const fs = require('fs');

let c = fs.readFileSync('index.html', 'utf8');

const targetStyle = `  <style id="critical-css">
    :root {
      --c-black:#0A0612;--c-s1:#110A1E;--c-s2:#17102A;--c-purple:#6D28D9;--c-purple-h:#7C3AED;
      --c-w100:#fff;--c-w80:rgba(255,255,255,0.8);--c-w60:rgba(255,255,255,0.6);
    }
    *,*::before,*::after{box-sizing:border-box}
    html{background:#0A0612;color:#fff;font-family:'Cairo',sans-serif;scroll-behavior:smooth}
    body{margin:0;padding:0;background:#0A0612;color:#fff;overflow-x:hidden}
    #hdr{position:fixed;top:0;left:0;right:0;z-index:900;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:rgba(10,6,18,0.85);backdrop-filter:blur(10px)}
    .hdr-logo{width:60px;height:60px;display:block}
    #hero{min-height:90vh;display:flex;align-items:center;position:relative;padding:100px 24px 40px;background:#0A0612}
    .hero-vr-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;width:100%;gap:40px}
    .hero-vr-title{font-size:clamp(32px,6vw,64px);font-weight:900;line-height:1.2;margin:0 0 16px}
    .hero-vr-title-accent{color:#A78BFA}
    .hero-vr-sub{font-size:clamp(15px,2vw,18px);color:rgba(255,255,255,0.7);margin:0 0 24px;line-height:1.6}
    .hero-vr-cta{display:inline-flex;align-items:center;gap:10px;background:#7C3AED;color:#fff;padding:14px 28px;border-radius:30px;font-weight:700;text-decoration:none}
    .hero-vr-logo-wrap{position:relative;flex-shrink:0;width:100%;max-width:550px;min-height:450px;display:flex;align-items:center;justify-content:center}
    .hero-statue-layer{position:relative;width:100%;max-width:450px}
    .hero-statue-layer img{max-width:100%;height:auto;display:block;aspect-ratio:1000/1091}
    .hero-brand-lockup{position:absolute;top:8%;left:-4%;z-index:5;display:flex;flex-direction:row;align-items:center;gap:18px}
    .hero-logo-layer{width:200px;max-width:200px;flex-shrink:0}
    .hero-logo-layer img{width:100%;height:auto;display:block;aspect-ratio:1/1}
    .hero-tagline-layer{display:flex;flex-direction:column;gap:4px;color:rgba(255,255,255,0.9);font-size:11px;letter-spacing:2px;border-left:2px solid rgba(168,85,247,0.5);padding-left:14px;white-space:nowrap}
    @media(max-width:768px){
      .hero-vr-inner{flex-direction:column-reverse;text-align:center}
      .hero-vr-cta{margin:0 auto}
      .hero-vr-logo-wrap{min-height:300px;max-width:360px}
      .hero-brand-lockup{position:static;flex-direction:column;gap:10px;margin-bottom:16px}
      .hero-logo-layer{width:140px;max-width:140px}
      .hero-tagline-layer{border-left:none;padding-left:0;text-align:center}
    }
  </style>`;

c = c.replace(/<style id="critical-css">[\s\S]*?<\/style>/, targetStyle);
fs.writeFileSync('index.html', c, 'utf8');
console.log('Updated critical-css in index.html to eliminate hero CLS!');
