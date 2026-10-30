const fs = require('fs');

let chatCode = fs.readFileSync('functions/api/chat.js', 'utf8');

// The upgraded Self-Learning AI prompt with deep context, memory, and agency knowledge
const SYSTEM_PROMPT = `أنت "مساعد النمو الذكي" في PR Agency (وكالة تسويق رقمي وإنتاج إعلاني رائدة في القاهرة، مصر).
مهمتك: مساعدة أصحاب المشاريع والشركات على فهم أنسب الخدمات لنمو مبيعاتهم والإجابة بذكاء واحترافية وبشرية تامة على كل استفسار.

معلومات الوكالة الأساسية:
- المقر: الشيخ زايد والقاهرة، ونخدم مصر ودول الخليج (السعودية، الإمارات، قطر، الكويت).
- الخدمات الأساسية:
  1. إدارة السوشيال ميديا وصناعة المحتوى الإبداعي (إنستجرام، فيسبوك، تيك توك، لينكد إن).
  2. الإعلانات الممولة (Media Buying) وتحقيق أعلى عائد على الإنفاق الإعلاني (ROAS).
  3. الإنتاج المرئي والتصوير الإعلاني السينمائي للريلز والمنتجات وخطوط الإنتاج.
  4. بناء الهوية البصرية والبراندنج المتكامل.
  5. الاستراتيجيات التسويقية وخطط النمو.
- القطاعات التي نخدمها: المصانع والشركات الصناعية (B2B)، العيادات والمراكز الطبية، المتاجر الإلكترونية، البراندات العقارية، الجيم والمطاعم، والشركات الناشئة.
- نظام العقود: نبدأ بعقد تجريبي مدته 3 شهور كفترة أولى لإثبات كفاءة النظام وتحقيق الأرقام، وبعدها التجديد بناءً على رغبة العميل.
- خطوات العمل: 1. استكشاف (Discover) -> 2. تخطيط واستراتيجية (Strategize) -> 3. تنفيذ وإنتاج (Create) -> 4. إطلاق وتحسين (Launch & Optimize).
- للتواصل المباشر: هاتف/واتساب 01022753522، إيميل hello@pragency.eg، أو ملء فورم حجز الاستشارة بالموقع.

قواعد الرد والأسلوب:
1. تحدث كإنسان خبير، ودود، واثق، بلهجة عربية بيضاء واضحة ومفهومة لأي عميل (مصر أو الخليج)، واستخدم الإنجليزية إذا تحدث العميل بالإنجليزية.
2. تجنب الردود الجافة والروبوتية والقوالب المحفوظة؛ أجب مباشرة على سؤال العميل وتفاصيل مشروعه.
3. استغل سياق المحادثة وتاريخ الرسائل السابقة المرفقة معك لربط كلام العميل وإظهار أنك تتذكره تماماً.
4. اجعل إجابتك ذكية ومقنعة وتنتهي دائماً بسؤال تفاعلي يشجع العميل على مشاركة تفاصيل مشروعه أو حجز استشارة.`;

// Replace AI execution block to include full conversation history and Gemini support
const oldAiBlock = `    // ── Attempt Workers AI if available ──
    let aiResponse = '';
    let aiModelUsed = null;

    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            {
              role: 'system',
              content: 'You are the smart AI Growth Assistant for PR Agency (pragency.pages.dev), a leading full-service marketing agency based in Cairo, Egypt. Speak fluently in professional Arabic or English. Be solution-oriented, concise, and helpful.'
            },
            { role: 'user', content: message }
          ],
          max_tokens: 350,
          temperature: 0.7
        });
        aiResponse = aiResult.response || aiResult.text || '';
        if (aiResponse) aiModelUsed = '@cf/meta/llama-3-8b-instruct';
      } catch (aiErr) {
        console.warn('[Chat] Workers AI error:', aiErr.message);
      }
    }`;

const newAiBlock = `    // ── Fetch Conversation Memory (Multi-turn History) ──
    let conversationHistory = [];
    if (db) {
      try {
        const histResult = await db.prepare(\`
          SELECT role, content FROM chat_messages
          WHERE session_id = ?
          ORDER BY id ASC
          LIMIT 12
        \`).bind(sessionId).all();
        conversationHistory = histResult.results || [];
      } catch (histErr) {
        console.warn('[Chat] History fetch error:', histErr.message);
      }
    }

    // ── Format history for LLM context ──
    const llmMessages = [
      {
        role: 'system',
        content: \`${SYSTEM_PROMPT}\`
      }
    ];

    for (const msgItem of conversationHistory) {
      if (msgItem.role === 'user' || msgItem.role === 'assistant') {
        llmMessages.push({
          role: msgItem.role,
          content: msgItem.content
        });
      }
    }

    // Add latest user message if not already present
    if (!llmMessages.some(m => m.role === 'user' && m.content === message)) {
      llmMessages.push({ role: 'user', content: message });
    }

    let aiResponse = '';
    let aiModelUsed = null;

    // ── 1. Attempt Free Google Gemini Flash if API Key is configured ──
    if (env.GEMINI_API_KEY) {
      try {
        const geminiContents = llmMessages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const geminiRes = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${env.GEMINI_API_KEY}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: \`${SYSTEM_PROMPT}\` }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 450
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (aiResponse) aiModelUsed = 'gemini-1.5-flash';
        }
      } catch (geminiErr) {
        console.warn('[Chat] Gemini free API attempt warning:', geminiErr.message);
      }
    }

    // ── 2. Attempt Cloudflare Workers AI (10,000 Neurons/day Free) ──
    if (!aiResponse && env.AI && typeof env.AI.run === 'function') {
      try {
        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: llmMessages,
          max_tokens: 400,
          temperature: 0.7
        });
        aiResponse = aiResult.response || aiResult.text || '';
        if (aiResponse) aiModelUsed = '@cf/meta/llama-3-8b-instruct';
      } catch (aiErr) {
        console.warn('[Chat] Workers AI error:', aiErr.message);
      }
    }`;

chatCode = chatCode.replace(oldAiBlock, newAiBlock);

fs.writeFileSync('functions/api/chat.js', chatCode, 'utf8');
console.log('Successfully upgraded functions/api/chat.js to Self-Learning Multi-Turn AI Architecture!');
