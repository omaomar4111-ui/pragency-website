export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const rawText = await request.text();
    if (rawText.length > 12288) {
      return new Response(JSON.stringify({ success: false, error: 'Payload too large (max 12KB)' }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }
    const body = JSON.parse(rawText || '{}');
    const cleanField = (val, fallback, maxLen = 500) =>
      typeof val === 'string' && val.trim() ? val.trim().slice(0, maxLen) : fallback;

    const subject = cleanField(body.subject, 'Luxury commercial showcase', 500);
    const camera = cleanField(body.camera || body.cameraMove, 'Dolly In', 200);
    const lens = cleanField(body.lens || body.lensAngle, '35mm Lens, Eye-Level', 200);
    const lighting = cleanField(body.lighting, 'Volumetric Cinematic Lighting', 200);
    const ratio = cleanField(body.ratio || body.aspectRatio, '9:16', 50);

    // 1. بناء الـ System Prompt السينمائي (Seedance Six-Slot)
    const systemPrompt = `You are a senior cinematic director. Write a single, highly detailed cinematic prompt (50-80 words) based on the user inputs. Output ONLY the prompt text, no intro, no outro, no quotes.
    Structure: [Subject & Action] + [Camera Move & Lens] + [Lighting & Atmospheric Locks].
    Use high-end Hollywood terminology (e.g., Arri Alexa 65, Anamorphic lens, 8K resolution).`;

    const userPrompt = `Subject: ${subject}\nCamera: ${camera}\nLens: ${lens}\nLighting: ${lighting}\nAspect Ratio: ${ratio}`;

    let finalPrompt = "";
    let activeEngine = "";

    // ==========================================
    // TIER 1: Gemini API (Primary)
    // ==========================================
    if (env.GEMINI_API_KEY) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          finalPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (finalPrompt) {
            activeEngine = "Gemini 1.5 Flash";
          }
        }
      } catch (e) {
        console.warn("Gemini Tier 1 failed, falling back to Tier 2.", e);
      }
    }

    // ==========================================
    // TIER 2: OpenRouter / FreeLLMAPI (OpenAI Compatible)
    // ==========================================
    if (!finalPrompt && env.FREE_LLM_API_KEY) {
      try {
        const apiBase = env.FREE_LLM_API_BASE || "https://openrouter.ai/api/v1";
        const model = env.FREE_LLM_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

        const freeRes = await fetch(`${apiBase}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.FREE_LLM_API_KEY}`,
            "HTTP-Referer": "https://pragency.pages.dev",
            "X-Title": "PR Agency Cinematic Studio"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 150
          })
        });

        if (freeRes.ok) {
          const data = await freeRes.json();
          finalPrompt = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '') || "";
          if (finalPrompt) {
            activeEngine = `FreeLLMAPI (${model})`;
          }
        }
      } catch (e) {
        console.warn("FreeLLMAPI Tier 2 failed, falling back to Tier 3.", e);
      }
    }

    // ==========================================
    // TIER 3: Zero-Cost Local Fallback (Higgsfield MCSLA v3.0)
    // ==========================================
    if (!finalPrompt) {
      finalPrompt = `${subject} performing action in a highly detailed environment. Shot with dynamic ${camera} using a ${lens}, capturing cinematic realism. Bathed in dramatic ${lighting} with subtle atmospheric haze, sharp specular highlights, and pristine ray-traced reflections. Filmed on Arri Alexa 65 with anamorphic glass, Hyper-Realistic 8K resolution, ending in crystal-clear focal lock.`;
      activeEngine = "Local MCSLA v3.0 (Zero-Cost)";
    }

    // إرجاع النتيجة للواجهة
    return new Response(JSON.stringify({
      success: true,
      engine: activeEngine,
      prompt: finalPrompt,
      ratio: ratio,
      camera: camera,
      lens: lens,
      lighting: lighting
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
