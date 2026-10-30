import { logSystemAction } from '../../../../lib/audit.js';

// Helper to trigger automated sequences when a lead stage changes
async function triggerAutomatedSequences(db, leadId, newStage, leadData) {
  try {
    const normStage = (newStage || '').trim().toLowerCase();
    
    // Find active sequences matching this trigger stage
    const matchedSeqs = await db.prepare(`
      SELECT * FROM sales_sequences WHERE LOWER(trigger_stage) = ? AND is_active = 1
    `).bind(normStage).all();

    const sequences = matchedSeqs.results || [];
    if (sequences.length === 0) return [];

    const enrolled = [];
    const now = new Date().toISOString();

    for (const seq of sequences) {
      // Check if already enrolled
      const existing = await db.prepare(`
        SELECT id FROM lead_sequence_enrollments WHERE lead_id = ? AND sequence_id = ?
      `).bind(leadId, seq.id).first();

      if (!existing) {
        const enrollmentId = 'enr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        await db.prepare(`
          INSERT INTO lead_sequence_enrollments (
            id, lead_id, sequence_id, current_step_order, status, enrolled_at, last_executed_at
          ) VALUES (?, ?, ?, 1, 'active', ?, ?)
        `).bind(enrollmentId, leadId, seq.id, now, now).run();

        // Get first step
        const firstStep = await db.prepare(`
          SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_order ASC LIMIT 1
        `).bind(seq.id).first();

        enrolled.push({
          sequence_id: seq.id,
          sequence_name: seq.name,
          first_step: firstStep || null
        });

        // Log sequence enrollment action
        await logSystemAction(db, {
          actor_id: 'system_automation',
          actor_name: 'Sales Workflow Engine',
          actor_role: 'system',
          action: 'sequence_triggered',
          target_type: 'lead',
          target_id: leadId,
          details: { sequence_id: seq.id, sequence_name: seq.name, stage: normStage, step: firstStep?.channel }
        });
      }
    }
    return enrolled;
  } catch (err) {
    console.warn('[SequenceTrigger] Error:', err.message);
    return [];
  }
}

// PUT: Update pipeline stage or assign sales rep
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
    const { id, pipeline_stage, assigned_sales_id, assigned_sales_name, notes, lead_score } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Lead id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const current = await db.prepare('SELECT * FROM sales_leads WHERE id = ?').bind(id).first();
    if (!current) {
      return new Response(JSON.stringify({ success: false, error: 'Lead not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const newStage = pipeline_stage || current.pipeline_stage;
    const newRepId = assigned_sales_id !== undefined ? assigned_sales_id : current.assigned_sales_id;
    const newRepName = assigned_sales_name !== undefined ? assigned_sales_name : current.assigned_sales_name;
    const newScore = lead_score !== undefined ? lead_score : current.lead_score;

    await db.prepare(`
      UPDATE sales_leads
      SET pipeline_stage = ?, assigned_sales_id = ?, assigned_sales_name = ?, lead_score = ?, updated_at = ?
      WHERE id = ?
    `).bind(newStage, newRepId, newRepName, newScore, now, id).run();

    // Trigger Automated Sequences if stage changed
    let triggeredSequences = [];
    if (newStage !== current.pipeline_stage) {
      triggeredSequences = await triggerAutomatedSequences(db, id, newStage, current);
    }

    await logSystemAction(db, {
      actor_id: 'admin',
      actor_name: 'CRM Operator',
      actor_role: 'admin',
      action: 'lead_stage_updated',
      target_type: 'lead',
      target_id: id,
      details: {
        from_stage: current.pipeline_stage,
        to_stage: newStage,
        assigned_sales_name: newRepName,
        triggered_sequences: triggeredSequences
      },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'تم تحديث مرحلة العميل المحتمل بنجاح',
      lead: { id, pipeline_stage: newStage, assigned_sales_name: newRepName, lead_score: newScore, updated_at: now },
      triggered_sequences: triggeredSequences
    }), {
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
