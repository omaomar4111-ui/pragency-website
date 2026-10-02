const fs = require('fs');

let teamJs = fs.readFileSync('js/team.js', 'utf-8');

const updatedRoles = `  var ROLES = [
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
];`;

teamJs = teamJs.replace(/var ROLES = \[[\s\S]*?\];/m, updatedRoles);
fs.writeFileSync('js/team.js', teamJs);
console.log('team.js fallback ROLES updated with 7 roles and full EN descriptions.');
