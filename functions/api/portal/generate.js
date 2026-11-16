/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Multi-LLM Smart Router & Higgsfield Prompt Engine
   Architecture:
   1. Primary: Google Gemini 4 Argon / 2.5 Flash (via GEMINI_API_KEY)
   2. Secondary: FreeLLMAPI / Open-Source Free LLM Gateway (FREE_LLM_API_URL / OPENROUTER)
   3. Tertiary: Public Free LLM Text Fallback
   4. Local Edge Fallback: Pure Deterministic Higgsfield MCSLA + Seedance Algorithm
   ═══════════════════════════════════════════════════════════════════════════ */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      subject = 'Luxury product commercial showcase',
      action = 'smooth elegant rotation highlighting metallic texture and reflections',
      cameraMove = 'Dolly In',
      lensAngle = '35mm Lens, Eye-Level',
      lighting = 'Volumetric Cinematic Lighting',
      aspectRatio = '9:16',
      style = 'Hyper-Realistic 8K, Arri Alexa Mini LF, high-end commercial aesthetic',
      targetModel = 'Flux Pro / SDXL',
      mode = 'single_shot' // 'single_shot' or 'storyboard'
    } = body;

    const geminiKey = env.GEMINI_API_KEY;
    const freeLlmBase = env.FREE_LLM_API_BASE || env.FREELLMAPI_URL;
    const freeLlmKey = env.FREE_LLM_API_KEY || 'freellmapi-client';

    // Higgsfield Prompt Engineering System Prompt
    const systemPrompt = `You are the Lead Cinematic AI Director and Prompt Engineer at PR Agency, operating under strict Higgsfield OS v3.0 (MCSLA + Seedance Six-Slot standard).
Your task: Turn the user's creative inputs into a pristine, production-grade cinematic prompt for high-end AI video/image generators (Flux Pro, Kling, Runway Gen-3, Luma Dream Machine).

MANDATORY RULES:
1. Target Length: 50 to 80 words exactly for the positive prompt. Sharp, dense, evocative.
2. Structure:
   - Sentence 1: [Subject + Action] (Primary narrative load)
   - Sentence 2: [Camera Movement + Lens/Angle + Style] (Technical directorial execution)
   - Sentence 3: [Lighting + Constraints + Locks] (Atmospheric look and physical consistency)
3. Use unidirectional camera dynamics ending with specific focus ("ending on...").
4. Never include negative words (blurry, bad) in the positive prompt.
5. Return strictly a JSON object matching this schema:
{
  "positivePrompt": "50-80 words cinematic prompt in English",
  "negativePrompt": "text, watermark, logo, blurry, low resolution, cartoonish, distorted, deformed, amateur, plastic look, overexposed, jittery motion",
  "directorNotes": {
    "camera": "${cameraMove} with ${lensAngle}",
    "lighting": "${lighting}",
    "aspectRatio": "${aspectRatio}",
    "recommendedModel": "${targetModel}"
  },
  "seedanceSixSlot": {
    "cameraMovement": "${cameraMove}",
    "subject": "${subject}",
    "action": "${action}",
    "setting": "high-end luxury cinematic studio",
    "style": "${style}",
    "lighting": "${lighting}"
  }
}`;

    const userPrompt = `
Generate a cinematic prompt for:
- Subject: ${subject}
- Action: ${action}
- Camera Movement: ${cameraMove}
- Lens & Angle: ${lensAngle}
- Lighting Preset: ${lighting}
- Style & Mood: ${style}
- Aspect Ratio: ${aspectRatio}
`;

    let generatedOutput = null;
    let providerUsed = 'Deterministic MCSLA Rule Engine';

    // ── Tier 1: Try Gemini (Fast & Ultra High Intelligence) ──
    if (geminiKey) {
      const candidateModels = ['gemini-4-argon', 'gemini-2.5-flash', 'gemini-flash-latest'];
      for (const model of candidateModels) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 6000);

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: ctrl.signal,
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 600,
                response_mime_type: 'application/json'
              }
            })
          });
          clearTimeout(tid);

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) {
              try {
                generatedOutput = JSON.parse(text);
                providerUsed = `Gemini (${model})`;
                break;
              } catch (parseErr) {}
            }
          }
        } catch (e) {}
      }
    }

    // ── Tier 2: Try FreeLLMAPI / OpenAI-Compatible Smart Router ──
    if (!generatedOutput && freeLlmBase) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 6500);

        const routerUrl = freeLlmBase.endsWith('/v1') 
          ? `${freeLlmBase}/chat/completions` 
          : `${freeLlmBase.replace(/\/+$/, '')}/v1/chat/completions`;

        const res = await fetch(routerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freeLlmKey}`
          },
          signal: ctrl.signal,
          body: JSON.stringify({
            model: 'auto:smart', // FreeLLMAPI auto smart routing
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.6,
            max_tokens: 600
          })
        });
        clearTimeout(tid);

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            try {
              generatedOutput = JSON.parse(text);
              providerUsed = `FreeLLMAPI Smart Router (${data.model || 'auto'})`;
            } catch (err) {}
          }
        }
      } catch (err) {}
    }

    // ── Tier 3: High-Precision Zero-Cost Deterministic Fallback ──
    if (!generatedOutput) {
      const positivePrompt = `${subject} performing ${action} inside a sleek modern studio. Shot with dynamic ${cameraMove} using a ${lensAngle}, filmed on Arri Alexa 65 with anamorphic glass, capturing ${style}. Bathed in dramatic ${lighting} with subtle atmospheric haze, sharp specular highlights, pristine ray-traced reflections, ending in crystal-clear focal lock.`;

      generatedOutput = {
        positivePrompt,
        negativePrompt: "text, watermark, logo, blurry, low resolution, cartoonish, distorted, deformed, amateur, plastic look, overexposed, jittery motion",
        directorNotes: {
          camera: `${cameraMove} with ${lensAngle}`,
          lighting: lighting,
          aspectRatio: aspectRatio,
          recommendedModel: targetModel
        },
        seedanceSixSlot: {
          cameraMovement: cameraMove,
          subject: subject,
          action: action,
          setting: "high-end luxury cinematic studio",
          style: style,
          lighting: lighting
        }
      };
      providerUsed = 'Higgsfield Algorithmic OS v3.0 (Zero-Cost Guard)';
    }

    return new Response(JSON.stringify({
      success: true,
      prompt: generatedOutput,
      meta: {
        timestamp: new Date().toISOString(),
        engine: 'Higgsfield MCSLA v3.0',
        provider: providerUsed
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Higgsfield-Provider': providerUsed
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Internal director engine error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
