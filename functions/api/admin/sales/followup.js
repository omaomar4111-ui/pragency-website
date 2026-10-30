import { logSystemAction } from '../../../lib/audit.js';

// Handler for Logging Voice / Text Follow-ups with Formatted Structured Points
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const {
      lead_id,
      sales_id,
      sales_name,
      call_outcome, // 'interested' | 'callback' | 'no_answer' | 'not_fit'
      transcribed_text, // Voice recording text directly from speech recognition
      formatted_notes,  // Clean structured notes
      next_action,
      next_action_date,
      new_stage // 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'won' | 'lost'
    } = body;

    if (!lead_id || !sales_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing lead_id or sales_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // 1. Insert Follow-up Record
    await db.prepare(`
      INSERT INTO lead_followups (
        lead_id, sales_id, sales_name, call_outcome, transcribed_text, formatted_notes, next_action, next_action_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lead_id,
      sales_id,
      sales_name || 'Sales Rep',
      call_outcome || 'interested',
      transcribed_text || '',
      formatted_notes || transcribed_text || 'Followup recorded',
      next_action || '',
      next_action_date || null,
      now
    ).run();

    // 2. Update Lead Stage and Last Followup Timestamp
    await db.prepare(`
      UPDATE sales_leads
      SET pipeline_stage = COALESCE(?, pipeline_stage),
          last_followup_at = ?,
          next_followup_due = ?,
          followup_status = 'completed',
          updated_at = ?
      WHERE id = ?
    `).bind(
      new_stage || null,
      now,
      next_action_date || null,
      now,
      lead_id
    ).run();

    // 3. Log into Audit Trail
    await logSystemAction(db, {
      actor_id: sales_id,
      actor_name: sales_name || 'Sales Rep',
      actor_role: 'sales',
      action: 'lead_followup',
      target_type: 'lead',
      target_id: lead_id,
      details: { call_outcome, next_action, next_action_date },
      ip_address: request.headers.get('CF-Connecting-IP') || 'unknown'
    });

    return new Response(JSON.stringify({ success: true, message: 'Followup logged successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
