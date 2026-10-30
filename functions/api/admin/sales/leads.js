import { logSystemAction } from '../../../lib/audit.js';
import { computeLeadScore } from '../../../lib/crm_scoring.js';

// GET: Retrieve Leads (with filters for sales rep, stage, source, and calculated/stored scores)
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const leadId = url.searchParams.get('id');
  const salesId = url.searchParams.get('salesId');
  const stage = url.searchParams.get('stage');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // If specific lead ID is requested, fetch and return it directly with its followups
    if (leadId) {
      const lead = await db.prepare('SELECT * FROM sales_leads WHERE id = ?').bind(leadId).first();
      if (!lead) {
        return new Response(JSON.stringify({ success: false, error: 'Lead not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      let followups = [];
      try {
        const fRows = await db.prepare(
          'SELECT * FROM lead_followups WHERE lead_id = ? ORDER BY created_at DESC'
        ).bind(leadId).all();
        followups = fRows.results || [];
      } catch (fe) {}

      let score = lead.lead_score;
      if (!score || score === 0) {
        score = computeLeadScore(lead, followups.length);
      }

      const enriched = {
        ...lead,
        followup_count: followups.length,
        lead_score: score
      };

      return new Response(JSON.stringify({
        success: true,
        data: enriched,
        lead: enriched,
        followups
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    let countQuery = `SELECT COUNT(*) as total FROM sales_leads WHERE 1=1`;
    let query = `SELECT * FROM sales_leads WHERE 1=1`;
    const params = [];

    if (salesId) {
      query += ` AND assigned_sales_id = ?`;
      countQuery += ` AND assigned_sales_id = ?`;
      params.push(salesId);
    }
    if (stage) {
      query += ` AND pipeline_stage = ?`;
      countQuery += ` AND pipeline_stage = ?`;
      params.push(stage);
    }

    const countRow = await db.prepare(countQuery).bind(...params).first();
    const totalRecords = countRow?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const result = await db.prepare(query).bind(...params, limit, offset).all();
    const rawLeads = result.results || [];

    // Attach followups count and compute dynamic score if 0
    const enrichedLeads = await Promise.all(rawLeads.map(async (lead) => {
      const followups = await db.prepare(
        'SELECT COUNT(*) as count FROM lead_followups WHERE lead_id = ?'
      ).bind(lead.id).first();
      const followupCount = followups?.count || 0;

      let score = lead.lead_score;
      if (!score || score === 0) {
        score = computeLeadScore(lead, followupCount);
      }

      return {
        ...lead,
        followup_count: followupCount,
        lead_score: score
      };
    }));

    return new Response(JSON.stringify({
      success: true,
      data: enrichedLeads,
      leads: enrichedLeads,
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages
      }
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Add new Lead or Auto-Assign Round-Robin
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

    // If updating an existing lead:
    if (body.id) {
      const existing = await db.prepare('SELECT id FROM sales_leads WHERE id = ?').bind(body.id).first();
      if (existing) {
        const updates = [];
        const uParams = [];
        if (body.pipeline_stage) { updates.push('pipeline_stage = ?'); uParams.push(body.pipeline_stage); }
        if (body.notes || body.challenge_notes) { updates.push('challenge_notes = ?'); uParams.push(body.notes || body.challenge_notes); }
        if (body.name) { updates.push('name = ?'); uParams.push(body.name); }
        if (body.phone) { updates.push('phone = ?'); uParams.push(body.phone); }
        if (body.project_name) { updates.push('project_name = ?'); uParams.push(body.project_name); }
        if (body.service_interested) { updates.push('service_interested = ?'); uParams.push(body.service_interested); }
        if (body.budget_tier) { updates.push('budget_tier = ?'); uParams.push(body.budget_tier); }
        if (body.assigned_sales_name) { updates.push('assigned_sales_name = ?'); uParams.push(body.assigned_sales_name); }
        if (body.assigned_sales_id) { updates.push('assigned_sales_id = ?'); uParams.push(body.assigned_sales_id); }
        if (body.next_followup_due) { updates.push('next_followup_due = ?'); uParams.push(body.next_followup_due); }
        updates.push('updated_at = ?'); uParams.push(new Date().toISOString());
        uParams.push(body.id);

        if (updates.length > 1) {
          await db.prepare(`UPDATE sales_leads SET ${updates.join(', ')} WHERE id = ?`).bind(...uParams).run();
        }

        return new Response(JSON.stringify({ success: true, updated: true, id: body.id }), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    const {
      name,
      project_name,
      phone,
      email,
      source_type, // 'meta_ad' | 'tiktok_ad' | 'google_ad' | 'client_referral' | 'website_form'
      source_details,
      service_interested,
      budget_tier,
      challenge_notes
    } = body;

    if (!name || !phone) {
      return new Response(JSON.stringify({ success: false, error: 'Name and Phone are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    // ── Auto-Assignment (Round-Robin to active Sales Team members) ──
    let assignedSalesId = null;
    let assignedSalesName = null;

    try {
      const salesReps = await db.prepare(`
        SELECT id, name FROM agency_team_members
        WHERE department = 'sales' AND active = 1
        ORDER BY id ASC
      `).all();

      const reps = salesReps.results || [];
      if (reps.length > 0) {
        const lastAssigned = await db.prepare(`
          SELECT assigned_sales_id FROM sales_leads
          WHERE assigned_sales_id IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        `).first();

        const lastId = lastAssigned?.assigned_sales_id;
        const lastIdx = reps.findIndex(r => r.id === lastId);
        const nextRep = reps[(lastIdx + 1) % reps.length];

        assignedSalesId = nextRep.id;
        assignedSalesName = nextRep.name;
      }
    } catch (assignErr) {
      console.warn('Auto-assignment warning:', assignErr.message);
    }

    // Initial Lead Score calculation
    const initialScore = computeLeadScore({
      source_type: source_type || 'website_form',
      budget_tier: budget_tier || '',
      pipeline_stage: 'new'
    }, 0);

    await db.prepare(`
      INSERT INTO sales_leads (
        id, name, project_name, phone, email, source_type, source_details, service_interested, budget_tier, challenge_notes, assigned_sales_id, assigned_sales_name, pipeline_stage, lead_score, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
    `).bind(
      id,
      name,
      project_name || '',
      phone,
      email || '',
      source_type || 'website_form',
      source_details || '',
      service_interested || '',
      budget_tier || '',
      challenge_notes || '',
      assignedSalesId,
      assignedSalesName,
      initialScore,
      now,
      now
    ).run();

    // Log lead in Audit Trail
    await logSystemAction(db, {
      actor_id: 'system',
      actor_name: 'Lead Intake Engine',
      actor_role: 'system',
      action: 'lead_assigned',
      target_type: 'lead',
      target_id: id,
      details: { name, source_type, assigned_to: assignedSalesName, lead_score: initialScore },
      ip_address: request.headers.get('CF-Connecting-IP') || 'unknown'
    });

    return new Response(JSON.stringify({
      success: true,
      id,
      assigned_to: assignedSalesName,
      lead_score: initialScore
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
