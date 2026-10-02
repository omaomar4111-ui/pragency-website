/* ══════════════════════════════════════════════════════════════
   PR AGENCY — Team Section (7 Roles · 4-Column Layout)
   ══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';
  
  var ROLES = [
  {
    "id": 1,
    "roleEn": "Account Manager",
    "roleAr": "مدير حسابك",
    "descAr": "مسؤول التواصل معاك — بيتابع كل تفصيلة ويوصل صوتك للفريق.",
    "image": "role-01-account-manager.webp"
  },
  {
    "id": 2,
    "roleEn": "Content Creator",
    "roleAr": "كتابة المحتوى",
    "descAr": "بيكتب الكلام اللي يعبّر عن صوت براندك — بالعامية اللي الناس تفهمها.",
    "image": "role-02-content-creator.webp"
  },
  {
    "id": 3,
    "roleEn": "Content Strategist",
    "roleAr": "استراتيجية المحتوى",
    "descAr": "بيخطط المحتوى الاستراتيجي — بيشوف الصورة الكبيرة قبل التنفيذ.",
    "image": "role-03-content-strategist.webp"
  },
  {
    "id": 4,
    "roleEn": "Media Buyer",
    "roleAr": "شراء الإعلانات",
    "descAr": "بيُدير الحملات المدفوعة على Meta وGoogle — بأعلى ROI ممكن.",
    "image": "role-04-media-buyer.webp"
  },
  {
    "id": 5,
    "roleEn": "Photographer",
    "roleAr": "التصوير الفوتوغرافي",
    "descAr": "بيصوّر اللحظات اللي تحكي قصة براندك — بأسلوب سينمائي.",
    "image": "role-05-photographer.webp"
  },
  {
    "id": 6,
    "roleEn": "Video Editor",
    "roleAr": "مونتاج الفيديو",
    "descAr": "بيحوّل الأفكار لفيديوهات تشد الانتباه — إيقاع وإبداع وتفاصيل.",
    "image": "role-06-video-editor.webp"
  },
  {
    "id": 7,
    "roleEn": "Graphic Designer",
    "roleAr": "تصميم الجرافيك",
    "descAr": "بيحوّل الأفكار لهوية بصرية متسقة — كل حاجة بتطلع بنفس الشكل.",
    "image": "role-07-graphic-designer.webp"
  }
];
  
  function basePath() {
    return (window.location.pathname.indexOf('/services/') > -1 ||
            window.location.pathname.indexOf('/blog/') > -1) ? '../' : '';
  }
  
  function renderTeam() {
    var grid = document.getElementById('teamGrid');
    if (!grid) return;
    var bp = basePath();
    
    grid.innerHTML = ROLES.map(function(r) {
      return '<article class="role-card" data-role-id="' + r.id + '">' +
             '  <div class="role-image-wrap">' +
             '    <div class="role-image">' +
             '      <picture>' +
             '        <source srcset="' + bp + 'assets/team/' + r.image + '" type="image/webp">' +
             '        <img src="' + bp + 'assets/team/' + r.image.replace('.webp', '.png') + '" alt="' + r.roleEn + '" loading="lazy" width="300" height="300" />' +
             '      </picture>' +
             '    </div>' +
             '  </div>' +
             '  <div class="role-info">' +
             '    <h3 class="role-name-en">' + r.roleEn + '</h3>' +
             '    <p class="role-name-ar">' + r.roleAr + '</p>' +
             '    <p class="role-desc">' + r.descAr + '</p>' +
             '  </div>' +
             '  <div class="role-line"></div>' +
             '</article>';
    }).join('');

    function checkHash() {
      if (window.location.hash === '#team') {
        var t = document.getElementById('team');
        if (t) {
          setTimeout(function() {
            t.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
    checkHash();
    window.addEventListener('hashchange', checkHash);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTeam);
  } else {
    renderTeam();
  }
})();

// Re-render on language change
document.addEventListener('i18n:changed', () => {
  if (typeof renderTeam === 'function') renderTeam();
});
