import { sendTelegramNotification } from './telegram.js';
import { sendEmail } from './email.js';

/**
 * Dispatches notifications simultaneously to Telegram (if chat_id configured) and Email.
 * Also prepares placeholder for WhatsApp webhook/API dispatch.
 */
export async function notifyClient(env, client, { title, message, url }) {
  if (!client) return { telegram: false, email: false };

  const link = url || 'https://pragency.pages.dev/portal-access-2026';
  const clientName = client.company_name || client.contact_name || 'عميلنا العزيز';

  // 1. Telegram Dispatch
  let telegramSent = false;
  if (client.telegram_chat_id) {
    const telegramText = `🔔 <b>تحديث جديد في بوابة العملاء — PR Agency</b>\n\nأهلاً <b>${clientName}</b>،\n${message}\n\n🔗 <b>رابط البوابة:</b> ${link}`;
    telegramSent = await sendTelegramNotification(env, telegramText, { chat_id: client.telegram_chat_id });
  }

  // 2. Email Dispatch via Resend
  let emailSent = false;
  if (client.email) {
    const emailHtml = `
      <div dir="rtl" style="font-family: Cairo, Tahoma, sans-serif; background:#0d0e12; color:#f3f4f6; padding:30px; border-radius:12px;">
        <h2 style="color:#8b5cf6; margin-top:0;">PR Agency — إشعار جديد</h2>
        <p style="font-size:16px;">أهلاً <b>${clientName}</b>،</p>
        <p style="font-size:15px; color:#d1d5db; line-height:1.6;">${message}</p>
        <div style="margin:24px 0;">
          <a href="${link}" style="background:#8b5cf6; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">
            الدخول لبوابة العميل ↗
          </a>
        </div>
        <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:24px 0;" />
        <p style="font-size:12px; color:#6b7280;">PR Agency Egypt • نظام إدارة وبوابات العملاء 2026</p>
      </div>
    `;
    const res = await sendEmail(env, {
      to: client.email,
      subject: `PR Agency: ${title}`,
      html: emailHtml
    });
    emailSent = res.success;
  }

  // 3. WhatsApp Ready Hook (For future Twilio / Meta Cloud API)
  if (client.whatsapp_number && env.WHATSAPP_API_KEY) {
    console.log(`[WhatsApp Hook Ready] Dispatched template to ${client.whatsapp_number}`);
  }

  return { telegram: telegramSent, email: emailSent };
}
