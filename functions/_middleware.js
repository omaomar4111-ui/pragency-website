import { ar, en } from './locales_data.js';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Skip backend endpoints, static files, and admin
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

  // 2. Check if route is explicitly /en/...
  const isEnRoute = pathname === '/en' || pathname === '/en/' || pathname.startsWith('/en/');

  // Determine target language
  let lang = 'ar';
  if (isEnRoute) {
    lang = 'en';
  } else {
    // Check cookie or header preference if on root
    const cookie = request.headers.get('Cookie') || '';
    if (cookie.includes('pr_lang=en')) {
      lang = 'en';
    } else if (!cookie.includes('pr_lang=ar')) {
      const acceptLang = request.headers.get('Accept-Language') || '';
      const primaryLang = acceptLang.split(',')[0].trim().toLowerCase();
      if (primaryLang.startsWith('en')) {
        lang = 'en';
      }
    }
  }

  // 3. Resolve the underlying asset request
  let originPath = pathname;
  if (isEnRoute) {
    originPath = pathname.replace(/^\/en/, '') || '/';
  }

  // Rewrite request for internal asset resolution if /en/ was requested
  let response;
  if (isEnRoute) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = originPath;
    response = await context.env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  } else {
    response = await next();
  }

  // If response is not HTML, return as is
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // 4. Determine canonical and hreflang URLs
  const cleanPath = originPath.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;
  const baseUrl = 'https://pragency.pages.dev';
  const arUrl = `${baseUrl}${normalizedPath || '/'}`;
  const enUrl = `${baseUrl}/en${normalizedPath || ''}`;

  // 5. Build HTMLRewriter
  const dict = lang === 'en' ? en : ar;
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  let rewriter = new HTMLRewriter()
    // Update html lang and dir
    .on('html', {
      element(el) {
        el.setAttribute('lang', lang);
        el.setAttribute('dir', dir);
      }
    })
    // Update body direction classes
    .on('body', {
      element(el) {
        if (lang === 'en') {
          el.setAttribute('class', (el.getAttribute('class') || '') + ' lang-en');
        } else {
          el.setAttribute('class', (el.getAttribute('class') || '') + ' lang-ar');
        }
      }
    })
    // Inject hreflang tags into <head>
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
    // Update lang-switch button label
    .on('.lang-switch .lang-label', {
      element(el) {
        el.setInnerContent(lang === 'ar' ? 'English' : 'عربي');
      }
    })
    // Server-side translate elements with data-i18n
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
    // Server-side translate elements with data-i18n-html
    .on('[data-i18n-html]', {
      element(el) {
        const key = el.getAttribute('data-i18n-html');
        if (key && dict[key]) {
          el.setInnerContent(dict[key], { html: true });
        }
      }
    });

  const modifiedResponse = rewriter.transform(response);

  // Return with appropriate caching and header flags
  const headers = new Headers(modifiedResponse.headers);
  headers.set('Content-Language', lang);
  headers.set('Vary', 'Accept-Language, Cookie');

  return new Response(modifiedResponse.body, {
    status: modifiedResponse.status,
    statusText: modifiedResponse.statusText,
    headers
  });
}
