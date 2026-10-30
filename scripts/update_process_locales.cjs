const fs = require('fs');

// 1. Update locales/ar.json
if (fs.existsSync('locales/ar.json')) {
  const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf8'));
  
  ar['process.card1.title'] = "استكشاف (Discover)";
  ar['process.card1.desc'] = "جلسة عمل (Meeting / Audit) لتحليل وضع البراند الحالي، دراسة المنافسين في مصر والخليج، وتحديد الميزانية والأهداف البيعية.";

  ar['process.card2.title'] = "تخطيط واستراتيجية (Strategize)";
  ar['process.card2.desc'] = "بناء خطة العمل الشهرية (Marketing Roadmap): تحديد الجمهور المستهدف، زوايا الإعلانات (Hooks & Angles)، وتوزيع ميزانية الإعلانات على المنصات.";

  ar['process.card3.title'] = "تنفيذ وإنتاج (Create)";
  ar['process.card3.desc'] = "صناعة المحتوى البصري: كتابة السكريبتات، تصوير الفيديوهات والريلز، وتجهيز تصميمات الهوية والإعلانات.";

  ar['process.card4.title'] = "إطلاق وتحسين (Launch & Optimize)";
  ar['process.card4.desc'] = "إطلاق الحملات الممولة، متابعة الأداء يوم بيوم، تحسين سعر الرسالة أو الشراء، وإرسال تقارير دورية شفافة للعميل.";

  ar['form.project_name'] = "اسم المشروع / البيزنس *";
  ar['form.project_name.ph'] = "اكتب اسم مشروعك أو علامتك التجارية";
  ar['form.challenge'] = "إيه التحدي أو الهدف اللي عايز تحققه معانا؟";
  ar['form.challenge.ph'] = "مثلاً: زيادة المبيعات، إطلاق براند جديد، خفض تكلفة الإعلانات...";

  fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2), 'utf8');
  console.log('Updated locales/ar.json');
}

// 2. Update locales/en.json
if (fs.existsSync('locales/en.json')) {
  const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));

  en['process.card1.title'] = "Discover";
  en['process.card1.desc'] = "Working session (Meeting / Audit) to analyze current brand positioning, benchmark competitors in Egypt & the Gulf, and set clear sales targets and budgets.";

  en['process.card2.title'] = "Strategize";
  en['process.card2.desc'] = "Building the monthly Marketing Roadmap: defining target personas, creative ad hooks & angles, and allocating media spend across platforms.";

  en['process.card3.title'] = "Create";
  en['process.card3.desc'] = "Visual asset production: scriptwriting, shooting reels & videos, and designing brand identities and high-converting ad creatives.";

  en['process.card4.title'] = "Launch & Optimize";
  en['process.card4.desc'] = "Campaign deployment, daily performance tracking, optimizing cost-per-lead / acquisition, and sending transparent reports.";

  en['form.project_name'] = "Project / Business Name *";
  en['form.project_name.ph'] = "Enter your project or brand name";
  en['form.challenge'] = "What is the main challenge or goal you want to achieve with us?";
  en['form.challenge.ph'] = "e.g. Scaling sales, launching a new brand, reducing ad acquisition cost...";

  fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2), 'utf8');
  console.log('Updated locales/en.json');
}
