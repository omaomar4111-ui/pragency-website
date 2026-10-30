// functions/api/admin/sales/daily-brief.js
// Daily Sales Intelligence Brief & Telegram Dispatch

import { sendTelegramNotification } from '../../../lib/telegram.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return jsonResponse({ success: false, error: 'Database unavailable' }, 500);
  }

  try {
    const url = new URL(request.url);
    const sendTelegram = url.searchParams.get('send_telegram') !== 'false';

    // 1. Fetch sales pipeline KPIs using actual schema columns (pipeline_stage)
    const newLeads = await db.prepare("SELECT COUNT(*) as count FROM sales_leads WHERE pipeline_stage = 'new'").first();
    const overdueFollowups = await db.prepare("SELECT COUNT(*) as count FROM sales_leads WHERE next_followup_due < date('now') AND pipeline_stage NOT IN ('won', 'lost')").first();
    const wonRecently = await db.prepare("SELECT COUNT(*) as count FROM sales_leads WHERE pipeline_stage = 'won' AND date(updated_at) >= date('now', '-7 days')").first();
    const totalActivePipeline = await db.prepare("SELECT COUNT(*) as count FROM sales_leads WHERE pipeline_stage NOT IN ('won', 'lost')").first();

    const newCount = newLeads?.count || 0;
    const overdueCount = overdueFollowups?.count || 0;
    const wonCount = wonRecently?.count || 0;
    const activeCount = totalActivePipeline?.count || 0;

    // 2. Draft human-friendly Egyptian Arabic Daily Brief
    const briefText = `☀️ <b>صباح الخير يا فريق المبيعات والنمو — PR Agency 🚀</b>

📊 <b>البريف اليومي لحالة الصفقات والمبيعات:</b>
• 📥 <b>عملاء جدد بانتظار الرد:</b> ${newCount} عميل محتمل.
• ⏰ <b>متابعات مستحقة/متأخرة:</b> ${overdueCount} عميل محتاجين اتصال عاجل اليوم!
• 🏆 <b>صفقات ناجحة مؤخراً (Won):</b> ${wonCount} صفقة تم إغلاقها.
• 💼 <b>إجمالي الصفقات النشطة قيد التفاوض:</b> ${activeCount} فرصة بيعية.

💡 <b>توصية اليوم:</b> ركزوا أول ساعة في اليوم على المتابعات المتأخرة، واستخدموا ميزة <b>"رسالة الأوتريتش"</b> في الـ CRM للرد السريع.

🔗 <b>افتح الـ CRM الآن:</b> https://pragency.pages.dev/sales-crm-2026`;

    let telegramSent = false;
    if (sendTelegram && env.TELEGRAM_BOT_TOKEN) {
      telegramSent = await sendTelegramNotification(env, briefText);
    }

    return jsonResponse({
      success: true,
      data: {
        newLeads: newCount,
        overdueFollowups: overdueCount,
        wonRecently: wonCount,
        activePipelineCount: activeCount,
        telegramSent,
        briefText
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
