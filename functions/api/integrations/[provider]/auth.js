// functions/api/integrations/[provider]/auth.js
// OAuth 2.0 Auth Initiation for Meta Ads & Google Ads

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const provider = (params.provider || '').toLowerCase();
  const url = new URL(request.url);

  const clientId = url.searchParams.get('client_id');
  const redirectMode = url.searchParams.get('mode') || 'redirect'; // 'redirect' or 'json'

  if (!clientId) {
    return jsonResponse({ success: false, error: 'client_id is required' }, 400);
  }

  // Current origin callback URL
  const origin = url.origin;
  const callbackUrl = `${origin}/api/integrations/${provider}/callback`;

  // State encodes client_id and a random CSRF nonce
  const state = encodeURIComponent(JSON.stringify({
    client_id: clientId,
    nonce: Math.random().toString(36).substring(2, 10),
    created_at: Date.now()
  }));

  let authUrl = '';

  if (provider === 'meta') {
    const metaAppId = env.META_APP_ID || '1084293819283741'; // Fallback / placeholder app id
    // Scopes needed for Ads reporting & management
    const scope = encodeURIComponent('ads_read,ads_management,business_management');
    authUrl = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider === 'google') {
    const googleClientId = env.GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com'; // Fallback / placeholder
    const scope = encodeURIComponent('https://www.googleapis.com/auth/adwords');
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
  } else {
    return jsonResponse({ success: false, error: 'Unsupported provider. Use "meta" or "google".' }, 400);
  }

  if (redirectMode === 'json') {
    return jsonResponse({
      success: true,
      provider,
      client_id: clientId,
      auth_url: authUrl,
      callback_url: callbackUrl
    });
  }

  // 302 Redirect to Provider Consent Screen
  return Response.redirect(authUrl, 302);
}
