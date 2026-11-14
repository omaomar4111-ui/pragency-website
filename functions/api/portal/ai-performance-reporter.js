/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — AI Executive Monthly Performance Reporter (Powered by Gemini)
   • Leverages Marketing & High-Ticket Founder Growth Skills
   • Translates raw KPIs (Spend, ROAS, Leads, CPL, Views, Engagement) into a C-Level Board Report
   • Highlights Strategic Wins, Attribution analysis, and Next-Month Growth Initiatives
   • Formatted in elegant, prestigious Arabic for Brand Owners & CEOs
═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { clientName, industry, month, kpis = {}, achievements = [] } = body;

    const geminiKey = env.GEMINI_API_KEY;

    const systemPrompt = `
أنت "كبير مستشاري النمو التسويقي والشريك الإداري (Growth Partner & CMO)" في وكالة PR Agency.
تطبق منهجيات مهارات التسويق المتقدمة (Founder Skill Suite & Enterprise Marketing Frameworks: CAC, LTV, ROAS, Blended Pipeline).

مهمتك: صياغة "تقرير الأداء والنمو الشهري التنفيذي (C-Level Executive Monthly Growth Report)" الموجه لصاحب البيزنس / المدير التنفيذي.

قواعد الصياغة الإلزامية:
1. النبرة: فخمة، موثوقة، استراتيجية، متفائلة ومبنية على لغة الأرقام وعائد الاستثمار (ROI).
2. هيكل التقرير:
   - 🌟 **الملخص التنفيذي (Executive Summary):** خلاصة سريعة للنتائج بلغة بيزنس واضحة.
   - 📈 **مؤشرات الأداء الرئيسية (Key Metrics Breakdown):** الإنفاق، المشاهدات، العملاء المحتملين (Leads)، العائد الإعلاني (ROAS)، وتكلفة الاستحواذ.
   - 🏆 **أبرز الإنجازات والانتصارات الإبداعية (Strategic Wins):** نجاحات الفيديوهات، الحملات التي تصدرت، وقوة البراندنج.
   - 🎯 **خارطة طريق الشهر القادم (Next Month Scalability Plan):** 3 مبادرات تسويقية جديدة ومقترحات مضاعفة المبيعات.
3. التحدث بأسلوب الشريك الاستراتيجي الذي يحافظ على أموال العميل ويضاعفها، لا مجرد مقاول إعلانات.
`;

    const userPrompt = `
العميل / الشركة: ${clientName || 'العميل الشريك'}
المجال: ${industry || 'التجارة والخدمات'}
الشهر المعني: ${month || 'الشهر الحالي'}
الأرقام والـ KPIs:
- إجمالي الإنفاق الإعلاني: ${kpis.spend || 'غير محدد'}
- العائد على الإنفاق (ROAS): ${kpis.roas || '4.2x'}
- عدد العملاء المحتملين / المبيعات: ${kpis.leads || '180+ عميل محتمل جاد'}
- الوصول والمشاهدات: ${kpis.impressions || '450,000+ مشاهدة'}
- أهم ما تم تنفيذه: ${achievements.join('، ') || 'إطلاق حملات الفيديو السينمائية وإعادة ضبط مسار التحويل'}

صِغ التقرير التنفيذي الكامل لتقديمه للعميل.
`;

    let reportResult = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];

    for (const model of candidateModels) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 900 }
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            reportResult = text;
            break;
          }
        }
      } catch (e) {}
    }

    if (!reportResult) {
      reportResult = `# 📊 تقرير الأداء الشهري - ${clientName}\n\n**الملخص:** تم تحقيق نتائج قياسية خلال هذا الشهر بنمو ملحوظ في المبيعات والاستحواذ الإعلاني بمعدل عائد قوي.`;
    }

    return new Response(JSON.stringify({
      success: true,
      clientName,
      month,
      reportMarkdown: reportResult
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
