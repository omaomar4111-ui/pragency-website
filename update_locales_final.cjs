const fs = require('fs');

const ar = JSON.parse(fs.readFileSync('locales/ar.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));

// Keys for about.html
const aboutKeysAR = {
  "about.hero.subtitle": "في PR Agency، بنؤمن إن التسويق مش مجرد \"محتوى شكله حلو\". التسويق أداة عملية بتفتح فرص جديدة، وبتجيب نمو حقيقي في المبيعات والوضوح.",
  "about.story.p1": "PR Agency وكالة تسويق متكاملة متخصصة في بناء وتنمية العلامات التجارية عبر استراتيجيات مبتكرة وتنفيذ احترافي. بنشتغل مع الشركات في مصر والخليج لتحقيق نتائج حقيقية وقابلة للقياس.",
  "about.story.p2": "فريقنا يجمع بين الخبرة الاستراتيجية والإبداع التقني لتقديم حلول تسويقية شاملة — من الإعلانات الممولة للإنتاج المرئي وإدارة السوشيال ميديا.",
  "about.v1.title": "استراتيجية مبنية على البيانات",
  "about.v1.desc": "كل قرار بناخده بيبقى مبني على تحليل حقيقي للسوق والجمهور المستهدف، مش مجرد حدس.",
  "about.v2.title": "نتائج قابلة للقياس",
  "about.v2.desc": "بنقيس كل حاجة — من تكلفة الإعلان لنسبة التحويل — عشان تشوف قيمة كل جنيه بتصرفه.",
  "about.v3.title": "شراكة حقيقية",
  "about.v3.desc": "بنتعامل مع كل عميل كأنه شريك — هدفه هدفنا، ونجاحه نجاحنا.",
  "about.v4.title": "تنفيذ سريع واحترافي",
  "about.v4.desc": "بنشتغل بسرعة من غير ما نضحي بالجودة — لأن السوق مش بيستنى.",
  "about.stat.brands": "علامة تجارية",
  "about.stat.experts": "متخصصين",
  "about.stat.services": "خدمات متكاملة",
  "about.stat.commitment": "التزام بالنتائج",
  "about.cta.title": "جاهز نبدأ مشروعك؟",
  "about.cta.desc": "احصل على استشارة مجانية من فريق PR Agency",
  "about.cta.btn": "احصل على استشارة مجانية",
  "footer.quickLinks": "روابط سريعة",
  "footer.project.title": "عندك مشروع؟ يلا نبدأ",
  "footer.project.cta": "ابعتلنا هدفك وميزانيتك، وهنرد عليك بخطة جاهزة للتنفيذ.",
  "footer.location": "المقر",
  "footer.location.val": "القاهرة — مصر",
  "footer.call": "اتصل بنا",
  "footer.mail": "راسلنا على",
  "footer.privacy": "سياسة الخصوصية",
  "footer.terms": "شروط الاستخدام",
  "footer.rights": "كل الحقوق محفوظة.",
  "team.page.badge": "نخبة المبدعين",
  "team.page.subtitle": "الناس اللي بتشتغل على شغلك بكل شغف واحترافية لتحقيق أعلى نتائج ممكنة لبراندك."
};

const aboutKeysEN = {
  "about.hero.subtitle": "At PR Agency, we believe marketing isn't just \"nice-looking content\". Marketing is a practical engine that unlocks real opportunities, driving measurable sales growth and clear brand authority.",
  "about.story.p1": "PR Agency is a full-service marketing agency dedicated to scaling brands through data-led strategies and flawless execution across Egypt and the Gulf.",
  "about.story.p2": "Our team brings together strategic vision and high-level production — from performance media buying to premium cinematic content and complete social media dominance.",
  "about.v1.title": "Data-Driven Strategy",
  "about.v1.desc": "Every decision is backed by deep market research and audience analytics, never intuition alone.",
  "about.v2.title": "Measurable Results",
  "about.v2.desc": "We measure every key metric — from CPA to conversion rate — making sure every pound delivers maximum ROI.",
  "about.v3.title": "True Partnership",
  "about.v3.desc": "We act as your dedicated growth team — your business goals are our mission, and your success is ours.",
  "about.v4.title": "Swift & Flawless Execution",
  "about.v4.desc": "We move fast without ever compromising quality, because fast markets wait for no one.",
  "about.stat.brands": "Trusted Brands",
  "about.stat.experts": "Specialists",
  "about.stat.services": "Core Services",
  "about.stat.commitment": "Commitment to Results",
  "about.cta.title": "Ready to Scale Your Brand?",
  "about.cta.desc": "Get a free marketing consultation with our senior strategists.",
  "about.cta.btn": "Claim Your Free Consultation",
  "footer.quickLinks": "Quick Links",
  "footer.project.title": "Have a Project? Let's Start",
  "footer.project.cta": "Send us your goals and budget, and we'll deliver a clear execution plan.",
  "footer.location": "Location",
  "footer.location.val": "Cairo — Egypt",
  "footer.call": "Call Us",
  "footer.mail": "Email Us",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.rights": "All rights reserved.",
  "team.page.badge": "Top Creators",
  "team.page.subtitle": "The passionate experts dedicated to executing your vision and maximizing your brand's growth."
};

Object.assign(ar, aboutKeysAR);
Object.assign(en, aboutKeysEN);

fs.writeFileSync('locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('locales/en.json', JSON.stringify(en, null, 2));
console.log('Locales updated successfully. Total keys:', Object.keys(ar).length);
