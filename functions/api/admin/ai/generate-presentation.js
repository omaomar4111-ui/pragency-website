// functions/api/admin/ai/generate-presentation.js
// Enterprise Pitch Deck & Proposal Generator (Arena-Enhanced with offers, pricing, & sales-enablement skills)

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
      client_name = 'العميل المميز',
      industry = 'العقارات والتطوير العقاري',
      budget = '50,000 EGP',
      goals = 'مضاعفة المبيعات وتوليد عملاء جادين'
    } = body;

    const { skillNames, contextPrompt } = getCombinedSkillContext('generate_presentation', industry);

    const basePrompt = `قم بإنشاء هيكل عرض تقديمي بيعي فائز (Winning 6-Slide Sales Pitch Deck) لعميلنا: "${client_name}" في قطاع "${industry}".
الميزانية المقترحة: ${budget}
الأهداف: ${goals}`;

    const arenaPrompt = enhanceWithArena(basePrompt, 'generate_presentation');

    const defaultSlides = [
      {
        slide_number: 1,
        title: `الرؤية الاستراتيجية لنمو ${client_name} في 2026`,
        bullet_points: [
          `تحويل الحضور الرقمي لـ ${client_name} إلى قمع مبيعات متدفق مستمر`,
          `بناء مكانة قيادية في قطاع ${industry} بالتفوق البصري والإعلاني`,
          `شراكة استراتيجية مستدامة مع PR Agency مبنية على الأرقام والعائد (ROI)`
        ],
        speaker_notes: `ابدأ بالترحيب بالعميل والتركيز على الشراكة طويلة الأمد بدلاً من مجرد بيع خدمة تسويقية روتينية.`
      },
      {
        slide_number: 2,
        title: `تحليل الوضع الحالي والفجوة التسويقية (Market Gap)`,
        bullet_points: [
          `المنافسون يعتمدون على حملات تقليدية تركز على الخصومات دون بناء ولاء`,
          `ارتفاع تكلفة اكتساب العميل (CAC) بسبب غياب التأهيل الأولي لليدز`,
          `فرصة غير مستغلة في محتوى الفيديو القصير (Short-form video) والبحث المحلي`
        ],
        speaker_notes: `أكد للعميل أن المشكلة ليست في جودة منتجه بل في طريقة إيصال القيمة وقمع التحويل الحالي.`
      },
      {
        slide_number: 3,
        title: `خريطة الطريق والحل المتكامل: منظومة النمو 360°`,
        bullet_points: [
          `المسار الأول: إنتاج مرئي احترافي (High-End Creative & Storytelling)`,
          `المسار الثاني: إدارة إعلانات ذكية تعتمد على A/B Testing واستهداف الجمهور النخبوي`,
          `المسار الثالث: مسار تحويل مبيعات فوري (Instant Lead Qualification via WhatsApp & CRM)`
        ],
        speaker_notes: `اشرح كيف تعمل الأجزاء الثلاثة معاً لتضمن أن كل جنيه مدفوع في الإعلانات يترجم إلى مبيعات.`
      },
      {
        slide_number: 4,
        title: `خطة المخرجات التنفيذية الشهرية (Deliverables)`,
        bullet_points: [
          `12 منشور وتصميم إبداعي عالي الجودة مع كتابة محتوى بيعي`,
          `8 فيديوهات ريلز وسينمائية تركز على الهوك القوي وقصص النجاح`,
          `إدارة ومتابعة يومية للحملات الإعلانية مع ضبط الميزانية وفقاً لأعلى أداء`,
          `لوحة تحكم حية (Client Portal) لمتابعة الأداء والمصاريف دقيقة بدقيقة`
        ],
        speaker_notes: `أبرز الشفافية التي توفرها بوابتنا الرقمية للعميل، وهي ميزة لا توفرها أغلب الوكالات الأخرى.`
      },
      {
        slide_number: 5,
        title: `هيكلة الاستثمار والتسعير (Value & Pricing Tier)`,
        bullet_points: [
          `الباقة الاستراتيجية المقترحة: ${budget} شهرياً شاملاً كافة المخرجات السابقة`,
          `متوسط تكلفة الصفقة الواحدة في قطاع ${industry} يغطي تكلفة التعاقد بالكامل من أول شهر`,
          `عقد مرن قابل للتطوير مع مراجعة مؤشرات الأداء (KPIs) بشكل ربع سنوي`
        ],
        speaker_notes: `ركز على أن هذا استثمار مولد للأرباح (Revenue Driver) وليس بند مصروفات.`
      },
      {
        slide_number: 6,
        title: `الخطوات التالية وبدء التنفيذ (Next Steps & Onboarding)`,
        bullet_points: [
          `توقيع مذكرة التفاهم وبدء ورشة عمل البراندينج خلال 48 ساعة`,
          `إطلاق أول دفعة إعلانية واختبار السوق خلال أول 7 أيام عمل`,
          `جلسة تقييم أسبوعية مع مدير الحساب المخصص لمناقشة النتائج`
        ],
        speaker_notes: `أنهِ العرض بسؤال إغلاق الصفقة: "هل نبدأ ورشة العمل يوم الأحد القادم أم يناسبكم موعد آخر؟"`
      }
    ];

    let finalSlides = defaultSlides;
    let arenaRounds = [
      "الجولة 1: تفوق المسار المعتمد على أرقام العائد الاستثماري (ROI) على مسار التسعير المنخفض.",
      "الجولة 2: تحصين العرض ببنود الشفافية في بوابة العميل ضد اعتراضات الأمان والمتابعة.",
      "الفائز النهائي: هيكل العرض التقديمي المتوازن (6 شرائح) الموجه للاستحواذ الفوري."
    ];

    // Try Cloudflare Workers AI if available
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const sys = `You are a world-class Pitch Deck Architect for enterprise deals. Output JSON strictly matching format: {"title": string, "slides": [{"slide_number": number, "title": string, "bullet_points": [string], "speaker_notes": string}]}. Language: Arabic.`;
        const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: `${arenaPrompt}\n${contextPrompt}` }
          ],
          max_tokens: 1200,
          temperature: 0.6
        });

        if (aiRes && aiRes.response) {
          const parsed = JSON.parse(aiRes.response);
          if (parsed && Array.isArray(parsed.slides)) {
            finalSlides = parsed.slides;
          }
        }
      } catch (aiErr) {
        console.warn('[Presentation Generator] AI fallback used:', aiErr.message);
      }
    }

    return jsonResponse({
      success: true,
      data: {
        title: `عرض تقديمي استراتيجي لشركة ${client_name}`,
        client_name,
        industry,
        budget,
        arena_evaluation: arenaRounds,
        skills_used: skillNames,
        slides: finalSlides
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
