/* ═══════════════════════════════════════════════════════════════════════════
   PR AGENCY — Smart Chat Engine v3 (Multi-Dialect & Comprehensive Journey)
   • Egyptian & Gulf Dialect Normalization
   • 18 Specialized Topics covering the entire Client Journey:
     (Greetings, Services, Social, Media Buying, Video, Branding, Strategy,
      Pricing, Contact, Portfolio, Team, About, Process, Comparison,
      Objection, Buying Intent, Thanks, Location)
   • 3-4 Diverse Human-Like Responses per topic (AR + EN)
   • Conversation Memory (D1 context & follow-ups)
   • Intelligent Fallback with specific assistance prompts
═══════════════════════════════════════════════════════════════════════════ */

// ── 1. Dialect Normalizer (Gulf & Egyptian variations) ────────────────────────
const GULF_TO_STANDARD_MAP = [
  [/\b(وش|ويش|شنو)\b/g, 'ايه'],
  [/\b(شلون|شلونكم)\b/g, 'ازاي'],
  [/\b(وين|وينكم|وين مقركم)\b/g, 'فين'],
  [/\b(بكم|كم يكلف|كم السعر|كم التكلفة)\b/g, 'بكام'],
  [/\b(الحين|هسه)\b/g, 'دلوقتي'],
  [/\b(ابغى|ابي|ابغا|اريد|ودي)\b/g, 'عايز'],
  [/\b(سوي|تسوي|نسوي|تسوون)\b/g, 'بتعملوا'],
  [/\b(زين|حيل)\b/g, 'كويس'],
  [/\b(تكفى)\b/g, 'لو سمحت'],
  [/\b(يا طويل العمر)\b/g, 'يا فندم'],
  [/\b(انستقرام)\b/g, 'انستجرام']
];

function normalizeDialect(msg) {
  let text = msg.toLowerCase().trim();
  // Strip common Arabic diacritics
  text = text.replace(/[\u064B-\u0652]/g, '');
  // Normalize Hamzas
  text = text.replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  
  for (const [pattern, replacement] of GULF_TO_STANDARD_MAP) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

// ── 2. Response Variants ────────────────────────────────────────────────────
const RESPONSES = {
  greeting: {
    ar: [
      "أهلاً وسهلاً بك! 👋 يسعدنا تواصلك مع PR Agency. كيف يمكننا مساعدتك اليوم في تنمية أعمالك؟",
      "يا هلا بيك! 😊 نوّرت PR Agency. تحب تستفسر عن خدماتنا التسويقية، باقات الأسعار، أم نماذج أعمالنا؟",
      "أهلاً ومرحباً! 🌟 شريكك الإبداعي والتسويقي هنا لمساعدتك. تفضل بسؤالك وسأجيبك فوراً!"
    ],
    en: [
      "Hello and welcome! 👋 How can PR Agency help scale your business today?",
      "Hi there! 😊 Welcome to PR Agency. Would you like to explore our services, pricing packages, or past work?",
      "Greetings! 🌟 We're thrilled to connect. Ask me anything about our marketing solutions and I'll assist right away!"
    ]
  },

  services: {
    ar: [
      "في PR Agency نقدّم 5 حلول تسويقية متكاملة:\n1️⃣ إدارة السوشيال ميديا وصناعة المحتوى\n2️⃣ الإعلانات الممولة (Media Buying) بأعلى عائد استثمار\n3️⃣ الإنتاج المرئي وجلسات التصوير الاحترافية\n4️⃣ تصميم الهوية البصرية والبراندنج\n5️⃣ استراتيجيات النمو ودراسة السوق\nأي من هذه الخدمات تود التركيز عليها؟",
      "نحن وكالة نمو متكاملة تغطي كافة جوانب التسويق:\n• السوشيال ميديا: خطة شهرية + تصاميم + كتابة محتوى\n• الإعلانات الممولة: Meta, Google, TikTok, Snapchat\n• الإنتاج الإعلاني: تصوير فيديوهات Reels وإعلانات تجارية وموشن\n• البراندنج: شعار كامل ودليل الهوية\n• الاستراتيجية: خطة تسويقية محكمة للنمو\nشاركنا مجالك وسنقترح الحل الأنسب لك! 🚀",
      "خدماتنا مصممة خصيصاً لمضاعفة مبيعاتك وبناء علامتك التجارية:\n✅ إدارة السوشيال ميديا\n✅ إعلانات رقمية موجهة\n✅ تصوير وإنتاج سينمائي\n✅ هوية تجارية احترافية\n✅ استشارات تسويقية\nتحب تشوف نماذج من أعمالنا في مجالك أولاً؟"
    ],
    en: [
      "PR Agency provides 5 full-service marketing pillars:\n1️⃣ Social Media Management & Copywriting\n2️⃣ Performance Media Buying (Meta, Google, TikTok, Snap)\n3️⃣ Commercial Video Production & Photoshoots\n4️⃣ Brand Identity & Logo Design\n5️⃣ Growth Strategy & Market Research\nWhich solution interests you the most?",
      "We're your end-to-end growth partner:\n• Social Media: Strategy, daily content & community engagement\n• Paid Ads: High-ROI targeted campaigns\n• Production: Reels, ads, motion graphics & shoots\n• Branding: Full visual identity & guidelines\n• Strategy: Actionable growth roadmaps\nTell us your business sector to get custom recommendations! 🚀",
      "Our services are crafted to boost sales and brand authority:\n✅ Social Media Management\n✅ Performance Media Buying\n✅ Creative Video Production\n✅ Branding & Identity\n✅ Marketing Strategy\nWould you like to see case studies from your industry?"
    ]
  },

  social_media: {
    ar: [
      "خدمة إدارة السوشيال ميديا وصناعة المحتوى عندنا تشمل:\n📅 تقويم شهري وجدول نشر مدروس\n✍️ كتابة محتوى (كوبي رايتينج) جذاب ومقنع\n🎨 تصاميم جرافيك وهوية بصرية متناسقة\n💬 إدارة التفاعل مع العملاء والتعليقات\nبنشتغل على إنستجرام، فيسبوك، تيك توك، ولينكد إن. ما هي منصتك الأساسية؟",
      "إدارة الصفحات عندنا مش مجرد بوستات، بل منظومة لبناء الثقة والبيع:\n• استراتيجية محتوى تناسب نشاطك وجمهورك\n• إنتاج منشورات وريلز بشكل دوري\n• تقارير شهرية توضح الأرقام ومعدل التفاعل\nتحب نبدأ بمراجعة سريعة لصفحتك الحالية وتقديم نصائح مجانية؟",
      "إذا كنت بحاجة لمن يدير حساباتك باحترافية، ففريقنا يتولى كل التفاصيل:\nمن كتابة الأفكار وتصميمها إلى النشر وتحليل التفاعل ونمو المتابعين الحقيقيين.\nشاركنا رابط صفحتك أو نشاطك لنبدأ فوراً! ✨"
    ],
    en: [
      "Our Social Media Management service covers:\n📅 Monthly curated content calendar\n✍️ Compelling bilingual copywriting\n🎨 High-converting graphic designs\n💬 Community management & engagement\nWe manage Instagram, Facebook, TikTok, and LinkedIn. Which platform are you focusing on?",
      "We turn social channels into sales engines:\n• Tailored content strategy for your brand identity\n• Consistent posts and trending Reels\n• In-depth monthly performance reports\nWould you like a free quick audit of your current social page?",
      "Looking for professional page management? We handle the entire pipeline: concepts, copy, visual design, scheduling, and community growth. Drop your page link to get started! ✨"
    ]
  },

  media_buying: {
    ar: [
      "في الإعلانات الممولة (Media Buying)، نركز على تحقيق أعلى عائد استثمار (ROI):\n🎯 حملات Meta (فيسبوك وإنستجرام) المتقدمة\n🔍 إعلانات بحث وشبكة جوجل (Google Ads)\n🎵 إعلانات TikTok و Snapchat الممولة\nنقوم بالاختبار المستمر A/B Testing واستهداف الجمهور الأكثر قابلية للشراء. ما هي ميزانيتك الإعلانية المقترحة؟",
      "خدمة إدارة الحملات الإعلانية المدفوعة لدينا:\n1. دراسة الجمهور المستهدف وتحديد اهتماماته\n2. كتابة إعلانات وإعداد كريتيف يحقق النقرات والتحويل\n3. تحسين يومي للحملات لتقليل تكلفة العميل (CPA)\nهل هدفك الأساسي زيادة المبيعات أم جمع بيانات العملاء (Leads)؟",
      "إعلاناتنا مبنية على الأرقام والبيانات الصريحة. نعمل على جذب عملاء مستعدين للشراء فوراً مع تقارير أداء دورية وشفافة.\nاترك لنا تفاصيل مشروعك لنحدد المنصة الإعلانية الأكثر ربحية لك! 📈"
    ],
    en: [
      "In Paid Advertising & Media Buying, our priority is maximum ROI:\n🎯 Advanced Meta Ads (Facebook & Instagram)\n🔍 High-intent Google Search & Display Ads\n🎵 TikTok & Snapchat Ads\nWe continuously run A/B testing to reach buyers at the lowest acquisition cost. What is your intended ad budget?",
      "Our Paid Ads Campaign Management:\n1. Deep audience research & segmentation\n2. High-converting ad copy and creative assets\n3. Daily optimization to scale revenue\nIs your primary goal e-commerce sales or B2B lead generation?",
      "Data-driven advertising that delivers tangible profits. We scale campaigns transparently with weekly tracking reports.\nShare your project details so we can pick the highest-converting channel for you! 📈"
    ]
  },

  video: {
    ar: [
      "خدمة الإنتاج المرئي والتصوير عندنا متكاملة تماماً:\n🎬 تصوير ريلز وفيديوهات قصيرة تيك توك وسناب شات\n📸 جلسات تصوير منتجات ومواقع احترافية\n📺 إعلانات تجارية سينمائية\n🎨 موشن جرافيك ورسوم متحركة\nسواء كنت تريد فيديو واحداً أو حملة إنتاج كاملة، نحن جاهزون بأحدث المعدات وفريق إخراج كامل!",
      "فيديوهات الريلز والمحتوى القصير هي أسرع وسيلة للانتشار حالياً 🔥\nنحن نقدم:\n• الفكرة وكتابة السيناريو\n• طاقم التصوير والإضاءة والصوت\n• المونتاج والتلوين والمؤثرات الصوتية\nما هو نوع المنتج أو الفكرة التي تريد تصويرها؟",
      "إذا كنت بحاجة لتصوير فيديو واحد فقط أو باقة شهرية، يسعدنا ذلك!\nنصور في استوديوهاتنا أو في موقع عملك مع توفير الموديلز وفريق الإنتاج بالكامل.\nأخبرنا بتفاصيل ما ترغب بتصويره لنرسل لك عرض سعر محدد ومباشر! 🎥"
    ],
    en: [
      "Our Visual & Video Production service covers everything:\n🎬 Trending Reels & short-form TikTok/Snapchat videos\n📸 Professional commercial product photography\n📺 Cinematic brand commercials\n🎨 High-end motion graphics\nWhether you need a single hero video or a full monthly package, we provide high-grade cameras and a dedicated crew!",
      "Short-form video is today's most viral growth channel 🔥\nWe handle:\n• Creative scripting & storyboard\n• On-set filming, lighting, and sound\n• Dynamic editing, sound design, and color grading\nWhat kind of product or concept do you want to shoot?",
      "Looking to film a single video or recurring monthly Reels? We've got you covered!\nWe shoot in-studio or on-location with complete production staff.\nTell us your vision to receive a custom quote! 🎥"
    ]
  },

  branding: {
    ar: [
      "الهوية البصرية القوية هي سر ثقة العملاء وعلامة البراند الناجح 💎\nنقدم:\n✨ تصميم شعار (Logo) مميز وأصيل\n🎨 لوحة ألوان وأنماط خطوط متناسقة\n📘 دليل الهوية البصرية الكامل (Brand Guidelines)\n📦 تطبيقات الهوية على المطبوعات، السوشيال ميديا، والتغليف\nهل تبدأ مشروعاً جديداً أم ترغب في تطوير هوية حالية؟",
      "نصمم علامات تجارية تعلق في أذهان العملاء:\nمن الفكرة والقيمة الجوهرية إلى الشعار وتطبيقاته على كافة وسائط العرض والمراسلات.\nشاركنا اسم أو مجال مشروعك لنطلعك على أفكار ونماذج مميزة! 🎨",
      "خدمة البراندنج والتصميم عندنا شاملة كل ما تحتاجه للانطلاق:\nشعار احترافي، ألوان متناسقة، براند بوك، وتصاميم السوشيال ميديا والمطبوعات.\nتحب نحدد موعد جلسة عصف ذهني مجانية لمناقشة هويتك؟"
    ],
    en: [
      "A strong brand identity establishes immediate market authority 💎\nWe deliver:\n✨ Unique, memorable logo design\n🎨 Cohesive color palette & typography\n📘 Comprehensive Brand Guidelines\n📦 Brand collateral (packaging, stationery, social kit)\nAre you launching a new venture or rebranding an existing business?",
      "We craft brand identities that leave lasting impressions:\nFrom conceptual values to refined logos and digital assets across all touchpoints.\nTell us your business sector to explore tailored design inspirations! 🎨",
      "Complete branding ready for launch: distinct logo, typography guidelines, brand book, and print-ready collateral.\nWould you like to schedule a free brand discovery call?"
    ]
  },

  strategy: {
    ar: [
      "الاستراتيجية التسويقية هي الخريطة التي تضمن وصولك للهدف دون هدر للميزانية 🧭\nتشمل خطتنا:\n📊 دراسة السوق والمنافسين وتحليل نقاط القوة والضعف (SWOT)\n🎯 تحديد العميل المثالي (Buyer Persona)\n📋 خطة عمل تنفيذية وجدول زمني محدد مع مؤشرات قياس أداء واضحة (KPIs)\nهل ترغب في وضع خطة للربع القادم؟",
      "بدون خطة تسويقية واضحة، الإعلانات تكون مجرد مصاريف.\nنحن نضع خططاً مبنية على أرقام واقعية وأهداف قابلة للقياس (مبيعات، عملاء محتملين، انتشار).\nأخبرنا عن هدفك التسويقي للـ 6 أشهر القادمة لنساعدك في تحقيقه!",
      "فريق الاستراتيجية لدينا يساعدك في:\n1. معرفة موقعك من المنافسين\n2. اختيار أنسب القنوات للوصول لجمهورك بأقل تكلفة\n3. توزيع ميزانيتك الإعلانية بذكاء\nاحجز جلستك الاستشارية لنبدأ فوراً! 📊"
    ],
    en: [
      "Marketing Strategy is the roadmap that secures results without budget waste 🧭\nOur strategy roadmap covers:\n📊 Competitor intelligence and market positioning\n🎯 Exact Buyer Persona definition\n📋 Actionable implementation timeline with clear KPIs\nWould you like us to outline a strategic plan for the upcoming quarter?",
      "Without strategy, ad spend is just an expense. We architect plans grounded in market metrics and measurable ROI.\nShare your growth target for the next 6 months and let's structure the roadmap!",
      "Our strategists help you:\n1. Benchmark against market competitors\n2. Select the most profitable channels at the lowest acquisition cost\n3. Optimize ad budget allocation\nBook a strategy consult to start! 📊"
    ]
  },

  pricing: {
    ar: [
      "أسعارنا مرنة وتُحدد بناءً على حجم أهدافك واحتياجاتك الخاصة 💰:\n• باقات السوشيال ميديا: اشتراكات شهرية تعتمد على حجم المحتوى وعدد المنصات.\n• الإعلانات الممولة: تعتمد على حجم الميزانية والمنصات المستهدفة.\n• جلسات التصوير والإنتاج: تُحسب وفق عدد الفيديوهات وطبيعة المواقع.\nاترك اسمك ورقم هاتفك أو نوع نشاطك وسنزودك بعرض سعر مفصل ومناسب لميزانيتك خلال وقت قصير! 🚀",
      "لا نعتمد أسعاراً عشوائية لأن كل مشروع له متطلباته الخاصة:\nنبدأ باجتماع تعريفي سريع لفهم ميزانيتك المقترحة، ثم نقدم باقة مفصلة تضمن لك أعلى فائدة وعائد.\nما هي الميزانية التقريبية أو الخدمة التي تود معرفة تكلفتها؟",
      "عروضنا مصممة لتناسب مختلف المراحل:\nسواء كنت شركة ناشئة تبحث عن باقة اقتصادية لبدء الانطلاق، أو علامة تجارية كبرى تبحث عن خطة تسويق وتصوير متكاملة.\nأرسل لنا رقمك أو تواصل معنا مباشرة عبر واتساب على 01144826641 وسنوافيك بكافة التفاصيل! 📞"
    ],
    en: [
      "Our pricing is tailored to your specific scope and milestones 💰:\n• Social Media packages: Monthly retainers tailored by content volume.\n• Media Buying: Scales with targeted platforms and ad budgets.\n• Video Production: Scoped per shoot days and video deliverables.\nShare your name and phone number and our strategist will deliver a custom proposal! 🚀",
      "We avoid cookie-cutter price tags because every brand needs specific focus.\nWe assess your targets and provide transparent package tiers to maximize ROI.\nWhat service or budget tier are you looking to explore?",
      "Packages designed for every scale: From cost-effective launch packages for growing startups to complete 360° agency retainers.\nDrop your number or chat on WhatsApp at +201144826641 for immediate quote options! 📞"
    ]
  },

  portfolio: {
    ar: [
      "يسعدنا جداً اطلاعك على أعمالنا السابقة! 💼\nنفذنا أكثر من 19 شراكة نجاح عبر قطاعات حيوية تشمل:\n🏥 العيادات والمراكز الطبية الكبرى\n💪 الأندية الرياضية وصالات الجيم\n🏢 المشاريع والشركات العقارية\n🛒 المتاجر الإلكترونية والعلامات الاستهلاكية\nيمكنك زيارة صفحة أعمالنا على الموقع (pragency.pages.dev/clients.html) أو إخبارنا بمجالك لنرسل لك نماذج مشابهة فوراً!",
      "شغلنا يتحدث عن نفسه! قمنا بإدارة حملات تصوير وإعلانات حققت ملايين المشاهدات ومبيعات قياسية لشركائنا.\nما هو مجالك تحديداً؟ وسأشارك معك فوراً دراسة حالة (Case Study) مطابقة لمجالك. 🌟",
      "نماذج الأعمال وتجارب النجاح السابقة متوفرة بالكامل على الموقع الرسمي في قسم 'عملاؤنا'.\nتحب نرسل لك ملف سابقة الأعمال (Portfolio PDF) مباشرة عبر واتساب؟ شاركنا رقمك!"
    ],
    en: [
      "We'd love to showcase our track record! 💼\nOver 19 successful client partnerships across high-growth sectors:\n🏥 Healthcare & Medical Centers\n💪 Fitness Clubs & Sports Academies\n🏢 Real Estate & Property Developers\n🛒 E-commerce & Retail Brands\nCheck our clients showcase at pragency.pages.dev/clients.html or share your industry for matching samples!",
      "Our work delivers measurable impact! We've produced viral commercial campaigns and generated record-breaking sales for clients.\nWhat is your business niche? I'll share an exact matching case study. 🌟",
      "Full case studies and creative portfolios are live on our website in the 'Clients' section.\nWould you like our portfolio deck sent directly to WhatsApp? Share your number!"
    ]
  },

  team: {
    ar: [
      "فريق PR Agency يضم نخبة من المتخصصين والمبدعين:\n👨‍💼 مديرو استراتيجيات وتسويق رقمي بخبرات سوقية واسعة\n🎨 مصممو هوية بصرية وجرافيك مبدعون\n🎥 مخرجون ومصورون محترفون بأحدث المعدات\n📊 خبراء ميديا باينج وتحليل بيانات\nفريق شاب وشغوف يضع نجاح مشروعك كأولوية أولى! هل تود مقابلتنا؟",
      "نحن فريق عمل متكامل يجمع بين الفكر الاستراتيجي والإنتاج الفني:\nكل فرد في الفريق متخصص في مجاله لضمان أن تخرج حملتك بأعلى جودة ممكنة.\nيمكنك زيارة صفحة 'فريقنا' في الموقع للتعرف عليهم فرداً فرداً! 🌟",
      "خلف كل إعلان وتصميم ناجح في PR Agency فريق متكامل يعمل بروح الشراكة الحقيقية مع عملائنا.\nيسعدنا دائماً ترتيب اجتماع تعارف لمناقشة أهدافك مع المتخصصين مباشرة! 🤝"
    ],
    en: [
      "The PR Agency team brings top-tier marketing and creative talent:\n👨‍💼 Veteran digital strategists and marketing leads\n🎨 Innovative brand identity and graphic artists\n🎥 Commercial directors and photographers\n📊 Performance media buyers and data specialists\nA passionate team dedicated to scaling your business! Want to meet the crew?",
      "An integrated studio fusing strategic thinking with high-end creative execution.\nEvery specialist focuses on their craft to guarantee flawless deliverables.\nVisit our 'Team' page to meet the faces behind our campaigns! 🌟",
      "Behind every winning campaign at PR Agency is a collaborative team treating your brand as their own.\nWe'd love to set up an introductory meeting to align with our specialists! 🤝"
    ]
  },

  about: {
    ar: [
      "PR Agency هي وكالة تسويق رقمي وإنتاج إبداعي متكاملة مقرها الرئيسي في القاهرة، مصر 🇪🇬\nتأسست لمساعدة الشركات والعلامات التجارية في مصر ومنطقة الخليج العربي على تحقيق نمو حقيقي في المبيعات والانتشار عبر حلول مبنية على البيانات والإبداع.\nنفذنا أكثر من 19 شراكة نجاح متواصلة في قطاعات متعددة.",
      "نحن شريكك في النمو والتسويق 🚀\nنؤمن بأن التسويق ليس مجرد منشورات جميلة، بل أداة عملية تفتح فرصاً تجارية جديدة وتحقق أرباحاً قابلة للقياس.\nقيمنا تقوم على الشفافية التامة، النتائج الملموسة، والشراكة طويلة الأمد.",
      "وكالة تسويق متكاملة نجمع بين الرؤية الاستراتيجية والإتقان في التنفيذ.\nنخدم عملاءنا في مصر، السعودية، الإمارات، والكويت بحلول مخصصة لكل سوق.\nهل تود معرفة كيف يمكننا مساعدة علامتك التجارية في السوق؟"
    ],
    en: [
      "PR Agency is a full-service creative digital marketing agency based in Cairo, Egypt 🇪🇬\nWe empower businesses across Egypt and the GCC to achieve measurable sales growth through data-driven campaigns and creative excellence.\n19+ sustained partner success stories across diverse industries.",
      "We are your dedicated growth partner 🚀\nWe believe marketing isn't just attractive visuals; it's a commercial instrument that drives quantifiable revenue and market authority.\nOur pillars are radical transparency, real ROI, and long-term partnership.",
      "A complete agency combining strategic foresight with meticulous creative production.\nServing brands in Egypt, Saudi Arabia, the UAE, and Kuwait.\nCurious how we can elevate your market presence?"
    ]
  },

  process: {
    ar: [
      "آلية العمل والبدء معنا سهلة ومنظمة للغاية 🛠️:\n1️⃣ اجتماع استكشافي مجاني: نستمع فيه لأهدافك ونفهم تحدياتك.\n2️⃣ إعداد الخطة وعرض السعر: نرسل مقترح عمل تفصيلي بالخدمات والتكلفة والجدول الزمني.\n3️⃣ توقيع الاتفاق والبدء: استلام المواد وتجهيز خطة الشهر الأول والمحتوى فوراً.\n4️⃣ التنفيذ والتحسين الدوري: إطلاق الحملات ومتابعة النتائج وتقديم تقارير شفافة.\nتحب نحدد موعد للخطوة الأولى؟",
      "خطوات العمل من الفكرة حتى تحقيق النتائج:\n• نبدأ بدراسة وضعك الحالي وتحديد الأولويات.\n• إعداد خطة العمل والاتفاق على مؤشرات الأداء (KPIs).\n• فريق الإنتاج والتسويق يبدأ التنفيذ في غضون أيام قليلة.\nالعملية سريعة وسلسة ودون أي تعقيدات! جاهز للانطلاق؟ 🚀",
      "بخصوص الوقت والتنفيذ:\nعادةً نبدأ العمل الفعلي وتجهيز الحملات خلال 3 إلى 5 أيام عمل من الاتفاق الرسمي.\nتحب نحدد مكالمة سريعة اليوم مع مستشارنا التسويقي؟"
    ],
    en: [
      "Our onboarding process is transparent and structured 🛠️:\n1️⃣ Free Discovery Call: We listen to your goals and challenges.\n2️⃣ Custom Proposal & Quote: Detailed scope, deliverables, and timeline.\n3️⃣ Kickoff & Onboarding: Asset collection and month-one roadmap execution.\n4️⃣ Execution & Scaling: Launching campaigns, tracking metrics, and weekly reporting.\nReady to take Step 1?",
      "From concept to measurable milestones:\n• We audit your current channels and set benchmarks.\n• Formulate the campaign roadmap with concrete KPIs.\n• Full execution launches within days.\nSmooth, fast, and structured! Ready to start? 🚀",
      "Timelines & Delivery:\nStandard campaign kickoff happens within 3 to 5 business days after agreement finalization.\nShall we schedule a brief discovery call with our strategist today?"
    ]
  },

  comparison: {
    ar: [
      "ما يميز PR Agency عن غيرنا هو تركيزنا على النتائج المالية والمبيعات وليس مجرد أرقام وهمية 🎯:\n1. خطط مخصصة 100% لنشاطك (لا نستخدم قوالب جاهزة مكررة).\n2. فريق متكامل يجمع الاستراتيجية، الميديا باينج، والتصوير السينمائي في مكان واحد.\n3. شفافية تامة في التقارير ومصاريف الإعلانات دون أي تكاليف خفية.\n4. سرعة استجابة ومرونة في التعديل والمتابعة اليومية.\nنسعد بأن نكون شركاء نجاحك الحقيقيين!",
      "لماذا تختار PR Agency؟\nلأننا نتحمل مسؤولية نمو مشروعك كأنه مشروعنا الخاص.\nنجمع بين الفن الإبداعي في التصوير والتصميم، والذكاء التحليلي في استهداف الإعلانات وإغلاق الصفقات.\nيسعدنا إثبات ذلك لك في أول تجربة عمل تجمعنا! 🌟",
      "الفرق يكمن في جودة المخرجات والاهتمام بالتفاصيل:\nلا نكتفي بنشر محتوى أو تشغيل إعلانات، بل ندرس سيكولوجية عميلك ونوجهه للشراء وبناء الولاء لعلامتك.\nتحب تشوف مقارنة عملية أو نماذج من إعلاناتنا السابقة؟"
    ],
    en: [
      "What sets PR Agency apart is our laser focus on bottom-line revenue, not vanity metrics 🎯:\n1. 100% bespoke strategies tailored to your exact industry.\n2. In-house unified team: strategy, high-ROI media buying, and cinema-grade production under one roof.\n3. Total transparency in ad spend and comprehensive analytics.\n4. Agile turnaround and dedicated account leadership.\nWe act as your true internal growth division!",
      "Why choose PR Agency?\nBecause we take ownership of your growth targets.\nWe merge high-converting visual storytelling with relentless data analytics.\nWe'd love to prove our value on your next campaign! 🌟",
      "The distinction lies in our execution standards:\nWe don't merely schedule posts; we understand buyer psychology and optimize the complete customer conversion funnel.\nWant to see our before/after client transformation metrics?"
    ]
  },

  objection: {
    ar: [
      "نقدّر جداً اهتمامك بالميزانية! 💡 في PR Agency نؤمن بأن التسويق الحقيقي استثمار يعود عليك بأرباح مضاعفة وليس عبئاً مالياً.\nلدينا باقات مرنة ومتنوعة، ويمكننا دائماً تكييف نطاق العمل ليناسب ميزانيتك الحالية والبدء خطوة بخطوة.\nما هو النطاق المالي المناسب لك لنقترح عليك أفضل خطة ممكنة؟",
      "يسعدنا التوصل لحل متوازن يرضيك ويحقق أهدافك!\nيمكننا تعديل عدد المنشورات أو نطاق التصوير بما يمنحك أعلى جودة ضمن الميزانية المتاحة لك.\nدعنا نتحدث هاتفياً أو عبر واتساب ونصل لأفضل اتفاق مرن! 🤝",
      "بخصوص الأسعار والعروض الخاصة:\nنقدّم خصومات مميزة عند التعاقد على الباقات ربع السنوية أو السنوية، وباقات مخصصة للمشاريع الناشئة.\nشاركنا رقم هاتفك وسيقوم مسؤول الحسابات بتقديم أفضل عرض متاح لك اليوم! 🎁"
    ],
    en: [
      "We completely respect your budget considerations! 💡 At PR Agency, sound marketing is an investment that yields measurable returns, not a cost.\nWe offer tiered packages and can scale the project scope to match your comfort level as we grow together.\nWhat budget parameters work best for you?",
      "We are always glad to find a mutually rewarding solution!\nWe can calibrate deliverable volume or production scale to fit your current budget while keeping quality uncompromised.\nLet's connect on WhatsApp to design an agreeable proposal! 🤝",
      "Regarding discounts and special retainers:\nWe provide bundled incentives on multi-month retainers as well as tailored startup launch tiers.\nLeave your number and our business team will prepare our best promotional offer! 🎁"
    ]
  },

  buying_intent: {
    ar: [
      "أهلاً بك! نحن متحمسون جداً لبدء هذا التعاون ومساعدتك في تحقيق أهدافك القادمة 🚀\nلحجز موعد الاستشارة المجانية والبدء في تجهيز الخطة:\nفضلاً اترك اسمك الكريم ورقم هاتفك (أو واتساب) وسيتواصل معك مستشار التسويق لدينا خلال ساعات قليلة.",
      "خطوة ممتازة! يسعدنا انضمامك لشركاء نجاح PR Agency 🌟\nيرجى كتابة رقم هاتفك واسمك هنا في المحادثة، أو مراسلتنا مباشرة على واتساب: 01144826641 لنحدد موعد الاجتماع فوراً!",
      "جاهزون للبدء فوراً وتخصيص فريق عمل لمشروعك!\nسجل بيانات التواصل الخاصة بك وسنقوم بإعداد مسودة عمل أولية وتقديمها لك في أقرب فرصة. 🤝"
    ],
    en: [
      "We are thrilled to collaborate and accelerate your brand's growth journey! 🚀\nTo schedule your free strategy consultation:\nPlease provide your name and phone number/WhatsApp, and our senior strategist will connect with you shortly.",
      "Fantastic decision! We look forward to having you as our next success story 🌟\nShare your contact details here in chat or message us directly on WhatsApp at +201144826641 to book your discovery session!",
      "We're geared up to allocate a dedicated marketing team to your project!\nLeave your details and we will outline your kickoff roadmap immediately. 🤝"
    ]
  },

  contact: {
    ar: [
      "يسعدنا تواصلك معنا مباشرة عبر القنوات التالية:\n📞 هاتف / واتساب: +201144826641\n✉️ البريد الإلكتروني: hello@pragency.eg\n🏢 المقر: القاهرة، مصر (مع تقديم خدماتنا لكافة دول الخليج العربي)\nأو يمكنك ترك اسمك ورقمك هنا وسنتصل بك في غضون دقائق! ⚡",
      "طرق التواصل السريع مع فريق PR Agency:\n📱 واتساب مباشر: 01144826641\n📧 الإيميل: hello@pragency.eg\nيسعدنا الإجابة على أي استفسار أو تنسيق موعد اجتماع على الفور!",
      "يمكنك مراسلتنا على مدار الساعة على واتساب رقم 01144826641، أو ترك رقمك واسمك هنا في الشات وسيتواصل معك أحد خبرائنا مباشرة. 📲"
    ],
    en: [
      "You can connect with us directly across our official channels:\n📞 Phone / WhatsApp: +201144826641\n✉️ Email: hello@pragency.eg\n🏢 Headquarters: Cairo, Egypt (serving clients throughout the GCC)\nOr drop your name and number right here and we'll reach out within minutes! ⚡",
      "Immediate ways to reach PR Agency:\n📱 WhatsApp: +201144826641\n📧 Email: hello@pragency.eg\nWe are always here to answer questions or set up a consultation call!",
      "Reach our specialists 24/7 on WhatsApp at +201144826641, or leave your phone and name here for an instant callback. 📲"
    ]
  },

  location: {
    ar: [
      "مقر PR Agency الرئيسي في القاهرة، مصر 📍\nونقدم خدماتنا وشراكاتنا التسويقية للشركات في جميع أنحاء مصر، والمملكة العربية السعودية، والإمارات، والكويت.\nيسعدنا دائماً ترتيب زيارة لمكاتبنا أو عقد اجتماع أونلاين عبر Zoom/Google Meet!",
      "مكاتبنا الرئيسية في القاهرة، مصر 🇪🇬\nونعمل بشكل يومي مع شركاء نجاح في الرياض، جدة، دبي، ومصر.\nتفضل بالتواصل معنا لحجز لقاء في المقر أو افتراضياً عبر الفيديو!",
      "مقرنا في قلب القاهرة، ونخدم كافة المنطقة عن بُعد وبزيارات تصوير ميدانية عند الحاجة 🌍\nتواصل معنا عبر واتساب 01144826641 للمزيد من التفاصيل!"
    ],
    en: [
      "PR Agency is headquartered in Cairo, Egypt 📍\nWe actively partner with brands across Egypt, Saudi Arabia, the UAE, and Kuwait.\nWe'd love to host you at our office or schedule a Zoom discovery call!",
      "Our main creative studio is in Cairo, Egypt 🇪🇬\nOperating seamlessly with clients throughout Riyadh, Jeddah, Dubai, and Cairo.\nGet in touch to visit us or set up a video consult!",
      "Based in Cairo and serving the broader MENA/GCC markets with remote strategy and on-site production crews 🌍\nReach out on WhatsApp at +201144826641 for location and visit details!"
    ]
  },

  thanks: {
    ar: [
      "الشكر لله! دائماً في خدمتك وسعداء بمساعدتك 😊 هل لديك أي استفسار آخر ترغب بمعرفته؟",
      "العفو بكل سرور! تسلم، نحن هنا دوماً لخدمتك ومساعدة علامتك التجارية على النمو 🌟",
      "على الرحب والسعة! الله يعطيك ألف عافية. يسعدنا استمرار تواصلك في أي وقت تريده! 🤝"
    ],
    en: [
      "You are most welcome! Always happy to assist 😊 Anything else you'd like to explore?",
      "Our absolute pleasure! We are always here to help you scale your brand 🌟",
      "Anytime! Wishing you immense success. Feel free to reach out whenever needed! 🤝"
    ]
  }
};

// ── 3. Fallbacks ─────────────────────────────────────────────────────────────
const FALLBACKS = {
  ar: [
    "أهلاً بك في PR Agency! يسعدنا جداً الإجابة على استفسارك ومساعدتك في تطوير نشاطك التجاري. هل ترغب في معرفة تفاصيل خدماتنا (سوشيال ميديا، إعلانات، إنتاج إعلاني)، أم تود معرفة عروض الأسعار والبدء فوراً؟",
    "مرحباً بك! أنا مساعد PR Agency الذكي. يسعدني إرشادك في كل ما يخص التسويق وتنمية مبيعاتك. تفضل بسؤالك وسأجيبك بأدق التفاصيل!",
    "شكراً لتواصلك! لمساعدتك بأفضل طريقة ممكنة، هل تبحث عن: 1) خدمات السوشيال ميديا وصناعة المحتوى، 2) حملات الإعلانات الممولة، أم 3) إنتاج وتصوير الفيديوهات؟"
  ],
  en: [
    "Hello and welcome to PR Agency! We are eager to assist with your marketing goals. Would you like to explore our services (Social Media, Paid Ads, Video Production), or request pricing packages for your brand?",
    "Hi! I am the PR Agency AI Growth Assistant. How can I help accelerate your digital marketing and sales today?",
    "Thanks for connecting! To give you the exact details you need, are you looking for: 1) Social media & content management, 2) Paid advertising, or 3) Video production?"
  ]
};

// ── 4. Comprehensive Keyword Map (Egyptian & Gulf Normalized) ────────────────
const KEYWORD_MAP = {
  greeting: [
    'السلام عليكم', 'سلام', 'اهلا', 'مرحبا', 'هاي', 'هلا', 'ازيك', 'اخبارك',
    'صباح الخير', 'مساء الخير', 'hi', 'hello', 'hey', 'salam', 'good morning',
    'good evening', 'يا هلا', 'حياك', 'هلا والله', 'السلام', 'ازيكم', 'شخبارك'
  ],

  pricing: [
    'سعر', 'اسعار', 'بكام', 'تكلفه', 'ميزانيه', 'باقه', 'باقات', 'عرض سعر',
    'كم السعر', 'كام الشغل', 'كم يكلف', 'كم التكلفه', 'عروض', 'خصومات', 'خصم',
    'price', 'pricing', 'cost', 'budget', 'package', 'how much', 'rate', 'quote',
    'فلوس', 'ارخص', 'غاليه', 'غالي'
  ],

  objection: [
    'غالي', 'ميزانيه قليله', 'مش قادر', 'خصم', 'مفاوضه', 'ارخص', 'مش في الميزانيه',
    'مكلف', 'too much', 'expensive', 'discount', 'cheaper', 'over budget',
    'ده غالي', 'ممكن خصم'
  ],

  buying_intent: [
    'عايز اتعاون', 'مهتم', 'احجز', 'عايز ابدا', 'عايز اشتغل معاكم', 'جاهز', 'ابدأ',
    'ابدا', 'مهتم بالخدمه', 'عايز اعمل مشروع', 'هيا نبدا', 'يلا نبدا', 'عايز استشير',
    'استشاره', 'طلب عرض', 'احجز موعد', 'عايز موعد', 'عايز اكلم حد', 'interested',
    'book', 'start', 'ready'
  ],

  process: [
    'بتشتغلوا ازاي', 'كيف تشتغلون', 'الخطوات', 'ازاي بتبداوا', 'كيف نبدا', 'من فين نبدا',
    'اول خطوه', 'بعد كده', 'وبعدين', 'بعدها ايه', 'بتاخدوا وقت اد ايه', 'كم المده',
    'طريقه العمل', 'ازاي', 'طب ازاي', 'كيف', 'اليه العمل', 'steps', 'process', 'procedure', 'how do you start',
    'how it works'
  ],

  comparison: [
    'الفرق بينكم', 'ايه الفرق', 'ليه اختاركم', 'ليه انتوا', 'احسن من', 'افضل من',
    'ليه مش غيركم', 'ليه انتو', 'ميزتكم', 'شو الميزه', 'why choose you', 'why you',
    'difference', 'competitive advantage'
  ],

  video: [
    'فيديو', 'فيديوهات', 'تصوير', 'اصور', 'مصور', 'مونتاج', 'موشن', 'ريلز',
    'تيك توك', 'تيكتوك', 'انتاج', 'تصوير منتجات', 'تصوير اعلانات', 'محتاج فيديو',
    'عايز فيديو', 'اصور فيديو', 'تصوير احترافي', 'video', 'production', 'shoot',
    'film', 'motion', 'reels', 'shorts', 'كاميرا', 'جلسه تصوير'
  ],

  social_media: [
    'سوشيال', 'سوشيال ميديا', 'انستجرام', 'انستا', 'فيسبوك', 'فيس', 'تويتر',
    'سناب', 'لينكد ان', 'اداره صفحات', 'اداره حسابات', 'بتديروا انستجرام',
    'بتديروا فيسبوك', 'عايز حد يدير صفحتي', 'محتاج محتوى', 'عايز بوستات', 'كونتنت',
    'محتوى', 'محتوي', 'محتاج محتوى', 'عايز محتوى', 'تفاعل', 'فولوورز', 'followers', 'social media', 'instagram',
    'facebook', 'content', 'منشورات', 'سوشيال ميديا ماركتنج'
  ],

  media_buying: [
    'اعلانات', 'اعلان', 'مموله', 'ميديا باينج', 'ميديا باي', 'حملات', 'حمله',
    'كامبين', 'campaign', 'جوجل ادز', 'google ads', 'فيسبوك ادز', 'facebook ads',
    'تيك توك ادز', 'tiktok ads', 'عايز اعلانات', 'محتاج اعلانات', 'حمله اعلانيه',
    'ads', 'media buying', 'paid ads', 'تسويق مدفوع', 'سناب ادز', 'snapchat ads',
    'اعلانات جوجل', 'اداره حملات'
  ],

  branding: [
    'هويه', 'هويه بصريه', 'براند', 'براندنج', 'لوجو', 'شعار', 'تصميم لوجو',
    'هويه الشركه', 'تصميم هويه', 'عايز لوجو', 'محتاج لوجو', 'تصميم براند',
    'branding', 'brand', 'logo', 'identity', 'visual identity', 'brand guidelines',
    'براند بوك', 'دليل الهويه'
  ],

  strategy: [
    'استراتيجيه', 'خطه تسويقيه', 'ماركتنج', 'استراتيجيه تسويقيه', 'عايز خطه',
    'محتاج خطه', 'خطه عمل', 'خطط تسويقيه', 'strategy', 'marketing strategy',
    'دراسه سوق', 'تحليل سوق', 'بحث سوق', 'market research', 'خطه نمو'
  ],

  portfolio: [
    'اعمال', 'شغل', 'شغلكم', 'سابقه', 'بورتفوليو', 'portfolio', 'عملاء',
    'clients', 'case studies', 'امثله', 'نماذج', 'samples', 'work', 'اعمالكم',
    'فين شغلكم', 'فين اعمالكم', 'وروني شغلكم', 'عايز اشوف شغلكم', 'ممكن اشوف',
    'ابعتلي امثله', 'projects', 'مشاريع', 'مشاريعكم'
  ],

  team: [
    'فريق', 'فريقكم', 'مين الفريق', 'عدد الفريق', 'خبراء', 'متخصصين', 'specialists',
    'experts', 'مين شغال معاكم', 'الفريق بتاعكم', 'team', 'who is in the team'
  ],

  location: [
    'عنوان', 'عنوانكم', 'فين مقركم', 'مقر', 'مكتب', 'لوكيشن', 'موقعكم',
    'فين مكانكم', 'فين', 'وين', 'location', 'where are you', 'address', 'office', 'cairo'
  ],

  about: [
    'مين انتوا', 'عن الشركه', 'عنكم', 'معلومات عنكم', 'عايز اعرف عنكم',
    'متى تأسستوا', 'بقالكم قد ايه', 'خبرتكم', 'خبره', 'experience', 'who are you',
    'about us', 'about you', 'تاريخ الشركه'
  ],

  services: [
    'خدمات', 'خدمه', 'بتعملوا ايه', 'بتقدموا ايه', 'تسوون', 'وش تسوون', 'بتسووا', 'ايه شغلكم', 'شغلكم ايه',
    'مجالاتكم', 'نشاطكم', 'تخصصكم', 'services', 'offer', 'provide', 'what do you do',
    'what do you offer', 'help with', 'بتساعدوا في'
  ],

  contact: [
    'تواصل', 'اتصال', 'رقم', 'واتساب', 'whatsapp', 'ايميل', 'بريد', 'contact',
    'phone', 'email', 'reach', 'call', 'رقمكم', 'رقم الموبايل', 'رقم الهاتف',
    'رقم الواتساب', 'ازاي اتواصل', 'عايز اتواصل', 'ابعتلي رقم'
  ],

  thanks: [
    'شكرا', 'متشكر', 'مشكور', 'تسلم', 'thanks', 'thank you', 'شكرا ليك',
    'الله يعطيك العافيه', 'يعطيك العافيه', 'مشكورين', 'جزاك الله خير',
    'الله يبارك', 'تمام كده', 'ماشي', 'اوك', 'ok', 'perfect', 'great'
  ]
};

// Priority ordering: more specific intents must be checked before broader ones
const TOPIC_PRIORITY = [
  'objection',
  'buying_intent',
  'comparison',
  'process',
  'video',
  'branding',
  'media_buying',
  'social_media',
  'strategy',
  'pricing',
  'portfolio',
  'team',
  'location',
  'about',
  'contact',
  'services',
  'thanks',
  'greeting'
];

// Short follow-up expressions
const FOLLOWUP_PATTERNS = [
  /^(وكمان|طب|و ايه|وايه|ازاي|ايه|اية|وإيه كمان|more|and\??|what about|tell me more|go on|continue)[\?!؟]*$/i,
  /^(تمام|ماشي|اوك|حلو|ok|okay|got it|cool|nice|good)[\?!؟]*$/i,
  /^(كمان|زياده|تفاصيل|اكتر|more details|details|expand)[\?!؟]*$/i,
  /^(فين|وين|where)[\?!؟]*$/i,
  /^(بكام|كم|how much)[\?!؟]*$/i
];

function detectLang(msg) {
  return /[\u0600-\u06FF]/.test(msg) ? 'ar' : 'en';
}

function detectTopic(normalizedMsg) {
  for (const topic of TOPIC_PRIORITY) {
    const keywords = KEYWORD_MAP[topic] || [];
    for (const kw of keywords) {
      const cleanKw = kw.toLowerCase().trim();
      if (normalizedMsg.includes(cleanKw)) {
        return topic;
      }
    }
  }
  return null;
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

function pickFallback(lang, lastAssistantMsg) {
  const variants = FALLBACKS[lang] || FALLBACKS.ar;
  const filtered = variants.filter(v => v !== lastAssistantMsg);
  const pool = filtered.length > 0 ? filtered : variants;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 5. Main Request Handler ──────────────────────────────────────────────────

// ── Service Links Extension for Responses ───────────────────────────────────
const serviceLinks = {
  pricing: {
    ar: 'خدماتنا اللي بتغطي الميزانيات المختلفة: إدارة السوشيال ميديا، الإعلانات الممولة، الإنتاج المرئي، الهوية البصرية، والاستراتيجيات التسويقية. تحب نبدأ بأي واحدة؟',
    en: 'Our services that fit different budgets: Social Media Management, Paid Ads, Video Production, Branding, and Marketing Strategy. Which one would you like to start with?'
  },
  portfolio: {
    ar: 'تقدر تشوف نماذج من شغلنا في: إدارة السوشيال ميديا، الميديا باينج، إنتاج الفيديوهات، والبراندنج. أي خدمة تحب تشوف أعمالها؟',
    en: 'You can see samples of our work in: Social Media, Media Buying, Video Production, and Branding. Which service would you like to explore?'
  },
  process: {
    ar: 'خطواتنا بتنقسم على حسب الخدمة: لو سوشيال ميديا، بنبدأ بالاستراتيجية والمحتوى. لو إعلانات، بنبدأ بتحليل الجمهور والميزانية. لو إنتاج، بنبدأ بالسيناريو والتصوير. أي خدمة مهتم بيها؟',
    en: 'Our process depends on the service: Social Media starts with strategy and content. Ads start with audience and budget analysis. Production starts with scripting and filming. Which service interests you?'
  },
  team: {
    ar: 'فريقنا متخصص في: إدارة الحسابات، الميديا باينج، إنتاج المحتوى، التصميم، والتصوير. كل خدمة ليها فريق متخصص. تحب تعرف تفاصيل أي خدمة؟',
    en: 'Our team specializes in: Account Management, Media Buying, Content Creation, Design, and Photography. Each service has its own dedicated team. Want details on any service?'
  },
  comparison: {
    ar: 'اللي بيميزنا في كل خدمة:\n• سوشيال ميديا: محتوى إبداعي + تحليل أداء\n• ميديا باينج: نتايج بالأرقام وROAS واضح\n• إنتاج: جودة سينمائية\n• براندنج: هوية بتعيش\nأي خدمة تحب نتكلم عنها؟',
    en: 'What sets us apart per service:\n• Social Media: Creative content + performance analysis\n• Media Buying: Clear ROAS and numbers\n• Production: Cinematic quality\n• Branding: A lasting identity\nWhich service would you like to discuss?'
  },
  about: {
    ar: 'إحنا وكالة تسويق متكاملة بنقدم 5 خدمات أساسية: السوشيال ميديا، الإعلانات الممولة، الإنتاج المرئي، الهوية البصرية، والاستراتيجية. بنشتغل مع عملاء في مصر والخليج. أي خدمة تحب نعرفك عليها؟',
    en: 'We are a full-service marketing agency offering 5 core services: Social Media, Paid Ads, Video Production, Branding, and Strategy. We work with clients across Egypt and the Gulf. Which service would you like to know more about?'
  }
};

const generalFallback = {
  ar: 'أهلاً! إحنا PR Agency، وكالة تسويق متكاملة بنقدم:\n• إدارة السوشيال ميديا\n• الإعلانات الممولة\n• الإنتاج المرئي\n• الهوية البصرية\n• الاستراتيجيات التسويقية\n\nإيه الخدمة اللي تحب تعرف عنها أكتر؟',
  en: 'Hi! We are PR Agency, a full-service marketing agency offering:\n• Social Media Management\n• Paid Ads\n• Video Production\n• Branding\n• Marketing Strategy\n\nWhich service would you like to know more about?'
};

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

    // ── Log Session & Message in D1 ──
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

    // ── Attempt Workers AI if available ──
    let aiResponse = '';
    let aiModelUsed = null;

    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            {
              role: 'system',
              content: 'You are the smart AI Growth Assistant for PR Agency (pragency.pages.dev), a leading full-service marketing agency based in Cairo, Egypt. Speak fluently in professional Arabic or English. Be solution-oriented, concise, and helpful.'
            },
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

    // ── Smart Engine v3 Rule Matching ──
    if (!aiResponse) {
      const lang = detectLang(message);
      const normalized = normalizeDialect(message);

      // Fetch conversation history from D1
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

      const lastAssistantMsg = [...conversationHistory].reverse().find(m => m.role === 'assistant')?.content || '';
      const previousUserMsgs = conversationHistory.filter(m => m.role === 'user');
      // Previous user message before current one
      const lastUserMsg = previousUserMsgs.length > 1 ? previousUserMsgs[previousUserMsgs.length - 2]?.content : '';

      const isFollowUp = FOLLOWUP_PATTERNS.some(p => p.test(message.trim()));
      let topic = null;

      if (isFollowUp && lastUserMsg) {
        const prevNormalized = normalizeDialect(lastUserMsg);
        topic = detectTopic(prevNormalized);
      }

      if (!topic) {
        topic = detectTopic(normalized);
      }
      if (!topic && isFollowUp) {
        topic = 'services';
      }

      if (topic) {
        aiResponse = pickResponse(topic, lang, lastAssistantMsg);
        if (serviceLinks[topic] && !aiResponse.includes('خدماتنا') && !aiResponse.includes('services')) {
          const serviceLink = serviceLinks[topic][lang] || serviceLinks[topic].ar;
          aiResponse = aiResponse + '\n\n' + serviceLink;
        }
      }

      if (!aiResponse) {
        aiResponse = generalFallback[lang] || generalFallback.ar;
      }
    }

    // ── Save Assistant Response in D1 ──
    if (db) {
      try {
        const replyTime = new Date().toISOString();
        await db.prepare(`
          INSERT INTO chat_messages (session_id, role, content, timestamp)
          VALUES (?, 'assistant', ?, ?)
        `).bind(sessionId, aiResponse, replyTime).run();
      } catch (saveErr) {
        console.warn('[Chat] Error saving assistant reply:', saveErr.message);
      }
    }

    return new Response(JSON.stringify({
      reply: aiResponse,
      sessionId,
      aiModel: aiModelUsed,
      aiStatus: aiModelUsed ? 'workers_ai' : 'smart_engine_v3'
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
