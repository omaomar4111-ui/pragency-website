// Central Audit Logger Helper for all Agency OS APIs
export async function logSystemAction(db, {
  actor_id,
  actor_name,
  actor_role,
  action,
  target_type,
  target_id,
  client_id = null,
  details = null,
  ip_address = null
}) {
  if (!db) return;
  try {
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO system_audit_logs (
        actor_id, actor_name, actor_role, action, target_type, target_id, client_id, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      actor_id || 'system',
      actor_name || 'System Auto',
      actor_role || 'system',
      action,
      target_type,
      target_id,
      client_id,
      typeof details === 'object' ? JSON.stringify(details) : (details || ''),
      ip_address || 'internal',
      now
    ).run();
  } catch (err) {
    console.warn('[Audit Log] Failed to record action:', err.message);
  }
}
