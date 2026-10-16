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
      return new Response('File not found', { status: 404 });
    }

    const ext = key.split('.').pop().toLowerCase();
    let contentType = object.httpMetadata?.contentType;
    if (!contentType) {
      if (ext === 'mp4') contentType = 'video/mp4';
      else if (ext === 'webm') contentType = 'video/webm';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'gif') contentType = 'image/gif';
      else contentType = 'image/jpeg';
    }

    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err) {
    return new Response('Error retrieving file: ' + err.message, { status: 500 });
  }
}
