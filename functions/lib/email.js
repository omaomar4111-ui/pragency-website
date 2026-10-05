export async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set, skipping email dispatch.');
    return { skipped: true, reason: 'RESEND_API_KEY_MISSING' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'PR Agency <hello@pragency.eg>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('[Email] Resend API error response:', data);
      return { success: false, error: data };
    }
    return { success: true, data };
  } catch (err) {
    console.error('[Email] Failed to dispatch via Resend:', err.message);
    return { success: false, error: err.message };
  }
}
