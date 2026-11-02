// functions/api/internal/agents/creative-agent.js
// Autonomous Creative AI Agent — Generates Production-Grade Creative Briefs
import { sendTelegramNotification } from '../../../lib/telegram.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/**
 * Synthesizes a Creative Brief based on ad-creative, copywriting, and yt-script skills
 */
export function synthesizeCreativeBrief(task) {
  const title = (task.title || 'مهمة إبداعية جديدة').trim();
  const desc = (task.description || '').trim();
  const fullText = `${title} ${desc}`.toLowerCase();

  // Detect medium & creative angle
  let medium = 'Reels & TikTok Video Ad (9:16)';
  let visualStyle = 'سينمائي سريع مع إضاءة درامية وتقطيع ديناميكي';
  let hook = `لحظة.. لو بتدور على حل حقيقي يضاعف نتائج نشاطك بدون تشتت`;

  if (/تصوير|فيديو|ريلز|reel|video|تيك توك|tiktok|يوتيوب|yt/i.test(fullText)) {
    medium = 'Reels / Shorts Video Production (9:16)';
    visualStyle = 'لقطة أولى سريعة بحركة كاميرا Crash Zoom تجذب العين خلال أول ثانيتين';
    hook = `السر اللي معظم المنافسين في السوق بيخفوه عنك مش الإعلانات الكتير، السر هو دا...`;
  } else if (/تصميم|بوست|carousel|كاورسيل|جرافيك|design|image/i.test(fullText)) {
    medium = 'Social Media Carousel / High-Converting Static Ad (4:5)';
    visualStyle = 'تصميم مودرن بسيط (Minimalist Dark) مع كونتراست لوني عالي وTypography قوي';
    hook = `3 خطوات بسيطة هتغير نظرتك تماماً لطريقة إدارة وتسويق ${title}`;
  } else if (/كتابة|محتوى|مقال|copy|script|نص/i.test(fullText)) {
    medium = 'High-Converting Copywriting & Sales Angle';
    visualStyle = 'نص مباشر يعتمد أسلوب Problem-Agitate-Solve موجه لرواد الأعمال';
    hook = `ليه عميلك المحتمل بيفضل منافسك عنك حتى لو خدمتك أحسن؟ الإجابة في السطر التاني.`;
  }

  const brief = 
`🎯 <b>بريف إبداعي ذكي (AI Creative Brief) | للمهمة: ${title}</b>
────────────────────
📱 <b>التنسيق والمنصة المقترحة:</b> ${medium}
🎨 <b>الأسلوب البصري والإخراجي:</b> ${visualStyle}

⚡ <b>الخطاف الأولي (3-Second Visual & Audio Hook):</b>
• <i>الصوت:</i> "${hook}"
• <i>الكاميرا:</i> Dolly In سريع مع التركيز على العنصر الأساسي وإيقاف التمرير (Scroll-Stopper).

🎬 <b>مخطط المشاهد وسرد القصة (Scene Flow):</b>
1. <b>المشهد 1 (0-3 ثوانٍ):</b> تسليط الضوء على المشكلة الحقيقية بطريقة مباشرة وصادمة.
2. <b>المشهد 2 (3-8 ثوانٍ):</b> تفكيك المعتقد الخاطئ لدى الجمهور وإثبات الفجوة.
3. <b>المشهد 3 (8-18 ثانية):</b> استعراض الحل من خلال الخدمة/المنتج مع لقطات تفصيلية مقربة وتأثير فوري.
4. <b>المشهد 4 (18-25 ثانية):</b> شهادة نجاح سريعة أو مؤشر رقمي يمنح المصداقية.

✍️ <b>النص الإعلاني وزاوية الإقناع (Copywriting Script):</b>
"في كل مرة بتحاول تكبر، بتلاقي التكلفة بتزيد والنتيجة واحدة.. الحل مش إنك تدفع أكتر، الحل إنك تبني منظومة تسويقية صحيحة تحول كل زائر لعميل حقيقي. مع PR Agency، بنوفرلك المنظومة المتكاملة."

📣 <b>الدعوة لاتخاذ إجراء (Low-Friction Call-To-Action):</b>
• "اضغط على الرابط أسفل الفيديو واحجز استشارتك المجانية قبل انتهاء باقات الشهر."
• <i>الزر المقترح:</i> <b>Learn More / احجز الآن</b>`;

  return brief;
}

/**
 * Core Execution Engine for Creative Agent
 */
export async function runCreativeAgent(env, task) {
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbMain = env.DB || env.ANALYTICS_DB;

  const actionId = 'act_creative_' + Date.now();
  const briefContent = synthesizeCreativeBrief(task);
  const taskId = task.id || 'task_pending';
  const taskTitle = task.title || 'مهمة جديدة';
  const projectId = task.project_id || 'proj_agency';

  try {
    // 1. Save draft to agent_pending_actions
    await dbAnalytics.prepare(`
      INSERT INTO agent_pending_actions (
        id, agent_type, lead_id, lead_name, lead_company, action_type, draft_content, status, related_id, created_at, updated_at
      ) VALUES (?, 'creative', ?, ?, ?, 'creative_brief', ?, 'pending_approval', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      actionId,
      taskId,
      taskTitle,
      projectId,
      briefContent,
      taskId
    ).run();

    // 2. Dispatch Telegram Notification with Approval Inline Keyboard
    const telegramMsg = 
`🎨 <b>الوكيل الإبداعي | مقترح بريف إبداعي جديد (Creative Brief)</b>
────────────────────
📋 <b>المهمة:</b> ${taskTitle}
🆔 <b>المعرّف:</b> <code>${taskId}</code>

📝 <b>ملخص البريف المقترح:</b>
${briefContent.slice(0, 700)}...

⚡ <i>راجع البريف واعتمد نقله للمهمة مباشرة:</i>`;

    await sendTelegramNotification(env, telegramMsg, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ اعتماد البريف للمهمة', callback_data: `action:agent:approve_brief:${actionId}` },
            { text: '✏️ تعديل', callback_data: `action:agent:edit:${actionId}` }
          ],
          [
            { text: '❌ رفض وتجاهل', callback_data: `action:agent:reject:${actionId}` }
          ]
        ]
      }
    });

    return {
      success: true,
      actionId,
      taskId,
      briefContent
    };
  } catch (err) {
    console.error('[Creative Agent Exception]:', err.message);
    return { success: false, error: err.message };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const task = await request.json();
    const result = await runCreativeAgent(env, task);
    return jsonResponse(result, result.success ? 200 : 500);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 400);
  }
}
