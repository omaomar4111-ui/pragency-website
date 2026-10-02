const fs = require('fs');

let css = fs.readFileSync('css/pages.css', 'utf-8');

const mobileEnhancements = `
/* ══════════════════════════════════════════════════════════════
   MOBILE UX ENHANCEMENTS & OVERHAUL (v66)
   ══════════════════════════════════════════════════════════════ */

/* Burger Button styling */
.hdr-burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.35);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 0;
  flex-shrink: 0;
}
.hdr-burger:hover {
  background: rgba(124, 58, 237, 0.28);
  border-color: #A78BFA;
  transform: scale(1.05);
}
.hdr-burger svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* Mobile Header cleanup & breakpoints */
@media (max-width: 900px) {
  .hdr-burger {
    display: inline-flex !important;
  }
  .hdr-phone {
    display: none !important; /* Remove phone number clutter on mobile */
  }
  .hdr-cta {
    display: none !important; /* Keep only language toggle and burger in mobile header */
  }
  #hdr {
    padding: 12px 18px !important;
  }
  .hdr-actions {
    gap: 10px !important;
  }
}

/* Mobile Drawer (mmenu) styling */
#mmenu {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
#mmenu.open {
  display: block;
}
.mmenu-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: min(320px, 85vw);
  background: #0d071a;
  border-left: 1px solid rgba(168, 85, 247, 0.25);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.8);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}
[dir="ltr"] .mmenu-panel {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 1px solid rgba(168, 85, 247, 0.25);
  box-shadow: 10px 0 40px rgba(0, 0, 0, 0.8);
  transform: translateX(-100%);
}
#mmenu.open .mmenu-panel {
  transform: translateX(0) !important;
}
.mmenu-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.mmenu-close {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.mmenu-close:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #EF4444;
}
.mmenu-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}
.mmenu-links a {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}
.mmenu-links a:hover,
.mmenu-links a.active {
  background: rgba(124, 58, 237, 0.2);
  color: #fff;
  padding-inline-start: 18px;
}

/* Mobile Bottom Bar & Floating elements cleanup */
#mbar {
  display: none !important; /* Hide cluttered bottom bar completely on mobile */
}
#smart-cta {
  display: none !important; /* Avoid screen-blocking smart prompts on small screens */
}

/* Adjusted WhatsApp Floating Button */
@media (max-width: 768px) {
  .wa-widget {
    width: 52px !important;
    height: 52px !important;
    bottom: 24px !important;
    left: 20px !important;
    z-index: 9999 !important;
  }
  [dir="ltr"] .wa-widget {
    left: auto !important;
    right: 20px !important;
  }
}

/* Mobile Hero Polish & Text Scaling */
@media (max-width: 600px) {
  .hero-vr {
    padding: 90px var(--sp-4) 20px !important;
    min-height: auto !important;
  }
  .hero-vr-inner {
    gap: 20px !important;
    padding-bottom: 20px !important;
  }
  .hero-vr-title {
    font-size: clamp(28px, 7.5vw, 36px) !important;
    line-height: 1.15 !important;
    margin-bottom: 12px !important;
  }
  .hero-vr-title-small {
    font-size: clamp(16px, 4.2vw, 20px) !important;
    margin-top: 6px !important;
  }
  .hero-vr-sub {
    font-size: 14px !important;
    line-height: 1.6 !important;
    margin-bottom: 20px !important;
    padding: 0 4px !important;
  }
  .hero-vr-cta {
    padding: 13px 28px !important;
    font-size: 15px !important;
    width: 100% !important;
    max-width: 280px !important;
    justify-content: center !important;
    margin: 0 auto !important;
  }
  .hero-vr-logo-wrap {
    min-height: 280px !important;
    max-height: 320px !important;
  }
  .hero-statue-layer {
    width: 100% !important;
    max-width: 320px !important;
    opacity: 0.65 !important;
  }
  .hero-logo-layer {
    width: 180px !important;
    max-width: 180px !important;
  }
  .hero-tagline-layer {
    font-size: 11px !important;
    letter-spacing: 2px !important;
    border-left: none !important;
    padding-left: 0 !important;
  }
}
`;

css += '\n' + mobileEnhancements;
fs.writeFileSync('css/pages.css', css);
console.log('Mobile enhancements CSS appended to pages.css successfully.');
