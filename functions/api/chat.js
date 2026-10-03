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
      } catch (aiErr) {
        console.warn('[Chat] Workers AI execution error:', aiErr.message);
      }
    }

    // Fallback if AI is not available or errored
    if (!aiResponse) {
      const isArabic = /[\u0600-\u06FF]/.test(message);
      if (isArabic) {
        if (/سعر|تكلفة|بكام|عرض|اسعار/i.test(message)) {
          aiResponse = "أهلاً بك في PR Agency! أسعار باقاتنا وخططنا التسويقية تعتمد على حجم نشاطك وأهدافك (سواء إدارة سوشيال ميديا، إعلانات ممولة، أو إنتاج مرئي). يرجى مشاركة رقم هاتفك أو بريدك الإلكتروني ليتواصل معك مدير الحسابات بعرض مخصص ومدروس.";
        } else if (/خدمات|بتعملوا ايه|شغلكم/i.test(message)) {
          aiResponse = "في PR Agency بنقدم حلول تسويقية متكاملة:\n1. إدارة السوشيال ميديا وحملات المحتوى\n2. الإعلانات الممولة (Media Buying) على Meta و Google و TikTok\n3. الإنتاج المرئي والتصوير الإعلاني والموشن\n4. بناء وتطوير الهوية البصرية (Branding)\n5. استراتيجيات النمو المعتمدة على البيانات.\nإيه الخدمة اللي حابب نبدأ بيها لبراندك؟";
        } else {
          aiResponse = "أهلاً بك في PR Agency — شريكك في النمو! كيف يمكننا مساعدتك اليوم لتطوير علامتك التجارية وزيادة مبيعاتك؟ يمكنك أيضاً ترك رقم هاتفك ليتواصل معك خبير تسويقي فوراً.";
        }
      } else {
        if (/price|cost|quote|budget/i.test(message)) {
          aiResponse = "Welcome to PR Agency! Our pricing depends on your business goals and service scope (Media Buying, Social Media, Content Production). Please share your phone number or email, and our senior strategist will reach out with a tailored proposal.";
        } else if (/services|what do you do|help/i.test(message)) {
          aiResponse = "At PR Agency, we offer full-suite marketing solutions:\n1. Social Media Management\n2. Performance Media Buying (Meta, Google, TikTok)\n3. Creative Visual & Video Production\n4. Branding & Visual Identity\n5. Data-Driven Growth Strategy.\nWhich service would you like to explore for your brand?";
        } else {
          aiResponse = "Hello and welcome to PR Agency — Your Partner in Growth! How can we assist you today with scaling your brand? Feel free to share your project details or contact info for a direct consultation.";
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
      sessionId
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
