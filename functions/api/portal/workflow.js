import { logSystemAction } from '../../lib/audit.js';
import { notifyClient } from '../../lib/client_notifications.js';

// Handler for Submitting & Approving Deliverables with Account Manager Quality Gate
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
    const { action } = body;

    // Action 1: Creator Submits New Item for AM Review
    if (action === 'submit_item') {
      const {
        client_id,
        title,
        type, // 'video' | 'design' | 'carousel' | 'canva' | 'drive' | 'sheet' | 'pdf'
        media_url,
        caption,
        hashtags,
        scheduled_date,
        scheduled_time,
        platform,
        created_by_name,
        created_by_role
      } = body;

      const id = 'del_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO portal_deliverables (
          id, client_id, title, type, media_url, caption, hashtags, scheduled_date, scheduled_time, platform, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'under_am_review', ?)
      `).bind(
        id,
        client_id,
        title,
        type || 'design',
        media_url,
        caption || '',
        hashtags || '',
        scheduled_date,
        scheduled_time || '18:00',
        platform || 'instagram',
        now
      ).run();

      // Log upload action with author & timestamp
      await logSystemAction(db, {
        actor_id: created_by_name || 'creator',
        actor_name: created_by_name || 'Team Creator',
        actor_role: created_by_role || 'creative_team',
        action: 'upload',
        target_type: 'deliverable',
        target_id: id,
        client_id: client_id,
        details: { title, type, scheduled_date },
        ip_address: clientIp
      });

      return new Response(JSON.stringify({ success: true, id, status: 'under_am_review' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Action 2: Account Manager Approves Item to Send to Client
    if (action === 'am_approve') {
      const { deliverable_id, am_name, client_id } = body;
      const now = new Date().toISOString();

      await db.prepare(`
        UPDATE portal_deliverables
        SET status = 'pending', reviewed_at = ?
        WHERE id = ?
      `).bind(now, deliverable_id).run();

      // Log AM approval action
      await logSystemAction(db, {
        actor_id: am_name || 'account_manager',
        actor_name: am_name || 'Account Manager',
        actor_role: 'account_manager',
        action: 'internal_approve',
        target_type: 'deliverable',
        target_id: deliverable_id,
        client_id: client_id,
        details: { message: 'Approved by Account Manager and released to client' },
        ip_address: clientIp
      });

      // 🔔 Notify Client via Telegram & Email
      try {
        const item = await db.prepare('SELECT title FROM portal_deliverables WHERE id = ?').bind(deliverable_id).first();
        const clientObj = await db.prepare('SELECT * FROM portal_clients WHERE id = ?').bind(client_id).first();
        if (clientObj) {
          await notifyClient(env, clientObj, {
            title: 'محتوى جديد جاهز للاعتماد: ' + (item?.title || 'تصميم جديد'),
            message: 'قام مدير الحسابات باعتماد محتوى جديد <b>"' + (item?.title || 'تصميم جديد') + '"</b> وهو جاهز الآن لمراجعتك واعتماده في البوابة.',
            url: 'https://pragency.pages.dev/portal-access-2026'
          });
        }
      } catch (e) {
        console.warn('[Workflow Notification Exception]:', e.message);
      }

      return new Response(JSON.stringify({ success: true, status: 'pending' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Action 3: Client Reviews (Approve / Reject with Comments)
    if (action === 'client_review') {
      const { deliverable_id, decision, client_id, client_name, comment } = body;
      const now = new Date().toISOString();
      const newStatus = decision === 'approve' ? 'approved' : 'rejected';

      await db.prepare(`
        UPDATE portal_deliverables
        SET status = ?, client_feedback = ?, reviewed_at = ?
        WHERE id = ?
      `).bind(newStatus, comment || '', now, deliverable_id).run();

      // Record feedback history
      await db.prepare(`
        INSERT INTO portal_feedback_history (deliverable_id, client_id, action, comment, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(deliverable_id, client_id, newStatus, comment || '', now).run();

      // Log in central audit trail
      await logSystemAction(db, {
        actor_id: client_id,
        actor_name: client_name || 'Client',
        actor_role: 'client',
        action: decision === 'approve' ? 'client_approve' : 'client_reject',
        target_type: 'deliverable',
        target_id: deliverable_id,
        client_id: client_id,
        details: { comment: comment || '' },
        ip_address: clientIp
      });

      return new Response(JSON.stringify({ success: true, status: newStatus }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
