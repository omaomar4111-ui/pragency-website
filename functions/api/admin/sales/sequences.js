import { logSystemAction } from '../../../lib/audit.js';

// GET: Retrieve Sequences and their steps
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const sequences = await db.prepare(`
      SELECT * FROM sales_sequences ORDER BY created_at DESC
    `).all();

    const seqList = sequences.results || [];

    // Fetch steps for each sequence
    const enriched = await Promise.all(seqList.map(async (seq) => {
      const steps = await db.prepare(`
        SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_order ASC
      `).bind(seq.id).all();
      
      const enrollmentsCount = await db.prepare(`
        SELECT COUNT(*) as count FROM lead_sequence_enrollments WHERE sequence_id = ?
      `).bind(seq.id).first();

      return {
        ...seq,
        steps: steps.results || [],
        enrolled_leads_count: enrollmentsCount?.count || 0
      };
    }));

    return new Response(JSON.stringify({ success: true, sequences: enriched }), {
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

// POST: Create or Update a Sequence with steps
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
    const { name, trigger_stage, is_active, steps } = body;

    if (!name || !trigger_stage) {
      return new Response(JSON.stringify({ success: false, error: 'Name and trigger_stage are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const seqId = 'seq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO sales_sequences (id, name, trigger_stage, is_active, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(seqId, name.trim(), trigger_stage.trim().toLowerCase(), is_active !== false ? 1 : 0, now).run();

    // Insert steps if provided
    if (Array.isArray(steps) && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepId = 'step_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 5);
        await db.prepare(`
          INSERT INTO sequence_steps (id, sequence_id, step_order, channel, delay_hours, template_content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          stepId,
          seqId,
          step.step_order || (i + 1),
          step.channel || 'email',
          parseInt(step.delay_hours || 0, 10),
          step.template_content || '',
          now
        ).run();
      }
    }

    await logSystemAction(db, {
      actor_id: 'admin',
      actor_name: 'Sales Architect',
      actor_role: 'admin',
      action: 'sequence_created',
      target_type: 'sales_sequence',
      target_id: seqId,
      details: { name, trigger_stage, steps_count: steps?.length || 0 },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'تم إنشاء مسار الأتمتة والخطوات بنجاح',
      sequence_id: seqId
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
