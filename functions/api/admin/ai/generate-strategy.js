// functions/api/admin/ai/generate-strategy.js
// Generates a comprehensive 1-month marketing strategy outline (Skill Router & Arena Enhanced)

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
      industry = 'التجارة الإلكترونية والخدمات',
      retainer_amount = 25000,
      currency = 'EGP'
    } = body;

    const { skillNames, contextPrompt } = getCombinedSkillContext('content_pillars', industry);
    let strategy = null;

    // 1. Try Cloudflare Workers AI if available
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const basePrompt = `أنت خبير استراتيجي تسويقي أول (Senior Marketing Strategist).
ضع خطة واستراتيجية تسويقية متكاملة لمدة شهر واحد (1-Month Marketing Strategy Plan) لعميل في مجال: "${industry}".
الميزانية الشهرية المقدرة: ${retainer_amount} ${currency}.
المطلوب في صورة نقاط احترافية مفصلة باللغة العربية:
1. الأهداف الرئيسية (Monthly Goals & KPIs)
2. الفئة والجمهور المستهدف (Target Audience & Personas)
3. ركائز المحتوى وزوايا النشر (4 Content Pillars مبنية على مهارات الـ CRO و Copywriting)
4. توزيع ميزانية الحملات الإعلانية المدفوعة (Ad Spend Distribution)
5. خطة العمل الأسبوعية (4 Weeks Roadmap).`;

        const arenaPrompt = enhanceWithArena(basePrompt, 'content_pillars');

        const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: `استخدم أفضل الممارسات الموثقة في المهارات التسويقية:\n${contextPrompt}` },
            { role: 'user', content: arenaPrompt }
          ],
          max_tokens: 1100,
          temperature: 0.7
        });

        if (aiRes && aiRes.response) {
          strategy = aiRes.response.trim();
        }
      } catch (e) {
        console.warn('[AI Strategy] Cloudflare AI run fallback:', e.message);
      }
    }

    // 2. High-Quality Algorithmic Strategy Blueprint Fallback
    if (!strategy) {
      const spend = Number(retainer_amount) || 25000;
      const adSpend = Math.round(spend * 0.55);
      const productionSpend = Math.round(spend * 0.30);
      const managementSpend = spend - adSpend - productionSpend;

      strategy = `📊 **خطة الاستراتيجية التسويقية الشهرية الشاملة لـ [${client_name}]**
مجال النشاط: ${industry} | الميزانية التقديرية: ${spend.toLocaleString()} ${currency}

---
### 1. الأهداف التسويقية الرئيسية (Monthly Goals & KPIs):
- تحقيق نمو في المبيعات / طلبات الشراء بنسبة +25% خلال أول 30 يوماً.
- خفض تكلفة اكتساب العميل (CPA) بنسبة 15% عبر تحسين الجمهور وزوايا الإعلانات.
- إنتاج وتوزيع 12 قطعة محتوى مرئي عالي الجودة (Reels / TikToks / Carousels).
- تحقيق عائد مستهدف على الإنفاق الإعلاني (Target ROAS) لا يقل عن 3.8x إلى 4.5x.

---
### 2. الجمهور المستهدف (Target Audience & Personas):
- **الشريحة الأساسية (Primary):** الفئة العمرية 24 - 42 سنة، المهتمون بحلول ومنتجات ${industry} بجودة موثوقة وسرعة استجابة.
- **الشريحة الفرعية (Secondary):** أصحاب القرار ورواد الأعمال الباحثين عن كفاءة التكلفة والضمان.
- **الموقع الجغرافي:** المدن الرئيسية (القاهرة الكبرى، الإسكندرية، مع توسع إعلاني نحو مدن القناة والدلتا).

---
### 3. ركائز المحتوى (Content Pillars - 4 زوايا أساسية):
1. **ركيزة المصداقية والأثر (Social Proof & Case Studies):** نتائج عملاء سابقين، مراجعات حقيقية، أرقام وإثباتات جودة.
2. **ركيزة التعليم والقيمة (Educational & Tips):** محتوى فيديو سريع يجيب على أكثر 5 مشاكل شائعة تواجه العملاء في مجال ${industry}.
3. **ركيزة وراء الكواليس (Behind the Scenes):** مراحل التجهيز، فريق العمل، ضمان الجودة، والسرعة.
4. **ركيزة العروض المباشرة (Direct Response & Offers):** عروض محدودة، حزم مجمعة (Bundles)، ودعوات شراء صريحة.

---
### 4. توزيع الميزانية الإعلانية المقترحة (Ad Spend Distribution):
- **إعلانات التحويل والمبيعات (Conversion & Catalog):** ${adSpend.toLocaleString()} ${currency} (55%)
- **صناعة وإنتاج المحتوى الإعلاني المرجعي (UGC & Reels):** ${productionSpend.toLocaleString()} ${currency} (30%)
- **إعادة الاستهداف ومتابعة سلات الشراء (Retargeting):** ${managementSpend.toLocaleString()} ${currency} (15%)

---
### 5. خارطة الطريق الأسبوعية (4 Weeks Roadmap):
- **الأسبوع الأول:** تدقيق الحسابات الإعلانية، تركيب الـ Pixel وإعداد الـ Tracking، وإطلاق حملات اختبار الرسائل الإعلانية.
- **الأسبوع الثاني:** تحليل أفضل 2 إعلانات أداءً، رفع الميزانية عليها (Scaling)، وإطلاق فيديوهات الريلز التوعوية.
- **الأسبوع الثالث:** إطلاق حملات إعادة الاستهداف (Retargeting) لكل من تفاعل ولم يشترِ، مع عرض تحفيزي إضافي.
- **الأسبوع الرابع:** مراجعة الـ ROAS العام، تصدير التقرير المالي للعميل، وتحديث خطة الشهر القادم.`;
    }

    return jsonResponse({
      success: true,
      strategy,
      metadata: {
        client_name,
        industry,
        retainer_amount,
        currency,
        generated_at: new Date().toISOString()
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
