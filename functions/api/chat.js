/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Smart Chat Engine v2
   • Conversation memory (last 3 turns from D1)
   • Response variety (3-4 variants per topic, never repeats last reply)
   • Broader keyword detection with priority ordering
   • Follow-up question handling
   • Debug logging
═══════════════════════════════════════════════════════════════════════════ */

// ── 1. Response Variants ────────────────────────────────────────────────────
const RESPONSES = {
  greeting: {
    ar: [
      "أهلاً وسهلاً! 👋 أنا مساعد PR Agency الذكي. تقدر تسألني عن خدماتنا، الأسعار، أو تطلب استشارة مجانية. إيه اللي تحب تعرفه؟",
      "هلو! 😊 يسعدنا وجودك في PR Agency. إيه اللي تحتاجه النهارده — خدمات تسويق، إعلانات، تصوير؟ أنا هنا!",
      "أهلاً بيك! 🌟 PR Agency وكالة تسويق متكاملة مقرها القاهرة. تحب تعرف إزاي نقدر نساعد علامتك التجارية؟"
    ],
    en: [
      "Hello! 👋 I'm PR Agency's AI Assistant. Ask me about our services, pricing, or request a free consultation. What would you like to know?",
      "Hi there! 😊 Welcome to PR Agency. What can I help you with today — marketing, ads, or video production?",
      "Hey! 🌟 PR Agency is a full-service marketing agency based in Cairo. How can we help grow your brand?"
    ]
  },

  services: {
    ar: [
      "نحن وكالة تسويق متكاملة نقدم 5 خدمات رئيسية:\n1️⃣ إدارة السوشيال ميديا وكتابة المحتوى\n2️⃣ الإعلانات الممولة (Meta / Google / TikTok)\n3️⃣ الإنتاج المرئي والتصوير الاحترافي\n4️⃣ الهوية البصرية والبراندنج\n5️⃣ استراتيجيات النمو والتسويق\nإيه الخدمة اللي تهمك أكتر؟",
      "في PR Agency بنغطي كل احتياجاتك التسويقية:\n• سوشيال ميديا: استراتيجية + محتوى + تفاعل\n• ميديا باينج: إعلانات مستهدفة بأعلى عائد ROI\n• إنتاج: فيديو، ريلز، موشن، تصوير\n• براندنج: هوية بصرية + لوجو\n• استشارة نمو: خطة تسويقية متكاملة\nتحب نتكلم عن أي جزء بالتفصيل؟",
      "إحنا مش مجرد وكالة — إحنا شريك نمو لعلامتك التجارية! خدماتنا تشمل السوشيال ميديا، الإعلانات الممولة، الإنتاج الإعلاني، الهوية البصرية، والاستراتيجية. إيه التحدي التسويقي اللي بتواجهه؟",
      "خدماتنا التسويقية الخمس:\n✅ سوشيال ميديا\n✅ إعلانات ممولة\n✅ تصوير وإنتاج\n✅ هوية بصرية\n✅ استراتيجية ونمو\nتحب تشوف أعمالنا السابقة في مجالك أولاً؟"
    ],
    en: [
      "PR Agency offers 5 integrated marketing solutions:\n1️⃣ Social Media Management & Copywriting\n2️⃣ Media Buying (Meta, Google, TikTok Ads)\n3️⃣ Video & Photo Production\n4️⃣ Brand Identity Design\n5️⃣ Growth Strategy & Consulting\nWhich service interests you most?",
      "We cover everything your brand needs:\n• Social Media: strategy, content & engagement\n• Media Buying: high-ROI targeted ads\n• Production: videos, Reels, motion graphics\n• Branding: visual identity & logo\n• Strategy: full marketing roadmap\nWhat would you like to explore first?",
      "We're more than an agency — we're your growth partner! From social media to paid ads, production to branding. What's your biggest marketing challenge right now?",
      "Our 5 services:\n✅ Social Media\n✅ Paid Advertising\n✅ Video Production\n✅ Branding\n✅ Growth Strategy\nWant to see case studies from your industry?"
    ],
    more_ar: [
      "تفاصيل إضافية عن خدماتنا:\n🔹 السوشيال ميديا: بننشر يومياً، نكتب كوبي احترافي، ونتفاعل مع الجمهور بانتظام.\n🔹 الإعلانات: بنشغّل حملات موجهة بدقة لزيادة المبيعات والـ leads.\n🔹 الإنتاج: استوديو متكامل + فريق تصوير + مونتاج.\nتحب تعرف أسعار أي خدمة؟",
      "بالتفصيل:\n• السوشيال ميديا: إدارة كاملة شاملة التقويم الشهري، التصميمات، والتقارير.\n• الميديا باينج: بنحسّن الإعلانات أسبوعياً عشان أعلى ROI.\n• الإنتاج: بنصور في لوكيشنز مختلفة ومتنوعة.\nإيه اللي محتاجه بالضبط؟"
    ],
    more_en: [
      "More details on our services:\n🔹 Social Media: daily posting, professional copy, community management.\n🔹 Ads: precision-targeted campaigns to maximize leads & sales.\n🔹 Production: full studio + crew + editing.\nWant pricing info for any service?",
      "Deeper dive:\n• Social Media: monthly content calendar, designs, and performance reports.\n• Media Buying: weekly optimization for highest ROI.\n• Production: multi-location shoots available.\nWhat exactly do you need?"
    ]
  },

  pricing: {
    ar: [
      "أسعارنا مرنة وبتتحسب حسب احتياجات كل علامة تجارية:\n💰 إدارة السوشيال ميديا: باقات شهرية مخصصة حسب عدد المنشورات والمنصات.\n💰 الإعلانات الممولة: بتتحدد حسب الميزانية الإعلانية والأهداف.\n💰 الإنتاج المرئي: بيتحسب حسب نوع وعدد الفيديوهات.\nشاركنا اسمك ورقم موبايلك وهيتواصل معاك مستشار التسويق بعرض مفصل على طول! 🚀",
      "تسعيرنا مش ثابت لأننا بنبني خطة مخصصة لكل عميل:\n• الباقات الشهرية لإدارة السوشيال ميديا تبدأ من تحديد الأهداف دلوقتي.\n• ميزانية الإعلانات بتبدأ من ميزانيات صغيرة ممكن تتوسع تدريجياً.\n• التصوير بيتحدد حسب طبيعة وحجم الإنتاج.\nسيبلنا رقمك ونبعتلك عرض في نفس اليوم! 💪",
      "مش عندنا أسعار ثابتة — إحنا بنبني عروض مخصصة 100%. بس عشان نبدأ: شاركنا نوع نشاطك التجاري وميزانيتك التقريبية، وهنعمل عرض مناسب في أسرع وقت. 📩"
    ],
    en: [
      "Our pricing is flexible and tailored to each brand's goals:\n💰 Social Media Management: monthly retainers based on posts & platforms.\n💰 Media Buying: depends on ad budget and campaign objectives.\n💰 Video Production: priced per project type and volume.\nShare your name and phone number and our strategist will send a custom proposal today! 🚀",
      "We don't use one-size-fits-all pricing — every proposal is custom built:\n• Social media packages start from budget-friendly plans.\n• Ad campaigns can start small and scale up.\n• Production costs depend on project scope.\nDrop your number and we'll send a quote same day! 💪",
      "No fixed price list — we build 100% custom proposals. Share your business type and rough budget and we'll get back to you with a tailored offer. 📩"
    ],
    more_ar: [
      "للتوضيح أكتر: أسعارنا بتتحدد بعد فهم أهدافك بالظبط. الاجتماع الأول مجاناً والعرض بيوصلك خلال 24 ساعة. ابعت اسمك ورقمك! ✅",
      "باختصار: كل عرض سعر بيبدأ باجتماع مجاني نفهم فيه احتياجاتك. إيه الميزانية التقريبية اللي بتفكر فيها؟"
    ],
    more_en: [
      "To clarify: pricing is determined after understanding your goals. First meeting is free and you get a proposal within 24 hours. Send your name and number! ✅",
      "In short: every quote starts with a free discovery call. What's your rough budget range?"
    ]
  },

  contact: {
    ar: [
      "تقدر تتواصل معنا مباشرة:\n📞 هاتف / واتساب: +201144826641\n✉️ إيميل: hello@pragency.eg\nأو سيب اسمك ورقمك هنا وهنتواصل معاك فوراً! 😊",
      "وسائل التواصل معنا:\n📱 واتساب: 01144826641\n📧 hello@pragency.eg\nأو كتب اسمك ورقمك في الشات وهنكلمك خلال دقايق!",
      "للتواصل السريع: واتساب على 01144826641 أو بعت إيميل على hello@pragency.eg. أو سيبلنا بياناتك هنا وهنتواصل نحن! 🚀"
    ],
    en: [
      "Reach us directly:\n📞 Phone / WhatsApp: +201144826641\n✉️ Email: hello@pragency.eg\nOr leave your name and number here and we'll contact you right away! 😊",
      "Contact options:\n📱 WhatsApp: +201144826641\n📧 hello@pragency.eg\nOr type your name and number in this chat and we'll call you within minutes!",
      "Quick contact: WhatsApp +201144826641 or email hello@pragency.eg. Or drop your details here and we'll reach out! 🚀"
    ]
  },

  video: {
    ar: [
      "خدمة الإنتاج المرئي عندنا مرنة جداً:\n🎬 بنصور Reels وTikTok وإعلانات تلفزيونية وموشن جرافيك.\n✅ ممكن فيديو واحد أو حملة إنتاج كاملة.\n🎥 معدات احترافية + فريق إخراج متكامل.\nتحب نعمل عرض سعر لفيديو واحد؟ شاركنا التفاصيل!",
      "بنصور أي نوع فيديو:\n• Reels قصيرة وجذابة للسوشيال ميديا\n• إعلانات تلفزيونية احترافية\n• موشن جرافيك ومؤثرات بصرية\n• فيديوهات منتجات واستعراض\nلو عايز فيديو واحد بس — مفيش مشكلة! بنشتغل على أي حجم مشروع. إيه نوع الفيديو اللي محتاجه؟",
      "فريق الإنتاج عندنا كامل المعدات 📸🎬\nبنصور: ريلز، تيك توك، إعلانات، وموشن جرافيك.\nلو بتفكر في فيديو واحد بس كبداية — ده خيار ممتاز! ابعتلنا تفاصيل المشروع ونعمل عرض في نفس اليوم."
    ],
    en: [
      "Our video production service is fully flexible:\n🎬 Reels, TikTok, TV commercials, motion graphics.\n✅ One video or full campaign — we handle any scale.\n🎥 Professional crew + equipment.\nWant a quote for a single video? Share the details!",
      "We produce any video type:\n• Short Reels for social media\n• Professional TV commercials\n• Motion graphics & visual effects\n• Product showcase videos\nEven just one video — no problem! What type of video do you need?",
      "Our production team is fully equipped 📸🎬\nReels, TikTok, ads, motion graphics — we do it all.\nStarting with one video is a great approach! Send us project details and we'll quote you same day."
    ],
    more_ar: [
      "تفاصيل إضافية عن الإنتاج:\n⏱ مدة التصوير حسب نوع الفيديو (ساعات/أيام)\n🖥 مونتاج + موسيقى + تعليقات صوتية متضمنة\n📍 بنصور في لوكيشنز مختلفة أو في الاستوديو\nإيه نوع الفيديو بالضبط؟",
      "بخصوص الإنتاج: بنقدم خدمة كاملة من الفكرة للتسليم. السكريبت + التصوير + المونتاج + الديليفري. تحب نبدأ باجتماع مجاني لفهم رؤيتك؟"
    ],
    more_en: [
      "Production details:\n⏱ Shoot duration varies by video type\n🖥 Editing + music + voiceover included\n📍 On-location or studio shoots available\nWhat type of video exactly?",
      "Full-service production: from concept to delivery. Script + shoot + edit + delivery. Want a free discovery call to discuss your vision?"
    ]
  },

  reels: {
    ar: [
      "الريلز من أقوى أدوات التسويق دلوقتي 🔥\nبنعمل ريلز احترافية للـ Instagram وTikTok:\n• سكريبت إبداعي + تصوير سينمائي + مونتاج سريع\n• مخصصة للترند وللفئة المستهدفة\nتحب نشوف أمثلة من مجالك أو نعمل عرض مباشرة؟",
      "ريلز وتيك توك هما مستقبل التسويق! 🎯\nبنصور محتوى قصير وجذاب يحقق أعلى Engagement:\n✅ ريلز Trending\n✅ إنفوجرافيك متحرك\n✅ فيديو منتج\nتحب تبدأ بكام ريلز في الشهر؟",
      "عندنا باقات متخصصة للـ Reels والـ Short-Form Content!\nبنصور + نمونت + نضيف موسيقى وكابشن + نقترح أوقات النشر. نبدأ باجتماع مجاني نفهم فيه نشاطك؟ 🚀"
    ],
    en: [
      "Reels are one of the most powerful marketing tools right now 🔥\nWe produce professional Reels for Instagram & TikTok:\n• Creative script + cinematic shoot + fast edit\n• Trend-aware and audience-targeted\nWant examples from your industry or a direct quote?",
      "Reels & TikTok are the future of marketing! 🎯\nWe create short, engaging content for maximum Engagement:\n✅ Trending Reels\n✅ Animated Infographics\n✅ Product Videos\nHow many Reels per month are you thinking?",
      "We have dedicated Reels & Short-Form Content packages!\nWe shoot + edit + add music/captions + suggest posting times. Start with a free discovery call? 🚀"
    ]
  },

  social_media: {
    ar: [
      "إدارة السوشيال ميديا من أهم خدماتنا:\n📅 تقويم محتوى شهري مخطط\n✍️ كوبي رايتينج احترافي باللغتين\n🎨 تصميمات بصرية جذابة\n📊 تقارير أداء دورية\nبنشتغل على Instagram، Facebook، TikTok، وLinkedIn. إيه المنصة اللي بتركز عليها؟",
      "خدمة السوشيال ميديا عندنا شاملة 100%:\n• استراتيجية محتوى مخصصة لبراندك\n• نشر يومي أو أسبوعي حسب الباقة\n• تفاعل مع الجمهور والتعليقات\n• تحليل المنافسين والترندات\nتحب تشوف مثال على شغلنا في مجالك؟",
      "السوشيال ميديا هي الواجهة الرقمية لأي براند 💪\nإحنا بنبني الحضور الرقمي من الصفر أو بنطوّر الموجود.\nإيه الهدف اللي عايز تحققه؟ (زيادة Followers، Leads، مبيعات؟)"
    ],
    en: [
      "Social Media Management is one of our core services:\n📅 Monthly planned content calendar\n✍️ Professional bilingual copywriting\n🎨 Eye-catching visual designs\n📊 Regular performance reports\nWe manage Instagram, Facebook, TikTok & LinkedIn. Which platform are you focused on?",
      "Our Social Media service is 100% comprehensive:\n• Custom content strategy for your brand\n• Daily or weekly posting based on package\n• Community management & comment engagement\n• Competitor & trend analysis\nWant to see examples from your industry?",
      "Social media is your brand's digital storefront 💪\nWe build presence from scratch or level up what you have.\nWhat's your goal? (More followers, leads, or sales?)"
    ]
  },

  media_buying: {
    ar: [
      "خدمة الميديا باينج (الإعلانات الممولة) عندنا احترافية جداً:\n📱 Meta Ads (Facebook & Instagram)\n🔍 Google Search & Display\n🎵 TikTok Ads\nبنستهدف الجمهور المناسب بالرسالة الصح، وبنحسّن الحملات أسبوعياً لأعلى ROI. تحب تتكلم عن ميزانيتك الإعلانية؟",
      "إعلاناتنا بتحقق نتايج حقيقية 🎯\nبنشتغل على: Meta (Facebook/Instagram)، Google، TikTok.\nالعملية:\n1. تحديد الجمهور والهدف\n2. إنشاء الإعلانات والكريتيف\n3. مراقبة الأداء والتحسين المستمر\nإيه ميزانيتك الإعلانية؟",
      "الميديا باينج هي أسرع طريقة لتحقيق نتايج 📈\nبنصمم حملات بتحقق: مبيعات أعلى، لييدز أكتر، تعريف أوسع بالبراند.\nعايز نعمل اجتماع سريع نشوف فيه ميزانيتك وأهدافك؟"
    ],
    en: [
      "Our Media Buying (Paid Ads) service is highly professional:\n📱 Meta Ads (Facebook & Instagram)\n🔍 Google Search & Display\n🎵 TikTok Ads\nWe target the right audience with the right message, optimizing weekly for maximum ROI. Want to discuss your ad budget?",
      "Our ads deliver real results 🎯\nPlatforms: Meta, Google, TikTok.\nProcess:\n1. Audience & goal definition\n2. Ad creative & copy\n3. Continuous monitoring & optimization\nWhat's your ad budget?",
      "Media buying is the fastest way to get results 📈\nWe build campaigns for: more sales, more leads, wider brand awareness.\nWant a quick call to discuss your budget and goals?"
    ]
  },

  branding: {
    ar: [
      "خدمة الهوية البصرية والبراندنج عندنا شاملة:\n🎨 تصميم اللوجو الاحترافي\n📐 دليل الهوية البصرية الكامل\n🖋 اختيار الألوان والخطوط\n📱 تطبيق الهوية على كل المواد\nبتحتاج براند جديد ولا تطوير للموجود؟",
      "الهوية القوية هي أساس كل براند ناجح 💫\nبنصمم:\n✅ لوجو احترافي مميز\n✅ ألوان وتايبوجرافي متناسقة\n✅ دليل هوية بصرية متكامل\n✅ تطبيق على السوشيال ميديا والمواد التسويقية\nإيه طبيعة نشاطك التجاري؟",
      "براندنج قوي = ثقة عالية من العملاء 🌟\nبنبني هويات بصرية احترافية من الصفر. لوجو، ألوان، خطوط، وتطبيق على كل منصاتك. تحب تشوف أعمالنا السابقة في البراندنج؟"
    ],
    en: [
      "Our Branding & Visual Identity service is comprehensive:\n🎨 Professional logo design\n📐 Complete brand guidelines\n🖋 Color palette & typography\n📱 Brand application across all materials\nNeed a new brand or refreshing an existing one?",
      "A strong identity is the foundation of every successful brand 💫\nWe design:\n✅ Distinctive professional logo\n✅ Harmonious colors & typography\n✅ Complete brand guidelines\n✅ Application across social media & marketing materials\nWhat's your business type?",
      "Strong branding = high customer trust 🌟\nWe build professional visual identities from scratch. Logo, colors, fonts, and full platform application. Want to see our branding portfolio?"
    ]
  },

  strategy: {
    ar: [
      "خدمة الاستراتيجية التسويقية عندنا متكاملة:\n📊 تحليل السوق والمنافسين\n🎯 تحديد الجمهور المستهدف بدقة\n📋 خطة تسويقية واضحة بـ KPIs قابلة للقياس\n📈 خريطة نمو للـ 3-6-12 شهر\nتحب نعمل تحليل مجاني لعلامتك التجارية؟",
      "الاستراتيجية الصح هي الفرق بين علامة تجارية ناجحة وأخرى مش شايفة نتايج 🧭\nبنبني استراتيجيات مبنية على:\n• بيانات حقيقية\n• تحليل المنافسين\n• أهداف واضحة وقابلة للقياس\nمشروعك في أي مرحلة دلوقتي؟",
      "الاستشارة التسويقية المجانية متاحة! 🎁\nبنحلل: وضعك الحالي + المنافسين + الفرص المتاحة.\nونعمل خطة تسويقية واقعية بميزانيتك.\nسيب رقمك ونحجز معاك ميعاد في أقرب وقت! 📞"
    ],
    en: [
      "Our Marketing Strategy service is fully integrated:\n📊 Market & competitor analysis\n🎯 Precise audience targeting\n📋 Clear marketing plan with measurable KPIs\n📈 Growth roadmap for 3-6-12 months\nWant a free brand analysis?",
      "The right strategy is what separates successful brands from ones not seeing results 🧭\nWe build strategies based on:\n• Real data\n• Competitor analysis\n• Clear, measurable objectives\nWhat stage is your project at right now?",
      "Free marketing consultation available! 🎁\nWe analyze: your current situation + competitors + opportunities.\nAnd create a realistic plan within your budget.\nLeave your number and we'll schedule a call ASAP! 📞"
    ]
  },

  portfolio: {
    ar: [
      "إحنا نفذنا أكثر من 19 شراكة نجاح في مجالات متنوعة:\n🏥 عيادات ومراكز طبية\n💪 أكاديميات رياضة وجيمات\n🏢 مشاريع عقارية\n🛒 متاجر إلكترونية\nتحب تشوف أعمالنا في مجالك تحديداً؟ زور صفحة عملاءنا على الموقع! 👉",
      "شغلنا بيتكلم عن نفسه 💼\nشركاء نجاحنا في: الطب، الرياضة، العقارات، والتجارة الإلكترونية.\nزور pragency.pages.dev وشوف الـ Case Studies أو بعتلنا نوع مجالك وهنشاركك أعمال مشابهة.",
      "أكتر من 19 علامة تجارية وثقت فينا 🌟\nبنقدم نتايج حقيقية قابلة للقياس.\nعايز تشوف Case Study من مجالك؟ بعتلنا نوع نشاطك!"
    ],
    en: [
      "We've executed 19+ success partnerships across diverse industries:\n🏥 Clinics & medical centers\n💪 Sports academies & gyms\n🏢 Real estate projects\n🛒 E-commerce stores\nWant to see our work in your specific industry? Visit our clients page!",
      "Our work speaks for itself 💼\nSuccess partners in: healthcare, sports, real estate & e-commerce.\nVisit pragency.pages.dev to see case studies, or tell us your industry and we'll share similar work.",
      "19+ brands have trusted us 🌟\nWe deliver real, measurable results.\nWant a case study from your industry? Tell us your business type!"
    ]
  },

  team: {
    ar: [
      "فريق PR Agency يضم نخبة من المتخصصين:\n👨‍💼 مديرو استراتيجية وتسويق\n🎨 مصممون ومبدعون\n📸 مصورون ومخرجون\n📊 محللو بيانات وميديا باينج\nفريق شبابي ومتحمس، بنشتغل بأعلى معايير الاحترافية. تحب تتعرف علينا أكتر؟",
      "إحنا فريق من المتخصصين الشباب في التسويق الرقمي 💪\nكل واحد في الفريق متخصص في مجاله:\n• الاستراتيجية والتخطيط\n• الإنتاج والتصوير\n• الإعلانات والميديا باينج\n• التصميم والبراندنج\nبتوقع أي سؤال تاني عن الفريق؟",
      "فريقنا هو سر نجاحنا 🌟\nمجموعة من المحترفين الشباب بخبرة واسعة في السوق المصري والخليجي.\nزور صفحة الفريق على الموقع تعرف على كل واحد!"
    ],
    en: [
      "The PR Agency team is a group of specialists:\n👨‍💼 Strategy & marketing directors\n🎨 Designers & creatives\n📸 Photographers & directors\n📊 Data analysts & media buyers\nYoung, passionate team working to the highest professional standards. Want to learn more?",
      "We're a team of young digital marketing specialists 💪\nEach team member is an expert in their field:\n• Strategy & planning\n• Production & photography\n• Advertising & media buying\n• Design & branding\nAny other questions about the team?",
      "Our team is our secret to success 🌟\nA group of young professionals with extensive experience in the Egyptian and GCC markets.\nVisit the Team page on our website to meet everyone!"
    ]
  },

  about: {
    ar: [
      "PR Agency وكالة تسويق رقمي متكاملة مقرها القاهرة، مصر 🇪🇬\nبنساعد الشركات والعلامات التجارية على النمو عبر خدمات: السوشيال ميديا، الإعلانات الممولة، الإنتاج المرئي، الهوية البصرية، والاستراتيجية التسويقية.\nنفذنا 19+ شراكة نجاح في مصر ومنطقة MENA.",
      "إحنا PR Agency — وكالتك لنمو البراند 🚀\nموجودين من القاهرة وبنخدم عملاء في مصر والخليج.\nبنشتغل بشفافية، نتائج حقيقية، وشراكة حقيقية مع كل عميل.\nتحب تعرف أكتر عن رؤيتنا؟",
      "PR Agency = شريكك الاستراتيجي في عالم التسويق الرقمي 🌐\nمقرنا في القاهرة، وخدماتنا وصلت لعملاء في مصر وكل الخليج.\nعندنا 19+ قصة نجاح ونستهدف المزيد! أنت القادم؟"
    ],
    en: [
      "PR Agency is a full-service digital marketing agency based in Cairo, Egypt 🇪🇬\nWe help businesses and brands grow through: Social Media, Paid Ads, Video Production, Branding & Marketing Strategy.\n19+ success partnerships across Egypt and the MENA region.",
      "We're PR Agency — your brand growth partner 🚀\nBased in Cairo, serving clients across Egypt and the Gulf.\nWe work with transparency, real results, and a true partnership approach.\nWant to know more about our vision?",
      "PR Agency = your strategic partner in digital marketing 🌐\nBased in Cairo, serving clients across Egypt and the GCC.\n19+ success stories and growing — will you be next?"
    ]
  },

  location: {
    ar: [
      "مقر PR Agency الرئيسي في القاهرة، مصر 📍\nبنقدم خدماتنا لعملاء في كل مصر ودول الخليج العربي.\nعايز تحجز زيارة لمكاتبنا؟ تواصل معنا على 01144826641!",
      "إحنا في القاهرة، مصر 🇪🇬\nوبنخدم عملاء عن بُعد في مصر والسعودية والإمارات والكويت.\nتواصل معنا على واتساب: 01144826641",
      "PR Agency موجودة في القاهرة وبتشتغل مع براندات في مصر وكل المنطقة 🌍\nسواء إنت قريب أو بعيد — إحنا هنا!"
    ],
    en: [
      "PR Agency is headquartered in Cairo, Egypt 📍\nWe serve clients across Egypt and the GCC region.\nWant to schedule a visit? Contact us at +201144826641!",
      "We're in Cairo, Egypt 🇪🇬\nServing clients remotely across Egypt, Saudi Arabia, UAE & Kuwait.\nWhatsApp: +201144826641",
      "PR Agency is based in Cairo and works with brands across Egypt and the entire region 🌍\nWhether you're near or far — we're here!"
    ]
  },

  thanks: {
    ar: [
      "العفو! يسعدنا نساعدك في أي وقت 😊 فيه حاجة تانية تحب تعرفها؟",
      "بكل سرور! نحن هنا دايماً لخدمتك. عندك سؤال تاني؟ 🌟",
      "الشكر لله! إيه اللي تحتاج تعرفه عن PR Agency كمان؟ 😊"
    ],
    en: [
      "You're welcome! Happy to help anytime 😊 Anything else you'd like to know?",
      "My pleasure! We're always here for you. Any other questions? 🌟",
      "Of course! What else would you like to know about PR Agency? 😊"
    ]
  },

  consultation: {
    ar: [
      "جاهزون لمساعدتك فوراً! 🚀\nاترك لنا اسمك ورقم هاتفك وفريق الاستراتيجيات هيتواصل معاك خلال ساعات لإعداد خطة عمل مجانية مخصصة لبراندك.",
      "الاستشارة المجانية متاحة النهارده! 🎁\nسيب اسمك ورقمك هنا وهنكلمك ونفهم احتياجاتك ونعمل خطة مناسبة.",
      "ابدأ رحلة نجاحك مع PR Agency 🌟\nمحتاج اسمك، رقمك، ونوع نشاطك التجاري — وهنعمل عرض مفصل ومجاني خلال 24 ساعة!"
    ],
    en: [
      "Ready to help you right now! 🚀\nLeave your name and phone number and our strategy team will contact you within hours for a free, personalized action plan.",
      "Free consultation is available today! 🎁\nDrop your name and number here and we'll call to understand your needs and create a fitting plan.",
      "Start your success journey with PR Agency 🌟\nWe need your name, number, and business type — and we'll prepare a detailed free proposal within 24 hours!"
    ]
  }
};

// ── 2. Fallback responses ───────────────────────────────────────────────────
const FALLBACKS = {
  ar: [
    "أهلاً بك في PR Agency! 👋 يسعدنا إجابة استفسارك. تقدر تسألني عن خدماتنا، الأسعار، طريقة التواصل، أو أعمالنا السابقة. إيه اللي يهمك؟",
    "شكراً لتواصلك مع PR Agency! 😊 تقدر تسألني عن:\n• خدماتنا التسويقية\n• الأسعار والباقات\n• أعمالنا السابقة\n• طريقة التواصل المباشر",
    "مرحباً! أنا مساعد PR Agency. أقدر أجاوبك على أي سؤال عن خدماتنا، أسعارنا، أو فريقنا. ابدأ! 💬"
  ],
  en: [
    "Hello and welcome to PR Agency! 👋 Happy to answer your question. Ask me about our services, pricing, contact info, or portfolio. What interests you?",
    "Thanks for reaching out to PR Agency! 😊 You can ask me about:\n• Our marketing services\n• Pricing & packages\n• Our portfolio\n• Direct contact options",
    "Hi! I'm PR Agency's assistant. I can answer any question about our services, pricing, or team. Fire away! 💬"
  ]
};

// ── 3. Keyword map (checked in priority order) ──────────────────────────────
const KEYWORD_MAP = {
  reels:        ['ريلز', 'reels', 'رييلز', 'شورت', 'shorts', 'tiktok', 'تيك توك', 'تيكتوك'],
  video:        ['فيديو', 'تصوير', 'اصور', 'بصور', 'موشن', 'إنتاج', 'انتاج', 'مقطع', 'video', 'shoot', 'film', 'motion', 'production', 'record'],
  media_buying: ['ميديا باينج', 'اعلانات', 'إعلانات', 'اعلان', 'إعلان', 'ممولة', 'كامبين', 'sponsored', 'ads', 'media buying', 'campaign', 'paid', 'boost', 'بوست'],
  social_media: ['سوشيال', 'سوشيال ميديا', 'انستجرام', 'انستغرام', 'فيسبوك', 'social media', 'instagram', 'facebook', 'منشور', 'بوست', 'متابعين'],
  branding:     ['هوية', 'براند', 'لوجو', 'شعار', 'تصميم', 'هوية بصرية', 'branding', 'brand', 'logo', 'identity', 'design', 'visual'],
  strategy:     ['استراتيجية', 'استراتيجيه', 'خطة', 'خطه', 'تسويق', 'strategy', 'plan', 'marketing plan', 'roadmap'],
  pricing:      ['سعر', 'اسعار', 'أسعار', 'بكام', 'تكلفة', 'تكلفه', 'ميزانية', 'باقة', 'باقات', 'فلوس', 'كام', 'price', 'pricing', 'cost', 'budget', 'package', 'how much', 'rate'],
  contact:      ['تواصل', 'اتصال', 'رقم', 'موبايل', 'تليفون', 'واتساب', 'واتس', 'ايميل', 'إيميل', 'contact', 'phone', 'whatsapp', 'email', 'reach', 'call'],
  portfolio:    ['اعمال', 'أعمال', 'شغل', 'سابقة', 'بورتفوليو', 'عملاء', 'portfolio', 'work', 'clients', 'cases', 'projects', 'examples'],
  team:         ['فريق', 'مين انتوا', 'مين انتم', 'team', 'who are you', 'staff', 'members'],
  location:     ['عنوان', 'فين', 'مكانكم', 'مقر', 'لوكيشن', 'موقعكم', 'location', 'where', 'address', 'office', 'cairo'],
  about:        ['عن', 'مين انتو', 'مين انتوا', 'ايه', 'about', 'who are you', 'tell me about'],
  consultation: ['استشارة', 'عرض', 'مساعدة', 'ابدأ', 'ابدا', 'consultation', 'help', 'start', 'begin', 'proposal'],
  services:     ['خدمات', 'خدمة', 'بتقدموا', 'بتعملوا', 'خدماتكم', 'services', 'offer', 'provide', 'do you do', 'capabilities', 'what do you'],
  thanks:       ['شكرا', 'شكراً', 'متشكر', 'مشكور', 'thanks', 'thank you', 'shukran', 'thx'],
  greeting:     ['هاي', 'اهلا', 'أهلا', 'مرحبا', 'مرحباً', 'السلام', 'ازيك', 'ازيكم', 'hi', 'hello', 'hey', 'salam', 'sup']
};

// Priority order: most specific first
const TOPIC_PRIORITY = [
  'reels', 'video', 'media_buying', 'social_media', 'branding', 'strategy',
  'pricing', 'contact', 'portfolio', 'team', 'location', 'about',
  'consultation', 'thanks', 'services', 'greeting'
];

// Follow-up patterns (short continuations, not real topics)
const FOLLOWUP_PATTERNS = [
  /^(وكمان|طب|و إيه|وإيه|ازاي|إزاي|ايه|اية|وإيه كمان|more|and\??|what about|tell me more|go on|continue)[\?!؟]*$/i,
  /^(تمام|ماشي|اوك|حلو|ok|okay|got it|cool|nice|good|interesting)[\?!؟]*$/i,
  /^(كمان|زيادة|تفاصيل|أكتر|more details|details|expand)[\?!؟]*$/i
];

// ── 4. Helper functions ─────────────────────────────────────────────────────
function detectTopic(msg) {
  const lower = msg.toLowerCase().trim();
  for (const topic of TOPIC_PRIORITY) {
    const keywords = KEYWORD_MAP[topic] || [];
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) return topic;
  }
  return null;
}

function detectLang(msg) {
  return /[\u0600-\u06FF]/.test(msg) ? 'ar' : 'en';
}

function pickResponse(topic, lang, lastAssistantMsg) {
  const topicData = RESPONSES[topic];
  if (!topicData) return null;
  const variants = topicData[lang] || [];
  if (variants.length === 0) return null;
  const filtered = variants.filter(v => v !== lastAssistantMsg);
  const pool = filtered.length > 0 ? filtered : variants;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickMoreResponse(topic, lang, lastAssistantMsg) {
  const topicData = RESPONSES[topic];
  if (!topicData) return null;
  const moreKey = `more_${lang}`;
  const moreVariants = topicData[moreKey] || [];
  if (moreVariants.length > 0) {
    const filtered = moreVariants.filter(v => v !== lastAssistantMsg);
    const pool = filtered.length > 0 ? filtered : moreVariants;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // fallback to regular variants with different pick
  return pickResponse(topic, lang, lastAssistantMsg);
}

function pickFallback(lang, lastAssistantMsg) {
  const variants = FALLBACKS[lang] || FALLBACKS.ar;
  const filtered = variants.filter(v => v !== lastAssistantMsg);
  const pool = filtered.length > 0 ? filtered : variants;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 5. Main handler ─────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;

  try {
    const payload = await request.json();
    const { message, sessionId, visitorId } = payload;

    if (!message || !sessionId) {
      return new Response(JSON.stringify({ error: 'Missing message or sessionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const cf = request.cf || {};
    const country = cf.country || null;
    const city = cf.city || null;
    const userAgent = request.headers.get('User-Agent') || '';

    // ── A. Log user message & upsert session ───────────────────────────────
    if (db) {
      try {
        await db.prepare(`
          INSERT INTO chat_sessions (id, visitor_id, started_at, last_message_at, message_count, country, city, user_agent)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            last_message_at = excluded.last_message_at,
            message_count = chat_sessions.message_count + 1
        `).bind(sessionId, visitorId || 'anon', now, now, country, city, userAgent).run();

        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'user', ?, ?)
        `).bind(sessionId, message, now).run();
      } catch (dbErr) {
        console.warn('[Chat] DB logging error:', dbErr.message);
      }
    }

    // ── B. Try Cloudflare Workers AI first ─────────────────────────────────
    let aiResponse = '';
    let aiModelUsed = null;

    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: `You are the smart AI Growth Assistant for PR Agency (pragency.pages.dev), a leading full-service marketing agency based in Cairo, Egypt. Services: 1) Social Media Management 2) Media Buying (Meta/Google/TikTok) 3) Content Production (video/photo/motion) 4) Branding & Visual Identity 5) Marketing Strategy. Contact: +201144826641, hello@pragency.eg. Respond in the same language as the user. Be friendly, concise, and solution-focused.` },
            { role: 'user', content: message }
          ],
          max_tokens: 350,
          temperature: 0.7
        });
        aiResponse = aiResult.response || aiResult.text || '';
        if (aiResponse) aiModelUsed = '@cf/meta/llama-3-8b-instruct';
      } catch (aiErr) {
        console.warn('[Chat] Workers AI error:', aiErr.message);
      }
    }

    // ── C. Smart Rule Engine (when AI unavailable) ─────────────────────────
    if (!aiResponse) {
      const lang = detectLang(message);

      // Fetch last 3 messages from D1 for conversation memory
      let conversationHistory = [];
      if (db) {
        try {
          const histResult = await db.prepare(`
            SELECT role, content FROM chat_messages
            WHERE session_id = ?
            ORDER BY id DESC
            LIMIT 6
          `).bind(sessionId).all();
          conversationHistory = (histResult.results || []).reverse();
        } catch (histErr) {
          console.warn('[Chat] History fetch error:', histErr.message);
        }
      }

      // Extract last assistant and user messages from history
      const lastAssistantMsg = [...conversationHistory].reverse().find(m => m.role === 'assistant')?.content || '';
      const lastUserMsg = [...conversationHistory].reverse().find(m => m.role === 'user')?.content || '';

      // Check for follow-up
      const isFollowUp = FOLLOWUP_PATTERNS.some(p => p.test(message.trim()));

      let topic = null;
      let isMore = false;

      if (isFollowUp && lastUserMsg && lastUserMsg !== message) {
        // Detect topic from previous user message
        topic = detectTopic(lastUserMsg);
        isMore = true;
      } else {
        topic = detectTopic(message);
      }

      if (topic) {
        aiResponse = isMore
          ? pickMoreResponse(topic, lang, lastAssistantMsg)
          : pickResponse(topic, lang, lastAssistantMsg);
      }

      // If still no response, use fallback
      if (!aiResponse) {
        aiResponse = pickFallback(lang, lastAssistantMsg);
      }

      // Debug log
      console.log('CHAT_DEBUG:', JSON.stringify({
        message: message.substring(0, 60),
        lang,
        detectedTopic: topic,
        isFollowUp,
        isMore,
        lastUserMsg: lastUserMsg.substring(0, 40),
        lastAssistantMsg: lastAssistantMsg.substring(0, 40),
        selectedReply: aiResponse.substring(0, 60)
      }));
    }

    // ── D. Save assistant reply to D1 ──────────────────────────────────────
    if (db) {
      try {
        const replyTime = new Date().toISOString();
        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'assistant', ?, ?)
        `).bind(sessionId, aiResponse, replyTime).run();
      } catch (saveErr) {
        console.warn('[Chat] Error saving assistant message:', saveErr.message);
      }
    }

    return new Response(JSON.stringify({
      reply: aiResponse,
      sessionId,
      aiModel: aiModelUsed,
      aiStatus: aiModelUsed ? 'workers_ai' : 'smart_engine_v2'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('[Chat] Unhandled error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
