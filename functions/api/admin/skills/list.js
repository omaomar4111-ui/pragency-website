// functions/api/admin/skills/list.js
// Returns the complete active catalog of all 77 installed marketing, sales, YouTube, and strategic agent skills

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestGet(context) {
  const skills = [
    // --- 1. SALES & REVENUE OPERATIONS (12) ---
    { id: 'sales-enablement', name: 'Sales Enablement', category: 'Sales', description: 'سيناريوهات إغلاق الصفقات، معالجة اعتراضات العملاء، ودليل العروض البيعية', workflow: 'CRM Leads / Outreach', active: true },
    { id: 'cold-email', name: 'Cold Email & WhatsApp', category: 'Sales', description: 'صياغة رسائل التواصل الأولي ومسودات الأوتريتش المباشرة بأعلى نسبة فتح', workflow: 'CRM Leads / Auto-Outreach', active: true },
    { id: 'prospecting', name: 'Prospecting & ICP', category: 'Sales', description: 'استكشاف العملاء المحتملين وتحديد مواصفات العميل المثالي بدقة', workflow: 'CRM Leads / Research', active: true },
    { id: 'offers', name: 'High-Ticket Offers', category: 'Sales', description: 'هندسة العروض التي لا تُقاوم (Grand Slam Offers) وتجميع الباقات الاستشارية', workflow: 'Pitch Decks / Proposals', active: true },
    { id: 'pricing', name: 'Pricing Architecture', category: 'Sales', description: 'استراتيجيات التسعير والهيكلة المالية للعقود والريتينرز لتعظيم الربحية', workflow: 'Pitch Decks / Invoicing', active: true },
    { id: 'revops', name: 'Revenue Operations', category: 'Sales', description: 'حوكمة مسار الإيرادات وتوزيع الليدز ومتابعة كفاءة فريق المبيعات', workflow: 'CRM Automation', active: true },
    { id: 'lead-magnets', name: 'Lead Magnets Engine', category: 'Sales', description: 'صناعة أدلة مجانية وكتب رقمية جاذبة لتحويل الزوار إلى ليدز مؤهلين', workflow: 'Lead Gen Campaigns', active: true },
    { id: 'referrals', name: 'Referral Engineering', category: 'Sales', description: 'أنظمة ومحفزات إحالة العملاء لخفض تكلفة الاكتساب إلى الصفر', workflow: 'Client Retention', active: true },
    { id: 'churn-prevention', name: 'Churn Prevention', category: 'Sales', description: 'مؤشرات الإنذار المبكر لمنع إلغاء العقود وحماية الـ Monthly Retainer', workflow: 'Client Success', active: true },
    { id: 'onboarding', name: 'Client Onboarding', category: 'Sales', description: 'تسريع تدشين العملاء الجدد في أول 48 ساعة لترسيخ الثقة المبكرة', workflow: 'Client Portal', active: true },
    { id: 'paywalls', name: 'Paywalls & Gateways', category: 'Sales', description: 'نقاط الدفع وتسهيل التحصيل الفوري', workflow: 'Invoicing & Payments', active: true },
    { id: 'sms', name: 'SMS & Instant Pings', category: 'Sales', description: 'رسائل التنبيه العاجلة والرسائل القصيرة ذات معدل القراءة 98%', workflow: 'Automated Reminders', active: true },

    // --- 2. CREATIVE, ADS & COPYWRITING (20) ---
    { id: 'ad-creative', name: 'Ad Creative Engine', category: 'Creative', description: 'توليد أفكار إعلانية إبداعية وزوايا تسويقية وHooks غير تقليدية', workflow: 'Tasks / Creative Brief', active: true },
    { id: 'copywriting', name: 'Copywriting Mastery', category: 'Creative', description: 'كتابة نصوص إعلانات وفيسبوك وانستجرام وصفحات هبوط عالية التحويل', workflow: 'Tasks / Copywriter', active: true },
    { id: 'copy-editing', name: 'Copy Editing & Polish', category: 'Creative', description: 'تنقيح النصوص، شحذ الكلمات، والتخلص من الحشو اللغوي', workflow: 'Quality Check', active: true },
    { id: 'cro', name: 'Conversion Rate Optimization', category: 'Creative', description: 'تحسين معدلات التحويل لصفحات الهبوط وإزالة نقاط الاحتكاك', workflow: 'Strategy / Landing Pages', active: true },
    { id: 'marketing-ideas', name: '140+ Marketing Ideas', category: 'Creative', description: 'بنك أفكار نمو تسويقية مبتكرة لشركات الخدمات والمتاجر الإلكترونية', workflow: 'Strategy / Creative Brainstorm', active: true },
    { id: 'marketing-loops', name: 'Growth Loops', category: 'Creative', description: 'تصميم دورات النمو التلقائية التي تغذي نفسها بنفسها دون حرق ميزانيات', workflow: 'Long-term Strategy', active: true },
    { id: 'marketing-psychology', name: 'Consumer Psychology', category: 'Creative', description: 'تطبيق مبادئ علم النفس السلوكي (الندرة، الإثبات الاجتماعي، الانحيازات)', workflow: 'Ad Angles & Offers', active: true },
    { id: 'content-strategy', name: 'Omnichannel Content', category: 'Creative', description: 'تخطيط وتوزيع المحتوى عبر مختلف المنصات لتحقيق أعلى انتشار وتفاعل', workflow: 'Client Editorial Calendar', active: true },
    { id: 'social', name: 'Social Media Dynamics', category: 'Creative', description: 'استراتيجيات التفاعل وبناء المجتمعات الرقمية النشطة على إنستجرام ولينكدإن', workflow: 'Social Media Retainers', active: true },
    { id: 'ads', name: 'Paid Ads Architecture', category: 'Creative', description: 'هندسة الحملات الممولة على Meta و Google و TikTok بأعلى عائد ROAS', workflow: 'Media Buying Dashboard', active: true },
    { id: 'ab-testing', name: 'A/B Testing Framework', category: 'Creative', description: 'بروتوكول اختبار العناوين والتصميمات وعزل المتغيرات العلمية', workflow: 'Ad Experiments', active: true },
    { id: 'popups', name: 'Exit-Intent Popups', category: 'Creative', description: 'نوافذ اقتناص الزوار قبل مغادرة الموقع لرفع التحويل بنسبة +12%', workflow: 'Website Optimization', active: true },
    { id: 'emails', name: 'Email Sequences', category: 'Creative', description: 'سلاسل البريد الإلكتروني التلقائية للترحيب والتنشيط والبيع', workflow: 'Email Marketing', active: true },
    { id: 'brandkit', name: 'Brand Identity Kit', category: 'Creative', description: 'حفظ وتوحيد الخطوط والألوان ونبرة صوت الهوية البصرية للعلامات', workflow: 'Design System', active: true },
    { id: 'events', name: 'Event & Webinar Funnels', category: 'Creative', description: 'تسويق الويبنارات والفعاليات الحية لجذب العملاء الكبار', workflow: 'High-Ticket Funnels', active: true },
    { id: 'influencer-marketing', name: 'Influencer Collabs', category: 'Creative', description: 'إدارة واختيار المؤثرين وصياغة عقود المحتوى الترويجي الموجه', workflow: 'Influencer Campaigns', active: true },
    { id: 'community-marketing', name: 'Community Cultivation', category: 'Creative', description: 'بناء مجتمعات خاصة للعملاء وتحويل المتابعين إلى سفراء للبراند', workflow: 'Brand Loyalty', active: true },
    { id: 'co-marketing', name: 'Strategic Partnerships', category: 'Creative', description: 'الشراكات التسويقية التبادلية بين الشركات للوصول لجمهور مضاعف', workflow: 'Brand Alliances', active: true },
    { id: 'launch', name: 'Product Launch Runway', category: 'Creative', description: 'خطة إطلاق المنتجات والخدمات الجديدة على 3 مراحل (تشويق، إطلاق، متابعة)', workflow: 'Product Launches', active: true },
    { id: 'public-relations', name: 'PR & Press Release', category: 'Creative', description: 'صياغة البيانات الصحفية وبناء العلاقات مع المواقع الإخبارية', workflow: 'Brand Authority', active: true },

    // --- 3. YOUTUBE AGENT SKILLS (11) ---
    { id: 'yt-script', name: 'YouTube Script (21 Hooks)', category: 'YouTube', description: 'كتابة سكريبتات يوتيوب سينمائية مبنية على 21 تركيبة هوك عالمية', workflow: 'Video Tasks / Production', active: true },
    { id: 'yt-package', name: 'Packaging (Title + Thumb)', category: 'YouTube', description: 'تكامل العنوان المثير مع الغلاف البصري لتحقيق CTR أعلى من 10%', workflow: 'Video Thumbnail Brief', active: true },
    { id: 'yt-retention', name: 'Retention Curve Defense', category: 'YouTube', description: 'هندسة لحظات التشويق كل 30 ثانية لمنع انحدار المشاهدات', workflow: 'Video Editing Guidelines', active: true },
    { id: 'yt-shorts', name: 'Viral Shorts Extractor', category: 'YouTube', description: 'استخراج أقوى اللحظات الفيروسية وتحويلها إلى ريلز وشورتس', workflow: 'Short-Form Video', active: true },
    { id: 'yt-viral', name: 'Outlier & Viral Analyzer', category: 'YouTube', description: 'تحليل الفيديوهات الخارقة في مجالك واستنساخ أسباب نجاحها', workflow: 'Competitor Video Research', active: true },
    { id: 'yt-seo', name: 'YouTube Search Optimization', category: 'YouTube', description: 'هيكلة الوصف والكلمات الدلالية لتصدر نتائج البحث واقتراحات يوتيوب', workflow: 'Video Publishing', active: true },
    { id: 'yt-plan', name: 'Channel Blueprint & Series', category: 'YouTube', description: 'بناء خطة القناة وسلاسل الحلقات المتصلة لزيادة ساعات المشاهدة', workflow: 'YouTube Strategy', active: true },
    { id: 'yt-audit', name: 'Channel Health Audit', category: 'YouTube', description: 'فحص شامل لمقاييس القناة وتحديد الفيديوهات الميتة والفرص الضائعة', workflow: 'Channel Audit Reports', active: true },
    { id: 'yt-chapters', name: 'Smart Timestamps', category: 'YouTube', description: 'توليد فصول الفيديو والـ Chapters لتحسين تجربة المستخدم ومحركات البحث', workflow: 'Video Post-Production', active: true },
    { id: 'yt-comment', name: 'Community Pinned Comments', category: 'YouTube', description: 'صياغة التعليق المثبت التفاعلي واستطلاعات الرأي لجلب ليدز', workflow: 'Community Engagement', active: true },
    { id: 'yt-edit', name: 'Pacing & B-Roll Director', category: 'YouTube', description: 'توجيه المونتير لتوزيع الـ B-Roll والمؤثرات الصوتية والقطع السريع', workflow: 'Video Editor Hand-off', active: true },

    // --- 4. STRATEGIC DECISION, ARENA & RESEARCH (16) ---
    { id: 'arena', name: 'Skill Arena (Tournament Engine)', category: 'Quality & Decision', description: 'حلبة التحكيم التنافسية بين الوكلاء لغربلة الأفكار واختيار الفائز', workflow: 'All AI Endpoints / Quality Guard', active: true },
    { id: 'chief-of-staff', name: 'Chief of Staff Advisory', category: 'Quality & Decision', description: 'المستشار التنفيذي لتحديد الأولويات، حسم القرارات، وإدارة الوقت', workflow: 'Executive Management', active: true },
    { id: 'grill-me', name: 'Grill Me (Plan Stress-Tester)', category: 'Quality & Decision', description: 'اختبار صلابة الخطط ومحاكاة أسئلة المستثمرين والعملاء الصعبة', workflow: 'Proposal Defense', active: true },
    { id: 'marketing-plan', name: 'Full Marketing Plan', category: 'Quality & Decision', description: 'صياغة الخطة التسويقية السنوية والربع سنوية بأرقام وميزانيات واقعية', workflow: 'Client Strategy', active: true },
    { id: 'marketing-council', name: 'Marketing Council (Multi-Agent)', category: 'Quality & Decision', description: 'مجلس استشاري افتراضي يضم خبراء في النمو والبراندينج والأداء', workflow: 'Complex Strategic Reviews', active: true },
    { id: 'customer-research', name: 'Customer Voice Mining', category: 'Quality & Decision', description: 'استخراج لغة العميل الحقيقية من المراجعات واستطلاعات الرأي', workflow: 'Copywriting Grounding', active: true },
    { id: 'competitors', name: 'Competitor Intelligence', category: 'Quality & Decision', description: 'رصد إعلانات واستراتيجيات المنافسين وتحليل نقاط الضعف لديهم', workflow: 'Market Analysis', active: true },
    { id: 'competitor-profiling', name: 'Deep Competitor Profiling', category: 'Quality & Decision', description: 'ملفات تفصيلية عن حركة مرور مواقع المنافسين ومصادر زياراتهم', workflow: 'Benchmarking', active: true },
    { id: 'product-marketing', name: 'Product Positioning', category: 'Quality & Decision', description: 'تحديد موقع المنتج التنافسي وصياغة سردية القيمة (Narrative)', workflow: 'Product Go-to-Market', active: true },
    { id: 'analytics', name: 'Data & Tracking Insights', category: 'Quality & Decision', description: 'قراءة تقارير GA4 وتحديد مصادر الزيارات الأكثر ربحية', workflow: 'Performance Dashboards', active: true },
    { id: 'attribution', name: 'Multi-Touch Attribution', category: 'Quality & Decision', description: 'تحديد القناة الإعلانية المسؤولة فعلياً عن المبيعات (First/Last Click)', workflow: 'Budget Allocation', active: true },
    { id: 'conversion-tracking', name: 'CAPI & Pixel Setup', category: 'Quality & Decision', description: 'إعداد الـ Conversions API لفيسبوك وجوجل لضمان دقة البيانات', workflow: 'Technical Setup', active: true },
    { id: 'free-tools', name: 'Free Tool Lead Magnets', category: 'Quality & Decision', description: 'بناء حاسبات أو أدوات مجانية تستقطب آلاف الزيارات المؤهلة أسبوعياً', workflow: 'Organic Lead Gen', active: true },
    { id: 'quinary-inference', name: 'Quinary Decision Framework', category: 'Quality & Decision', description: 'مصفوفة اتخاذ القرارات خماسية الأبعاد لتقليل المخاطر التشغيلية', workflow: 'Risk Management', active: true },
    { id: 'experimental-design', name: 'Growth Experiments', category: 'Quality & Decision', description: 'صياغة فرضيات النمو واختبارها بأسلوب الـ Lean Startup', workflow: 'Growth Sprints', active: true },
    { id: 'full-output-enforcement', name: 'Zero-Truncation Engine', category: 'Quality & Decision', description: 'بروتوكول ضمان اكتمال المخرجات بنسبة 100% دون بتر أو توقف', workflow: 'AI Response Engine', active: true },

    // --- 5. SEO, TECH & DESIGN SYSTEMS (18) ---
    { id: 'ai-seo', name: 'AI & Semantic SEO', category: 'SEO & Technical', description: 'بناء استراتيجية الكيوردز الدلالية ومجموعات المواضيع (Topic Clusters)', workflow: 'SEO Campaigns', active: true },
    { id: 'programmatic-seo', name: 'Programmatic SEO', category: 'SEO & Technical', description: 'إنتاج آلاف الصفحات المستهدفة برمجياً لاقتناص الكلمات طويلة الذيل', workflow: 'Scale SEO', active: true },
    { id: 'seo-audit', name: 'Technical SEO Audit', category: 'SEO & Technical', description: 'فحص مشاكل الأرشفة والسرعة وCore Web Vitals لصفحات الموقع', workflow: 'Website Audits', active: true },
    { id: 'link-building', name: 'Digital PR & Backlinks', category: 'SEO & Technical', description: 'استراتيجيات بناء الروابط الخلفية القوية لرفع تصنيف النطاق (DR)', workflow: 'Domain Authority', active: true },
    { id: 'schema', name: 'Schema Markup Architecture', category: 'SEO & Technical', description: 'إضافة الـ Structured Data للحصول على مقتطفات جوجل المميزة (Rich Snippets)', workflow: 'Technical SEO', active: true },
    { id: 'site-architecture', name: 'Silo Site Architecture', category: 'SEO & Technical', description: 'هندسة بنية الروابط الداخلية وتنظيم تدفق قوة الدومين (PageRank)', workflow: 'Site Structure', active: true },
    { id: 'aso', name: 'App Store Optimization', category: 'SEO & Technical', description: 'تصدر نتائج متجر تطبيقات جوجل وآبل وزيادة التنزيلات العضوية', workflow: 'Mobile App Marketing', active: true },
    { id: 'directory-submissions', name: 'High-Impact Directories', category: 'SEO & Technical', description: 'تسجيل الموقع في الأدلة العالمية والمحلية المعتمدة لتعزيز السيو', workflow: 'Local SEO', active: true },
    { id: 'high-end-visual-design', name: 'High-End Luxury Design', category: 'SEO & Technical', description: 'معايير التصميم الفاخر (Typography, Spacing, Contrast) للمواقع والبراندات', workflow: 'UI/UX Design', active: true },
    { id: 'minimalist-ui', name: 'Minimalist Linear UI', category: 'SEO & Technical', description: 'واجهات أنيقة وعصرية بنمط Linear.app و Vercel فائقة السرعة', workflow: 'Frontend UI', active: true },
    { id: 'industrial-brutalist-ui', name: 'Modern Neo-Brutalist', category: 'SEO & Technical', description: 'أنماط التصميم الجريئة والمبتكرة للبراندات العصرية والتقنية', workflow: 'Frontend UI', active: true },
    { id: 'design-taste-frontend', name: 'Frontend Taste Engine', category: 'SEO & Technical', description: 'معايير الذوق الرفيع في اختيار الخطوط والأنيميشن التفاعلي', workflow: 'Web Development', active: true },
    { id: 'image-to-code', name: 'Image to Clean Code', category: 'SEO & Technical', description: 'تحويل لقطات الشاشة والتصميمات إلى كود HTML/CSS/JS متجاوب وفوري', workflow: 'Rapid Prototyping', active: true },
    { id: 'imagegen-frontend-web', name: 'Web Image Assets', category: 'SEO & Technical', description: 'توليد أصول صور متوافقة بدقة مع مقاسات الهيرو كاردز وخلفيات الويب', workflow: 'Asset Generation', active: true },
    { id: 'imagegen-frontend-mobile', name: 'Mobile Asset Optimizer', category: 'SEO & Technical', description: 'توليد صور وواجهات مخصصة لشاشات الهواتف مع شاشات ريتنا', workflow: 'Mobile Assets', active: true },
    { id: 'stitch-design-taste', name: 'Component Cohesion', category: 'SEO & Technical', description: 'توحيد تباين العناصر والهوامش بين كل شاشات النظام', workflow: 'UI Cohesion', active: true },
    { id: 'anatomy', name: 'Anatomy 3D & Technical Schemas', category: 'SEO & Technical', description: 'رسومات هندسية وتشريحية متقدمة ثلاثية الأبعاد بـ SVG و WebGL', workflow: 'Interactive Visuals', active: true },
    { id: 'signup', name: 'Frictionless Signup Funnels', category: 'SEO & Technical', description: 'تقليل خطوات التسجيل وتحقيق أعلى معدل إكمال استمارات', workflow: 'Registration Flow', active: true }
  ];

  return jsonResponse({
    success: true,
    total_skills: skills.length, // Exact 77
    active_skills: skills.length,
    badge_label: 'المهارات النشطة: ' + skills.length,
    categories: [
      { id: 'all', name: 'كل المهارات (77)', count: skills.length },
      { id: 'Sales', name: 'المبيعات والأوتريتش (12)', count: skills.filter(s => s.category === 'Sales').length },
      { id: 'Creative', name: 'الإبداع والمحتوى والإعلانات (20)', count: skills.filter(s => s.category === 'Creative').length },
      { id: 'YouTube', name: 'يوتيوب والفيديو (11)', count: skills.filter(s => s.category === 'YouTube').length },
      { id: 'Quality & Decision', name: 'القرارات الاستراتيجية والأرينا (16)', count: skills.filter(s => s.category === 'Quality & Decision').length },
      { id: 'SEO & Technical', name: 'السيو والأنظمة التقنية (18)', count: skills.filter(s => s.category === 'SEO & Technical').length }
    ],
    skills
  });
}
