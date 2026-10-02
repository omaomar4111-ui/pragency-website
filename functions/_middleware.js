import { ar, en } from './locales_data.js';

// Cooldown map in Worker memory for Telegram notifications (per visitor)
const notifyCooldown = new Map();

function isBot(userAgent) {
  if (!userAgent) return 0;
  const bots = [
    'bot', 'crawl', 'spider', 'slurp', 'googlebot', 'bingbot', 'yandex',
    'duckduckbot', 'baiduspider', 'facebookexternalhit', 'twitterbot',
    'rogerbot', 'linkedinbot', 'embedly', 'quora link preview', 'showyoubot',
    'outbrain', 'pinterest', 'slackbot', 'vkShare', 'W3C_Validator'
  ];
  const ua = userAgent.toLowerCase();
  return bots.some(b => ua.includes(b)) ? 1 : 0;
}

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

async function sendTelegramAlert(env, data) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const now = Date.now();
  const lastSent = notifyCooldown.get(data.visitorId) || 0;
  if (now - lastSent < 60000) {
    // 60 seconds cooldown per visitor to prevent spamming
    return;
  }
  notifyCooldown.set(data.visitorId, now);

  // Clean old cooldown entries periodically
  if (notifyCooldown.size > 2000) {
    notifyCooldown.clear();
  }

  const message = 
    `🔔 <b>New Visitor on PR Agency!</b>\n` +
    `📍 <b>Location:</b> ${data.city || 'Unknown'}, ${data.country || 'Unknown'}\n` +
    `🌐 <b>Page:</b> ${data.path}\n` +
    `📱 <b>Device:</b> ${data.device}\n` +
    `🔗 <b>Referrer:</b> ${data.referrer || 'Direct'}\n` +
    `🆔 <b>Visitor ID:</b> <code>${data.visitorId.slice(0, 8)}</code>`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Telegram notification error:', err);
  }
}

async function logVisit(context, visitorData) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) return;

  try {
    const now = new Date().toISOString();

    // Upsert session
    const insertSession = db.prepare(`
      INSERT INTO sessions (
        id, visitor_id, first_seen, last_seen, country, city, ip,
        user_agent, referrer, entry_page, exit_page, page_views, is_bot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        last_seen = excluded.last_seen,
        exit_page = excluded.exit_page,
        page_views = page_views + 1
    `).bind(
      visitorData.sessionId,
      visitorData.visitorId,
      now,
      now,
      visitorData.country || null,
      visitorData.city || null,
      visitorData.ip || null,
      visitorData.userAgent || null,
      visitorData.referrer || null,
      visitorData.path,
      visitorData.path,
      visitorData.isBot
    );

    // Insert page view event
    const insertEvent = db.prepare(`
      INSERT INTO events (session_id, visitor_id, event_type, event_data, page_url, timestamp)
      VALUES (?, ?, 'page_view', ?, ?, ?)
    `).bind(
      visitorData.sessionId,
      visitorData.visitorId,
      JSON.stringify({ lang: visitorData.lang }),
      visitorData.path,
      now
    );

    await db.batch([insertSession, insertEvent]);
  } catch (err) {
    console.error('Visitor logging DB error:', err);
  }
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Skip backend endpoints, static assets, and admin
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/locales/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/css/') ||
    pathname.startsWith('/js/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.json')
  ) {
    return next();
  }

  // 2. Identify Visitor & Session
  const cookies = parseCookies(request.headers.get('Cookie'));
  let visitorId = cookies['pr_vid'];
  let newVidCookie = null;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    newVidCookie = `pr_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  // Generate a daily-based or ongoing session ID
  const todayStr = new Date().toISOString().slice(0, 10);
  const sessionId = `${visitorId.slice(0, 8)}_${todayStr}`;

  const userAgent = request.headers.get('User-Agent') || '';
  const botFlag = isBot(userAgent);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const country = request.cf?.country || '';
  const city = request.cf?.city || '';
  const referrer = request.headers.get('Referer') || '';

  // Determine language mode
  const isEnRoute = pathname === '/en' || pathname === '/en/' || pathname.startsWith('/en/');
  let lang = 'ar';
  if (isEnRoute) {
    lang = 'en';
  } else {
    if (cookies['pr_lang'] === 'en') {
      lang = 'en';
    } else if (cookies['pr_lang'] !== 'ar') {
      const acceptLang = request.headers.get('Accept-Language') || '';
      const primaryLang = acceptLang.split(',')[0].trim().toLowerCase();
      if (primaryLang.startsWith('en')) {
        lang = 'en';
      }
    }
  }

  // 3. Asynchronous Visitor Analytics & Telegram Dispatch (Zero-latency impact)
  if (!botFlag) {
    const visitorData = {
      visitorId,
      sessionId,
      ip,
      country,
      city,
      path: pathname,
      referrer,
      userAgent,
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      isBot: botFlag,
      lang
    };

    context.waitUntil(
      Promise.all([
        logVisit(context, visitorData),
        sendTelegramAlert(env, visitorData)
      ])
    );
  }

  // 4. Resolve Underlying Asset
  let originPath = pathname;
  if (isEnRoute) {
    originPath = pathname.replace(/^\/en/, '') || '/';
  }

  let response;
  if (isEnRoute) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = originPath;
    response = await context.env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  } else {
    response = await next();
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    if (newVidCookie) {
      const h = new Headers(response.headers);
      h.append('Set-Cookie', newVidCookie);
      return new Response(response.body, { status: response.status, headers: h });
    }
    return response;
  }

  // 5. Build HTMLRewriter (SSR i18n & hreflang tags)
  const cleanPath = originPath.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;
  const baseUrl = 'https://pragency.pages.dev';
  const arUrl = `${baseUrl}${normalizedPath || '/'}`;
  const enUrl = `${baseUrl}/en${normalizedPath || ''}`;

  const dict = lang === 'en' ? en : ar;
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  let rewriter = new HTMLRewriter()
    .on('html', {
      element(el) {
        el.setAttribute('lang', lang);
        el.setAttribute('dir', dir);
      }
    })
    .on('body', {
      element(el) {
        if (lang === 'en') {
          el.setAttribute('class', (el.getAttribute('class') || '') + ' lang-en');
        } else {
          el.setAttribute('class', (el.getAttribute('class') || '') + ' lang-ar');
        }
      }
    })
    .on('head', {
      element(el) {
        el.append(
          `\n  <link rel="alternate" hreflang="ar" href="${arUrl}" />` +
          `\n  <link rel="alternate" hreflang="en" href="${enUrl}" />` +
          `\n  <link rel="alternate" hreflang="x-default" href="${arUrl}" />\n`,
          { html: true }
        );
      }
    })
    .on('.lang-switch .lang-label', {
      element(el) {
        el.setInnerContent(lang === 'ar' ? 'English' : 'عربي');
      }
    })
    .on('[data-i18n]', {
      element(el) {
        const key = el.getAttribute('data-i18n');
        if (key && dict[key]) {
          const val = dict[key];
          const tag = el.tagName.toUpperCase();
          if (tag === 'INPUT' || tag === 'TEXTAREA') {
            el.setAttribute('placeholder', val);
          } else {
            el.setInnerContent(val, { html: false });
          }
        }
      }
    })
    .on('[data-i18n-html]', {
      element(el) {
        const key = el.getAttribute('data-i18n-html');
        if (key && dict[key]) {
          el.setInnerContent(dict[key], { html: true });
        }
      }
    });

  const modifiedResponse = rewriter.transform(response);
  const headers = new Headers(modifiedResponse.headers);
  headers.set('Content-Language', lang);
  headers.set('Vary', 'Accept-Language, Cookie');
  if (newVidCookie) {
    headers.append('Set-Cookie', newVidCookie);
  }

  return new Response(modifiedResponse.body, {
    status: modifiedResponse.status,
    statusText: modifiedResponse.statusText,
    headers
  });
}
