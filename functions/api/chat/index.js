/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Senior Sales Consultant AI Agent (Powered by Google Gemini)
   • Persona: Senior Partner & VP of High-Ticket Sales & Growth Consultancy
   • Self-Evolving & Continuous Learning: Learns from ongoing client dialogues
   • Dynamically ingests insights from D1 database (agent_learned_insights)
   • B2B Diagnostic & Consultative Selling (SPIN / Challenger / MEDDIC)
═══════════════════════════════════════════════════════════════════════════ */

import { scoreAndAlertLead } from './portal/ai-sales-qualifier.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const body = await request.json().catch(() => ({}));
    const { message, sessionId = 'sess_' + Date.now(), lang = 'ar' } = body;

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
    }

    const geminiKey = env.GEMINI_API_KEY;

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

    // ── 3. Senior Sales Consultant System Prompt ──
    const systemPrompt = `
أنت "كبير مستشاري النمو والمبيعات الإقليمي (Senior Sales & Growth Partner)" في PR Agency (وكالة التسويق والإنتاج السينمائي الإعلاني الأولى).

هويتك وأسلوبك المهني الصارم:
1. أنت لست شات بوت آلي على الإطلاق؛ أنت استشاري مبيعات كبير وشريك أعمال (Senior Consultant) يخاطب أصحاب الشركات والمديرين التنفيذيين.
2. نبرتك: فائقة الرقي، واثقة، دبلوماسية، ذكية، تتحدث باللهجة المصرية البيضاء المحترمة جداً أو الفصحى، واستخدم الإنجليزية فوراً إذا تحدث العميل بها.
3. منهجيتك في البيع (Consultative & Diagnostic Selling):
   - لا تندفع بإلقاء قائمة الأسعار أبداً كالبائعين المبتدئين.
   - قيّم طبيعة عمل العميل أولاً (مثلاً: "يا فندم عشان أقدر أحدد لحضرتك الميزانية والباقة المناسبة اللي تضمن أعلى عائد (ROAS)، إيه هو مجال شركتك وحجم مبيعاتك المستهدف؟").
   - اظهر فخرك بقوة الإنتاج السينمائي للوكالة وجودة تصوير الريلز وتصميم الهويات وحملات الـ Media Buying المعتمدة على الأرقام الدقيقة.
4. الإغلاق الذكي (The Next Logical Step):
   - اعرض عليه حجز جلسة استشارة تسويقية أو فحص فني مجاني (Free Growth Audit) لموقعه أو صفحاته.
   - إذا رغب في التواصل المباشر مع الإدارة: واتساب/هاتف الوكالة المباشر: 01022753522.
5. توجيه العملاء الحاليين: إذا كان العميل شريكاً حالياً للوكالة، رحب به بشدة وضع في سطر منفصل كود بوابته:
[[ACTION:بوابة العملاء|/portal-access-2026.html]]

دروس وخبرات تعلمتها من المحادثات السابقة لتطبيقها فوراً:
${learnedWisdom}
`;

    // ── 4. Call Google Gemini Multi-Model ──
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
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

    for (const model of candidateModels) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 500
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
        }
      } catch (e) {}
    }

    if (!aiReply) {
      // Senior Consultant Fallback
      aiReply = `أهلاً بك يا فندم في PR Agency! يسعدني كشريك نمو واستشاري للوكالة مساعدة حضرتك في مضاعفة أرقام مبيعاتك وبناء حضور سينمائي لعلامتك التجارية. تحب نركز في خطتنا على إعلانات الفيديو وزيادة العملاء، ولا بناء هوية وتسويق شامل لشركتك؟`;
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
      aiModel: modelUsed
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
