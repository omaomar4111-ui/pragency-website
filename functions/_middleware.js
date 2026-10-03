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
  if (!token || !chatId) {
    console.warn('[Analytics] Telegram credentials missing in Worker env:', { hasToken: !!token, hasChatId: !!chatId });
    return;
  }

  // ── NOTIFY_ALL_VISITS logic ────────────────────────────────────────────────
  // Default: only notify for NEW visitors (no pr_vid cookie previously seen).
  // If env var NOTIFY_ALL_VISITS=true, notify for returning visitors too,
  // but with a 5-minute per-visitor cooldown stored in Worker memory.
  const notifyAll = (env.NOTIFY_ALL_VISITS || '').toLowerCase() === 'true';
  const isNewVisitor = data.isNewVisitor === true;

  if (!isNewVisitor && !notifyAll) {
    // Returning visitor and NOTIFY_ALL_VISITS is false → skip
    return;
  }

  // Country filtering: Support NOTIFY_COUNTRIES env var, fallback to EG, SA, AE
  const allowedCountries = (env.NOTIFY_COUNTRIES || 'EG,SA,AE')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  const visitorCountry = (data.country || '').trim().toUpperCase();
  if (visitorCountry && !allowedCountries.includes(visitorCountry)) {
    console.log(`[Analytics] Skipping Telegram alert for country ${visitorCountry}. Allowed: ${allowedCountries.join(',')}`);
    return;
  }

  // ── Per-visitor cooldown (Worker memory, 5-min window) ────────────────────
  const COOLDOWN_MS = notifyAll ? 5 * 60 * 1000 : 60 * 1000; // 5 min if notifyAll, else 1 min
  const now = Date.now();
  const lastSent = notifyCooldown.get(data.visitorId) || 0;
  if (now - lastSent < COOLDOWN_MS) {
    return;
  }
  notifyCooldown.set(data.visitorId, now);

  if (notifyCooldown.size > 2000) {
    notifyCooldown.clear();
  }

  // ── Build message ─────────────────────────────────────────────────────────
  const locationParts = [data.city, data.region, data.country].filter(Boolean).join(', ') || 'Unknown';
  let geoBlock = `📍 <b>Location:</b> ${locationParts}`;
  if (data.postalCode) geoBlock += `\n📮 <b>Postal Code:</b> ${data.postalCode}`;
  if (data.latitude && data.longitude) geoBlock += `\n🧭 <b>Coordinates:</b> ${data.latitude}, ${data.longitude}`;

  const visitorLabel = isNewVisitor ? '🆕 <b>New Visitor!</b>' : '🔄 <b>Returning Visitor</b>';

  const message =
    `🔔 ${visitorLabel} — PR Agency\n` +
    `${geoBlock}\n` +
    `🌐 <b>Page:</b> ${data.path}\n` +
    `📱 <b>Device:</b> ${data.device}\n` +
    `🔗 <b>Referrer:</b> ${data.referrer || 'Direct'}\n` +
    `🆔 <b>Visitor ID:</b> <code>${data.visitorId.slice(0, 8)}</code>`;

  // ── Send with 429 retry handling ──────────────────────────────────────────
  try {
    const tgResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });

    if (tgResponse.status === 429) {
      const retryAfter = parseInt(tgResponse.headers.get('Retry-After') || '5', 10);
      console.warn(`TELEGRAM_RATE_LIMITED: retry after ${retryAfter}s for visitor ${data.visitorId.slice(0,8)}`);
      // Reset cooldown so next request can retry
      notifyCooldown.delete(data.visitorId);
      return;
    }

    const tgBody = await tgResponse.text();
    console.log('TELEGRAM_RESPONSE_STATUS:', tgResponse.status);
    if (tgResponse.status !== 200) {
      console.warn('TELEGRAM_RESPONSE_BODY:', tgBody);
    }
  } catch (err) {
    console.error('TELEGRAM_FETCH_ERROR:', err.message);
  }
}

async function logVisit(context, visitorData) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) {
    console.error('[Analytics] Neither ANALYTICS_DB nor DB is available in env!');
    return;
  }

  try {
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT id, page_views FROM sessions WHERE id = ?').bind(visitorData.sessionId).first();

    if (existing) {
      await db.prepare(`
        UPDATE sessions SET
          last_seen = ?,
          exit_page = ?,
          page_views = page_views + 1
        WHERE id = ?
      `).bind(now, visitorData.path, visitorData.sessionId).run();
    } else {
      await db.prepare(`
        INSERT INTO sessions (
          id, visitor_id, first_seen, last_seen, country, city, ip,
          user_agent, referrer, entry_page, exit_page, page_views, is_bot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
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
      ).run();
    }

    await db.prepare(`
      INSERT INTO events (session_id, visitor_id, event_type, event_data, page_url, timestamp)
      VALUES (?, ?, 'page_view', ?, ?, ?)
    `).bind(
      visitorData.sessionId,
      visitorData.visitorId,
      JSON.stringify({
        lang: visitorData.lang,
        region: visitorData.region,
        coords: visitorData.latitude ? `${visitorData.latitude},${visitorData.longitude}` : null
      }),
      visitorData.path,
      now
    ).run();

    console.log('[Analytics] Successfully recorded visit in D1 for session:', visitorData.sessionId);
  } catch (err) {
    console.error('[Analytics] Visitor logging DB error:', err);
  }
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log('MIDDLEWARE_HIT:', pathname);
  console.log('ENV_CHECK:', { hasDB: !!(env.ANALYTICS_DB || env.DB), hasToken: !!env.TELEGRAM_BOT_TOKEN, hasChatId: !!env.TELEGRAM_CHAT_ID, chatId: env.TELEGRAM_CHAT_ID });

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const sessionId = `${visitorId.slice(0, 8)}_${todayStr}`;

  const userAgent = request.headers.get('User-Agent') || '';
  const botFlag = isBot(userAgent);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  
  // Extract comprehensive geographic attributes from Cloudflare request.cf
  const cf = request.cf || {};
  const country = cf.country || '';
  const city = cf.city || '';
  const region = cf.region || cf.regionCode || '';
  const postalCode = cf.postalCode || '';
  const latitude = cf.latitude || '';
  const longitude = cf.longitude || '';

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

  // 3. Reliable Visitor Tracking (Synchronous execution)
  if (!botFlag) {
    const visitorData = {
      visitorId,
      sessionId,
      ip,
      country,
      city,
      region,
      postalCode,
      latitude,
      longitude,
      path: pathname,
      referrer,
      userAgent,
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      isNewVisitor: !cookies['pr_vid'],
      isBot: botFlag,
      lang
    };

    try {
      await logVisit(context, visitorData);
      await sendTelegramAlert(env, visitorData);
    } catch (e) {
      console.error('[Analytics] Error during direct visit tracking:', e);
    }
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
