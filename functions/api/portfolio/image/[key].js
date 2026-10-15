export async function onRequest(context) {
  const { params, env } = context;
  const key = params.key;

  if (!key) {
    return new Response('Key required', { status: 400 });
  }

  const bucket = env.PORTFOLIO_BUCKET;
  if (!bucket) {
    return new Response('Storage bucket not configured', { status: 500 });
  }

  try {
    const object = await bucket.get('portfolio/' + key);
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err) {
    return new Response('Error retrieving image: ' + err.message, { status: 500 });
  }
}
