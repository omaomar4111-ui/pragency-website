(async function() {
  'use strict';
  
    var ROLES = [
  {
    "id": 1,
    "roleEn": "Account Manager",
    "roleAr": "مدير حساب",
    "descAr": "مسؤول عن إدارة الحملات والتواصل اليومي.",
    "descEn": "Responsible for campaign oversight, client alignment, and day-to-day operations.",
    "image": "role-01-account-manager.webp"
  },
  {
    "id": 2,
    "roleEn": "Content Creator",
    "roleAr": "صانع المحتوى",
    "descAr": "بيبتكر المحتوى اللي بيخلق تفاعل حقيقي.",
    "descEn": "Crafts compelling creative angles and scripts that spark high audience engagement.",
    "image": "role-02-content-creator.webp"
  },
  {
    "id": 3,
    "roleEn": "Content Strategist",
    "roleAr": "استراتيجي المحتوى",
    "descAr": "بيحط الخطة اللي بتمشي عليها الكامبين.",
    "descEn": "Designs full-funnel content roadmaps tailored to maximize organic and paid reach.",
    "image": "role-03-content-strategist.webp"
  },
  {
    "id": 4,
    "roleEn": "Media Buyer",
    "roleAr": "خبير الإعلانات",
    "descAr": "بيدير الحملات المدفوعة لأعلى ROI.",
    "descEn": "Scales high-converting paid ad campaigns across Meta, Google, and TikTok with optimal ROI.",
    "image": "role-04-media-buyer.webp"
  },
  {
    "id": 5,
    "roleEn": "Photographer",
    "roleAr": "التصوير الفوتوغرافي",
    "descAr": "بيصوّر اللحظات اللي تحكي قصة براندك بأسلوب سينمائي.",
    "descEn": "Captures stunning cinematic stills and product visuals that elevate brand perception.",
    "image": "role-05-photographer.webp"
  },
  {
    "id": 6,
    "roleEn": "Video Editor",
    "roleAr": "مونتاج الفيديو",
    "descAr": "بيحوّل الأفكار لفيديوهات تشد الانتباه بإيقاع وإبداع.",
    "descEn": "Transforms raw footage into fast-paced, high-retention video assets that stop the scroll.",
    "image": "role-06-video-editor.webp"
  },
  {
    "id": 7,
    "roleEn": "Graphic Designer",
    "roleAr": "تصميم الجرافيك",
    "descAr": "بيحوّل الأفكار لهوية بصرية متسقة وقوية.",
    "descEn": "Creates distinctive brand identity systems and high-converting marketing visuals.",
    "image": "role-07-graphic-designer.webp"
  }
];

  async function fetchTeam() {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        return data.data;
      }
    } catch(e) {}
    return null;
  }
  
  function basePath() {
    return (window.location.pathname.indexOf('/services/') > -1 ||
            window.location.pathname.indexOf('/blog/') > -1) ? '../' : '';
  }
  
  window.renderTeam = async function() {
    var grid = document.getElementById('teamGrid');
    if (!grid) return;
    
    // Fetch once and cache in window
    if (!window._teamData) {
      const apiData = await fetchTeam();
      window._teamData = (apiData && apiData.length > 0) ? apiData : ROLES;
    }
    
    var data = window._teamData;
    var bp = basePath();
    const lang = window.i18n ? window.i18n.get() : 'ar';
    
    grid.innerHTML = data.map(function(r) {
      // Map API fields (name, role, bio) or Fallback static fields (roleAr, descAr)
      var nameAr = r.name || r.roleEn || '';
      var nameEn = r.name_en || nameAr;
      
      var roleAr = r.role || r.roleAr || '';
      var roleEn = r.role_en || r.roleEn || roleAr;
      
      var descAr = r.bio || r.descAr || '';
      var descEn = r.bio_en || r.descEn || descAr;
      
      var imgUrl = r.photo_url || r.image;
      if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
        imgUrl = bp + 'assets/team/' + imgUrl;
      }
      
      var dName = (lang === 'en') ? nameEn : nameAr;
      var dRole = (lang === 'en') ? roleEn : roleAr;
      var dDesc = (lang === 'en') ? descEn : descAr;

      return '<article class="role-card" data-role-id="' + r.id + '">' +
             '  <div class="role-image-wrap">' +
             '    <div class="role-image">' +
             '      <img src="' + imgUrl + '" alt="' + dName + '" loading="lazy" width="300" height="300" style="width:100%;height:100%;object-fit:cover;" />' +
             '    </div>' +
             '  </div>' +
             '  <div class="role-info">' +
             '    <h3 class="role-name-en">' + dName + '</h3>' +
             '    <p class="role-name-ar">' + dRole + '</p>' +
             '    <p class="role-desc">' + dDesc + '</p>' +
             '  </div>' +
             '  <div class="role-line"></div>' +
             '</article>';
    }).join('');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderTeam);
  } else {
    window.renderTeam();
  }
})();

document.addEventListener('i18n:changed', () => {
  if (typeof window.renderTeam === 'function') window.renderTeam();
});
