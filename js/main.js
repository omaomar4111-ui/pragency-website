/* ══════════════════════════════════════════════════════════════
   PR AGENCY — SHARED JS ENGINE
══════════════════════════════════════════════════════════════ */
(function() {
'use strict';

var CFG = {
  ownerPhone: '201144826641'
};

var TRACKING = window.TRACKING || {GTM:{enabled:false},GA4:{enabled:false},META:{enabled:false},TIKTOK:{enabled:false}};
window.dataLayer = window.dataLayer || [];

function $(s,c){return (c||document).querySelector(s);}
function $$(s,c){return (c||document).querySelectorAll(s);}
function on(el,ev,fn,opt){if(el)el.addEventListener(ev,fn,opt||false);}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function clamp(v,a,b){return Math.min(Math.max(v,a),b);}
function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}
function validatePhone(p){var c=p.replace(/[\s\-+]/g,'');return /^(01[0125]\d{8}|201[0125]\d{8})$/.test(c);}
function normalizePhone(p){var c=p.replace(/[\s\-+]/g,'');return c.startsWith('201')?c:c.startsWith('01')?'2'+c:c;}

function track(loc,action){
  window.dataLayer.push({event:'pr_cta',cta_location:loc,cta_action:action,ts:Date.now()});
  if(typeof gtag==='function'&&TRACKING.GA4.enabled)gtag('event',action,{event_category:loc});
  if(typeof fbq==='function'&&TRACKING.META.enabled)fbq('trackCustom',action,{location:loc});
}
window.track = track;

function initLoader() {
  var l = $('#loader');
  if (!l) return;
  var reveal = function() {
    l.classList.add('hidden');
    document.body.classList.remove('loading');
  };
  setTimeout(reveal, 200);
}

function initProgressBar(){
  var b=$('#progress-bar');if(!b)return;
  on(window,'scroll',function(){
    var p=window.scrollY/(document.body.scrollHeight-window.innerHeight);
    b.style.transform='scaleX('+clamp(p,0,1)+')';
  },{passive:true});
}

function initHeader(){
  var h=$('#hdr');if(!h)return;
  on(window,'scroll',function(){h.classList.toggle('scrolled',window.scrollY>60);},{passive:true});
}

function initMobileMenu(){
  var b=$('#hdr-burger'),m=$('#mmenu');if(!b||!m)return;
  var c=$('.mmenu-close',m);
  on(b,'click',function(){m.classList.add('open');document.body.style.overflow='hidden';});
  on(c,'click',close);
  on(m,'click',function(e){if(e.target===m)close();});
  on(document,'keydown',function(e){if(e.key==='Escape')close();});
  function close(){m.classList.remove('open');document.body.style.overflow='';}
}

function initParticles(){
  var c=$('#particle-canvas');if(!c)return;
  if(window.innerWidth<1024){c.style.display='none';return;}
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var ctx=c.getContext('2d'),W,H,ps=[],mx=-999,my=-999;
  var count=30;
  function resize(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;}
  resize();on(window,'resize',debounce(resize,250));
  on(document,'mousemove',function(e){mx=e.clientX;my=e.clientY;},{passive:true});
  for(var i=0;i<count;i++)ps.push({
    x:Math.random()*window.innerWidth,
    y:Math.random()*window.innerHeight,
    r:Math.random()*1.4+0.3,
    vx:(Math.random()-0.5)*0.25,
    vy:(Math.random()-0.5)*0.25,
    alpha:Math.random()*0.4+0.1
  });
  function loop(){
    ctx.clearRect(0,0,W,H);
    ps.forEach(function(p){
      var dx=p.x-mx,dy=p.y-my,d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){p.vx+=dx/d*0.04;p.vy+=dy/d*0.04;}
      p.vx*=0.995;p.vy*=0.995;p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(192,0,0,'+p.alpha+')';ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  loop();
  setTimeout(function(){c.classList.add('visible');},400);
}

function initCursor(){
  var d=$('#cursor'),r=$('#cursor-ring');if(!d||!r)return;
  if(window.innerWidth<1024)return;
  if(window.matchMedia('(hover:none)').matches)return;
  var rx=0,ry=0,mx=0,my=0;
  on(document,'mousemove',function(e){
    mx=e.clientX;my=e.clientY;
    d.style.left=mx+'px';d.style.top=my+'px';
  });
  function a(){
    rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;
    r.style.left=rx+'px';r.style.top=ry+'px';
    requestAnimationFrame(a);
  }
  a();
  $$('a,button,.service-card,.blog-card,.value-card,.process-step,.conv-choice,.fq').forEach(function(el){
    on(el,'mouseenter',function(){r.classList.add('hover');});
    on(el,'mouseleave',function(){r.classList.remove('hover');});
  });
  on(document,'mousedown',function(){r.classList.add('click');});
  on(document,'mouseup',function(){r.classList.remove('click');});
}

function initRipple(){
  $$('.btn-primary,.btn-gold,.mbar-cta,.conv-send').forEach(function(b){
    on(b,'click',function(e){
      b.classList.add('ripple-host');
      var rec=b.getBoundingClientRect(),sz=Math.max(rec.width,rec.height)*1.5;
      var x=(e.clientX||rec.left+rec.width/2)-rec.left-sz/2;
      var y=(e.clientY||rec.top+rec.height/2)-rec.top-sz/2;
      var w=document.createElement('span');w.className='ripple-wave';
      w.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+x+'px;top:'+y+'px';
      b.appendChild(w);
      setTimeout(function(){w.remove();},600);
    });
  });
}

function initWhatsAppTracking() {
  document.querySelectorAll('a[href*="wa.me"], .hdr-cta, [href*="whatsapp"]').forEach(function(el) {
    el.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'whatsapp_click', {
          'event_category': 'engagement',
          'event_label': window.location.pathname
        });
      }
      if (typeof fbq === 'function') {
        fbq('track', 'Contact', {
          content_name: 'WhatsApp Click'
        });
      }
    });
  });
}
function init(){
  initLoader();
  initProgressBar();
  initHeader();
  initMobileMenu();
  initNavActive();
  initFooterYear();
  initBackToTop();
  requestAnimationFrame(function(){
    initParticles();
    initCursor();
  });
  initRipple();
  // Form + scroll reveal are self-initializing via
  // js/contact-form.js and js/reveal.js
}

if(document.readyState==='loading'){
  on(document,'DOMContentLoaded',init);
} else {
  init();
}

window.__2D={
  track:track,
  saveLocal:saveLocal,
  saveSupabase:saveSupabase,
  validatePhone:validatePhone,
  normalizePhone:normalizePhone
};
})();

function initGSAP() {
  if (typeof gsap === 'undefined') {
    setTimeout(initGSAP, 300);
    return;
  }
  
  gsap.registerPlugin(ScrollTrigger);
  
  var tl = gsap.timeline({ delay: 0.2 });
  
  tl.from('.hero-vr-title', {
    y: 60, opacity: 0, duration: 1.1, ease: 'power4.out'
  })
  .from('.hero-vr-sub', {
    y: 30, opacity: 0, duration: 0.8, ease: 'power2.out'
  }, '-=0.7')
  .from('.hero-vr-cta', {
    y: 24, opacity: 0, duration: 0.7, ease: 'back.out(1.4)'
  }, '-=0.6')
  .from('.hero-vr-logo-img', {
    scale: 0.7, opacity: 0, duration: 1.3, ease: 'power3.out'
  }, 0);
  
  gsap.utils.toArray('.section-h2').forEach(function(el) {
    gsap.from(el, {
      opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
}

/* ═══ PWA Service Worker & Install Prompt ═══ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
    }).catch(function(err) {
      console.warn('[PWA] ServiceWorker registration failed:', err);
    });
  });
}

var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  if (document.getElementById('pwa-install-btn')) return;
  var btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.className = 'pwa-install-btn';
  btn.setAttribute('aria-label', 'تثبيت التطبيق');
  var currentLang = (document.documentElement.lang || 'ar').toLowerCase();
  var labelText = currentLang === 'en' ? 'Install App' : 'ثبت التطبيق';
  btn.innerHTML = '📱 <span data-i18n="pwa.install">' + labelText + '</span>';
  btn.onclick = async function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.remove();
  };
  document.body.appendChild(btn);
  setTimeout(function() {
    if (btn && btn.parentNode) btn.remove();
  }, 30000);
}
