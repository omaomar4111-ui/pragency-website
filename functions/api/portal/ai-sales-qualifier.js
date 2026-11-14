/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — High-Ticket B2B Sales Qualifier & Hot Lead Scoring (Powered by Gemini)
   • Implements High-Stakes B2B Sales & Discovery Frameworks (MEDDIC / BANT / Spin Selling)
   • Evaluates incoming visitor messages for:
     1. Budget Tier (Enterprise / Mid / Low / Price-Shopper)
     2. Urgency & Buying Timeline (Immediate / 1 month / Casual)
     3. Decision Maker Authority (Owner, C-Level, Marketer, Student)
     4. Pain Point Severity
   • Automatically triggers Instant Telegram High-Priority Alert for "Hot Leads"
═══════════════════════════════════════════════════════════════════════════ */

export async function scoreAndAlertLead(visitorData, conversationText, env) {
  try {
    const geminiKey = env.GEMINI_API_KEY;

    const systemPrompt = `
أنت "كبير مسؤولي المبيعات والصفقات الكبرى (VP of High-Ticket Sales & Revenue)" في PR Agency.
تعتمد منهجيات مبيعات B2B العالمية (MEDDIC & BANT Qualification):
Budget, Authority, Need, Timeline, Metrics, Economic Buyer.

مهمتك: تحليل استفسار العميل ورسائله لتحديد مدى جديته وتصنيفه سيلز.
أجب فقط بصيغة JSON نظيفة بدون أي Markdown:
{
  "score": 85, // رقم من 0 إلى 100
  "qualification": "HOT", // "HOT" (80+), "WARM" (50-79), "COLD" (<50)
  "deal_potential": "High-Ticket Retainer / Production / Small",
  "industry_detected": "المجال المكتشف أو غير محدد",
  "pain_point": "ملخص المشكلة التي يريد حلها في جملة",
  "recommended_sales_action": "خطوة الإغلاق السريعة المقترحة لفريق المبيعات"
}
`;

    const userPrompt = `
بيانات الزائر المتاحة:
- الاسم / الهاتف إن وُجد: ${visitorData.name || 'غير محدد'} | ${visitorData.phone || 'غير مسجل'}
- الدولة / المصدر: ${visitorData.country || 'EG'}
محتوى رسائل المحادثة:
"""
${conversationText}
"""
`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
    let scoringJson = null;

    for (const model of candidateModels) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 300, responseMimeType: 'application/json' }
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            scoringJson = JSON.parse(text);
            break;
          }
        }
      } catch (e) {}
    }

    if (!scoringJson) {
      // Fallback rule
      const isHot = /سعر|بكام|عايز|حملة|ميزانية|مصنع|شركة|تصوير|فيديو/i.test(conversationText);
      scoringJson = {
        score: isHot ? 80 : 45,
        qualification: isHot ? 'HOT' : 'WARM',
        deal_potential: isHot ? 'Campaign / Production' : 'General Inquiry',
        industry_detected: 'General',
        pain_point: 'استفسار تسويقي عام',
        recommended_sales_action: 'متابعة سريعة وإرسال نماذج الأعمال عبر واتساب'
      };
    }

    // If Qualified as HOT LEAD (Score >= 75), send immediate Telegram VIP Alert
    if (scoringJson.score >= 70) {
      const botToken = env.TELEGRAM_BOT_TOKEN;
      const chatId = env.TELEGRAM_CHAT_ID || '5715939844';

      if (botToken && chatId) {
        const alertMsg = `🔥 *تنبيه عميل ساخن جداً (HOT LEAD DETECTED)* 🔥\n\n` +
          `🎯 *التقييم:* ${scoringJson.qualification} (${scoringJson.score}/100)\n` +
          `💼 *الصفقة المحتملة:* ${scoringJson.deal_potential}\n` +
          `🏭 *المجال:* ${scoringJson.industry_detected}\n` +
          `⚠️ *الاحتياج:* ${scoringJson.pain_point}\n` +
          `💬 *آخر رسالة:* "${conversationText.slice(-120)}"\n\n` +
          `⚡ *توصية المبيعات:* ${scoringJson.recommended_sales_action}`;

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: alertMsg,
            parse_mode: 'Markdown'
          })
        }).catch(() => {});
      }
    }

    return scoringJson;
  } catch (err) {
    console.error('Lead scoring error:', err);
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const { visitorData = {}, conversationText = '' } = body;

    const result = await scoreAndAlertLead(visitorData, conversationText, env);
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
}
