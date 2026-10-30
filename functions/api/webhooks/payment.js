// functions/api/webhooks/payment.js
// Handles Payment Gateway Webhook & Notification (Stripe / Paymob / Simulator)
import { logSystemAction } from '../../lib/audit.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) return jsonResponse({ success: false, error: 'Database not available' }, 500);

  try {
    const body = await request.json();
    const {
      event_type,
      invoice_id,
      transaction_id,
      amount,
      currency = 'EGP',
      payment_method = 'credit_card',
      auth_code
    } = body;

    // Support both direct payload and nested webhook object (e.g. data.object)
    const targetInvoiceId = invoice_id || body.data?.object?.metadata?.invoice_id || body.data?.object?.client_reference_id;
    const isSuccess = event_type === 'checkout.session.completed' ||
                      event_type === 'payment_intent.succeeded' || 
                      event_type === 'TRANSACTION_SUCCESS' || 
                      body.success === true || 
                      body.status === 'success' ||
                      body.type === 'checkout.session.completed';

    if (!targetInvoiceId) {
      return jsonResponse({ success: false, error: 'invoice_id is required in webhook payload' }, 400);
    }

    if (!isSuccess) {
      return jsonResponse({ success: true, message: 'Non-success event acknowledged without status update' });
    }

    // 1. Fetch current invoice record
    const invoice = await db.prepare(`
      SELECT ci.*, pc.company_name, pc.email as client_email, pc.phone as client_phone
      FROM client_invoices ci
      JOIN portal_clients pc ON pc.id = ci.client_id
      WHERE ci.id = ?
    `).bind(targetInvoiceId).first();

    if (!invoice) {
      return jsonResponse({ success: false, error: 'Invoice not found in database' }, 404);
    }

    const paidAtIso = new Date().toISOString();
    const finalAuthCode = auth_code || 'AUTH_' + Math.floor(100000 + Math.random() * 900000);

    // 2. Update D1 client_invoices table to 'paid'
    await db.prepare(`
      UPDATE client_invoices
      SET status = 'paid', paid_at = ?, notes = COALESCE(notes || ' | ', '') || ?
      WHERE id = ?
    `).bind(paidAtIso, `سداد إلكتروني عبر البوابة (${finalAuthCode})`, invoice.id).run();

    // 3. Log to system_audit_logs
    await logSystemAction(db, {
      actor_id: invoice.client_id,
      actor_name: invoice.company_name || 'Client',
      actor_role: 'client',
      action: 'invoice_paid_online',
      target_type: 'invoice',
      target_id: invoice.id,
      client_id: invoice.client_id,
      details: {
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        currency: invoice.currency,
        auth_code: finalAuthCode,
        transaction_id: transaction_id || 'TXN_' + Date.now()
      },
      ip_address: clientIp
    });

    // 4. Send Instant Telegram Alert to Super Admin
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const teleMsg = `💰 *سداد فاتورة إلكتروني ناجح عبر البوابة (Online Payment)*\n\n🏢 *العميل:* ${invoice.company_name}\n🧾 *رقم الفاتورة:* #${invoice.invoice_number}\n💵 *المبلغ المسدد:* *${Number(invoice.amount).toLocaleString()} ${invoice.currency}*\n💳 *طريقة الدفع:* ${payment_method}\n🔑 *رمز التفويض (Auth Code):* \`${finalAuthCode}\`\n⏱️ *وقت العملية:* \`${paidAtIso.slice(0, 19).replace('T', ' ')}\`\n\n✅ تم اعتماد الفاتورة كـ Paid وتحديث سجل التدقيق المالي.`;

      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: teleMsg,
          parse_mode: 'Markdown'
        })
      }).catch(e => console.error('[Webhook] Telegram send error:', e.message));
    }

    // 5. Emit Event to Smart Automation Engine (Workflows)
    const origin = new URL(request.url).origin;
    fetch(`${origin}/api/internal/emit-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'invoice.paid',
        data: {
          invoice: {
            id: invoice.id,
            client_id: invoice.client_id,
            invoice_number: invoice.invoice_number,
            company_name: invoice.company_name,
            amount: invoice.amount,
            currency: invoice.currency
          }
        }
      })
    }).catch(err => console.warn('Automation engine emit error:', err));

    return jsonResponse({
      success: true,
      message: `تم اعتماد سداد الفاتورة #${invoice.invoice_number} بنجاح`,
      invoice_id: invoice.id,
      status: 'paid',
      auth_code: finalAuthCode,
      paid_at: paidAtIso
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
