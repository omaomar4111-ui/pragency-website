/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Virtual Team Decider & Consultation Engine v2.0
   Features:
   - Multi-Turn Conversation Memory (contextHistory)
   - Action Cards Payload (Direct link to Higgsfield, Invoices, Delivery)
   - Multi-Tier LLM (Gemini -> OpenRouter/FreeLLMAPI -> Rich Fallback)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      message = '',
      targetBot = 'auto',
      history = [] // [ { role: 'user'|'assistant', text: string } ]
    } = body;

    if (!message.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'الرسالة فارغة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Agent Registry
    const BOTS = {
      media_buyer: {
        id: 'media_buyer',
        nameEn: 'Karim (Media Buyer)',
        nameAr: 'كريم — مسؤول الحملات والشراء',
        avatar: '📊',
        title: 'خبير إعلانات Meta و Google ومضاعفة الـ ROI',
        systemPrompt: `أنت كريم، مسؤول الـ Media Buying الأول في وكالة PR Agency.
أسلوبك: عملي، مهووس بالأرقام ومعدل العائد على الصرف (ROAS) وتكلفة الاستحواذ (CPA).
تحدث بالعربية (لهجة بيزنس احترافية ومباشرة).
نسّق ردك بنقاط واضحة أو خطوات عملية محددة.`
      },
      content_strategist: {
        id: 'content_strategist',
        nameEn: 'Sarah (Content Strategist)',
        nameAr: 'سارة — استراتيجية المحتوى',
        avatar: '💡',
        title: 'خبيرة استراتيجيات المحتوى وجذب الجمهور',
        systemPrompt: `أنتِ سارة، مستشارة المحتوى والـ Content Strategist في PR Agency.
أسلوبك: إبداعي وتحليلي، تركزين على الهوك (Hook) القوي، سرد القصة (Storytelling)، واحتياجات العميل المستهدف.
تحدثي بالعربية بأسلوب ذكي ومشجع ونسّقي أفكارك في نقاط bullet points.`
      },
      director: {
        id: 'director',
        nameEn: 'Tarek (Cinematic Director)',
        nameAr: 'طارق — المخرج السينمائي (Higgsfield)',
        avatar: '🎬',
        title: 'مخرج بصري متخصص في برومبتات الفيديو والإضاءة',
        systemPrompt: `أنت طارق، المخرج الفني والسينمائي في PR Agency المسؤول عن نظام Higgsfield OS.
أسلوبك: سينمائي راقٍ، مهتم بحركة الكاميرا (Dolly, Orbit, Crane)، العدسات (35mm, 85mm)، والإضاءة (Volumetric, Cyberpunk, Rim Light).
تحدث بالعربية مع استخدام المصطلحات الإخراجية الإنجليزية بدقة، واقترح إعدادات تصوير متكاملة.`
      },
      account_manager: {
        id: 'account_manager',
        nameEn: 'Nour (Account Manager)',
        nameAr: 'نور — مديرة حسابك وشؤون العميل',
        avatar: '🤝',
        title: 'متابعة مواعيد التسليم، الفواتير، والطلبات الخاصة',
        systemPrompt: `أنتِ نور، مديرة الحساب المخصصة للعميل في وكالة PR Agency.
أسلوبك: لبق، منظم، حريص على متابعة خطة العمل، تواريخ التسليم، الفواتير والاشتراكات.
تحدثي بالعربية بأسلوب راقٍ ومطمئن، وقدّمي إجابات محددة عن حالة الحساب والمتابعة.`
      }
    };

    // 2. Auto Decider Routing
    let selectedBotKey = targetBot;
    if (selectedBotKey === 'auto' || !BOTS[selectedBotKey]) {
      const lower = message.toLowerCase();
      if (lower.includes('كاميرا') || lower.includes('فيديو') || lower.includes('تصوير') || lower.includes('إخراج') || lower.includes('لقطة') || lower.includes('عدسة') || lower.includes('برومبت') || lower.includes('higgsfield')) {
        selectedBotKey = 'director';
      } else if (lower.includes('إعلان') || lower.includes('حملة') || lower.includes('ميزانية') || lower.includes('صرف') || lower.includes('meta') || lower.includes('google') || lower.includes('roi') || lower.includes('ads') || lower.includes('تمويل')) {
        selectedBotKey = 'media_buyer';
      } else if (lower.includes('فاتورة') || lower.includes('دفع') || lower.includes('موعد') || lower.includes('تسليم') || lower.includes('اشتراك') || lower.includes('حسابي') || lower.includes('تعديل')) {
        selectedBotKey = 'account_manager';
      } else {
        selectedBotKey = 'content_strategist';
      }
    }

    const bot = BOTS[selectedBotKey];

    // 3. Multi-Turn History Assembly
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const conversationMessages = [
      { role: 'system', content: bot.systemPrompt }
    ];

    for (const h of recentHistory) {
      if (h.text) {
        conversationMessages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        });
      }
    }
    conversationMessages.push({ role: 'user', content: message });

    // 4. Multi-Tier AI Generation
    const geminiKey = env.GEMINI_API_KEY;
    const freeLlmBase = env.FREE_LLM_API_BASE || 'https://openrouter.ai/api/v1';
    const freeLlmKey = env.FREE_LLM_API_KEY;
    const freeLlmModel = env.FREE_LLM_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

    let reply = '';
    let engineUsed = '';

    // Tier 1: Gemini
    if (geminiKey) {
      try {
        const geminiContents = recentHistory.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }));
        geminiContents.push({ role: 'user', parts: [{ text: message }] });

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: bot.systemPrompt }] },
            contents: geminiContents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (reply) engineUsed = 'Gemini 1.5 Flash';
        }
      } catch (err) {
        console.warn('[TeamChat] Gemini failed:', err);
      }
    }

    // Tier 2: OpenRouter / FreeLLMAPI
    if (!reply && freeLlmKey) {
      try {
        const openRes = await fetch(`${freeLlmBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freeLlmKey}`,
            'HTTP-Referer': 'https://pragency.pages.dev',
            'X-Title': 'PR Agency Virtual Team'
          },
          body: JSON.stringify({
            model: freeLlmModel,
            messages: conversationMessages,
            temperature: 0.7,
            max_tokens: 400
          })
        });

        if (openRes.ok) {
          const data = await openRes.json();
          reply = data.choices?.[0]?.message?.content?.trim() || '';
          if (reply) engineUsed = `FreeLLMAPI (${freeLlmModel})`;
        }
      } catch (err) {
        console.warn('[TeamChat] FreeLLMAPI failed:', err);
      }
    }

    // Tier 3: Zero-Cost Fallback
    if (!reply) {
      engineUsed = 'Local Agency Knowledge Base (Zero-Cost)';
      if (selectedBotKey === 'media_buyer') {
        reply = `بناءً على تحليلي للحملات المماثلة، هذه خطة التحسين الموصى بها:\n\n1. **اختبار الزوايا:** قسّم الميزانية بنسبة 60% لحملة التفاعل و 40% لحملة التحويل المباشر.\n2. **تحديد الـ CPA:** استهدف تخفيض تكلفة الاكتساب عن طريق تضييق الاهتمامات لأعلى 3 شرائح تفاعلاً.\n3. **تحسين المبدعات (Creatives):** استبدال الصور الثابتة بفيديوهات قصيرة لا تتعدى 15 ثانية لمضاعفة الـ ROAS.`;
      } else if (selectedBotKey === 'director') {
        reply = `إليك التوجيه الإخراجي الأنسب لتحقيق أقصى إبهار بصري:\n\n- **حركة الكاميرا:** حركة **Orbit 360** سريعة تدور حول المنتج بانسيابية.\n- **العدسة:** عدسة **35mm Eye-Level** لعزل الخلفية وتركيز الضوء على تفاصيل الخامة.\n- **الإضاءة:** نمط **Cyberpunk Neon Contrast** مع تدرجات اللون الأزرق والوردي ولمعان معدني حاد.`;
      } else if (selectedBotKey === 'account_manager') {
        reply = `أهلاً بك! لقد قمت بمراجعة حسابك والجدول الزمني:\n\n- **حالة التسليمات:** جميع التصاميم المتفق عليها للأسبوع الحالي مجدولة وجاهزة للمراجعة في تبويب روزنامة المحتوى.\n- **الفواتير والدفعات:** سجل حسابك محدث وموثق، ويمكنك الاطلاع على الفواتير المعتمدة بنقرة واحدة.`;
      } else {
        reply = `استراتيجية المحتوى المقترحة لمضاعفة التفاعل والمبيعات:\n\n1. **الهوك (Hook) في أول ثانيتين:** اطرح سؤالاً يبدأ بـ "ليه معظم الناس بتغلط في...؟".\n2. **حل المشكلة (Value Deliverable):** قدّم 3 نصائح عملية سريعة تظهر جودة ما تقدمه.\n3. **دعوة لاتخاذ إجراء (CTA):** اطلب من العميل كتابة تعليق للحصول على عرض حصري فوراً.`;
      }
    }

    // 5. Intelligent Action Card Payload (Connecting with Platform Modules)
    let actionCard = null;
    if (selectedBotKey === 'director') {
      actionCard = {
        type: 'higgsfield_director',
        title: '🎬 فتح استوديو المخرج السينمائي',
        desc: 'تطبيق هذه الإعدادات وتوليد برومبت Higgsfield فوراً',
        actionLabel: 'الانتقال لاستوديو المخرج ↗',
        targetTab: 'calendar'
      };
    } else if (selectedBotKey === 'media_buyer') {
      actionCard = {
        type: 'analytics_review',
        title: '📊 مراجعة لوحة التحليلات المباشرة',
        desc: 'تفقد كفاءة القنوات الإعلانية وتوزيع التحويلات الحالية',
        actionLabel: 'فتح لوحة التحليلات ↗',
        targetTab: 'analytics'
      };
    } else if (selectedBotKey === 'account_manager') {
      actionCard = {
        type: 'invoices_view',
        title: '🧾 الاطلاع على سجل الفواتير والدفعات',
        desc: 'معاينة الفواتير المستحقة وإيصالات السداد المعتمدة',
        actionLabel: 'عرض الفواتير ↗',
        targetTab: 'invoices'
      };
    } else {
      actionCard = {
        type: 'strategy_view',
        title: '📋 مراجعة الاستراتيجية التسويقية المعتمدة',
        desc: 'الاطلاع على ركائز المحتوى وتحليل المنافسين والجمهور',
        actionLabel: 'عرض الاستراتيجية ↗',
        targetTab: 'strategy'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      bot: {
        id: bot.id,
        nameAr: bot.nameAr,
        nameEn: bot.nameEn,
        avatar: bot.avatar,
        title: bot.title
      },
      reply,
      actionCard,
      engine: engineUsed,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Internal Agent Consultation Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
