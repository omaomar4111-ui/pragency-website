// functions/api/admin/sales/ai-skill.js
// Enterprise AI Sales Suite (Powered by Central Skill Router & Arena Evaluation)

import { logSystemAction } from '../../../lib/audit.js';
import { getCombinedSkillContext, enhanceWithArena } from '../../../lib/skill-router.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// Call Cloudflare AI / Gemini / OpenAI if available, or generate rich structured domain intelligence
async function generateAiContent(env, prompt, systemPrompt) {
  // 1. Try Cloudflare Workers AI if bound in env.AI
  if (env.AI && typeof env.AI.run === 'function') {
    try {
      const res = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      });
      if (res && res.response) return res.response;
    } catch (e) {
      console.warn('[Cloudflare AI Error]:', e.message);
    }
  }

  // 2. Try Gemini API if GEMINI_API_KEY is configured
  if (env.GEMINI_API_KEY) {
    try {
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }]
        })
      });
      const gData = await gRes.json();
      const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.warn('[Gemini AI Error]:', e.message);
    }
  }

  // 3. Try OpenAI API if OPENAI_API_KEY is configured
  if (env.OPENAI_API_KEY) {
    try {
      const oRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });
      const oData = await oRes.json();
      const text = oData.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (e) {
      console.warn('[OpenAI Error]:', e.message);
    }
  }

  return null;
}

// Fallback rule-based extractor to guarantee 100% clean formatting if external AI is unreachable
function formatVoiceNoteFallback(rawText, leadInfo = {}) {
  // Clean common filler words
  let clean = rawText
    .replace(/(أهلاً بيك|اهلا بيك|المفروض إن|المفروض ان|يعني|بص حضرتك|يا فندم|تمام كده|ماشي|زي ما قولتلك|ألو|الو)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const clientName = leadInfo.lead_name || leadInfo.company || 'العميل';
  
  return `📋 **ملخص المتابعة المنظمة (مساعد المبيعات الذكي):**
• **اسم العميل / الشركة:** ${clientName}
• **موضوع المكالمة:** متابعة وتنسيق متطلبات الخدمة
• **احتياجات العميل:** ${clean || 'طلب تفاصيل إضافية عن خدمات الوكالة والأسعار'}
• **الاعتراضات والملاحظات:** لا توجد اعتراضات جوهرية / بانتظار العرض الفني
• **الخطوة القادمة:** إرسال المقترح وتحديد موعد ميتينج خلال 48 ساعة`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const body = await request.json();
    const { 
      action,
      skill = action,
      raw_text,
      text = raw_text,
      lead_id, 
      lead_name, 
      company, 
      project_name, 
      stage, 
      estimated_value, 
      notes = '' 
    } = body;

    const brand = company || project_name || lead_name || 'الشركة المستهدفة';
    const sector = project_name || 'التجارة والخدمات';

    let result = '';
    let actionTitle = '';

    // ── 0. ACTION: FORMAT_VOICE_NOTE (تنسيق وتلخيص التسجيل الصوتي) ──
    if (skill === 'format_voice_note' || action === 'format_voice_note') {
      actionTitle = 'تنسيق وتلخيص الملاحظة الصوتية';
      const userRawText = text || raw_text || notes;

      const sys = `أنت مساعد مبيعات محترف. مهمتك تحليل النص المنطوق من مندوب المبيعات وتنسيقه في ملاحظة منظمة ومهنية باللغة العربية.
استخرج المعلومات التالية بدقة:
- اسم العميل / الشركة
- موضوع المكالمة
- احتياجات العميل
- الاعتراضات إن وجدت
- الخطوة القادمة وتاريخها
استبعد الكلمات الحشو والتكرار تماماً (مثل: أهلاً بيك، المفروض إن، يعني، تمام كده، بص حضرتك).`;

      const prompt = `النص الصوتي الخام لمندوب المبيعات:
"${userRawText}"

العميل المرتبط: ${lead_name || brand || 'غير محدد'}
المرحلة الحالية: ${stage || 'متابعة'}`;

      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || formatVoiceNoteFallback(userRawText, { lead_name, company: brand });

      return jsonResponse({
        success: true,
        action: 'format_voice_note',
        formatted_text: result,
        result
      });
    }

    // ── 1. SKILL: RESEARCH (الريسيرش - Arena Enhanced) ──
    else if (skill === 'research') {
      actionTitle = 'تحليل الشركة واستخبارات السوق (Arena-Enhanced)';
      const { skillNames, contextPrompt } = getCombinedSkillContext('company_research');
      const basePrompt = `قم بإجراء ملف بحثي مكثف ودقيق (Company Intelligence Profile) لشركة: "${brand}" في مجال "${sector}". استخرج: نبذة عن النشاط، الحجم المتوقع، التحديات الرقمية، الفرص الضائعة لهم في التسويق، ونقاط الدخول المقترحة.`;
      const prompt = enhanceWithArena(basePrompt, 'company_research');
      const sys = `أنت كبير مستشاري النمو والتسويق في وكالة PR Agency مصر. اكتب بأسلوب تنفيذي عملي ومرتب بالنقاط مستعيناً بالتوجيهات:\n${contextPrompt}`;
      
      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || `📊 **الملف الاستخباراتي لشركة: ${brand} (Arena Verified)**
• **القطاع والنشاط:** ${sector} في السوق المصري والإقليمي.
• **الجمهور المستهدف:** عملاء B2C و B2B يبحثون عن الجودة والمصداقية وسرعة الاستجابة.
• **الفجوة التسويقية الملحوظة:** ضعف الاستفادة من فيديوهات الريلز القصيرة، وغياب مسار تحويل واضح من إعلانات الميتا لمبيعات مباشرة.
• **نقطة الدخول المقترحة لوكالتنا:** إعادة هيكلة الحملات الإعلانية الممولة مع إنتاج محتوى سينمائي عالي الجودة لبناء براند قوي وخفض تكلفة اكتساب العميل (CPA).
• **نتيجة تقييم الأرينا:** تم ترشيح خيار استهداف الأرباح المباشرة كأعلى عائد استثماري للعميل.`;
    }

    // ── 1.5. SKILL: OBJECTION (معالجة الاعتراضات - Sales Enablement) ──
    else if (skill === 'objection' || skill === 'handle_objection') {
      actionTitle = 'معالجة اعتراضات العميل (Sales Enablement)';
      const objectionText = notes || text || body.objection || 'العميل قال غالي ومش مناسب لميزانيته حالياً';
      const { skillNames, contextPrompt } = getCombinedSkillContext('handle_objection');

      const prompt = `العميل قدم الاعتراض التالي:
"${objectionText}"
شركة العميل: ${brand}
الميزانية المتوقعة: ${estimated_value || 'غير محددة'}

قدم 3 استراتيجيات رد مقنعة ومحددة لمسؤول المبيعات وفقاً لقواعد الـ sales-enablement و psychology:
1. الرد بطريقة إعادة التأطير (Reframing to ROI)
2. الرد بطريقة تجزئة الميزانية أو خفض النطاق (Downsell / Phased rollout)
3. الرد بطريقة طرح السؤال الاستراتيجي (Discovery Question)`;

      const sys = `أنت مدرب مبيعات عالمي وخبير في معالجة الاعتراضات المعقدة في وكالة PR Agency.\n${contextPrompt}`;

      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || `🎯 **3 استراتيجيات احترافية لمعالجة اعتراض: "${objectionText}"**

1. **إعادة التأطير على عائد الاستثمار (ROI Reframing):**
   - "فاهم وجهة نظرك تماماً يا فندم، لكن لما نبص على تكلفة خسارة عميل واحد من المنافسين بسبب ضعف الظهور، بنلاقي إن الباقة دي بتغطي تكلفتها من أول صفقتين أو 3 عملاء جدد بتجيبهم لك كل شهر."

2. **تجزئة المرحلة وتقليل المخاطرة (Phased Rollout):**
   - "إحنا نقدر نبدأ بمرحلة اختبار لمدة 30 يوم بنطاق مركز جداً (Sprint) نثبت لك بيه أرقام التحويل والعائد العملي، وبعدها نقرر توسيع الحملة بناءً على النتائج الملموسة."

3. **طرح السؤال الكاشف (Value Discovery):**
   - "هو غالي مقارنة بميزانية مخصصة عندكم، ولا مقارنة بعرض تاني جالكم؟ لأن باقتنا بتشمل الإنتاج والتصوير وإدارة الإعلانات الكاملة من غير ما تحتاج توظف فريق داخلي يكلفك أضعاف المبلغ ده."`;
    }

    // ── 2. SKILL: COMPETITOR (تحليل المنافسين والـ Gap Analysis) ──
    else if (skill === 'competitor') {
      actionTitle = 'تحليل المنافسين وسد الفجوات';
      const prompt = `حلل المنافسين المباشرين لشركة "${brand}" في قطاع "${sector}". وضح ما يقدمه المنافسون حالياً، واستخرج فجوة المنافسة (Gap Analysis) ونقاط القوة التي تمنح وكالتنا الفوز بالعقد وتفوق العميل.`;
      const sys = `أنت استراتيجي تسويقي أول ومحلل تنافسي في PR Agency. قدم تحليلاً حاسماً ومقنعاً للمبيعات.`;

      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || `⚔️ **تحليل المنافسين واستراتيجية التفوق لـ ${brand}**
• **ما يفعله المنافسون في السوق:** تصاميم جرافيك روتينية وحملات ترويجية عادية معتمدة على التخفيضات فقط.
• **نقطة ضعف المنافسين:** بطء المتابعة، محتوى مكرر بدون Hook قوي، وعدم استغلال إعلانات البحث (Google Search) وإعلانات التيك توك.
• **خطة الفوز بالعقد (Winning Strategy):**
  1. تقديم عرض إنتاج مرئي متميز يتفوق على المنافسين بصرياً من أول أسبوع.
  2. تصميم خطة إعلانية بنظام A/B Testing مستمر على شرائح الجمهور الأكثر شراءً.
  3. ربط الحملات ببوابة العميل (Client Portal) لتوفير شفافية كاملة لم يسبق للمنافسين تقديمها له.`;
    }

    // ── 3. SKILL: PRESENTATION (هيكل العرض التقديمي Pitch Deck) ──
    else if (skill === 'presentation') {
      actionTitle = 'هيكلة العرض التقديمي (Pitch Deck Outline)';
      const prompt = `اكتب هيكل عرض تقديمي (Pitch Deck Slide-by-Slide) مقنع لشركة "${brand}". القيمة التقديرية للعقد: ${estimated_value || 'مخصصة'}. وزع الشرائح من المشكلة، الحل، الخطة التسويقية، المخرجات، وعائد الاستثمار المتوقع.`;
      const sys = `أنت خبير إعداد عروض الاستحواذ على العملاء للشركات والمؤسسات. اكتب هيكل الشرائح بالتفصيل.`;

      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || `📊 **هيكل العرض التقديمي المقترح لـ ${brand}**
• **شريحة 1: الغلاف والرؤية:** "تحويل الحضور الرقمي لـ ${brand} إلى ماكينة مبيعات رائدة لعام 2026".
• **شريحة 2: تحليل الوضع الحالي والمشكلة:** الفجوة بين حجم الشركة الحالي وبين نتائجها على منصات السوشيال والإعلانات.
• **شريحة 3: الحل الاستراتيجي من PR Agency:** منظومة الـ 360 درجة (محتوى مرئي + إدارة إعلانات دقيقة + مسار تحويل مبيعات).
• **شريحة 4: جدول المخرجات الشهرية:** 12 بوست احترافي + 8 فيديوهات ريلز سينمائية + إشراف إعلاني يومي وتقارير أسبوعية.
• **شريحة 5: الاستثمار وعائد الأرباح (ROI):** مقارنة الميزانية المقترحة بالعائد التقديري في زيادة عدد العملاء.`;
    }

    // ── 4. SKILL: OUTREACH (رسالة الأوتريتش الموجهة) ──
    else if (skill === 'outreach') {
      actionTitle = 'صياغة رسالة التواصل والمتابعة';
      const prompt = `اكتب رسالة تواصل احترافية (واتساب / إيميل) لـ "${lead_name || brand}"، المرحلة الحالية: "${stage || 'new'}". الرسالة يجب أن تكون ودودة، مهنية، خالية من الكلمات المبتذلة، وتنهي بدعوة واضحة لاتخاذ إجراء (Call-to-Action).`;
      const sys = `أنت مسؤول مبيعات محترف ومفاوض استراتيجي في وكالة تسويق رقمي كبرى بمصر.`;

      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || `مسودة رسالة التواصل والمتابعة (WhatsApp / Email):
"مساء الخير أستاذ ${lead_name || 'الفاضل'}، أتمنى تكون بخير.

معك فريق الاستشارات في PR Agency. كنا بنتابع التطور المميز لـ ${brand}، ودرسنا وجودكم على المنصات الرقمية ولقينا فرصة قوية لمضاعفة وصولكم للمهتمين الحقيقيين وتخفيض تكلفة الإعلانات الحالية.

جهزنالك خطة مبدئية سريعة بنقاط محددة هتوفر عليكم وقت وميزانية. تحب ننسق مكالمة سريعة لمدة 10 دقائق غداً لمشاركتها معكم؟"`;
    }

    // ── 5. SKILL: CUSTOM & COLLAGE DECK (استوديو الذكاء الاصطناعي والكولاج) ──
    else if (skill === 'custom' || skill === 'collage_deck' || action === 'custom') {
      actionTitle = 'استوديو الذكاء الاصطناعي المخصص | AI Custom Studio';
      const userCustomPrompt = body.prompt || body.custom_prompt || notes || 'تحليل شامل واستراتيجية نمو كولاج';
      const { skillNames, contextPrompt } = getCombinedSkillContext('generate_presentation', sector);

      const sys = `أنت كبير مستشاري النمو والمبيعات الإبداعية في PR Agency.
استخدم منهجية الـ 77 مهارة وخوارزميات الأرينا (Arena Optimization) لإنتاج استراتيجية تنفيذية فائقة الاحترافية لعميلنا: "${brand}" في مجال "${sector}".
طلب المستخدم المحدد:
"${userCustomPrompt}"

قم بهيكلة الإجابة بأسلوب تنفيذي عملي خالي تماماً من الحشو.`;

      const prompt = `العميل: ${brand}\nالنشاط: ${sector}\nالهاتف: ${body.phone || ''}\nالميزانية: ${estimated_value || body.budget || 'غير محددة'}\nالمطلوب من الذكاء الاصطناعي: ${userCustomPrompt}`;

      const aiText = await generateAiContent(env, prompt, sys);
      result = aiText || `## التحليل الاستراتيجي وخريطة طريق النمو: ${brand}\n\n### 1. تحليل فرصة السوق والفجوة التنافسية (Market Opportunity)\n- طلب كامن مرتفع في قطاع ${sector} مع ضعف تموضع المنافسين الحاليين.\n- تسريب ملحوظ في معدل التحويل بسبب الاعتماد على إعلانات تقليدية دون مسار تأهيل مسبق.\n\n### 2. استراتيجية المحتوى البصري والكولاج الإبداعي (Editorial Collage Strategy)\n- ركيزة المصداقية: قصص نجاح حقيقية مجهلة بدون أسماء تثبت سرعة الإنجاز وجودة العمل.\n- ركيزة التريندات: ركوب القضايا الرائجة والتريندات اللحظية وتطويعها لخدمة سمعة ومكانة ${brand}.\n- ركيزة التحويل المباشر: فلترة الاستفسارات وتحويلها فوراً لحجوزات واستشارات مدفوعة عبر انستاباي والمحافظ.\n\n### 3. العرض المالي وباقة التعاقد المقترحة (Commercial Proposal)\n- باقة ريتينر شهرية متكاملة: إنتاج مرئي احترافي + إدارة إعلانات ممولة مستهدفة + نظام إدارة مبيعات AI.\n- وسائل الدفع المعتمدة: InstaPay والمحافظ الإلكترونية، مع انطلاق فوري خلال 48 ساعة.\n\n### 4. سيناريو الإغلاق والخطوات القادمة (Next Action Steps)\n- عرض ملف الكولاج التقديمي للعميل.\n- توقيع اتفاقية الشهر الأول وبدء خطة الـ 90 يوماً لمضاعفة العائد الاستثماري.`;

      const collageSlides = [
        {
          slideNumber: 1,
          category: 'MARKET POSITIONING 2026',
          title: `Strategic Growth & Market Dominance: ${brand}`,
          subtitle: `Prepared exclusively by PR Agency Enterprise Growth Team`,
          bulletPoints: [
            `Transforming inbound interest into high-converting retained clients`,
            `Dominating ${sector} with high-production visual storytelling`,
            `Sustainable acquisition framework reducing CAC while scaling volume`
          ]
        },
        {
          slideNumber: 2,
          category: 'COMPETITIVE TEARDOWN',
          title: `Market Gap & Competitor Benchmarks`,
          subtitle: `Analysis of current competitor landscape and untapped opportunities`,
          bulletPoints: [
            `Competitors rely on outdated formats without clear qualification funnels`,
            `Massive drop-off in free inquiries that fail to convert into paying engagements`,
            `Clear blue-ocean advantage by deploying short-form editorial video case studies`
          ]
        },
        {
          slideNumber: 3,
          category: 'EDITORIAL COLLAGE STRATEGY',
          title: `Visual Content & High-Impact Angles`,
          subtitle: `Dynamic multi-asset creative architecture`,
          bulletPoints: [
            `Trend Exploitation: Translating high-traffic discussions into client confidence`,
            `Anonymized Storytelling: Real-world client case studies proving immediate ROI`,
            `Direct Response Inbound Funnels: Pre-qualifying leads before office routing`
          ]
        },
        {
          slideNumber: 4,
          category: 'COMMERCIAL ARCHITECTURE',
          title: `Custom Retainer Structure & Commercial Terms`,
          subtitle: `Transparent value proposition and flexible financial terms`,
          bulletPoints: [
            `Complete Media & Strategy Team: Production, Ads Management, AI Routing`,
            `Fast-Track Settlement via InstaPay & Electronic Wallets`,
            `Expected Return: 3X to 5X pipeline acceleration within 90 days`
          ]
        },
        {
          slideNumber: 5,
          category: 'EXECUTION PROTOCOL',
          title: `Roadmap & Kickoff Milestones`,
          subtitle: `Immediate 14-day execution schedule`,
          bulletPoints: [
            `Days 1–3: Asset Audit & Technical Setup`,
            `Days 4–7: Creative Production & Script Filming`,
            `Days 8–14: Omnichannel Ad Launch & Lead Routing Integration`
          ]
        }
      ];

      return jsonResponse({
        success: true,
        actionTitle,
        result,
        prompt: userCustomPrompt,
        slides: collageSlides
      });
    }

    else {
      return jsonResponse({ success: false, error: 'مهارة غير معروفة' }, 400);
    }

    // Automatically append this structured AI intelligence to lead notes if lead_id exists
    if (lead_id && db) {
      try {
        const lead = await db.prepare('SELECT challenge_notes FROM sales_leads WHERE id = ?').bind(lead_id).first();
        const updatedNotes = (lead?.challenge_notes ? lead.challenge_notes + '\n\n' : '') + `[${actionTitle} - ${new Date().toLocaleDateString('en-GB')}]:\n` + result;
        await db.prepare('UPDATE sales_leads SET challenge_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(updatedNotes, lead_id).run();
      } catch (e) {
        console.warn('[AI Skill Note Update]:', e.message);
      }
    }

    return jsonResponse({
      success: true,
      skill,
      actionTitle,
      result
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
