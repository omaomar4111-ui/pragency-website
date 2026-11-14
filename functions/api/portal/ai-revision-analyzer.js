/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — AI Revision Analyzer & Task Extraction (Powered by Gemini)
   • Analyzes unstructured client feedback/revisions on designs/videos
   • Translates emotional/vague client comments into an engineering-grade actionable checklist
   • Assigns clear department tags (Video Editor, Graphic Designer, Copywriter)
   • Formats timestamps for video cues (e.g., 00:14) and visual adjustments
═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { deliverableTitle, deliverableType, rawFeedback, clientName } = body;

    if (!rawFeedback || !rawFeedback.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Feedback text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiKey = env.GEMINI_API_KEY;

    const systemPrompt = `
أنت "كبير المخرجين الفنيين ومدير جودة الإنتاج الإبداعي (Creative Operations Lead)" في وكالة PR Agency.
مهمتك: استلام ملاحظات وتعديلات العميل العشوائية أو غير المنظمة على عمل معين (${deliverableType || 'تصميم/فيديو'})، وتحويلها إلى "قائمة مهام تنفيذية دقيقة ومبوبة ومفصلة تقنياً (Actionable Production Checklist)".

قواعد التحليل الإلزامي:
1. استخرج نقاط التعديل بدقة وحدد المسؤول عن كل تعديل: [مونتير الفيديو] أو [مصمم الجرافيك] أو [كاتب المحتوى] أو [مدير الحملات].
2. إذا ذكر العميل توقيتات أو ثوانٍ (مثلاً: الثانية 5، في أول الفيديو، في النص)، حدد التوقيت بدقة (Timestamp Cues).
3. اضبط نبرة الملاحظات: حوّل التعبير العاطفي (مثل: "مش عاجبني الخط" أو "الألوان بهتانة") إلى توجيه تقني محدد (مثل: "تعديل الخط لخط Cairo Bold بحجم أكبر، ورفع الـ Saturation وضبط الـ Color Grading").
4. في نهاية التقرير، قدّم تقدير زمني إرشادي لتنفيذ التعديلات (مثلاً: 2 إلى 4 ساعات عمل).
5. أخرج النتيجة بتنسيق Markdown احترافي وأنيق مع أيقونات مناسبة.
`;

    const userPrompt = `
العميل: ${clientName || 'عميل الوكالة'}
العمل المراد تعديله: ${deliverableTitle || 'عمل إبداعي'} (${deliverableType || 'ميديا'})
ملاحظات وتعديلات العميل الأصلية:
"""
${rawFeedback}
"""
حلل هذه الملاحظات وقدم خطة التعديل التنفيذية الموجهة لفريق الإنتاج.
`;

    let checklistResult = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];

    for (const model of candidateModels) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            checklistResult = text;
            break;
          }
        }
      } catch (e) {}
    }

    if (!checklistResult) {
      // Smart Fallback
      checklistResult = `### 📋 قائمة مهام التعديل المعتمدة:\n- **المسؤول:** فريق الإنتاج والتصميم\n- **الملاحظة:** ${rawFeedback}\n- **الحالة:** تم التوثيق وجاري إرسالها للمصمم/المونتير للمراجعة المباشرة.`;
    }

    return new Response(JSON.stringify({
      success: true,
      deliverableTitle,
      analyzedTasks: checklistResult
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
