/* ============================================================
   PR AGENCY — CLIENTS LOGOS MODULE (21 UNIQUE CLIENTS)
   Two Marquee Rows (Opposite Directions) — NO GRID
   Supports API with Hardcoded Fallback
   ============================================================ */
var CLIENT_LOGOS = [
  { name: 'BLILTNA', nameEn: 'BLILTNA', sector: 'زراعة', file: 'client-01-bliltna.png' },
  { name: 'Home IX', nameEn: 'HOME IX', sector: 'عقارات', file: 'client-02-home-ix.png' },
  { name: 'Kangaroo', nameEn: 'KANGAROO', sector: 'متاجر', file: 'client-03-kangaroo.png' },
  { name: 'دار', nameEn: 'DAR', sector: 'مطاعم', file: 'client-04-dar.png' },
  { name: 'Unit X', nameEn: 'UNIT X', sector: 'عقارات', file: 'client-06-unit-x.png' },
  { name: 'Mountain View', nameEn: 'MOUNTAIN VIEW', sector: 'عقارات', file: 'client-07-mountain-view.png' },
  { name: 'Merath', nameEn: 'MERATH', sector: 'عقارات', file: 'client-08-merath.png' },
  { name: 'Memaar', nameEn: 'MEMAAR', sector: 'عقارات', file: 'client-09-memaar.png' },
  { name: 'SAK', nameEn: 'SAK', sector: 'عقارات', file: 'client-10-sak.png' },
  { name: 'The Address', nameEn: 'THE ADDRESS', sector: 'عقارات', file: 'client-11-address.png' },
  { name: 'Evergreen', nameEn: 'EVERGREEN', sector: 'عقارات', file: 'client-12-evergreen.png' },
  { name: 'JG', nameEn: 'JG', sector: 'عقارات', file: 'client-13-jg.png' },
  { name: 'Island Gym', nameEn: 'ISLAND GYM', sector: 'جيمات', file: 'client-14-island-gym.png' },
  { name: 'iSkin', nameEn: 'ISKIN', sector: 'تجميل', file: 'client-15-iskin.png' },
  { name: 'Paws Stylist', nameEn: 'PAWS STYLIST', sector: 'خدمات', file: 'client-16-paws.png' },
  { name: 'XGarage', nameEn: 'XGARAGE', sector: 'سيارات', file: 'client-17-xgarage.png' },
  { name: 'OVO', nameEn: 'OVO', sector: 'خدمات', file: 'client-18-ovo.png' },
  { name: 'SWAN', nameEn: 'SWAN', sector: 'طبي', file: 'client-19-swan.png' },
  { name: 'Godzilla Fitness', nameEn: 'GODZILLA', sector: 'جيمات', file: 'client-20-godzilla.png' },
  { name: 'NH Clinics', nameEn: 'NH CLINICS', sector: 'طبي', file: 'client-21-nh-clinics.png' },
  { name: 'Snoopy', nameEn: 'SNOOPY', sector: 'ترفيه', file: 'client-22-snoopy.png' }
];

function basePath() {
  return (window.location.pathname.indexOf('/services/') > -1 ||
          window.location.pathname.indexOf('/blog/') > -1) ? '../' : '';
}

async function fetchFromAPI() {
  try {
    const res = await fetch('/api/clients');
    const data = await res.json();
    if (data.success && data.data && data.data.length > 0) {
      return data.data.map(c => ({
        name: c.name || 'Client',
        file: c.logo_url,
        url: c.website_url,
        isExternal: (c.logo_url && (c.logo_url.startsWith('http://') || c.logo_url.startsWith('https://')))
      }));
    }
  } catch (e) {}
  return null;
}

function renderRow(items, bp) {
  var doubled = items.concat(items);
  return doubled.map(function(logo) {
    if (logo.isExternal) {
      return '<div class="client-logo" title="' + (logo.name || '') + '">' +
             '  <img src="' + logo.file + '" alt="' + (logo.name || '') + '" loading="lazy" width="160" height="70" style="max-height:60px;width:auto;object-fit:contain" />' +
             '</div>';
    }
    var webp = (logo.file || '').replace(/\.(png|jpg)$/i, '.webp');
    return '<div class="client-logo" title="' + (logo.name || '') + '">' +
           '  <picture>' +
           '    <source srcset="' + bp + 'assets/logos/clients/' + webp + '" type="image/webp">' +
           '    <img src="' + bp + 'assets/logos/clients/' + logo.file + '" alt="' + (logo.name || '') + '" loading="lazy" width="160" height="70" />' +
           '  </picture>' +
           '</div>';
  }).join('');
}

async function initClients() {
  var trackTop = document.getElementById('clientsTrackTop');
  var trackBottom = document.getElementById('clientsTrackBottom');
  if (!trackTop || !trackBottom) return;

  var bp = basePath();
  var apiClients = await fetchFromAPI();
  var clients = (apiClients && apiClients.length > 0) ? apiClients : CLIENT_LOGOS;

  var half = Math.ceil(clients.length / 2);
  var rowTop = clients.slice(0, half);
  var rowBottom = clients.slice(half);

  trackTop.innerHTML = renderRow(rowTop, bp);
  trackBottom.innerHTML = renderRow(rowBottom, bp);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClients);
} else {
  initClients();
}
