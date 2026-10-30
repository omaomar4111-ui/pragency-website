// functions/api/portal/invoices/instapay.js
// Client Portal InstaPay transfer confirmation
import { verifyToken } from '../auth.js';
import { logSystemAction } from '../../../lib/audit.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  // 1. Verify Client Authentication
  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';
  let token = null;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const match = cookieHeader.match(/pr_portal_token=([^;]+)/);
    if (match) token = match[1];
  }

  const auth = await verifyToken(token, env);
  if (!auth || !auth.sub) {
    return jsonResponse({ success: false, error: 'Unauthorized client access' }, 401);
  }

  try {
    const body = await request.json();
    const { invoice_id, transaction_id } = body;

    if (!invoice_id || !transaction_id || !transaction_id.trim()) {
      return jsonResponse({ success: false, error: 'invoice_id ورقم عملية التحويل (transaction_id) مطلوبان' }, 400);
    }

    const cleanTxn = transaction_id.trim();

    // 2. Fetch invoice and verify ownership
    const invoice = await db.prepare(`
      SELECT ci.*, pc.company_name, pc.email as client_email, pc.phone as client_phone
      FROM client_invoices ci
      JOIN portal_clients pc ON pc.id = ci.client_id
      WHERE ci.id = ? AND ci.client_id = ?
    `).bind(invoice_id, auth.sub).first();

    if (!invoice) {
      return jsonResponse({ success: false, error: 'الفاتورة غير موجودة أو غير مصرح لك بسدادها' }, 404);
    }

    if (invoice.status === 'paid') {
      return jsonResponse({ success: false, error: 'هذه الفاتورة مسددة بالفعل' }, 400);
    }

    const noteUpdate = `تحويل إنستاباي - رقم العملية: [${cleanTxn}]`;
    const nowIso = new Date().toISOString();

    // 3. Update status to pending_verification
    await db.prepare(`
      UPDATE client_invoices
      SET status = 'pending_verification', notes = COALESCE(notes || ' | ', '') || ?
      WHERE id = ?
    `).bind(noteUpdate, invoice.id).run();

    // 4. Audit Log
    await logSystemAction(db, {
      actor_id: invoice.client_id,
      actor_name: invoice.company_name || 'Client',
      actor_role: 'client',
      action: 'instapay_payment_submitted',
      target_type: 'invoice',
      target_id: invoice.id,
      client_id: invoice.client_id,
      details: {
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        currency: invoice.currency,
        transaction_id: cleanTxn
      },
      ip_address: clientIp
    });

    // 5. Send Telegram Notification to Admin
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const teleMsg = `⚠️ *إيصال إنستاباي جديد بانتظار الاعتماد (InstaPay Verification)*\n\n` +
        `🏢 *العميل:* ${invoice.company_name}\n` +
        `🧾 *رقم الفاتورة:* #${invoice.invoice_number}\n` +
        `💵 *المبلغ:* *${Number(invoice.amount).toLocaleString()} ${invoice.currency}*\n` +
        `🔑 *رقم عملية التحويل (Ref / Txn):* \`${cleanTxn}\`\n` +
        `⏱️ *تاريخ الإرسال:* \`${nowIso.slice(0, 19).replace('T', ' ')}\`\n\n` +
        `👉 *يرجى مراجعة الحساب البنكي واعتماد الفاتورة من لوحة تحكم الإدارة.*`;

      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: teleMsg,
          parse_mode: 'Markdown'
        })
      }).catch(e => console.error('[InstaPay] Telegram error:', e.message));
    }

    return jsonResponse({
      success: true,
      message: 'تم إرسال بيانات التحويل بنجاح، جاري المراجعة والاعتماد المالي',
      invoice_id: invoice.id,
      status: 'pending_verification',
      transaction_id: cleanTxn
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
