export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const customText = url.searchParams.get('text') || 'TEST FROM CLOUDFLARE WORKER ENDPOINT';

  try {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Missing environment variables',
        hasToken: !!token,
        hasChatId: !!chatId
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: customText,
        parse_mode: 'HTML'
      })
    });

    const resData = await res.json();
    return new Response(JSON.stringify({
      status: res.status,
      telegramResponse: resData,
      envCheck: {
        chatId: chatId,
        tokenPrefix: token.slice(0, 10) + '...'
      }
    }, null, 2), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
