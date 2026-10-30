import { hashPassword } from '../portal/auth.js';
import { logSystemAction } from '../../lib/audit.js';

// ── GET: List portal clients with full stats ──────────────────────────────────
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const clientId = url.searchParams.get('id');

  if (!db) return jsonError('Database not bound', 500);

  try {
    if (clientId) {
      // Single client with deliverable stats
      const client = await db.prepare(`
        SELECT pc.*,
          COALESCE(pc.phone, '') as phone,
          COUNT(DISTINCT pd.id) as total_deliverables,
          SUM(CASE WHEN pd.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN pd.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN pd.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN pd.status = 'under_am_review' THEN 1 ELSE 0 END) as review_count
        FROM portal_clients pc
        LEFT JOIN portal_deliverables pd ON pd.client_id = pc.id
        WHERE pc.id = ?
        GROUP BY pc.id
      `).bind(clientId).first();

      if (!client) return jsonError('Client not found', 404);

      const strategy = await db.prepare(
        `SELECT id, title, status, created_at FROM client_strategies WHERE client_id = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(clientId).first();

      const upcoming = await db.prepare(`
        SELECT id, title, type, status, scheduled_date, platform
        FROM portal_deliverables WHERE client_id = ? AND scheduled_date >= date('now')
        ORDER BY scheduled_date ASC LIMIT 10
      `).bind(clientId).all();

      const invoices = await db.prepare(`
        SELECT status, COUNT(*) as count, SUM(amount) as total
        FROM client_invoices WHERE client_id = ? GROUP BY status
      `).bind(clientId).all();

      return jsonOk({
        client,
        strategy: strategy || null,
        upcoming: upcoming.results || [],
        invoices: invoices.results || []
      });
    }

    // All clients
    const result = await db.prepare(`
      SELECT pc.id, pc.company_name, pc.contact_name, pc.email,
        COALESCE(pc.phone, '') as phone,
        pc.active, pc.created_at, pc.brand_color, pc.logo_url,
        COUNT(DISTINCT pd.id) as total_deliverables,
        SUM(CASE WHEN pd.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN pd.status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM portal_clients pc
      LEFT JOIN portal_deliverables pd ON pd.client_id = pc.id
      GROUP BY pc.id
      ORDER BY pc.created_at DESC
    `).all();

    return jsonOk({ clients: result.results || [] });
  } catch (e) {
    return jsonError(e.message, 500);
  }
}

// ── POST: Manage portal clients ───────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) return jsonError('Database not bound', 500);

  try {
    const body = await request.json();
    const { action } = body;

    // ── Create ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { company_name, contact_name, email, password, phone, brand_color, logo_url, created_by } = body;
      if (!company_name || !email || !password) return jsonError('company_name, email, password مطلوبة', 400);

      const exists = await db.prepare('SELECT id FROM portal_clients WHERE email = ?').bind(email.trim().toLowerCase()).first();
      if (exists) return jsonError('هذا الإيميل مستخدم بالفعل', 409);

      const id = 'client_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO portal_clients (id, company_name, contact_name, email, password_hash, phone, brand_color, logo_url, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(id, company_name.trim(), contact_name || company_name, email.trim().toLowerCase(), passwordHash, phone || '', brand_color || '#8b5cf6', logo_url || '', now).run();

      await logSystemAction(db, {
        actor_id: created_by || 'admin', actor_name: created_by || 'Admin', actor_role: 'admin',
        action: 'create_client', target_type: 'client', target_id: id, client_id: id,
        details: { company_name, email, contact_name }, ip_address: clientIp
      });

      // 1. Telegram notification to Super Admin
      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        const adminMsg = `👤 *مستخدم جديد تم تسجيله في المنظومة*\n\n👤 *الاسم:* ${contact_name || company_name}\n🏢 *النوع:* Client (عميل بورتال)\n🏷️ *الشركة:* ${company_name}\n📧 *البريد:* ${email}\n📱 *الهاتف:* ${phone || 'غير مسجل'}\n🔑 *كلمة المرور المؤقتة:* ${password}\n\n🔗 رابط الدخول: https://pragency.pages.dev/portal-access-2026.html`;
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: adminMsg, parse_mode: 'Markdown' })
        }).catch(() => {});
      }

      // 1.5 Emit Event to Smart Automation Engine (Workflows)
      const origin = new URL(request.url).origin;
      fetch(`${origin}/api/internal/emit-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'client.created',
          data: {
            client: {
              id,
              company_name,
              contact_name,
              email,
              phone,
              retainer_amount: body.retainer_amount || 0,
              industry: body.industry || 'التجارة والتسويق'
            }
          }
        })
      }).catch(err => console.warn('Automation engine emit error:', err));

      // 2. Client Welcome Notification (if telegram_chat_id provided)
      if (body.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
        const welcomeMsg = `🎉 *أهلاً بك في PR Agency!*\n\nتم تفعيل حسابك الرسمي في البوابة الخاصة بشركتك (*${company_name}*).\nيمكنك متابعة جدول الحملات، واعتماد التصاميم والفيديوهات، وتحميل الفواتير من الرابط التالي:\n\n🔗 https://pragency.pages.dev/portal-access-2026.html\n\n📧 البريد: ${email}\n🔑 كلمة المرور: ${password}`;
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: body.telegram_chat_id, text: welcomeMsg, parse_mode: 'Markdown' })
        }).catch(() => {});
      }

      return jsonOk({ id, message: 'تم إنشاء حساب العميل بنجاح' });
    }

    // ── Toggle active ────────────────────────────────────────────────────────
    if (action === 'toggle_active') {
      const { client_id, active, updated_by } = body;
      await db.prepare('UPDATE portal_clients SET active = ? WHERE id = ?').bind(active ? 1 : 0, client_id).run();
      await logSystemAction(db, {
        actor_id: updated_by || 'admin', actor_name: updated_by || 'Admin', actor_role: 'admin',
        action: active ? 'activate_client' : 'deactivate_client', target_type: 'client',
        target_id: client_id, client_id: client_id, details: { active }, ip_address: clientIp
      });
      return jsonOk({ message: active ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب' });
    }

    // ── Reset password ───────────────────────────────────────────────────────
    if (action === 'reset_password') {
      const { client_id, new_password, updated_by } = body;
      if (!new_password || new_password.length < 6) return jsonError('الباسورد 6 أحرف على الأقل', 400);
      const passwordHash = await hashPassword(new_password);
      await db.prepare('UPDATE portal_clients SET password_hash = ? WHERE id = ?').bind(passwordHash, client_id).run();
      await logSystemAction(db, {
        actor_id: updated_by || 'admin', actor_name: updated_by || 'Admin', actor_role: 'admin',
        action: 'reset_client_password', target_type: 'client', target_id: client_id,
        client_id: client_id, details: { message: 'Password reset by admin' }, ip_address: clientIp
      });
      return jsonOk({ message: 'تم تغيير كلمة المرور بنجاح' });
    }

    // ── Update info ─────────────────────────────────────────────────────────
    if (action === 'update') {
      const { client_id, company_name, contact_name, phone, brand_color, logo_url, updated_by } = body;
      await db.prepare(`
        UPDATE portal_clients SET company_name = ?, contact_name = ?, phone = ?, brand_color = ?, logo_url = ? WHERE id = ?
      `).bind(company_name, contact_name, phone || '', brand_color || '#8b5cf6', logo_url || '', client_id).run();
      await logSystemAction(db, {
        actor_id: updated_by || 'admin', actor_name: updated_by || 'Admin', actor_role: 'admin',
        action: 'update_client', target_type: 'client', target_id: client_id,
        client_id: client_id, details: { company_name, contact_name }, ip_address: clientIp
      });
      return jsonOk({ message: 'تم تحديث بيانات العميل' });
    }

    return jsonError('Action غير معروف', 400);
  } catch (e) {
    return jsonError(e.message, 500);
  }
}

function jsonOk(data) {
  return new Response(JSON.stringify({ success: true, ...data }), { headers: { 'Content-Type': 'application/json' } });
}
function jsonError(msg, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
}
