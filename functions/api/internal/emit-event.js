// functions/api/internal/emit-event.js
// Central Event Ingestion & Workflow Trigger Endpoint
import { executeAutomationEvent } from '../../lib/automation-engine.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { event, data } = body;

    if (!event) {
      return jsonResponse({ success: false, error: 'Event name is required' }, 400);
    }

    const executionResults = await executeAutomationEvent(event, data || {}, env);

    return jsonResponse({
      success: true,
      event,
      triggered_workflows: executionResults.length,
      executions: executionResults
    });
  } catch (err) {
    console.error('Error emitting automation event:', err);
    return jsonResponse({ success: false, error: err.message || 'Internal Server Error' }, 500);
  }
}
