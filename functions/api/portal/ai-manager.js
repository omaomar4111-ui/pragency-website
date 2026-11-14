/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — AI Account Manager Engine (Multi-Model Resilient Router)
   • Senior AI Account Executive representing PR Agency
   • Handles client queries 24/7 with deep business diplomacy & project context
   • Auto-falls back across Gemini models or to Built-in Smart Fallback Engine
═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const { message, clientName, projectName, conversationHistory = [] } = body;

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Empty message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiKey = env.GEMINI_API_KEY;

    const systemInstruction = `
أنت "مدير الحسابات الذكي (AI Account Manager)" لوكالة التسويق والإنتاج السينمائي الرائدة "PR Agency".
اسمك: "مدير حساباتك في PR Agency".

طبيعة دورك ومبادئك الصارمة:
1. أنت تمثل الإدارة العليا للوكالة. أسلوبك: فائق الرقي، دبلوماسي، مرحب، واثق ومطمئن للعميل.
2. تتحدث باللهجة المصرية البيضاء المهذبة والمحترفة جداً، أو بالعربية الفصحى، أو بالإنجليزية إذا خاطبك العميل بها.
3. تفهم كل ما يخص:
   - تصوير الفيديو والإعلانات السينمائية والـ Reels.
   - الحملات الإعلانية الممولة (Media Buying) وتحقيق أعلى عائد (ROAS).
   - تصميم الهويات البصرية والبراندنج ومخرجات الشغل.
   - طلبات التحميل: إذا طلب العميل تحميل فيديو أو ملف أصلي، وضح له بلباقة أن بإمكانه الضغط على زر "طلب تصريح تحميل الملف الأصلي" بجوار العمل المطلوب في بوابته، وسيصل إشعار فوري للإدارة لاعتماده فوراً وتوفير النسخة الأصلية 4K بأعلى نقاء.
4. لو العميل عنده استفسار عن مواعيد أو تعديل: طمئنه فوراً بأن طلبه تم تسجيله وجاري تنفيذه مع التيم الإبداعي.
5. لا تستخدم أبداً جمل الذكاء الاصطناعي المبتذلة. تحدث كشخص خبير وحريص على نجاح بيزنس العميل.
`;

    // Try Gemini Models with Fallback
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-2.5-pro'
    ];

    let aiReply = null;
    let successfulModel = null;

    if (geminiKey) {
      for (const model of candidateModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          
          const formattedContents = [];
          for (const msg of conversationHistory.slice(-4)) {
            formattedContents.push({
              role: msg.sender === 'client' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          }

          formattedContents.push({
            role: 'user',
            parts: [{ text: `العميل: ${clientName || 'عميل الوكالة'}\nالمشروع: ${projectName || 'مشروع تسويقي'}\nرسالة العميل: ${message}` }]
          });

          const ctrl = new AbortController();
          const timeoutId = setTimeout(() => ctrl.abort(), 8000);

          const resp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents: formattedContents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
            })
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              aiReply = text;
              successfulModel = model;
              break;
            }
          }
        } catch (e) {
          // Continue to next model
        }
      }
    }

    if (!aiReply) {
      // Intelligent Context-Aware Fallback
      const lower = message.toLowerCase();
      if (lower.includes('تحميل') || lower.includes('فيديو') || lower.includes('download')) {
        aiReply = `أهلاً بحضرتك يا فندم! 👋 بخصوص تحميل الفيديوهات أو التصاميم الأصلية بدقة 4K، يمكنك ببساطة الضغط على زر "📥 طلب تحميل الملف الأصلي" بجوار العمل المطلوب داخل بوابتك. سيصل إشعار فوري للإدارة لاعتماده وتوفير رابط التحميل المباشر لك خلال دقائق 🚀`;
      } else if (lower.includes('تعديل') || lower.includes('تعديلات') || lower.includes('edit')) {
        aiReply = `أهلاً بك يا فندم! تم تسجيل ملاحظاتك وتعديلاتك باهتمام وسيقوم الفريق الإبداعي بمراجعتها وتجهيز النسخة المحدثة فوراً. يمكنك أيضاً كتابة أي تفاصيل إضافية داخل "ثريد التعديلات" لأي عمل ✍️`;
      } else if (lower.includes('مواعيد') || lower.includes('امتى') || lower.includes('موعد')) {
        aiReply = `أهلاً بحضرتك! جدول النشر ومواعيد تسليم الحملات موثقة بالكامل في قسم "روزنامة الشهر الحالي" في بوابتك مع تواريخ وساعات النشر المحددة. فريقنا شغال عليها بانتظام 📅`;
      } else {
        aiReply = `أهلاً بحضرتك يا فندم! 🌟 استلمت رسالتك بخصوص: "${message.substring(0, 45)}..." وفريق إدارة الحسابات يتابع طلبك وسنوافيك بالتفاصيل فوراً. هل تحب استفسرلك عن حالة تسليم مخرج معين؟`;
      }
      successfulModel = 'smart-rule-engine';
    }

    return new Response(JSON.stringify({
      success: true,
      reply: aiReply,
      source: successfulModel
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: true,
      reply: 'أهلاً بك يا فندم! تم تسجيل استفسارك وسيقوم مدير الحسابات بمتابعة طلبك فوراً 🤝',
      source: 'offline-safety-fallback'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
