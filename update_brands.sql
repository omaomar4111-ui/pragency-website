-- 1. Bliltna (F&B)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا + إعلانات ممولة', 
  service_en = 'Social Media Management + Ads', 
  story_ar = 'كانوا خايفين إن التوصيل ياخد شغلهم اللي في الفرع، وإن المنافسين بيسحبوا العملاء بأسعار أرخص. عشان كده ركزنا على بناء هوية قوية على السوشيال ميديا، وبدل ما ننزل أسعار، عملنا محتوى بيركز على "الجودة والطعم الأصلي". الإعلانات الممولة كانت موجهة بدقة للمناطق اللي فيها زحمة مرورية عشان نجيب أوردرات دليفري وقت الذروة.',
  story_en = 'They feared delivery apps would cannibalize their walk-in traffic, and competitors were undercutting them. We built a strong social identity focusing on "authentic taste and quality" instead of price wars. Ads were geo-targeted to high-traffic areas during peak hours to drive delivery orders.',
  is_published = 0
WHERE slug = 'bliltna';

-- 2. Home IX (Furniture/Interior)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'العقبة الأساسية كانت إن قطع الأثاث غالية، ومحدش بيشتري حاجة بـ 50 ألف جنيه من إعلان على فيسبوك بسهولة. العميل كان خايف يحرق ميزانية الإعلانات على ناس مش جادة. حليت المشكلة دي بإننا غيرنا الهدف من "البيع المباشر" لـ "جلب Leads مهتمة"، وعملنا إعلانات بتعرض قبل وبعد (Before/After) لشغلهم، مع فورم تفاعلي بيسأل عن المساحة والميزانية قبل ما يتواصلوا.',
  story_en = 'High-ticket furniture is rarely an impulse buy from a Facebook ad. The client feared burning ad spend on unqualified leads. We shifted from direct sales to a high-ticket lead generation funnel using Before/After visuals and an interactive form that qualified buyers by space and budget.',
  is_published = 0
WHERE slug = 'home-ix';

-- 3. Kangaroo (Kids/Education)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'كانوا فاكرين إن عشان نبيع منتجات أطفال، لازم ننزل صور وخلاص. الخوف كان إن الصفحة تبقى "سوق عربي" وميفضلش حد يتابعها. قررنا نبني كوميونيتي حقيقي، فبدأنا نعمل محتوى توعوي للأمهات عن تربية الأطفال وتنمية مهاراتهم، ولما بقى عندنا جمهور بيثق فينا، بدأنا نقدم المنتجات كـ "حلول" لمشاكلهم. التفاعل زاد 3 أضعاف.',
  story_en = 'They thought selling kids products meant just posting pictures. The fear was becoming a "bazaar page" with zero organic reach. We built a community by sharing parenting tips and child development advice. Once trust was established, we positioned products as solutions, boosting engagement by 300%.',
  is_published = 0
WHERE slug = 'kangaroo';

-- 4. Dar (Real Estate)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا + إعلانات ممولة', 
  service_en = 'Social Media Management + Ads', 
  story_ar = 'العميل كان خايف من التكلفة العالية للإعلانات العقارية (CPC عالي جداً). بدل ما ندخل ننافس الشركات الكبيرة بكلمات مكلفة، عملنا حملات "Retargeting" ذكية على الناس اللي دخلت الموقع أو شافت الفيديوهات. وركزنا على السوشيال ميديا في عرض الـ 3D Virtual Tours عشان العميل يحس إنه جوه الكومباوند قبل ما يزوره.',
  story_en = 'The client was terrified of the high CPC in real estate. Instead of competing on expensive broad keywords, we built a smart retargeting funnel. We used social media to showcase immersive 3D virtual tours, allowing buyers to experience the compound online before booking a physical visit.',
  is_published = 0
WHERE slug = 'dar';

-- 5. NH Clinics (Healthcare)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'المجال الطبي حساس جداً. كانوا خايفين إن أي محتوى يبان "إعلاني" يقلل من مصداقية العيادة، أو إننا منعرفش نتكلم بلغة طبية صح. عشان كده اشتغلنا على محتوى "توعوي بحت" (Educational Content). دكاترة العيادة بنفسهم كانوا بيطلعوا في فيديوهات قصيرة يشرحوا حالات وأعراض، وده بنى ثقة رهيبة جابتلهم حجوزات من غير ما يبانوا إنهم بيبيعوا.',
  story_en = 'Healthcare marketing is a delicate balance. They feared looking "salesy" and losing credibility. We pivoted to purely educational content. The doctors themselves appeared in short reels explaining symptoms and treatments, building immense trust that translated into organic bookings without aggressive selling.',
  is_published = 0
WHERE slug = 'nh-clinics';

-- 6. Unit X (Tech/Wearables)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'المنتج بتاعهم تكنولوجي ومحتاج شرح. العميل كان قلقان إن الناس مش هتفهم فايدة المنتج من فيديو 15 ثانية، وإن نسبة الـ Return هتبقى عالية. عملنا إعلانات فيديو بتعرض "المشكلة والحل" بشكل سريع جداً، واستخدمنا الـ User-Generated Content (ناس حقيقية بتستخدمه). ده قلل نسبة المرتجعات وطلع ROAS عالي جداً.',
  story_en = 'Their tech product required education. The client feared people wouldn\'t get it from a 15-second ad, leading to high return rates. We used fast-paced Problem/Solution video ads combined with UGC (User Generated Content) to show real people using it. This crushed return rates and maximized ROAS.',
  is_published = 0
WHERE slug = 'unit-x';

-- 7. Mountain View (Real Estate)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا + إعلانات ممولة', 
  service_en = 'Social Media Management + Ads', 
  story_ar = 'مع كبار المطورين، ميزانيتنا الإعلانية كانت بتتبص ليها إنها "أقل". الخوف كان إننا نضيع في الزحمة. الحل كان في الاستهداف الفائق (Hyper-targeting). عملنا كامبينز مخصصة جداً لناس بتدور على "كمبوند هادي" و"تشطيبات معينة"، وعملنا محتوى سوشيال ميديا بيركز على "اللايف ستايل" جوه الكومباوند مش بس المباني. جبنا مبيعات بقت أفضل من كامبينات شركات تانية ميزانيتها أكبر.',
  story_en = 'Competing with real estate giants meant our budget could easily get lost. We bypassed the noise with hyper-targeted ad campaigns for buyers looking specifically for "quiet compounds" and "specific finishes." Our social media content sold the "lifestyle," not just the buildings, proving that precision beats massive budgets.',
  is_published = 0
WHERE slug = 'mountain-view';

-- 8. Merath (Luxury/Jewelry)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'الماركات الفاخرة صعب تسويقها بالطرق العادية. كانوا خايفين إن المحتوى التافه يقلل من قيمة البراند. ركزنا على الـ Aesthetics والتصوير السينمائي (Cinematic Photography). كل ريل كان بيحكي قصة قطعة الجواهر، والـ Caption كان مكتوب بلغة راقية جداً. مبنبيعش مجوهرات، إحنا بنبيع "إرث" و"ذكريات".',
  story_en = 'Luxury brands cannot be marketed with generic content. The fear was cheapening the brand. We focused entirely on cinematic aesthetics and storytelling. Every reel told the story behind the jewelry, using sophisticated copywriting. We weren\'t selling jewelry; we were selling an "inheritance" and a "memory".',
  is_published = 0
WHERE slug = 'merath';

-- 9. Memaar (Architecture)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'شركات المقاولات والهندسة بتقدم محتوى جاف جداً (رسومات هندسية ومخططات). العميل كان خايف إن المحتوى يبقى ممل ومحدش يتابعه. قررنا نحول المخططات لفيديوهات 3D سينمائية بتوضح جمال التصميم، ودخلنا المتابع في رحلة "من الفكرة للبناء". المحتوى بقى مرجع للطلبة والمهندسين، وده جابلهم B2B Leads قوية جداً.',
  story_en = 'Construction and architecture can be extremely dry content. The client feared being boring. We turned static blueprints into cinematic 3D flythrough videos, taking the audience on a journey from concept to reality. The page became a reference for engineers, driving high-quality B2B leads.',
  is_published = 0
WHERE slug = 'memaar';

-- 10. SAK (Fintech/Investment)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة + إدارة سوشيال ميديا', 
  service_en = 'Media Buying (Ads) + Social Media', 
  story_ar = 'المجال المالي في مصر حساس، والناس بتخاف تحط فلوسها في مكان جديد. الخوف كان إن البراند يبان "نصباية". بنينا ثقة من الصفر عن طريق محتوى تعليمي بسيط جداً عن الاستثمار، وعملنا إعلانات بتركز على "الأمان والشفافية" مش بس الأرباح. استخدمنا شهادات عملاء حقيقيين في الإعلانات، وده كسر حاجز الخوف.',
  story_en = 'Finance in Egypt is highly sensitive; people fear losing money. The client feared being perceived as a scam. We built trust from scratch using simplified educational content about investing. Our ads focused on "security and transparency" rather than just profits, using real client testimonials to break the fear barrier.',
  is_published = 0
WHERE slug = 'sak';

-- 11. The Address (Real Estate)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'كانوا بيعانوا من "جودة الليدز". الإعلانات بتجيب أرقام كتير بس نصهم مش جادين وبيضيعوا وقت فريق المبيعات. الخوف كان إن تكلفة الليد الجاد تبقى عالية جداً. حلينا ده بإننا حطينا فلاتر في الـ Lead Form (زي السؤال عن الميزانية وطريقة الدفع). قل عدد الليدز بنسبة 40%، بس نسبة الجادين منهم زادت لـ 80%.',
  story_en = 'They suffered from terrible lead quality. Ads brought numbers, but sales agents wasted time on unqualified leads. We introduced strict qualifying questions in the lead forms (budget, payment method). The total lead volume dropped by 40%, but the quality of serious buyers jumped to 80%.',
  is_published = 0
WHERE slug = 'address';

-- 12. Evergreen (Agriculture)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'العميل كان شايف إن "الزراعة" مجال ملوش علاقة بالسوشيال ميديا، وإن مفيش حد هيتابع نباتات. الخوف كان من إهدار الوقت. غيرنا الفكرة تماماً وركزنا على الـ "Landscaping" وتصميم الحدائق. صورنا فيلات حقيقية قبل وبعد التنسيق. الناس بدأت تتابع عشان تشوف جمال الطبيعة، وبقى فيه طلب كبير على الخدمة من أصحاب الفيلات والمشاريع.',
  story_en = 'The client thought agriculture had no place on social media. We shifted the focus entirely to "Landscaping" and garden design. We showcased stunning real-life Before/After videos of villas. People followed for the visual beauty, resulting in massive demand for landscaping services from high-end property owners.',
  is_published = 0
WHERE slug = 'evergreen';

-- 13. JG (Corporate B2B)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'الشركات (B2B) صعب جداً تتسوق بالإعلانات العادية اللي بتاعت البيع للمستهلك. الخوف كان إن الميزانية تروح هدر لأن صاحب القرار مش بيدوس على إعلانات كتير. عملنا LinkedIn Ads + Google Search Ads موجهة بدقة لـ Job Titles معينة ومدراء الشركات. تكلفة الـ B2B Lead كانت عالية شوية، بس العائد من عقد واحد بس غطى كل الميزانية.',
  story_en = 'B2B marketing is a different beast. The fear was wasting budget because decision-makers ignore consumer ads. We utilized LinkedIn and Google Search ads targeting specific executive job titles. While the cost per B2B lead was higher, closing just one contract covered the entire campaign budget multiple times over.',
  is_published = 0
WHERE slug = 'jg';

-- 14. Island Gym (Fitness)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا + إعلانات ممولة', 
  service_en = 'Social Media Management + Ads', 
  story_ar = 'الجيمات بتعاني من مشكلة "الاشتراك في يناير والانسحاب في مارس". كانوا خايفين إننا نجيب اشتراكات جديدة وناس تسيب الجيم بعد شهر. ركزنا على محتوى بيبني "مجتمع" (Community). عملنا تحدي للترانسفورم، ونزلنا قصص نجاح حقيقية لناس عادية. الإعلانات مش كانت للجيم، كانت للانضمام لـ "الأسرة" دي.',
  story_en = 'Gyms suffer from the "Join in Jan, Quit in March" syndrome. The client feared high churn rates. We focused heavily on community building. We ran transformation challenges and showcased real, relatable success stories. The ads didn\'t just sell a gym; they sold membership into a supportive community.',
  is_published = 0
WHERE slug = 'island-gym';

-- 15. iSkin (Dermatology/Skincare)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'سوق العناية بالبشرة مشبع جداً بمنتجات كتير. العميل كان خايف إن البراند يضيع وسط الزحمة. بنينا استراتيجية تعتمد على "تعليم العميل". بدل ما نقول "اشتري منتجنا"، بقينا بنقول "إزاي تفرق بين أنواع البشرة". لما العميل فهم مشكلته، بقى المنتج بتاعنا هو الحل المنطقي الوحيد. التفاعل والثقة زادوا جداً.',
  story_en = 'The skincare market is heavily saturated. The client feared getting lost in the noise. We built a strategy around "educating the consumer." Instead of saying "buy this," we created content on "how to identify your skin type." Once customers understood their problem, our product became the logical solution.',
  is_published = 0
WHERE slug = 'iskin';

-- 16. Paws (Pets/Vet)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا', 
  service_en = 'Social Media Management', 
  story_ar = 'العميل كان خايف إن محتوى الحيوانات يبقى مجرد صور "كيوت" ومبيبيعش. ركزنا على الجانب التوعوي والطبي. عملنا محتوى بيساعد أصحاب الحيوانات في التعامل مع مشاكل القطط والكلاب الصحية والسلوكية. ولما حتة تتعرض للخطر، إحنا أول مكان بيفكروا فيه. الحب في المحتوى كان بيبيع.',
  story_en = 'The client feared pet content would just be "cute pictures" that don\'t drive sales. We pivoted to educational and medical content, helping pet owners deal with behavioral and health issues. When pets get sick, we are the first place they trust. The emotional connection in the content drove the sales.',
  is_published = 0
WHERE slug = 'paws';

-- 17. X Garage (Automotive)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'خدمات تعديل السيارات (Tuning) بتستهدف شريحة معينة جداً. الخوف كان إن الإعلانات توصل لناس مش بتفهم في العربيات، فمتبقاش مجدية. عملنا إعلانات فيديو سينمائية لصوت الموتور وتعديلات الأداء، ووجهناها بـ Interest Targeting دقيق جداً لمحبي وعشاق السيارات. جبنا Leads بتحب الميكانيكا والتعديل، مش مجرد ناس بتدور على غسيل عربيات.',
  story_en = 'Car tuning targets a very niche audience. The client feared wasting ads on people who don\'t care about cars. We created cinematic videos focusing on engine sounds and performance mods. Using hyper-specific interest targeting, we only reached true car enthusiasts, bringing high-quality leads.',
  is_published = 0
WHERE slug = 'xgarage';

-- 18. OVO (Furniture)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا + إعلانات ممولة', 
  service_en = 'Social Media Management + Ads', 
  story_ar = 'العميل كان عنده منتجات ممتازة، بس محتاج يبني هوية بصرية (Visual Identity) قوية عشان ينافس. الخوف كان إن المحتوى العادي ميبرزش جمال المنتج. صنعنا محتوى يركز على الـ "Minimalism" والإضاءة، وخلي المنتج بيتكلم عن نفسه. الإعلانات جابت زوار للمعرض، والتصميم الراقي خلى نسبة الشراء عالية جداً.',
  story_en = 'Great products, but lacking a strong visual identity. The client feared generic content wouldn\'t highlight their quality. We built a minimalist, high-end aesthetic focused on lighting and aesthetics. The beautiful content drove high-intent foot traffic to their showroom, resulting in immediate sales.',
  is_published = 0
WHERE slug = 'ovo';

-- 19. Swan (Beauty/Cosmetics)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'الإعلانات في مجال التجميل مكلفة جداً، والعائد مش بيكون مضمون. الخوف كان إن فلوس الميديا تروح على الفاضي. عملنا A/B Testing قوي جداً لمحتوى الإعلانات (فيديوهات، صور، ألوان). لقينا إن الإعلانات اللي بفيها "جمال حقيقي" للعميل بتجيب مبيعات أكتر من الموديلز. استغلينا ده ورفعنا الـ ROAS لـ 5x.',
  story_en = 'Cosmetics ads are notoriously expensive. The client feared low ROI. We ran extensive A/B testing on video formats and colors. We discovered that "real customer beauty" outperformed professional models by a landslide. We scaled those winning creatives, achieving a 5x ROAS.',
  is_published = 0
WHERE slug = 'swan';

-- 20. Godzilla (Entertainment/Gaming)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إدارة سوشيال ميديا + إعلانات ممولة', 
  service_en = 'Social Media Management + Ads', 
  story_ar = 'الجمهور بتاع الجيمنج صعب جداً تتكلم معاه بلغة إعلانية. الخوف كان إن المحتوى يبقى "cringe". عشان كده عيشنا معاهم وحطينا الميمز والترندات في صميم المحتوى. الإعلانات كانت عبارة عن "تحديات" وتفاعل مباشر، مش مجرد صورة ورقم. الجمهور حبنا عشان إحنا "واحد منهم".',
  story_en = 'The gaming audience hates corporate ads. The client feared being "cringe." We fully immersed ourselves in their culture, integrating memes and trends heavily into the content. Our ads were built around challenges and live interactions, not just boring product shots. They loved us because we felt like "one of them".',
  is_published = 0
WHERE slug = 'godzilla';

-- 21. Snoopy (Kids/Apparel)
UPDATE portfolio_brands SET 
  year = 2026, 
  service_ar = 'إعلانات ممولة', 
  service_en = 'Media Buying (Ads)', 
  story_ar = 'ملابس الأطفال سوقها موسمي (أعياد، عودة للمدارس). الخوف كان إن المحل يقف في المواسم العادية. عملنا حملات استباقية قبل كل موسم بشهر، وبعنا "الباقات" (Bundles) بدل القطع المفردة. استخدمنا إعلانات Retargeting للي دخلوا السايت، وده خلى مبيعات المواسم تتحسن بنسبة 60% ومحصلش أي ركود.',
  story_en = 'Kids apparel is highly seasonal. The client feared a dead store during off-seasons. We ran proactive campaigns a month before every season and sold bundled packages instead of individual items. Aggressive retargeting to site visitors boosted seasonal sales by 60% and eliminated off-season slumps.',
  is_published = 0
WHERE slug = 'snoopy';
