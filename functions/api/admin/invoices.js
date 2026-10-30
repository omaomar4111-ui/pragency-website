import { sendTelegramNotification } from '../../lib/telegram.js';
import { logSystemAction } from '../../lib/audit.js';
import { notifyClient } from '../../lib/client_notifications.js';

// Helper for standard JSON responses
function jsonOk(data) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// ── GET /api/admin/invoices ───────────────────────────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonError('Database not available', 500);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  try {
    const countRow = await db.prepare('SELECT COUNT(*) as total FROM client_invoices').first();
    const totalRecords = countRow?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const { results } = await db.prepare(`
      SELECT ci.*, pc.company_name, pc.contact_name, pc.email as client_email, pc.phone as client_phone
      FROM client_invoices ci
      LEFT JOIN portal_clients pc ON pc.id = ci.client_id
      ORDER BY ci.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return jsonOk({
      data: results || [],
      invoices: results || [],
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) return jsonError('Database not available', 500);

  try {
    const body = await request.json();
    const { action } = body;

    // ── Create a new invoice ───────────────────────────────────────────────
    if (action === 'create_invoice') {
      const { client_id, amount, currency, due_date, notes, created_by } = body;

      if (!client_id || !amount || !due_date) {
        return jsonError('جميع الحقول الأساسية مطلوبة (العميل، المبلغ، تاريخ الاستحقاق)');
      }

      // Generate invoice number: INV-YYYYMM-XXXX
      const datePart = new Date().toISOString().slice(0, 7).replace('-', '');
      const count = await db.prepare('SELECT COUNT(*) as count FROM client_invoices').first();
      const seq = String((count?.count || 0) + 1).padStart(4, '0');
      const invNum = `INV-${datePart}-${seq}`;

      const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO client_invoices (id, client_id, invoice_number, amount, currency, due_date, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(id, client_id, invNum, amount, currency || 'EGP', due_date, notes || '', now).run();

      await logSystemAction(db, {
        actor_id: created_by || 'admin',
        actor_name: created_by || 'Admin',
        actor_role: 'admin',
        action: 'invoice_created',
        target_type: 'invoice',
        target_id: id,
        client_id,
        details: { invoice_number: invNum, amount, currency: currency || 'EGP', due_date },
        ip_address: clientIp
      });

      // 🔔 Dispatch Notification to Client (Telegram & Email)
      try {
        const clientObj = await db.prepare('SELECT * FROM portal_clients WHERE id = ?').bind(client_id).first();
        if (clientObj) {
          await notifyClient(env, clientObj, {
            title: `تم إصدار فاتورة جديدة #${invNum}`,
            message: `تم إصدار فاتورة جديدة لحسابكم برقم <b>${invNum}</b> وقيمتها <b>${amount} ${currency || 'EGP'}</b> وتاريخ استحقاقها: <b>${due_date}</b>.`,
            url: 'https://pragency.pages.dev/portal-access-2026'
          });
        }
      } catch (e) {
        console.warn('[Invoice Notification] Failed:', e.message);
      }

      return jsonOk({ id, invoice_number: invNum, message: 'تم إنشاء الفاتورة بنجاح' });
    }

    // ── Mark invoice as paid ───────────────────────────────────────────────
    if (action === 'mark_paid') {
      const { invoice_id, updated_by } = body;
      const now = new Date().toISOString();
      await db.prepare(`UPDATE client_invoices SET status = 'paid', paid_at = ? WHERE id = ?`).bind(now, invoice_id).run();

      const invoice = await db.prepare(`
        SELECT ci.client_id, ci.invoice_number, ci.amount, ci.currency, pc.company_name, pc.contact_name
        FROM client_invoices ci
        LEFT JOIN portal_clients pc ON pc.id = ci.client_id
        WHERE ci.id = ?
      `).bind(invoice_id).first();

      const clientName = invoice?.company_name || invoice?.contact_name || invoice?.client_id || 'العميل';
      const invAmount = `${invoice?.amount || ''} ${invoice?.currency || 'EGP'}`;

      await logSystemAction(db, {
        actor_id: updated_by || 'admin',
        actor_name: updated_by || 'Admin',
        actor_role: 'admin',
        action: 'invoice_paid',
        target_type: 'invoice',
        target_id: invoice_id,
        client_id: invoice?.client_id || '',
        details: { invoice_number: invoice?.invoice_number, amount: invoice?.amount },
        ip_address: clientIp
      });

      // 💰 TELEGRAM ALERT: Invoice marked as Paid
      const tgMsg =
        `💰 <b>تم سداد فاتورة بنجاح!</b>\n\n` +
        `🏢 <b>العميل:</b> ${clientName}\n` +
        `🧾 <b>رقم الفاتورة:</b> <code>${invoice?.invoice_number || invoice_id}</code>\n` +
        `💵 <b>القيمة المسددة:</b> ${invAmount}\n` +
        `⏰ <b>توقيت السداد:</b> ${new Date().toLocaleString('ar-EG')}`;

      context.waitUntil(sendTelegramNotification(env, tgMsg));

      return jsonOk({ message: 'تم تسجيل الفاتورة كمدفوعة وإرسال الإشعار' });
    }

    // ── Send payment reminder via Telegram ────────────────────────────────
    if (action === 'send_reminder') {
      const { invoice_id } = body;

      const invoice = await db.prepare(`
        SELECT ci.*, pc.company_name, pc.email, pc.phone
        FROM client_invoices ci
        JOIN portal_clients pc ON pc.id = ci.client_id
        WHERE ci.id = ?
      `).bind(invoice_id).first();

      if (!invoice) return jsonError('الفاتورة غير موجودة', 404);

      const now = new Date().toISOString();
      await db.prepare('UPDATE client_invoices SET reminder_sent_at = ? WHERE id = ?').bind(now, invoice_id).run();

      const msg =
        `⏰ <b>تذكير بفاتورة مستحقة</b>\n\n` +
        `🏢 <b>العميل:</b> ${invoice.company_name}\n` +
        `📧 <b>البريد:</b> ${invoice.email}\n` +
        `📱 <b>الهاتف:</b> ${invoice.phone || 'غير متاح'}\n\n` +
        `🧾 <b>رقم الفاتورة:</b> <code>${invoice.invoice_number}</code>\n` +
        `💰 <b>المبلغ:</b> ${invoice.amount} ${invoice.currency}\n` +
        `📅 <b>تاريخ الاستحقاق:</b> ${invoice.due_date}\n\n` +
        `⚠️ <b>الحالة:</b> ${invoice.status === 'overdue' ? 'متأخرة!' : 'معلقة'}`;

      context.waitUntil(sendTelegramNotification(env, msg));

      return jsonOk({ message: 'تم إرسال التذكير بنجاح' });
    }

    // ── Auto-flag overdue invoices ─────────────────────────────────────────
    if (action === 'check_overdue') {
      const today = new Date().toISOString().slice(0, 10);
      const res = await db.prepare(`
        UPDATE client_invoices SET status = 'overdue'
        WHERE due_date < ? AND status = 'pending'
      `).bind(today).run();

      return jsonOk({ updated: res.meta.changes });
    }

    return jsonError('إجراء غير معروف');

  } catch (err) {
    return jsonError(err.message, 500);
  }
}
