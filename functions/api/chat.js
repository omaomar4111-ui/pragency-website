export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const payload = await request.json();
    const { message, sessionId, visitorId } = payload;

    if (!message || !sessionId) {
      return new Response(JSON.stringify({ error: 'Missing message or sessionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const cf = request.cf || {};
    const country = cf.country || null;
    const city = cf.city || null;
    const userAgent = request.headers.get('User-Agent') || '';

    // 1. Ensure chat session exists in D1
    if (db) {
      try {
        await db.prepare(`
          INSERT INTO chat_sessions (id, visitor_id, started_at, last_message_at, message_count, country, city, user_agent)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            last_message_at = excluded.last_message_at,
            message_count = chat_sessions.message_count + 1
        `).bind(
          sessionId,
          visitorId || 'anon',
          now,
          now,
          country,
          city,
          userAgent
        ).run();

        // Save user message
        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'user', ?, ?)
        `).bind(sessionId, message, now).run();
      } catch (dbErr) {
        console.warn('[Chat] DB logging error:', dbErr.message);
      }
    }

    // 2. Determine AI Response (Cloudflare Workers AI or Intelligent Fallback)
    let aiResponse = '';
    const systemPrompt = `You are the smart AI Growth Assistant for PR Agency (pragency.pages.dev), a leading full-service marketing agency based in Cairo, Egypt.
Agency Overview & Services:
1. Social Media Management: Complete content strategy, organic growth, professional copywriting, engagement.
2. Media Buying (Paid Ads): Meta (Facebook/Instagram), Google Search/Display, TikTok Ads with precision targeting and maximum ROI.
3. Content Production: Cinematic videos for Reels/TikTok, commercial photoshoot, motion graphics.
4. Branding & Visual Identity: Logo design, typography, brand guidelines.
5. Marketing Strategy: Comprehensive market research, competitor analysis, clear KPIs.
Contact Info: Phone: +201144826641, Email: hello@pragency.eg / hello@pragency.ag.
Instructions:
- If the user writes in Arabic, respond in fluent, friendly, professional Egyptian Arabic.
- If the user writes in English, respond in professional, friendly English.
- Keep your answers concise, engaging, and solution-focused.
- If the user expresses interest in hiring or requesting a price quote, politely encourage them to provide their name, phone number, and email so our senior strategist can reach out with a tailored proposal.`;

    let aiModelUsed = null;
    let aiErrorDetails = null;

    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 350,
          temperature: 0.7
        });
        aiResponse = aiResult.response || aiResult.text || '';
        if (aiResponse) aiModelUsed = '@cf/meta/llama-3-8b-instruct';
      } catch (aiErr) {
        console.warn('[Chat] Workers AI error:', aiErr.message);
        aiErrorDetails = aiErr.message;
      }
    } else {
      aiErrorDetails = 'env.AI binding not active';
    }

    // Comprehensive Intent-Based Knowledge Engine (Fallback & Edge-Fast Responses)
    if (!aiResponse) {
      const isArabic = /[\u0600-\u06FF]/.test(message);
      const m = message.toLowerCase();

      if (isArabic) {
        if (/سعر|تكلفة|بكام|عرض|اسعار|أسعار|باقات|فلوس|كام/i.test(message)) {
          aiResponse = "أهلاً بك! في PR Agency نعتمد خطط تسعير مرنة تناسب أهداف كل براند:\n• باقات إدارة السوشيال ميديا وصناعة المحتوى تبدأ من خطط نمو مخصصة.\n• خطط الميديا باينج (الإعلانات الممولة) تختلف حسب الميزانية الإعلانية المستهدفة.\n• الإنتاج الإعلاني وجلسات التصوير تُحسب حسب طبيعة الإنتاج.\n\nتقدر تشاركنا رقم موبايلك أو نشاطك التجاري، ومستشار التسويق هيتواصل معاك فوراً بعرض مفصل!";
        } else if (/خدمات|بتعملوا ايه|شغلكم|تقدموا|حلول|سوشيال|ميديا|اعلانات|إعلانات|تصوير|لوجو|براندنج/i.test(message)) {
          aiResponse = "نحن وكالة تسويق متكاملة نقدّم 5 خدمات أساسية:\n1. إدارة السوشيال ميديا: خطط استراتيجية، كتابة محتوى وتصميمات احترافية.\n2. الإعلانات الممولة (Media Buying): على Meta وGoogle وTikTok بأعلى عائد ROI.\n3. الإنتاج المرئي والإعلاني: تصوير فوتوغرافي، فيديوهات Reels/TikTok سينمائية، وموشن جرافيك.\n4. الهوية البصرية (Branding): تصميم لوجو ودليل هوية كامل.\n5. استشارات واستراتيجيات النمو وتطوير المبيعات.\n\nإيه المجال أو الخدمة اللي حابب تركز عليها لبراندك؟";
        } else if (/عنوان|فين|مكانكم|مقر|لوكيشن|موقعكم/i.test(message)) {
          aiResponse = "مقر PR Agency الرئيسي في القاهرة، مصر. ونقدّم خدماتنا وشراكاتنا التسويقية للشركات في جميع أنحاء مصر ودول الخليج العربي.";
        } else if (/تواصل|رقم|تليفون|موبايل|واتساب|واتس|ايميل|إيميل|اتصل/i.test(message)) {
          aiResponse = "تقدر تتواصل معنا مباشرة:\n📞 هاتف / واتساب: +201144826641\n✉️ البريد الإلكتروني: hello@pragency.eg\nأو سيب رقمك واسمك هنا وهنتواصل معاك فوراً.";
        } else if (/مين|فريق|خبرة|سابقة|عملاء|اعمالكم|أعمالكم|مين انتو/i.test(message)) {
          aiResponse = "فريق PR Agency يضم نخبة من المتخصصين في الاستراتيجيات الرقمية، الميديا باينج، صناعة المحتوى والإخراج الإعلاني. نفذنا أكثر من 19 شراكة نجاح مع كبرى العلامات التجارية في مجالات العيادات، الجيمات، العقارات، والمتاجر الإلكترونية.";
        } else if (/استشارة|عرض|خطة|مساعدة|عايز ابدأ|ابدا|ابدأ/i.test(message)) {
          aiResponse = "جاهزون لمساعدتك فوراً في إطلاق حملتك القادمة أو مضاعفة مبيعاتك! اترك لنا اسمك ورقم هاتفك أو نوع نشاطك، وسيقوم فريق الاستراتيجيات بالتواصل معك لإعداد خطة عمل مجانية.";
        } else {
          aiResponse = "أهلاً بك في PR Agency! يسعدنا جداً الإجابة على استفسارك. هل ترغب في معرفة تفاصيل خدماتنا (سوشيال ميديا، إعلانات، إنتاج إعلاني)، أم تود معرفة عروض الأسعار وخطة العمل لعلامتك التجارية؟";
        }
      } else {
        if (/price|cost|quote|budget|pricing|package|how much/i.test(m)) {
          aiResponse = "Welcome to PR Agency! Our pricing depends on your growth objectives and project scope:\n• Social Media Management tailored monthly retainers.\n• Performance Media Buying scaled to your ad spend.\n• Visual & Commercial Content Production per project.\n\nPlease share your phone number or business type, and our strategist will prepare a custom proposal for you!";
        } else if (/services|what do you do|help|offer|capabilities/i.test(m)) {
          aiResponse = "We offer 5 integrated marketing solutions:\n1. Social Media Management & Copywriting\n2. Performance Media Buying (Meta, Google, TikTok Ads)\n3. Creative Video & Photo Production\n4. Brand Identity & Visual Design\n5. Data-Driven Marketing Strategy.\n\nWhich service are you looking to start with?";
        } else if (/contact|phone|whatsapp|email|call|reach/i.test(m)) {
          aiResponse = "You can contact our team directly:\n📞 Phone / WhatsApp: +201144826641\n✉️ Email: hello@pragency.eg\nOr leave your phone number here and we'll call you right back.";
        } else if (/location|where|address|office/i.test(m)) {
          aiResponse = "PR Agency is headquartered in Cairo, Egypt, serving growing businesses across Egypt and the MENA/GCC region.";
        } else {
          aiResponse = "Hello and welcome to PR Agency! How can we assist your brand today? Feel free to ask about our marketing services, advertising plans, or request a customized consultation.";
        }
      }
    }

    // 3. Save AI response to D1
    if (db) {
      try {
        const replyTime = new Date().toISOString();
        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'assistant', ?, ?)
        `).bind(sessionId, aiResponse, replyTime).run();
      } catch (saveErr) {
        console.warn('[Chat] Error saving assistant message:', saveErr.message);
      }
    }

    return new Response(JSON.stringify({
      reply: aiResponse,
      sessionId,
      aiModel: aiModelUsed,
      aiStatus: aiModelUsed ? 'workers_ai' : 'smart_engine'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('[Chat] Unhandled error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
