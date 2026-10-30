// functions/api/admin/ai/generate-content.js
// Cloudflare Workers AI + Skill Router (ad-creative, copywriting, yt-script, yt-package) + Smart Creative Fallback

import { getCombinedSkillContext, enhanceWithArena } from '../../../lib/skill-router.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const {
      topic = 'عروض حصرية وخدمات تسويق رقمي متقدمة',
      platform = 'Instagram', // Instagram, Facebook, TikTok, LinkedIn, YouTube, YouTube_Shorts, Video
      tone = 'Sales',         // Sales, Professional, Funny, Inspiring
      target_audience = 'الجمهور المستهدف والعملاء المحتملين في مصر والخليج العربي',
      action = 'caption',      // 'caption', 'create_brief', 'youtube_script', 'video_script'
      industry = 'التسويق الرقمي والتجارة الإلكترونية',
      arena = false
    } = body;

    if (!topic || !topic.trim()) {
      return jsonResponse({ success: false, error: 'موضوع المهمة أو المنشور مطلوب (topic is required)' }, 400);
    }

    const cleanTopic = topic.trim();
    let generatedOutput = '';
    let usedModel = 'pr-creative-engine-v2';
    
    // Determine action routing
    const isBrief = action === 'create_brief' || action === 'creative_brief' || action === 'brief';
    const isVideo = action === 'youtube_script' || action === 'yt_script' || action === 'video_script' || 
                    platform.toLowerCase().includes('youtube') || platform.toLowerCase() === 'video';

    const routerAction = isBrief ? 'create_brief' : (isVideo ? 'youtube_script' : 'copywriting');
    const { skillNames, contextPrompt } = getCombinedSkillContext(routerAction, industry);

    // 1. Try Cloudflare Workers AI if binding available
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        let systemPrompt = '';
        let userPrompt = '';

        if (isBrief) {
          systemPrompt = `You are a Senior Creative Director & Advertising Strategist.
Use the following skills guidelines:
${contextPrompt}

Structure your response strictly in Arabic with clear markdown headings:
1. 🎯 الجمهور المستهدف بدقة (Target Audience & Psychographics)
2. 💡 الرسالة الجوهرية والوعد الأساسي (Key Value Proposition & Message)
3. 🪝 3 خطافات إعلانية مجربة ومقنعة (3 Viral High-Converting Hooks)
4. 🎨 الزاوية الإبداعية ومفهوم التصوير/التصميم (Creative Angle & Visual Direction)
5. 🚀 الدعوة لاتخاذ إجراء (High-Urgency CTA)`;

          userPrompt = `قم بإنشاء بريف إبداعي احترافي ومفصل (Creative Brief) للمهمة التالية:
عنوان ومحتوى المهمة: "${cleanTopic}"
مجال النشاط / العميل: "${industry}"
الجمهور المستهدف: "${target_audience}"`;

        } else if (isVideo) {
          systemPrompt = `You are an elite YouTube Creator & Video Algorithm Strategist based on YouTube Agent Skills (yt-script & yt-package).
Use the following skills guidelines:
${contextPrompt}

Structure your response strictly in Arabic with clear markdown headings:
1. 🎯 3 خيارات عناوين جذابة تحقق أعلى نسبة نقر (High-CTR Video Titles)
2. 🪝 3 خطافات افتتاحية محسوبة لأول 5 ثوانٍ لحبس الانتباه (Opening Hooks)
3. 🎬 سيناريو ومسار الاحتفاظ بالجمهور (Script & Retention Beats: Intro -> Problem -> Payoff -> CTA)
4. 🖼️ فكرة الغلاف البصري وتصميم المصغرة (Thumbnail Concept & Focal Point)
5. 🔍 وصف الفيديو المُحسن لمحركات البحث (SEO Description) و 5 هاشتاجات`;

          userPrompt = `اكتب سيناريو وحزمة فيديو كاملة (Video Script & Package) لـ:
الموضوع: "${cleanTopic}"
المنصة: ${platform}
الفئة المستهدفة: "${target_audience}"`;

        } else {
          systemPrompt = `You are a world-class Arabic digital marketing copywriter.
Use the following skills guidelines:
${contextPrompt}

Write a high-converting social media post tailored for ${platform}.
Tone: ${tone}.
Language: Modern Natural Arabic.
Structure:
- Hook Line (جملة افتتاحية قوية تخطف الانتباه مع إيموجي جذاب)
- Value & Body (3-4 أسطر تعرض القيمة أو العرض بأسلوب شيق)
- Call To Action (دعوة واضحة لاتخاذ إجراء - CTA)
- 5-8 Trending Relevant Hashtags`;

          userPrompt = `اكتب كابشن منشور احترافي ومغري بالكامل للموضوع التالي:
الموضوع: ${cleanTopic}
المنصة: ${platform}
نبرة الصوت: ${tone}
الفئة المستهدفة: ${target_audience}`;
        }

        if (arena) {
          userPrompt = enhanceWithArena(userPrompt, routerAction);
        }

        const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 900,
          temperature: 0.7
        });

        if (aiResponse && aiResponse.response) {
          generatedOutput = aiResponse.response.trim();
          usedModel = 'cloudflare-llama-3-8b-instruct';
        }
      } catch (aiErr) {
        console.warn('[AI Creative Copilot] Cloudflare Workers AI run fallback:', aiErr.message);
      }
    }

    // 2. High-Converting Algorithmic Fallback Engine (Zero failure guarantee)
    if (!generatedOutput) {
      if (isBrief) {
        generatedOutput = buildAlgorithmicBrief(cleanTopic, industry, target_audience);
      } else if (isVideo) {
        generatedOutput = buildAlgorithmicVideoScript(cleanTopic, platform, target_audience);
      } else {
        generatedOutput = buildAlgorithmicCaption(cleanTopic, platform, tone);
      }
      usedModel = 'pr-agency-creative-engine-v2';
    }

    return jsonResponse({
      success: true,
      data: {
        topic: cleanTopic,
        action: routerAction,
        platform,
        tone,
        skills_used: skillNames,
        model: usedModel,
        caption: generatedOutput,
        content: generatedOutput,
        created_at: new Date().toISOString()
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}

function buildAlgorithmicBrief(topic, industry, audience) {
  return `📋 **البريف الإبداعي الشامل للمهمة (Creative Brief)**
المهمة: ${topic} | المجال: ${industry}

---
### 1. 🎯 الجمهور المستهدف (Target Audience):
- **الشريحة الأساسية:** العملاء والمهتمون بـ ${industry} في مصر ودول الخليج، الباحثون عن نتائج سريعة ومضمونة.
- **الألم / الرغبة الرئيسية:** الرغبة في التميز، توفير التكاليف والمجهود، والتعامل مع جهة موثوقة تسلّم في المواعيد.

---
### 2. 💡 الرسالة الجوهرية والوعد الأساسي (Key Value Proposition):
- تحويل تحديات "${topic}" إلى فرص نمو حقيقية وملموسة بأعلى معايير الجودة والإتقان.

---
### 3. 🪝 3 خطافات إعلانية مجربة (3 High-Converting Hooks):
1. **خطاف الصدمة/الفضول:** "لو لسه بتعمل ${topic} بالطريقة القديمة.. إنت بتخسر أكتر من 40% من مجهودك وميزانيتك!"
2. **خطاف الدليل الاجتماعي:** "إزاي قدرنا نساعد عملائنا يحققوا أقصى استفادة من ${topic} في أقل من 14 يوم؟"
3. **خطاف العرض المباشر:** "الخطوة الوحيدة اللي هتنقل شغلك لمستوى تاني خالص بخصوص ${topic} جاهزة دلوقتي."

---
### 4. 🎨 الزاوية الإبداعية ومفهوم التصميم (Creative Angle & Visual Direction):
- **النمط البصري (Aesthetic):** ألوان حديثة، طباعة خطية واضحة وجريئة (Bold Typography)، واستخدام إضاءة سينمائية داكنة (Modern Dark Studio).
- **العنصر المركزي (Visual Anchor):** إظهار النتيجة النهائية السريعة (Before vs After) مع إحصائية بارزة تمنح العميل ثقة فورية.

---
### 5. 🚀 الدعوة لاتخاذ إجراء (Call To Action - CTA):
- "تواصل معنا اليوم لحجز جلستك الاستشارية أو اطلب العرض عبر الرسائل الخاصة الآن 📩"`;
}

function buildAlgorithmicVideoScript(topic, platform, audience) {
  return `🎬 **سكريبت وحزمة الفيديو الإعلاني التنافسية (Video Script & Retention Beats)**
الموضوع: ${topic} | المنصة: ${platform}

---
### 1. 🎯 3 خيارات عناوين ذات نسبة نقر مرتفعة (High-CTR Titles):
1. "السر اللي شركات التسويق مش عايزاك تعرفه عن ${topic} 🤫"
2. "كيف تتقن ${topic} في 2026 بدون ما تضيع وقت وميزانية؟"
3. "3 أخطاء شائعة بتدمر نتائج ${topic} (وكيف تتجنبها فوراً!)"

---
### 2. 🪝 3 خطافات افتتاحية لأول 5 ثوانٍ (0-5s Opening Hooks):
- **الخيار الأول (سريع ومفاجئ):** [لقطة مقربة] "وقف سكرول ثانية واحدة.. لو إنت مهتم بـ ${topic} الفيديو ده معمول ليك بالتحديد!"
- **الخيار الثاني (استفزاز فضول):** [تأثير صوتي سريع] "أنا متأكد إنك وقعت في الغلط ده على الأقل مرة وأنت بتفكر في ${topic}."
- **الخيار الثالث (نتيجة مباشرة):** [إظهار النتيجة على الشاشة] "الرقم ده قدرنا نوصله بفضل خطوة واحدة ذكية في ${topic}."

---
### 3. 📝 هيكل السيناريو ومسار الاحتفاظ بالمشاهد (Script Outline & Retention Beats):
- **(00:00 - 00:05) الخطاف والوعد:** إمساك انتباه المشاهد وحبس السكرول، وذكر الفائدة التي سيخرج بها بعد نهاية الفيديو.
- **(00:05 - 00:20) المشكلة الحقيقية:** توضيح لماذا يعاني أغلب الناس من التكلفة العالية والنتائج البطيئة.
- **(00:20 - 00:45) الحل السحري والتطبيق:** عرض 3 خطوات عملية وسهلة لتنفيذ ${topic} باحترافية وسرعة.
- **(00:45 - 00:60) الخاتمة والدعوة للإجراء (CTA):** "لو عجبك المحتوى ده، اضغط لايك واكتب لنا في التعليقات عشان نبعتلك الدليل المجاني كاملاً!"

---
### 4. 🖼️ فكرة الغلاف والمصغرة (Thumbnail Visual Concept):
- صورة شخصية بتعبير وجه مفاجئ أو واثق، خلفية ذات تباين نيون (أزرق/أرجواني)، مع نص مختصر لا يتجاوز 3 كلمات: **"السر اللي هيغير شغلك!"**.

---
### 5. 🔍 الوصف والهاشتاجات (SEO Description & Tags):
دليلك الشامل والعملي لفهم وتنفيذ ${topic} في عام 2026 بأعلى عائد وأفضل ممارسة تسويقية.
#تسويق_إلكتروني #${topic.replace(/\s+/g, '_')} #فيديو_تسويقي #بيزنس #رواد_الأعمال`;
}

function buildAlgorithmicCaption(topic, platform, tone) {
  let hook = '';
  let body = '';
  let cta = '';
  let hashtags = '';

  if (tone === 'Funny') {
    hook = `مش كل يوم بنقولها بصوت عالي.. بس المرة دي الموضوع يستاهل تركيزك 100%! 🤫🔥`;
    body = `لو كنت بتدور على الحل الأذكى لـ "${topic}"، وفرنا عليك ساعات الحيرة والبحث الطويل.\nخطوات عملية وواضحة تضمنلك أعلى نتيجة بأقل مجهود.`;
    cta = `علّق بكلمة "تفاصيل" أو ابعتلنا رسالة خاصة وهنرد عليك فوراً! 🚀`;
    hashtags = `#تسويق #أفكار_ذكية #${topic.replace(/\s+/g, '_')} #نمو #ريادة_الأعمال`;
  } else if (tone === 'Professional') {
    hook = `الجودة ليست صدفة، بل التزام دائم بالتميز والإتقان المؤسسي. 📈✨`;
    body = `يسرنا تقديم حلول متقدمة في "${topic}"، مصممة خصيصاً لتلبية متطلبات الشركات والمشاريع الواعدة الباحثة عن الريادة.\nنضمن لكم دقة التنفيذ وعائد استثماري ملموس ومستدام.`;
    cta = `تفضل بالتواصل معنا عبر الرابط في البايو أو أرسل استفسارك عبر الرسائل الخاصة للاستشارة المجانية.`;
    hashtags = `#حلول_أعمال #تسويق_مؤسسي #إدارة_أعمال #${topic.replace(/\s+/g, '_')} #استشارات`;
  } else {
    // Sales / Default
    hook = `فرصة حقيقية لن تتكرر.. العرض المنتظر بخصوص ${topic} أصبح متاحاً الآن! 🚀💥`;
    body = `لكل اللي مهتمين بـ "${topic}"، جهزنا ليكم أفضل ميزة تنافسية بأقوى ضمانات.\nما تضيعش الفرصة وخليك من أوائل المستفيدين اليوم قبل انتهاء الباقة المخصصة.`;
    cta = `احجز الآن مباشرة من خلال مراسلتنا في الخاص أو اضغط على الرابط في البايو قبل اكتمال العدد! ⏳`;
    hashtags = `#عرض_خاص #خصم #تسويق #${topic.replace(/\s+/g, '_')} #فرصة_ذهبية`;
  }

  return `${hook}\n\n${body}\n\n${cta}\n\n${hashtags}`;
}
