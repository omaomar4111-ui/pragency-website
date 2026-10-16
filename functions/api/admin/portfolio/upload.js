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
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    const videoExts = ['mp4', 'webm', 'mov'];

    for (const file of filesToUpload) {
      if (!file || typeof file === 'string') continue;

      const originalName = file.name || 'upload.bin';
      const ext = originalName.split('.').pop().toLowerCase();
      const isVideo = videoExts.includes(ext) || (file.type && file.type.startsWith('video/'));
      const isImage = imageExts.includes(ext) || (file.type && file.type.startsWith('image/'));

      if (!isVideo && !isImage) {
        results.push({
          name: originalName,
          success: false,
          error: `صيغة غير مدعومة (.${ext})`
        });
        continue;
      }

      const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > limit) {
        results.push({
          name: originalName,
          success: false,
          error: isVideo ? 'حجم الفيديو يتجاوز 50MB' : 'حجم الصورة يتجاوز 10MB'
        });
        continue;
      }

      try {
        const timestamp = Date.now();
        const random = crypto.randomUUID().slice(0, 8);
        const filename = `${timestamp}-${random}.${ext}`;
        const r2Key = `portfolio/${filename}`;
        const arrayBuffer = await file.arrayBuffer();
        const mimeType = file.type || (isVideo ? `video/${ext === 'mov' ? 'mp4' : ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`);

        await bucket.put(r2Key, arrayBuffer, {
          httpMetadata: {
            contentType: mimeType,
            cacheControl: 'public, max-age=31536000, immutable'
          }
        });

        const streamUrl = `/api/portfolio/image/${filename}`;
        const mediaType = isVideo ? 'video' : 'image';

        results.push({
          name: originalName,
          success: true,
          url: streamUrl,
          key: r2Key,
          filename,
          type: mediaType,
          media_type: mediaType,
          mime_type: mimeType,
          size: file.size
        });
      } catch (fileErr) {
        results.push({
          name: originalName,
          success: false,
          error: fileErr.message
        });
      }
    }

    const firstSuccessful = results.find(r => r.success);
    const allSuccessful = results.every(r => r.success);

    return new Response(JSON.stringify({
      success: allSuccessful || !!firstSuccessful,
      url: firstSuccessful ? firstSuccessful.url : null,
      key: firstSuccessful ? firstSuccessful.key : null,
      filename: firstSuccessful ? firstSuccessful.filename : null,
      type: firstSuccessful ? firstSuccessful.type : 'image',
      media_type: firstSuccessful ? firstSuccessful.type : 'image',
      mime_type: firstSuccessful ? firstSuccessful.mime_type : 'image/jpeg',
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
