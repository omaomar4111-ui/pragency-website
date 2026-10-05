import { addLeadScore } from './lib/lead_scoring.js';
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
  const notifyAll = (env.NOTIFY_ALL_VISITS || '').toLowerCase() === 'true';
  const isNewVisitor = data.isNewVisitor === true;

  if (!isNewVisitor && !notifyAll) {
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
  const COOLDOWN_MS = notifyAll ? 5 * 60 * 1000 : 60 * 1000;
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
      const retryAfter = parseInt(tgResponse.headers.get('Retry-After') || '3', 10);
      console.warn(`[Analytics] Telegram 429 rate limited. Backing off ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
      });
    }
  } catch (err) {
    console.error('[Analytics] Failed to send Telegram alert:', err);
  }
}

async function logVisit(context, visitorData) {
  const { env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  if (!db) {
    console.warn('[Analytics] DB binding not found (checked ANALYTICS_DB, DB). Skipping D1 logging.');
    return;
  }

  const now = new Date().toISOString();

  try {
    const existing = await db.prepare(
      'SELECT id, page_views FROM sessions WHERE id = ?'
    ).bind(visitorData.sessionId).first();

    if (existing) {
      await db.prepare(`
        UPDATE sessions
        SET last_seen = ?, page_views = page_views + 1, exit_page = ?
        WHERE id = ?
      `).bind(now, visitorData.path, visitorData.sessionId).run();
    } else {
      await db.prepare(`
        INSERT INTO sessions (
          id, visitor_id, first_seen, last_seen, country, city,
          ip, user_agent, referrer, entry_page, exit_page, is_bot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      INSERT INTO events (session_id, event_type, event_data, page_url, timestamp)
      VALUES (?, 'page_view', ?, ?, ?)
    `).bind(
      visitorData.sessionId,
      JSON.stringify({
        visitorId: visitorData.visitorId,
        lang: visitorData.lang,
        region: visitorData.region,
        coords: visitorData.latitude ? `${visitorData.latitude},${visitorData.longitude}` : null
      }),
      visitorData.path,
      now
    ).run();

    console.log('[Analytics] Successfully recorded visit in D1 for session:', visitorData.sessionId);

    // Add page view & return visitor score
    const eventType = visitorData.isNewVisitor ? 'page_view' : 'return_visit';
    await addLeadScore(env, {
      sessionId: visitorData.sessionId,
      visitorId: visitorData.visitorId,
      eventType: eventType,
      pageUrl: visitorData.path,
      locationInfo: { city: visitorData.city, country: visitorData.country }
    });

  } catch (err) {
    console.error('[Analytics] Visitor logging DB error:', err);
  }
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log('MIDDLEWARE_HIT:', pathname);

  // 1. Skip backend endpoints, static assets, and admin
  if (
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/') ||
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

  // 4. Cloudflare Cache API (Cache HTML responses per language and version)
  const VERSION = 'v81';
  const cacheKey = new Request(`https://cache.internal/${VERSION}/${lang}${pathname}`);
  let cache = null;
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      cache = caches.default;
    }
  } catch (ce) {
    console.warn('[Cache] caches.default error:', ce.message);
  }

  if (cache) {
    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const h = new Headers(cachedResponse.headers);
        h.set('X-Cache-Status', 'HIT');
        if (newVidCookie) {
          h.append('Set-Cookie', newVidCookie);
        }
        return new Response(cachedResponse.body, { status: cachedResponse.status, headers: h });
      }
    } catch (cmErr) {
      console.warn('[Cache] cache.match error:', cmErr.message);
    }
  }

  // 5. Resolve Underlying Asset
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

  // 6. Build HTMLRewriter (SSR i18n & hreflang tags)
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
  const responseBody = await modifiedResponse.text();

  if (cache) {
    try {
      const ch = new Headers(modifiedResponse.headers);
      ch.set('Content-Type', 'text/html; charset=utf-8');
      ch.set('Cache-Control', 'public, max-age=300');
      ch.set('Content-Language', lang);
      ch.set('Vary', 'Accept-Language, Cookie');
      const cacheResp = new Response(responseBody, {
        status: modifiedResponse.status,
        headers: ch
      });
      context.waitUntil(cache.put(cacheKey, cacheResp));
    } catch (putErr) {
      console.warn('[Cache] cache.put error:', putErr.message);
    }
  }

  const fh = new Headers(modifiedResponse.headers);
  fh.set('Content-Type', 'text/html; charset=utf-8');
  fh.set('Content-Language', lang);
  fh.set('Vary', 'Accept-Language, Cookie');
  fh.set('X-Cache-Status', 'MISS');
  if (newVidCookie) {
    fh.append('Set-Cookie', newVidCookie);
  }

  return new Response(responseBody, {
    status: modifiedResponse.status,
    statusText: modifiedResponse.statusText,
    headers: fh
  });
}
