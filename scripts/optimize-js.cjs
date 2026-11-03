const fs = require('fs');

// 1. Optimize js/main.js
let mainJs = fs.readFileSync('js/main.js', 'utf8');

// Replace initCursor with fast media query exit
mainJs = mainJs.replace(
  `function initCursor(){
  var d=$('#cursor'),r=$('#cursor-ring');if(!d||!r)return;
  if(window.innerWidth<1024)return;
  if(window.matchMedia('(hover:none)').matches)return;`,
  `function initCursor(){
  var d=$('#cursor'),r=$('#cursor-ring');if(!d||!r)return;
  if(window.matchMedia && (window.matchMedia('(max-width: 1023px)').matches || window.matchMedia('(hover: none)').matches)) return;`
);

// Disable duplicate initParticles in main.js since assets/js/particle-network.js handles it
mainJs = mainJs.replace(
  `function initParticles(){
  var c=$('#particle-canvas');if(!c)return;
  if(window.innerWidth<1024){c.style.display='none';return;}`,
  `function initParticles(){
  return; // Handled exclusively by particle-network.js to avoid duplicate loop & TBT`
);

// Optimize initRipple to use delegation
mainJs = mainJs.replace(
  `function initRipple(){
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
}`,
  `function initRipple(){
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest && e.target.closest('.btn-primary,.btn-gold,.mbar-cta,.conv-send');
    if (!b) return;
    b.classList.add('ripple-host');
    var rec = b.getBoundingClientRect(), sz = Math.max(rec.width, rec.height) * 1.5;
    var x = (e.clientX || rec.left + rec.width / 2) - rec.left - sz / 2;
    var y = (e.clientY || rec.top + rec.height / 2) - rec.top - sz / 2;
    var w = document.createElement('span'); w.className = 'ripple-wave';
    w.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + x + 'px;top:' + y + 'px';
    b.appendChild(w);
    setTimeout(function(){ w.remove(); }, 600);
  }, { passive: true });
}`
);

fs.writeFileSync('js/main.js', mainJs, 'utf8');
console.log('Optimized js/main.js');

// 2. Optimize js/native-sync.js
let syncJs = fs.readFileSync('js/native-sync.js', 'utf8');
syncJs = syncJs.replace(
  `document.addEventListener('DOMContentLoaded', initUI);`,
  `if (typeof window !== 'undefined') {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(initUI, { timeout: 3000 });
    } else {
      window.addEventListener('load', function() { setTimeout(initUI, 1000); });
    }
  }`
);
fs.writeFileSync('js/native-sync.js', syncJs, 'utf8');
console.log('Optimized js/native-sync.js');
