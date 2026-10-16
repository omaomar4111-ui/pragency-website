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
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'مساحة التخزين السحابية (PORTFOLIO_BUCKET) غير مربوطة بمشروع Cloudflare Pages حالياً. يرجى تفعيل R2 Bucket في لوحة التحكم أو استخدام روابط الصور المباشرة.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  try {
    const formData = await request.formData();
    // Accept single "file" or multiple "files" or multiple "file" entries
    let rawFiles = formData.getAll('files');
    if (!rawFiles || rawFiles.length === 0) {
      rawFiles = formData.getAll('file');
    }

    if (!rawFiles || rawFiles.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'لم يتم اختيار أي ملف للرفع' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // Limit to max 20 files per request
    const filesToUpload = rawFiles.slice(0, 20);
    const results = [];
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

    for (const file of filesToUpload) {
      if (!file || typeof file === 'string') continue;

      const originalName = file.name || 'upload.jpg';
      const ext = originalName.split('.').pop().toLowerCase();

      if (!allowedExts.includes(ext)) {
        results.push({
          name: originalName,
          success: false,
          error: `صيغة غير مدعومة (.${ext})`
        });
        continue;
      }

      if (file.size > MAX_SIZE) {
        results.push({
          name: originalName,
          success: false,
          error: 'حجم الملف يتجاوز 15MB'
        });
        continue;
      }

      try {
        const timestamp = Date.now();
        const random = crypto.randomUUID().slice(0, 8);
        const filename = `${timestamp}-${random}.${ext}`;
        const r2Key = `portfolio/${filename}`;
        const arrayBuffer = await file.arrayBuffer();

        await bucket.put(r2Key, arrayBuffer, {
          httpMetadata: {
            contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            cacheControl: 'public, max-age=31536000, immutable'
          }
        });

        const streamUrl = `/api/portfolio/image/${filename}`;
        results.push({
          name: originalName,
          success: true,
          url: streamUrl,
          key: r2Key,
          filename
        });
      } catch (fileErr) {
        results.push({
          name: originalName,
          success: false,
          error: fileErr.message
        });
      }
    }

    // If only one file uploaded, return single-file friendly response as well as files array
    const firstSuccessful = results.find(r => r.success);
    const allSuccessful = results.every(r => r.success);

    return new Response(JSON.stringify({
      success: allSuccessful || !!firstSuccessful,
      url: firstSuccessful ? firstSuccessful.url : null,
      key: firstSuccessful ? firstSuccessful.key : null,
      filename: firstSuccessful ? firstSuccessful.filename : null,
      files: results,
      total: results.length,
      uploadedCount: results.filter(r => r.success).length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
