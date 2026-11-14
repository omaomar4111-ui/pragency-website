/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Senior Sales Consultant AI Agent (Powered by Google Gemini)
   • Persona: Senior Partner & VP of High-Ticket Sales & Growth Consultancy
   • Self-Evolving & Continuous Learning: Learns from ongoing client dialogues
   • Dynamically ingests insights from D1 database (agent_learned_insights)
   • B2B Diagnostic & Consultative Selling (SPIN / Challenger / MEDDIC)
═══════════════════════════════════════════════════════════════════════════ */

import { scoreAndAlertLead } from '../portal/ai-sales-qualifier.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const body = await request.json().catch(() => ({}));
    const { message, sessionId = 'sess_' + Date.now(), clientMeta = {} } = body;

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
    }

    const geminiKey = env.GEMINI_API_KEY;

    // ── Location & Dialect Intelligence (Cloudflare Geo + Client Meta) ──
    const cf = request.cf || {};
    const countryCode = (request.headers.get('cf-ipcountry') || cf.country || '').toUpperCase();
    const city = cf.city || '';
    const region = cf.region || '';
    const clientTimeZone = clientMeta.timeZone || cf.timezone || '';
    const clientLang = clientMeta.lang || request.headers.get('accept-language') || '';

    // Dialect & Localization Matrix
    let dialectGuidance = '';
    let locationContext = `Country: ${countryCode || 'Unknown'}, City: ${city || 'Unknown'}, Timezone: ${clientTimeZone || 'Unknown'}`;

    if (['SA', 'AE', 'KW', 'QA', 'BH', 'OM'].includes(countryCode) || /Riyadh|Dubai|Kuwait|Qatar|Doha|Muscat|Manama|Abu Dhabi/i.test(clientTimeZone)) {
      dialectGuidance = `
- العميل يراسلك من الخليج العربي (${countryCode === 'SA' ? 'المملكة العربية السعودية 🇸🇦' : countryCode === 'AE' ? 'الإمارات العربية المتحدة 🇦🇪' : countryCode === 'KW' ? 'الكويت 🇰🇼' : countryCode === 'QA' ? 'قطر 🇶🇦' : 'الخليج العربي'}).
- تحدث معه باللهجة الخليجية البيضاء الراقية، المحترمة جداً والمهنية لقطاع الأعمال (بزنس راقي).
- استخدم عبارات ترحيبية وتعبيرية خليجية مثل: "يا هلا والله ومسهلا فيك يا غالي"، "طال عمرك"، "أبشر بعزك"، "وش تخصص مشروعك أو متجرك؟"، "عشان نحدد لك الخطة اللي ترفع مبيعاتك وتضمن لك أعلى عائد (ROAS)"، "نسوي لك محتوى إعلاني سينمائي يفرِق بالسوق".
- إذا كان في السعودية، اذكر مراعاة مواسم التجارة السعودية (يوم التأسيس، اليوم الوطني، عروض وتصوير إعلانات سناب شات وتيك توك وفيسبوك للجمهور السعودي).`;
    } else if (countryCode === 'EG' || /Cairo|Egypt/i.test(clientTimeZone)) {
      dialectGuidance = `
- العميل يراسلك من مصر 🇪🇬.
- تحدث معه باللهجة المصرية البيضاء المحترمة والراقية جداً لرواد الأعمال وأصحاب الشركات (Business Casual / Corporate).
- استخدم عبارات مثل: "أهلاً بك يا فندم"، "منورنا يا غالي"، "يسعدنا جداً شراكتنا مع حضرتك"، "طبيعة بيزنس حضرتك إيه ومستهدف مبيعات قد إيه في الفترة الجاية؟"، "نعمل لحضرتك شغل تصوير إعلاني وMedia Buying مدروس بالملي".`;
    } else if (['MA', 'DZ', 'TN'].includes(countryCode) || /Casablanca|Algiers|Tunis/i.test(clientTimeZone)) {
      dialectGuidance = `
- العميل يراسلك من المغرب العربي (${countryCode === 'MA' ? 'المغرب 🇲🇦' : countryCode === 'DZ' ? 'الجزائر 🇩🇿' : 'تونس 🇹🇳'}).
- تحدث معه بعربية سلسة قريبة ومفهومة جداً مع لمسات ترحيبية مغاربية لطيفة، وإذا بدأ بالفرنسية أو الإنجليزية، جاوبه بنفس لغته فوراً وباحترافية مطلقة.
- عبارات مثل: "مرحباً بك خويا / أهلاً بك يا فندم"، "شرف لينا نتواصلو معاك"، "باش نحددو الخطة التسويقية المناسبة لمشروعك ونرفعو رقم المعاملات والمبيعات".`;
    } else if (['JO', 'LB', 'SY', 'PS'].includes(countryCode) || /Amman|Beirut|Damascus|Jerusalem/i.test(clientTimeZone)) {
      dialectGuidance = `
- العميل يراسلك من بلاد الشام (${countryCode === 'JO' ? 'الأردن 🇯🇴' : countryCode === 'LB' ? 'لبنان 🇱🇧' : countryCode === 'PS' ? 'فلسطين 🇵🇸' : 'سوريا 🇸🇾'}).
- تحدث معه باللهجة الشامية البيضاء الراقية اللطيفة والمحترمة جداً في البزنس.
- استخدم عبارات مثل: "أهلاً وسهلاً بحضرتك، نورتنا"، "يسعد أوقاتك يا رب"، "تكرم عينك"، "شو مجال شركتك وشو الهدف البيعي اللي حابب توصله؟".`;
    } else if (['IQ'].includes(countryCode) || /Baghdad/i.test(clientTimeZone)) {
      dialectGuidance = `
- العميل يراسلك من العراق 🇮🇶.
- تحدث معه باللهجة العراقية البيضاء المهذبة والمحترمة لأصحاب المشاريع.
- استخدم عبارات مثل: "كل الهلا بيك عيني"، "منورنا أستاذنا العزيز"، "تدلل وتأمر أمر"، "شنو طبيعة مشروعك وشنو خطتكم للمبيعات؟".`;
    } else {
      dialectGuidance = `
- العميل يراسلك من موقع دولي (${locationContext}).
- إذا كتب بالعربية: تحدث معه بلغة عربية فصحى عصرية ومبسطة، راقية ومهنية جداً.
- إذا كتب بالإنجليزية أو أي لغة أجنبية أخرى: تحدث بنفس لغته فوراً (Native High-Ticket B2B English Consultant Tone).`;
    }

    // ── 1. Fetch Dynamic Learned Insights from DB (Self-Evolution Memory) ──
    let learnedWisdom = '';
    if (db) {
      try {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS agent_learned_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT,
            successful_technique TEXT,
            context_lesson TEXT NOT NULL,
            quality_score INTEGER DEFAULT 90,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});

        const rows = await db.prepare(`
          SELECT context_lesson FROM agent_learned_insights 
          ORDER BY id DESC LIMIT 5
        `).all().catch(() => ({ results: [] }));

        if (rows?.results?.length) {
          learnedWisdom = rows.results.map(r => `- ${r.context_lesson}`).join('\n');
        }
      } catch (e) {}
    }

    if (!learnedWisdom) {
      learnedWisdom = `- اسأل العميل عن مجاله وتحدي المبيعات الحالي قبل إعطاء أسعار ثابتة.
- ركز على العائد الاستثماري (ROAS) وجودة المحتوى الإعلاني السينمائي للريلز.
- اعرض تشخيصاً تسويقياً مجانياً (Free Audit) لبناء شراكة فورية.`;
    }

    // ── 2. Fetch recent conversation history ──
    let conversationHistory = [];
    if (db) {
      try {
        const histResult = await db.prepare(`
          SELECT role, content FROM chat_messages 
          WHERE session_id = ? ORDER BY id ASC LIMIT 8
        `).bind(sessionId).all().catch(() => ({ results: [] }));
        conversationHistory = histResult?.results || [];
      } catch (e) {}
    }

    // ── 3. Senior Sales Consultant System Prompt with Geo & Dialect Intelligence ──
    const systemPrompt = `
أنت "كبير مستشاري النمو والمبيعات الإقليمي (Senior Sales & Growth Partner)" في PR Agency (وكالة التسويق والإنتاج السينمائي الإعلاني الأولى).

🎯 قاعدة اللهجة ولغة العميل الإلزامية المطلقة (Dynamic Dialect & Geo-Adaptation):
${dialectGuidance}
- قاعدة ذهبية: تحدث دائماً بلهجة العميل وثقافته المحلية (سعودي/خليجي، مصري، شامي، مغاربي، عراقي، أو إنجليزي لغير العرب). اجعل العميل يشعر فوراً أنك ابن بلده وخبير في سوقه وتحدياته التجارية المحلية.

هويتك وأسلوبك المهني الصارم:
1. أنت لست روبوت دردشة آلي؛ أنت استشاري مبيعات تنفيذي كبير وشريك أعمال (Senior Consultant) يخاطب أصحاب الشركات والمديرين التنفيذيين بوقار وفطنة.
2. منهجيتك في البيع الاستشاري (Diagnostic & Consultative Selling):
   - لا تندفع بإلقاء قائمة الأسعار أبداً كالبائعين المبتدئين.
   - قيّم طبيعة عمل العميل أولاً (اسأله بلهجته عن مجاله، حجم مبيعاته الحالي والمستهدف، والمنصات التي يعتمد عليها).
   - اعرض قوة الإنتاج السينمائي للوكالة وجودة تصوير الريلز وتصميم الهويات وحملات الـ Media Buying المعتمدة على الأرقام الدقيقة.
3. الإغلاق الذكي (The Next Logical Step):
   - اعرض عليه حجز جلسة استشارة تسويقية أو فحص فني مجاني (Free Growth Audit) لموقعه أو صفحاته.
   - إذا رغب في التواصل المباشر مع الإدارة: واتساب/هاتف الوكالة المباشر: 01022753522.
4. توجيه العملاء الحاليين: إذا كان العميل شريكاً حالياً للوكالة، رحب به بشدة وضع في سطر منفصل كود بوابته:
[[ACTION:بوابة العملاء|/portal-access-2026.html]]

دروس وخبرات تعلمتها من المحادثات السابقة لتطبيقها فوراً:
${learnedWisdom}
`;

    // ── 4. Call Google Gemini Multi-Model (Prioritize Gemini 4 Argon) ──
    const candidateModels = [
      'gemini-4-argon',        // Gemini 4 Argon (البرمجة والتحليل والتفكير المنطقي العميق)
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest'
    ];
    const geminiContents = conversationHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    geminiContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    let aiReply = null;
    let modelUsed = null;
    let debugError = null;

    if (!geminiKey) {
      debugError = 'GEMINI_API_KEY is missing in env';
    } else {
      for (const model of candidateModels) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 6000);

          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: geminiContents,
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 600
              }
            })
          });
          clearTimeout(tid);

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) {
              aiReply = text;
              modelUsed = model;
              break;
            }
          } else {
            const errTxt = await geminiRes.text();
            debugError = `${model} failed (${geminiRes.status}): ${errTxt.slice(0, 150)}`;
          }
        } catch (e) {
          debugError = `${model} exception: ${e.message}`;
        }
      }
    }

    if (!aiReply) {
      // Localized Smart Fallbacks
      if (['SA', 'AE', 'KW', 'QA', 'BH', 'OM'].includes(countryCode) || /Riyadh|Dubai|Kuwait|Qatar|Doha|Muscat|Manama|Abu Dhabi/i.test(clientTimeZone)) {
        aiReply = `يا هلا والله ومسهلا فيك يا غالي في PR Agency! يسعدني كشريك نمو واستشاري للوكالة مساعدة حضرتك في مضاعفة مبيعات مشروعك وصناعة حضور إعلاني وسينمائي يفرِق بالسوق الخليجي. وش هو تخصص مشروعك أو متجرك، والهدف البيعي اللي ودك توصله؟`;
      } else {
        aiReply = `أهلاً بك يا فندم في PR Agency! يسعدني كشريك نمو واستشاري للوكالة مساعدة حضرتك في مضاعفة أرقام مبيعاتك وبناء حضور سينمائي لعلامتك التجارية. تحب نركز في خطتنا على إعلانات الفيديو وزيادة المبيعات، ولا بناء هوية وتسويق شامل لشركتك؟`;
      }
      modelUsed = 'consultant-fallback';
    }

    // ── 5. Save Messages & Self-Evolution Learning Loop in Background ──
    if (db) {
      try {
        const now = new Date().toISOString();
        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'user', ?, ?)
        `).bind(sessionId, message, now).run().catch(() => {});

        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'assistant', ?, ?)
        `).bind(sessionId, aiReply, now).run().catch(() => {});

        // Self-Evolution: If client asked a high-value objection or complex question, extract a learning insight
        if (message.length > 30 && (message.includes('سعر') || message.includes('منافس') || message.includes('ضمان'))) {
          const insightText = `التعامل مع استفسار: "${message.slice(0, 45)}" -> تقديم حل تشخيصي وبناء ثقة متبادلة دون إعطاء سعر مسبق.`;
          await db.prepare(`
            INSERT INTO agent_learned_insights (topic, successful_technique, context_lesson, quality_score)
            VALUES ('client_interaction', 'Consultative Re-framing', ?, 95)
          `).bind(insightText).run().catch(() => {});
        }
      } catch (saveErr) {}
    }

    // ── 6. Trigger Sales Scoring & VIP Lead Alert ──
    try {
      scoreAndAlertLead(
        { id: sessionId, country: request.headers.get('cf-ipcountry') || 'EG' },
        message,
        env
      ).catch(() => {});
    } catch (e) {}

    return new Response(JSON.stringify({
      reply: aiReply,
      sessionId,
      agentRole: 'Senior Sales & Growth Consultant',
      aiModel: modelUsed,
      debugError: debugError || undefined
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
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
