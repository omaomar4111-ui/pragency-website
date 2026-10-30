// functions/api/portal/settings/payment.js
// Client Portal endpoint to fetch agency payment credentials (InstaPay IPA & Name)
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
    const rows = await db.prepare("SELECT key, value FROM agency_settings WHERE key IN ('instapay_ipa', 'instapay_name')").all();
    const settings = {};
    (rows.results || []).forEach(r => {
      settings[r.key] = r.value;
    });

    return jsonResponse({
      success: true,
      payment: {
        instapay_ipa: settings.instapay_ipa || 'pragency@instapay',
        instapay_name: settings.instapay_name || 'PR Agency Egypt',
        apple_pay_merchant_id: settings.apple_pay_merchant_id || 'merchant.com.pragency.portal',
        apple_pay_enabled: true
      }
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
