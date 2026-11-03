// scripts/humanize-content.cjs
// Replaces robotic/AI-sounding phrases with warm, natural, human-friendly Egyptian Arabic across the app.

const fs = require('fs');
const path = require('path');

const replacements = [
  { from: 'جاري معالجة الطلب...', to: 'بنجهز طلبك...' },
  { from: 'جاري معالجة الطلب', to: 'بنجهز طلبك' },
  { from: 'جاري الإرسال...', to: 'بنرسل بياناتك، ثواني...' },
  { from: 'جاري الإرسال', to: 'بنرسل بياناتك' },
  { from: 'تم إتمام العملية بنجاح', to: 'تم الحفظ بنجاح' },
  { from: 'تم إنجاز العملية بنجاح', to: 'تم الحفظ بنجاح' },
  { from: 'عذراً، حدث خطأ غير متوقع', to: 'معلش، حصلت مشكلة غير متوقعة. جرب تاني.' },
  { from: 'حدث خطأ غير متوقع', to: 'معلش، حصلت مشكلة بسيطة. جرب تاني.' },
  { from: 'فشل الاتصال بالخادم، حاول مرة أخرى', to: 'معلش، النت قطع أو السيرفر مش مستجيب. جرب تاني بعد ثواني.' },
  { from: 'حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً', to: 'معلش، حصلت مشكلة في الاتصال بالنت. جرب تاني بعد شوية.' },
  { from: 'الرجاء الانتظار...', to: 'استنى ثواني...' },
  { from: 'جاري التحقق...', to: 'بنتأكد من بياناتك...' },
  { from: 'جاري الدخول...', to: 'بنتأكد من بياناتك وندخلك...' },
  { from: 'جاري التحميل...', to: 'بنجهز البيانات...' },
  { from: 'جاري الحفظ...', to: 'بنحفظ التعديلات...' },
  { from: 'جاري الحفظ... ⏳', to: 'بنحفظ التعديلات... ⏳' },
  { from: 'حدث خطأ في الحفظ', to: 'معلش، التعديل متحفظش. جرب تاني.' },
  { from: 'جاري استدعاء محرك الذكاء الاصطناعي', to: 'بنجهز البريف الذكي لحملتك' },
  { from: 'جاري الصياغة بالذكاء الاصطناعي عبر AI...', to: 'بنصيغ الأفكار الإعلانية المناسبة...' },
  { from: 'جاري المزامنة مع Meta و Google... ⏳', to: 'بنربط الحملات مع فيسبوك وجوجل... ⏳' },
  { from: 'تم استعادة الاتصال. جاري مزامنة التغييرات السحابية...', to: 'النت رجع! بنرفع التغييرات اللي سجلتها محلياً دلوقتي...' }
];

const targetFiles = [
  'js/contact-form.js',
  'js/admin.js',
  'js/native-sync.js',
  'portal-access-2026.html',
  'portal-dashboard-2026.html',
  'sales-crm-2026.html',
  'admin-agency.html',
  'index.html',
  'about.html',
  'services.html',
  'clients.html'
];

let totalReplacements = 0;

targetFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      const count = content.split(from).length - 1;
      content = content.replaceAll(from, to);
      fileChanges += count;
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ [${file}]: Applied ${fileChanges} natural Arabic humanizations.`);
    totalReplacements += fileChanges;
  }
});

console.log(`\n🎉 Humanization Complete! Updated ${totalReplacements} text occurrences to human-friendly Arabic.`);
