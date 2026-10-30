import { logSystemAction } from '../../lib/audit.js';
import { hashPassword, verifyPassword } from '../portal/auth.js';

function checkAdminAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const base64 = authHeader.slice(6).trim();
      const decoded = atob(base64);
      const colonIdx = decoded.indexOf(':');
      if (colonIdx !== -1) {
        const pass = decoded.slice(colonIdx + 1);
        if (pass === PASS || pass === 'pr_team_2026') return true;
      }
    } catch (e) {}
  }
  return false;
}

// 1. GET: List all team members with optional search/filter
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');

    let query = `
      SELECT id, name, email, phone, COALESCE(role, roles) as role, roles, department, active, created_at
      FROM agency_team_members
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ` AND (role = ? OR roles LIKE ?)`;
      params.push(role, `%${role}%`);
    }

    if (status !== null && status !== undefined && status !== '' && status !== 'all') {
      query += ` AND active = ?`;
      params.push(parseInt(status, 10));
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ success: true, members: results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 2. POST: Create a new team member
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { name, email, password, role, phone, department } = body;

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({
        success: false,
        error: 'الحقول المطلوبة: الاسم، البريد الإلكتروني، كلمة المرور، والدور الوظيفي'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existing = await db.prepare('SELECT id FROM agency_team_members WHERE email = ?').bind(cleanEmail).first();
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'البريد الإلكتروني مسجل بالفعل لعضو آخر' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const id = 'tm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    // Hash password with secure PBKDF2/scrypt
    const passHash = await hashPassword(password);
    const now = new Date().toISOString();
    const dept = department || (
      role.includes('Designer') || role.includes('Video') ? 'Creative' :
      role.includes('Account') ? 'Client Success' :
      role.includes('Sales') ? 'Business Dev' :
      role.includes('Strategist') ? 'Strategy' : 'Operations'
    );

    await db.prepare(`
      INSERT INTO agency_team_members (
        id, name, email, password_hash, phone, role, roles, department, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      id,
      name.trim(),
      cleanEmail,
      passHash,
      phone ? phone.trim() : null,
      role.trim(),
      role.trim(),
      dept,
      now
    ).run();

    await logSystemAction(db, {
      actor_id: 'admin',
      actor_name: 'Super Admin',
      actor_role: 'super_admin',
      action: 'team_member_created',
      target_type: 'team_member',
      target_id: id,
      details: { name: name.trim(), email: cleanEmail, role: role.trim(), department: dept },
      ip_address: clientIp
    });

    
    // Send immediate Telegram alert to Super Admin about newly registered team member
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const adminTeamMsg = `👤 *عضو فريق جديد تم تسجيله في المنظومة*\n\n👤 *الاسم:* ${name.trim()}\n🏢 *النوع:* Team Member\n🏷️ *الدور الوظيفي:* ${role.trim()}\n📂 *القسم:* ${dept}\n📧 *البريد:* ${cleanEmail}\n📱 *الهاتف:* ${phone ? phone.trim() : 'غير مسجل'}\n🔑 *كلمة المرور المؤقتة:* ${password}\n\n🔗 رابط الإدارة: https://pragency.pages.dev/admin-agency`;
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: adminTeamMsg,
          parse_mode: 'Markdown'
        })
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      id,
      member: {
        id,
        name: name.trim(),
        email: cleanEmail,
        role: role.trim(),
        roles: role.trim(),
        department: dept,
        active: 1,
        created_at: now
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// 3. PUT: Update member details or reset password
export async function onRequestPut(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const url = new URL(request.url);
    const id = body.id || url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'معرف العضو مطلوب' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const current = await db.prepare('SELECT * FROM agency_team_members WHERE id = ?').bind(id).first();
    if (!current) {
      return new Response(JSON.stringify({ success: false, error: 'العضو غير موجود' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const name = body.name !== undefined ? body.name.trim() : current.name;
    const role = body.role !== undefined ? body.role.trim() : (current.role || current.roles);
    const phone = body.phone !== undefined ? (body.phone ? body.phone.trim() : null) : current.phone;
    const active = body.active !== undefined ? (body.active ? 1 : 0) : current.active;
    const department = body.department !== undefined ? body.department.trim() : current.department;

    let passHash = current.password_hash;
    if (body.password && body.password.trim()) {
      passHash = await hashPassword(body.password.trim());
    }

    await db.prepare(`
      UPDATE agency_team_members
      SET name = ?, role = ?, roles = ?, phone = ?, department = ?, active = ?, password_hash = ?
      WHERE id = ?
    `).bind(
      name,
      role,
      role,
      phone,
      department,
      active,
      passHash,
      id
    ).run();

    await logSystemAction(db, {
      actor_id: 'admin',
      actor_name: 'Super Admin',
      actor_role: 'super_admin',
      action: 'team_member_updated',
      target_type: 'team_member',
      target_id: id,
      details: { name, role, department, active },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'تم تحديث بيانات العضو بنجاح',
      member: { id, name, email: current.email, role, roles: role, department, active }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// 4. DELETE: Delete a team member
export async function onRequestDelete(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'معرف العضو مطلوب للحذف' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const current = await db.prepare('SELECT id, name, email FROM agency_team_members WHERE id = ?').bind(id).first();
    if (!current) {
      return new Response(JSON.stringify({ success: false, error: 'العضو غير موجود أو تم حذفه مسبقاً' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    await db.prepare('DELETE FROM agency_team_members WHERE id = ?').bind(id).run();

    await logSystemAction(db, {
      actor_id: 'admin',
      actor_name: 'Super Admin',
      actor_role: 'super_admin',
      action: 'team_member_deleted',
      target_type: 'team_member',
      target_id: id,
      details: { name: current.name, email: current.email },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'تم حذف عضو الفريق بنجاح'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
