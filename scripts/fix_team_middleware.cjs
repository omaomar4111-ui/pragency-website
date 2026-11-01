const fs = require('fs');
let code = fs.readFileSync('functions/api/team/_middleware.js', 'utf8');

const target = `  // 1. Allow CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // 2. Strict Authentication & Role Check`;

const replacement = `  // 1. Allow CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // 1.5. Allow public GET /api/team (public team members endpoint for website)
  const reqUrl = new URL(request.url);
  if (request.method === 'GET' && (reqUrl.pathname === '/api/team' || reqUrl.pathname === '/api/team/')) {
    return next();
  }

  // 2. Strict Authentication & Role Check`;

const isCRLF = code.includes('\r\n');
const targetNorm = isCRLF ? target.replace(/\n/g, '\r\n') : target.replace(/\r\n/g, '\n');
const repNorm = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement.replace(/\r\n/g, '\n');

if (code.includes(targetNorm)) {
  code = code.replace(targetNorm, repNorm);
  fs.writeFileSync('functions/api/team/_middleware.js', code, 'utf8');
  console.log('Successfully updated functions/api/team/_middleware.js!');
} else {
  console.log('Target not found in functions/api/team/_middleware.js');
}
