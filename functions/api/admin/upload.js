function checkAuth(request, env) {
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = atob(auth.slice(6).trim());
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    return decoded.slice(idx + 1) === PASS;
  } catch (e) { return false; }
}

function unauthorized() {
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401, headers: { 'Content-Type': 'application/json' }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ success: false, error: 'GITHUB_TOKEN not configured' }, 500);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBuffer, fileName, folder;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      folder = formData.get('folder') || 'general';
      if (!file) return json({ success: false, error: 'No file provided' }, 400);
      fileName = file.name || ('upload-' + Date.now() + '.jpg');
      fileBuffer = await file.arrayBuffer();
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.data) return json({ success: false, error: 'No data provided' }, 400);
      folder = body.folder || 'general';
      fileName = body.name || ('upload-' + Date.now() + '.jpg');
      const base64 = body.data.replace(/^data:image\/\w+;base64,/, '');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      fileBuffer = bytes.buffer;
    } else {
      return json({ success: false, error: 'Unsupported content type' }, 400);
    }

    // Validate size (max 2MB)
    if (fileBuffer.byteLength > 2 * 1024 * 1024) {
      return json({ success: false, error: 'File too large (max 2MB)' }, 400);
    }

    // Sanitize filename
    const safeName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
    const timestamp = Date.now();
    const finalName = timestamp + '-' + safeName;
    const path = 'assets/uploads/' + folder + '/' + finalName;

    // GitHub API: upload file
    const ghUrl = 'https://api.github.com/repos/omaomar4111-ui/pragency-website/contents/' + path;
    const bytes = new Uint8Array(fileBuffer);
    let binaryStr = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binaryStr += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    const base64Content = btoa(binaryStr);

    const ghResponse = await fetch(ghUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'PR-Agency-Upload'
      },
      body: JSON.stringify({
        message: 'upload: ' + path,
        content: base64Content,
        branch: 'main'
      })
    });

    if (!ghResponse.ok) {
      const err = await ghResponse.text();
      return json({ success: false, error: 'GitHub upload failed: ' + err }, 500);
    }

    // Return jsDelivr CDN URL
    const jsdelivrUrl = 'https://cdn.jsdelivr.net/gh/omaomar4111-ui/pragency-website@main/' + path;

    return json({
      success: true,
      url: jsdelivrUrl,
      path: path,
      github_url: 'https://github.com/omaomar4111-ui/pragency-website/blob/main/' + path
    });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}
