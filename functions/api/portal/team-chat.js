/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Virtual Team Decider & Consultation Engine
   Inspired by OpenMausBot (server/decider/ & multi-agent roster)
   Handles multi-agent routing between:
   1. "media_buyer": الحملات الإعلانية والميزانيات و ROI
   2. "content_strategist": أفكار المحتوى، خطط السوشيال ميديا، والجمهور المستهدف
   3. "director": توجيه الفيديوهات، اللقطات السينمائية، وإعدادات الكاميرا والإضاءة
   4. "account_manager": الفواتير، جداول التسليم، المتابعة الإدارية
   ═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      message = '',
      targetBot = 'auto', // 'auto' | 'media_buyer' | 'content_strategist' | 'director' | 'account_manager'
      contextHistory = []
    } = body;

    if (!message.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'الرسالة فارغة' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Agent Personas Registry (Inspired by OpenMausBot Bots Roster)
    const BOTS = {
      media_buyer: {
        id: 'media_buyer',
        nameEn: 'Karim (Media Buyer)',
        nameAr: 'كريم — مسؤول الحملات والشراء',
        avatar: '📊',
        title: 'خبير إعلانات Meta و Google ومضاعفة الـ ROI',
        systemPrompt: `أنت كريم، مسؤول الـ Media Buying الأول في وكالة PR Agency.
أسلوبك: عملي جداً، مباشر، مهووس بالأرقام ومعدل العائد على الصرف (ROAS) وتكلفة التحويل (CPA).
تحدث باللغة العربية (لهجة مصرية بيزنس احترافية).
قدم نصائح واضحة عن: استهداف الجمهور، الميزانية المقترحة، فحص أداء الإعلانات، وتحسين النتائج.`
      },
      content_strategist: {
        id: 'content_strategist',
        nameEn: 'Sarah (Content Strategist)',
        nameAr: 'سارة — استراتيجية المحتوى',
        avatar: '💡',
        title: 'خبيرة استراتيجيات المحتوى وجذب الجمهور',
        systemPrompt: `أنتِ سارة، مستشارة المحتوى والـ Content Strategist في PR Agency.
أسلوبك: إبداعي، تحليلي، تركزين على الهوك (Hook) القوي، سرد القصة (Storytelling)، واحتياجات العميل المستهدف.
تحدثي باللغة العربية بأسلوب ذكي ومشجع.
اقترحي أفكار منشورات، زوايا محتوى مبتكرة، وركائز استراتيجية تزيد التفاعل والمبيعات.`
      },
      director: {
        id: 'director',
        nameEn: 'Tarek (Cinematic Director)',
        nameAr: 'طارق — المخرج السينمائي (Higgsfield)',
        avatar: '🎬',
        title: 'مخرج بصري متخصص في برومبتات الفيديو والإضاءة',
        systemPrompt: `أنت طارق، المخرج الفني والسينمائي في PR Agency المسؤول عن نظام Higgsfield OS.
أسلوبك: سينمائي راقٍ، مهتم بحركة الكاميرا (Dolly, Orbit, Crane)، نوع العدسات (35mm, 85mm)، والإضاءة (Volumetric, Cyberpunk, Rim Light).
تحدث بالعربية مع استخدام المصطلحات الإخراجية الإنجليزية بدقة.
قدم نصائح إخراجية للقطات الإعلانية وكيف تجعل الفيديو يبدو بجودة سينمائية 8K.`
      },
      account_manager: {
        id: 'account_manager',
        nameEn: 'Nour (Account Manager)',
        nameAr: 'نور — مديرة حسابك وشؤون العميل',
        avatar: '🤝',
        title: 'متابعة مواعيد التسليم، الفواتير، والطلبات الخاصة',
        systemPrompt: `أنتِ نور، الـ Account Manager المخصصة للعميل في وكالة PR Agency.
أسلوبك: لبق، منظم، حريص على راحة العميل ومتابعة خطة العمل، تواريخ التسليم، الفواتير والاشتراكات.
تحدثي باللغة العربية بأسلوب راقٍ ومطمئن.
ساعدي العميل في معرفة حالة مشروعه، طلب تعديلات، أو ترتيب أولويات التسليم.`
      }
    };

    // 2. Intelligent Router (Decider Pattern from OpenMausBot)
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
        selectedBotKey = 'content_strategist'; // default advisor
      }
    }

    const bot = BOTS[selectedBotKey];

    // 3. Multi-Tier AI Generation (Gemini -> OpenRouter / FreeLLMAPI -> Intelligent Fallback)
    const geminiKey = env.GEMINI_API_KEY;
    const freeLlmBase = env.FREE_LLM_API_BASE || 'https://openrouter.ai/api/v1';
    const freeLlmKey = env.FREE_LLM_API_KEY;
    const freeLlmModel = env.FREE_LLM_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

    let reply = '';
    let engineUsed = '';

    // Tier 1: Gemini
    if (geminiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: bot.systemPrompt }] },
            contents: [{ parts: [{ text: message }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
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
            messages: [
              { role: 'system', content: bot.systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 350
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

    // Tier 3: Zero-Cost Deterministic Fallback Advice
    if (!reply) {
      engineUsed = 'Local Agency Knowledge Base (Zero-Cost)';
      if (selectedBotKey === 'media_buyer') {
        reply = `أهلاً بك! بخصوص استفسارك، ننصح دائماً بالبدء باختبار 3 زوايا إعلانية مختلفة مع ميزانية مركزة على الـ Video Views ثم التحويل، وتثبيت بكسل التتبع بدقة لتحقيق أعلى ROI ممكن. نحن نراقب حملاتك يومياً لتحسين الأرقام.`;
      } else if (selectedBotKey === 'director') {
        reply = `رائع! للحصول على أقصى أثر بصري لهذا المشهد، أقترح استخدام حركة Orbit 360 مع عدسة 35mm وإضاءة Cyberpunk Neon أو Volumetric. هذا الأسلوب يعطي منتجك هيبة سينمائية تجذب العين من أول ثانيتين.`;
      } else if (selectedBotKey === 'account_manager') {
        reply = `أهلاً بك يا فندم! جميع طلباتك وتسليماتك قيد المتابعة الدقيقة مع الفريق. يمكنك تفقد جدول المحتوى والفواتير مباشرة من اللوحة، وسأكون معك خطوة بخطوة لأي تعديل ترغب به.`;
      } else {
        reply = `فكرة ممتازة! المفتاح الأساسي هنا هو صياغة هوك (Hook) في أول ثانيتين يلامس المشكلة الحقيقية لجمهورك بلهجة قريبة منهم، ثم تقديم الحل بوضوح مع دعوة لاتخاذ إجراء (Call to Action) محددة.`;
      }
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
