// functions/api/admin/sales/ai-outreach.js
// Generates personalized smart outreach draft using cold-email & sales-enablement skills

import { getCombinedSkillContext } from '../../../lib/skill-router.js';

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
      name = 'العميل',
      company = '',
      project_name = '',
      phone = '',
      email = '',
      source_type = 'meta_ad',
      stage = 'new',
      budget = ''
    } = body;

    const brandName = company || project_name || name;
    const { skillNames, contextPrompt } = getCombinedSkillContext('generate_outreach');

    let generatedOutreach = '';
    let usedSkills = skillNames;

    // Call Cloudflare AI if available
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const sysPrompt = `أنت كبير مستشاري المبيعات في وكالة PR Agency.
مهمتك: صياغة مسودة رسالة تواصل أولية ذكية وشخصية جداً (عبر واتساب أو إيميل) لعميل محتمل، بالاعتماد على التوجيهات الرسمية التالية:
${contextPrompt}

القواعد الأساسية:
- تحدث باللهجة البيزنس المصرية الراقية والمهنية.
- أظهر أنك اطلعت على نشاط العميل ("${brandName}").
- استعمل مبدأ Hook-Value-Offer (لا تبدأ بعبارات مبتذلة مثل: نتشرف نحن شركة كذا).
- أنهِ الرسالة بدعوة واضحة لاتخاذ إجراء (Call to Action) سهلة ومريحة (مثل: مكالمة سريعة 5 دقائق).`;

        const userPrompt = `بيانات الليد:
- الاسم: ${name}
- النشاط / المشروع: ${brandName}
- المصدر: ${source_type}
- المرحلة الحالية: ${stage}
- الميزانية المتوقعة: ${budget || 'غير محددة'}
اكتب مسودة الرسالة المقترحة الآن.`;

        const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.65
        });

        if (aiRes && aiRes.response) {
          generatedOutreach = aiRes.response.trim();
        }
      } catch (aiErr) {
        console.warn('[AI Outreach Engine] Workers AI error:', aiErr.message);
      }
    }

    // High quality deterministic fallback (grounded in cold-email & sales-enablement)
    if (!generatedOutreach) {
      generatedOutreach = `مساء الخير أستاذ ${name}، أتمنى تكون بخير 🌟

معك فريق النمو في PR Agency. كنا بنراجع النشاط الرقمي لـ "${brandName}" ولقينا نقطة قوة ملحوظة في مجالك ممكن نضاعف بيها حجم العملاء والطلبات الشهرية مع خفض تكلفة الإعلانات الحالية.

جهزنا لك دراسة سريعة مبنية على أرقام السوق لخطوات عملية تقدر تطبقها فوراً.

تحب ننسق مكالمة سريعة لمدة 5 دقائق غداً في وقت يناسبك لمشاركتها معك؟`;
    }

    return jsonResponse({
      success: true,
      data: {
        outreach: generatedOutreach,
        skills_used: usedSkills,
        lead_name: name,
        company: brandName
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
