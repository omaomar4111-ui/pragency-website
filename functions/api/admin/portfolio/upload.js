function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;
  try {
    const base64 = authHeader.slice(6).trim();
    const decoded = atob(base64);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    return decoded.slice(colonIdx + 1) === PASS;
  } catch (e) {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="PR Agency Admin", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }

  const bucket = env.PORTFOLIO_BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ success: false, error: 'R2 storage (PORTFOLIO_BUCKET) is not bound or configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ success: false, error: 'الملف مطلوب' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Size validation: max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ success: false, error: 'حجم الملف يتجاوز الحد المسموح (10MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Allowed extensions
    const mime = file.type || '';
    const name = file.name || 'upload.jpg';
    const ext = name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!allowedExts.includes(ext)) {
      return new Response(JSON.stringify({ success: false, error: 'نوع الملف غير مدعوم. الصيغ المدعومة: JPG, PNG, WEBP, GIF' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    const filename = `${timestamp}-${random}.${ext}`;
    const r2Key = `portfolio/${filename}`;

    const arrayBuffer = await file.arrayBuffer();

    await bucket.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: mime || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        cacheControl: 'public, max-age=31536000, immutable'
      }
    });

    const streamUrl = `/api/portfolio/image/${filename}`;

    return new Response(JSON.stringify({
      success: true,
      url: streamUrl,
      key: r2Key,
      filename
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
