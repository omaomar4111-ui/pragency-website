// functions/api/admin/settings/payment.js
// Manage agency payment gateway & InstaPay configuration
import { logSystemAction } from '../../../lib/audit.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  try {
    const rows = await db.prepare('SELECT key, value FROM agency_settings').all();
    const settings = {};
    (rows.results || []).forEach(r => {
      settings[r.key] = r.value;
    });

    return jsonResponse({
      success: true,
      settings: {
        instapay_ipa: settings.instapay_ipa || 'pragency@instapay',
        instapay_name: settings.instapay_name || 'PR Agency Egypt',
        apple_pay_merchant_id: settings.apple_pay_merchant_id || 'merchant.com.pragency.portal'
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) return jsonResponse({ success: false, error: 'Database unavailable' }, 500);

  try {
    const body = await request.json();
    const { instapay_ipa, instapay_name, apple_pay_merchant_id } = body;

    const now = new Date().toISOString();

    if (instapay_ipa !== undefined) {
      await db.prepare(`
        INSERT INTO agency_settings (key, value, updated_at) 
        VALUES ('instapay_ipa', ?, ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(instapay_ipa.trim(), now).run();
    }

    if (instapay_name !== undefined) {
      await db.prepare(`
        INSERT INTO agency_settings (key, value, updated_at) 
        VALUES ('instapay_name', ?, ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(instapay_name.trim(), now).run();
    }

    if (apple_pay_merchant_id !== undefined) {
      await db.prepare(`
        INSERT INTO agency_settings (key, value, updated_at) 
        VALUES ('apple_pay_merchant_id', ?, ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(apple_pay_merchant_id.trim(), now).run();
    }

    await logSystemAction(db, {
      actor_id: 'admin',
      actor_name: 'Super Admin',
      actor_role: 'admin',
      action: 'payment_settings_updated',
      target_type: 'settings',
      target_id: 'instapay_applepay',
      details: { instapay_ipa, instapay_name, apple_pay_merchant_id }
    });

    return jsonResponse({
      success: true,
      message: 'تم حفظ إعدادات إنستاباي و Apple Pay بنجاح',
      settings: {
        instapay_ipa,
        instapay_name,
        apple_pay_merchant_id
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
