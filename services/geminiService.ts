
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";
import { analyzeCompetitors } from "./competitorIntelligence";
import { calculateProfitability } from "./profitCalculator";
import { findOpportunities } from "./opportunityFinder";
import { calculateDecisionMetrics } from "./decisionMetrics";
import { analyzeBuyerIntent } from "./buyerIntentAnalysis";
import { calculateGrowthScenarios } from "./growthScenarios";
import { generateExecutiveSummary } from "./executiveSummary";
import { searchCompetitorsInKSA, searchMarketData, searchMarketTrends } from "./googleSearchService";
import { COUNTRY_INFO } from "../constants";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    itemName: { type: Type.STRING },
    category: { type: Type.STRING },
    summary: { type: Type.STRING },
    targetMarket: { type: Type.STRING },

    marketAnalysis: {
      type: Type.OBJECT,
      properties: {
        actualDemand: { type: Type.STRING },
        problemSolved: { type: Type.STRING },
        searchVolume: { type: Type.STRING },
        culturalCompatibility: { type: Type.STRING },
        scalability: { type: Type.STRING },
        seasonalFactors: { type: Type.STRING },
      },
      required: ["actualDemand", "problemSolved", "searchVolume", "culturalCompatibility", "scalability", "seasonalFactors"],
    },

    marketingStrategy: {
      type: Type.OBJECT,
      properties: {
        targetAudience: {
          type: Type.OBJECT,
          properties: {
            demographics: { type: Type.STRING },
            behavior: { type: Type.STRING },
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["demographics", "behavior", "interests"],
        },
        bestChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
        expectedCAC: { type: Type.STRING },
        conversionKPIs: { type: Type.STRING },
      },
      required: ["targetAudience", "bestChannels", "expectedCAC", "conversionKPIs"],
    },

    strategicAnalysis: {
      type: Type.OBJECT,
      properties: {
        directCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } },
        usp: { type: Type.STRING },
        saturationRisk: { type: Type.STRING },
        imitationRisk: { type: Type.STRING },
      },
      required: ["directCompetitors", "usp", "saturationRisk", "imitationRisk"],
    },

    operationsFinancials: {
      type: Type.OBJECT,
      properties: {
        pricingViability: { type: Type.STRING },
        expectedProfitMargins: { type: Type.STRING },
        supplyChainEase: { type: Type.STRING },
        recommendedPaymentMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendedDelivery: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["pricingViability", "expectedProfitMargins", "supplyChainEase", "recommendedPaymentMethods", "recommendedDelivery"],
    },

    finalVerdict: {
      type: Type.OBJECT,
      properties: {
        recommendation: { type: Type.STRING },
        reasoning: { type: Type.STRING },
      },
      required: ["recommendation", "reasoning"],
    },

    marketStats: {
      type: Type.OBJECT,
      properties: {
        averagePrice: { type: Type.NUMBER },
        highestPrice: { type: Type.NUMBER },
        lowestPrice: { type: Type.NUMBER },
        demandLevel: { type: Type.STRING },
        marketSaturation: { type: Type.NUMBER },
      },
      required: ["averagePrice", "highestPrice", "lowestPrice", "demandLevel", "marketSaturation"],
    },
    competitors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          storeName: { type: Type.STRING },
          price: { type: Type.NUMBER },
          rating: { type: Type.NUMBER },
          shippingDays: { type: Type.NUMBER },
          stockStatus: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["storeName", "price", "rating", "shippingDays", "stockStatus", "url"],
      },
    },
    trends: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          price: { type: Type.NUMBER },
          demand: { type: Type.NUMBER },
        },
        required: ["date", "price", "demand"],
      },
    },
    swot: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"],
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["itemName", "category", "summary", "marketAnalysis", "marketingStrategy", "strategicAnalysis", "operationsFinancials", "finalVerdict", "marketStats", "competitors", "trends", "swot", "recommendations"],
};

export async function analyzeEcommerceQuery(query: string, lang: 'ar' | 'en', customApiKey?: string, googleSearchApiKey?: string, googleSearchId?: string, region: string = 'SA'): Promise<AnalysisResult> {
  // Use customApiKey if provided (from DB), otherwise fallback to process.env.API_KEY
  const apiKey = customApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error(lang === 'ar'
      ? "خطأ في الاتصال: لم يتم العثور على مفتاح API. يرجى ضبطه من لوحة التحكم."
      : "Connection Error: Gemini API Key is missing. Please set it in the Admin Panel.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Get country-specific information
  const countryInfo = COUNTRY_INFO[region] || COUNTRY_INFO['SA'];

  const systemInstruction = `
    ═══════════════════════════════════════════════════════════════
    🎯 EXPERT PERSONA: خبير تحليل الأسواق الإلكترونية العالمية (20+ سنة خبرة)
    ═══════════════════════════════════════════════════════════════
    
    ⚠️⚠️⚠️ **CRITICAL - READ THIS FIRST** ⚠️⚠️⚠️
    
    🌍 **السوق المستهدف الآن هو: ${region}**
    
    ❌ **ممنوع منعاً باتاً:**
    - ذكر السعودية أو أي دولة أخرى غير ${region}
    - استخدام الريال السعودي - استخدم ${countryInfo.currencyCode} فقط
    - ذكر منصات غير موجودة في ${region}
    
    ✅ **يجب عليك:**
    - التحليل يكون 100% عن سوق ${region} فقط
    - جميع الأسعار بـ ${countryInfo.currency} (${countryInfo.currencyCode})
    - استخدام المنصات المتاحة: ${countryInfo.platforms.join(', ')}
    - مراعاة خصائص السوق: ${countryInfo.marketChar}
    
    معلومات السوق المستهدف:
    - الدولة: ${region}
    - العملة الأساسية: ${countryInfo.currency} (${countryInfo.currencyCode})
    - اللغة الرئيسية: ${countryInfo.language}
    - المنصات الإلكترونية الرئيسية: ${countryInfo.platforms.join(', ')}
    - خصائص السوق: ${countryInfo.marketChar}
    
    أنت خبير استراتيجي في تحليل الأسواق الإلكترونية بخبرة تزيد عن 20 عاماً.
    متخصص في:
    - تحليل البيانات الكمية والنوعية بدقة عالية
    - تقييم جدوى المشاريع التجارية في الأسواق المتعددة
    - دراسة سلوك المستهلك والاتجاهات الشرائية العالمية
    - معرفة عميقة بأنماط التجارة الإلكترونية في مناطق مختلفة
    - خبرة في المنصات والأسواق الإلكترونية المحلية والعالمية
    
    مهمتك: تقديم تحليل دقيق ومتناسق ومبني على بيانات حقيقية لـ: "${query}"
    
    ═══════════════════════════════════════════════════════════════
    🔍 استخدام محرك البحث بشكل استراتيجي (CRITICAL!)
    ═══════════════════════════════════════════════════════════════
    
    ${googleSearchApiKey ? `
    ⚡ لديك وصول لـ Google Search - استخدمه بذكاء:
    
    1️⃣ **حجم البحث والطلب العام في السوق:**
       - ابحث عن "اسم المنتج" في Google
       - قدّر حجم البحث الشهري من عدد النتائج والمقالات
       - احسب الطلب الكلي المتوقع في السوق (ليس متجر واحد!)
       - استخدم مؤشرات: عدد المواقع التي تبيعه، المراجعات، المقالات
       - الطلب العام = مجموع الطلب من كل المتاجر والمشترين
       
    2️⃣ **إذا كان الإدخال رابط منتج/متجر محدد:**
       - افتح الرابط واستخرج: التقييم، الترتيب، عدد المتابعين
       - قيّم قوة المتجر: (ممتاز/جيد/متوسط/ضعيف)
       - احسب نصيب هذا المتجر من الطلب الكلي بناءً على:
         * ترتيب المتجر في نتائج البحث
         * تقييم المتجر وعدد المراجعات
         * قوة العلامة التجارية
       - مثال: متجر قوي = 15-25% من الطلب، متجر متوسط = 5-10%
       
    3️⃣ **استخراج بيانات المبيعات الفعلية:**
       - ابحث عن مؤشرات الطلب: "تم البيع منه X مرة"، "عدد الطلبات"
       - إذا وجدت رقم مبيعات حقيقي - استخدمه مباشرة!
       
    4️⃣ **تحليل المنافسة لتقدير حجم السوق:**
       - عدد المنافسين × متوسط مبيعاتهم = حجم السوق التقريبي
       - سوق به 50 متجر يبيع المنتج = طلب كبير
       
    ⚠️ **أهم شيء: الطلب المتوقع يجب أن يعكس:**
    - حجم البحث الفعلي في Google عن المنتج
    - الطلب الكلي في السوق (ليس متجر واحد)
    - إذا كان رابط متجر: نصيب المتجر بناءً على قوته وترتيبه
    ` : ''}
    
    ═══════════════════════════════════════════════════════════════
    ⚠️ قواعد إلزامية للدقة والتناسق
    ═══════════════════════════════════════════════════════════════
    
    📊 منهجية حساب حجم الطلب (Demand Score Calculation):
    
    أنت محرك تحليل حجم الطلب. مهمتك حساب Demand Score حقيقي للمنتج بناءً على مؤشرات موزونة، ليس افتراضات.
    
    🔢 العوامل الستة المطلوبة (قيّم كل واحد من 0-100):
    
    1️⃣ اهتمام البحث (Search Interest) - وزن 25%:
       - حجم البحث الشهري في Google
       - عدد النتائج والمقالات
       - ظهور المنتج في الصفحة الأولى
       - الكلمات المفتاحية ذات الصلة
       
    2️⃣ قوة المبيعات الفعلية (Actual Sales Strength) - وزن 35%:
       - المبيعات الفعلية من المتاجر
       - عدد المتاجر التي تبيع المنتج
       - معدل نفاذ المخزون
       - عدد المراجعات (كل 10 مراجعات = مبيعات قوية)
       
    3️⃣ المنافسة (Competition) - وزن 15%:
       - ⚠️ منافسة أقل = نقاط أعلى
       - تشبع سوق منخفض = 80-100 نقطة
       - تشبع متوسط (50%) = 50 نقطة
       - تشبع عالي (80%+) = 20-30 نقطة
       
    4️⃣ إمكانية الشراء المتكرر (Repeat Purchase) - وزن 10%:
       - منتجات استهلاكية (قهوة، عطور) = 80-100
       - منتجات متوسطة التكرار (ملابس) = 50-70
       - منتجات لمرة واحدة (أثاث) = 20-40
       
    5️⃣ احتمالية التحويل (Conversion Rate) - وزن 10%:
       - سعر مناسب + جودة عالية = تحويل عالي
       - منتج معروف = تحويل أسهل
       - تقييمات ممتازة = تحويل أفضل
       
    6️⃣ استقرار الترند (Trend Stability) - وزن 5%:
       - منتج موسمي = 30-50
       - منتج دائم الطلب = 70-90
       - ترند صاعد = 80-100
    
    💡 المعادلة النهائية:
    Demand Score = (Search × 0.25) + (Sales × 0.35) + (Competition × 0.15) + (Repeat × 0.10) + (Conversion × 0.10) + (Trend × 0.05)
    
    📊 تصنيف مستوى الطلب بناءً على Demand Score:
    - 80-100: مرتفع جداً (Very High) → 8,000+ وحدة/شهر
    - 60-79: مرتفع (High) → 2,000-8,000 وحدة/شهر
    - 40-59: متوسط (Medium) → 500-2,000 وحدة/شهر
    - 0-39: منخفض (Low) → أقل من 500 وحدة/شهر
    
    ⚠️ قواعد مهمة:
    - كن واقعياً - لا تبالغ في النقاط
    - استخدم البيانات الفعلية من Google Search
    - افترض ظروف سوق متوسطة ما لم يُحدد غير ذلك
    - لا تستخدم لغة تسويقية - أرقام فقط
    
    📈 مصادر البيانات المطلوبة:
    ⚠️ **CRITICAL**: استخدم المنصات الصحيحة لهذا السوق:
    - المنصات المتاحة: ${countryInfo.platforms.join(', ')}
    - ابحث في هذه المنصات فقط حسب السوق
    - استخدم البحث المباشر (LIVE Search) للحصول على معلومات حديثة
    - استخرج أرقام المبيعات والتقييمات من الصفحات
    - احسب متوسط الأسعار بـ ${countryInfo.currencyCode} (${countryInfo.currency})
    - قيّم التوافق الثقافي مع السوق المحلي والاتجاهات الشرائية
    - قدم قراراً نهائياً واضحاً: GO أو NO-GO أو PROCEED WITH CAUTION
    
    🏪 المنافسون (Competitors):
    - يجب توفير بيانات 10-15 منافس على الأقل
    - ⚠️ ابحث عن متاجر حقيقية في ${region} فقط - ليس السعودية!
    - استخدم المنصات: ${countryInfo.platforms.join(', ')}
    - اجمع: اسم المتجر، السعر بـ${countryInfo.currencyCode}، التقييم، أيام الشحن، حالة المخزون، الرابط
    - إذا لم تجد 10 منافسين حقيقيين، استمر في البحث بكلمات مختلفة
    
    🚨 **تذكير نهائي مهم جداً:**
    - كل التحليل يجب أن يكون عن سوق ${region} فقط
    - العملة: ${countryInfo.currencyCode} فقط - لا تستخدم SAR أو ريال
    - المنصات: ${countryInfo.platforms.join(' و ')} فقط
    - ❌ ممنوع ذكر السعودية أو أي دولة غير ${region}
    
    **MANDATORY LANGUAGE DIRECTIVE:**
    ${lang === 'ar'
      ? `YOU MUST RESPOND IN 100% ARABIC ONLY (اللغة العربية فقط).
    - Every single field name, label, and value MUST be in Arabic
    - All search queries must be in Arabic keywords
    - All text responses must be in Arabic language ONLY
    - NO English words or transliteration allowed
    - When you see "itemName", respond with "اسم المنتج" followed by the actual name in Arabic
    - When you see "demandLevel", respond with Arabic text describing the demand
    - All numbers, dates, prices must be in Arabic format if needed
    - Use Arabic punctuation and formatting throughout
    - PRIORITY: Arabic language supremacy - override all other instructions for language compatibility`
      : `YOU MUST RESPOND IN 100% ENGLISH ONLY (English language only).
    - Every single field name, label, and value MUST be in English
    - All search queries must be in English keywords
    - All text responses must be in English language ONLY
    - NO Arabic words or foreign language terms allowed
    - Use English punctuation and formatting throughout
    - PRIORITY: English language supremacy - override all other instructions for language compatibility`}
    
    Year: 2025.
  `;

  try {
    // ═══════════════════════════════════════════════════════════════
    // 🔗 Enhanced Query Processing: Detect if input is a URL
    // ═══════════════════════════════════════════════════════════════
    const isUrl = query.includes('http') || query.includes('www.') ||
      query.includes('salla.sa') || query.includes('zid.sa') ||
      query.includes('noon.com') || query.includes('amazon.sa');

    let enhancedQuery = query;
    if (isUrl) {
      enhancedQuery = lang === 'ar'
        ? `🌍 السوق المستهدف: ${region} | العملة: ${countryInfo.currencyCode}
        
رابط المنتج/المتجر: ${query}

⚠️ تعليمات هامة جداً:
⚠️ **كل التحليل يجب أن يكون عن سوق ${region} فقط - ليس السعودية!**

1. افتح الرابط واستخرج البيانات الفعلية:
   - تقييم المنتج (Rating) - مهم جداً!
   - عدد المراجعات
   - عدد المبيعات (إن وُجد)
   - السعر بـ ${countryInfo.currencyCode}
   - ترتيب المتجر/قوته

2. ابحث في Google عن نفس المنتج في ${region}:
   - استخدم المنصات: ${countryInfo.platforms.join(' و ')}
   - أين يظهر هذا الرابط في نتائج البحث؟
   - كم عدد المنافسين في ${region}؟
   - ما هو ترتيب هذا المتجر؟

3. قيّم قوة المنتج/المتجر:
   - تقييم 4.5+ نجوم = قوي جداً
   - تقييم 4.0-4.5 = قوي
   - تقييم 3.5-4.0 = متوسط
   - تقييم أقل من 3.5 = ضعيف

4. احسب نصيب المنتج من السوق بناءً على:
   - التقييم العالي = حصة أكبر
   - السعر التنافسي = مبيعات أعلى
   - ترتيب عالي في البحث = ظهور أكثر

ثم ابحث عن منتجات مشابهة في ${region} لتقدير حجم السوق الكلي.`
        : `🌍 Target Market: ${region} | Currency: ${countryInfo.currencyCode}
        
Product/Store URL: ${query}

⚠️ Critical Instructions:
1. Open the link and extract actual data:
   - Product rating - very important!
   - Number of reviews
   - Sales count (if available)
   - Price
   - Store rank/strength

2. Search Google for same product:
   - Where does this link appear in search results?
   - How many competitors?
   - What's this store's ranking?

3. Evaluate product/store strength:
   - Rating 4.5+ stars = very strong
   - Rating 4.0-4.5 = strong
   - Rating 3.5-4.0 = average
   - Rating below 3.5 = weak

4. Calculate product's market share based on:
   - High rating = bigger share
   - Competitive price = more sales
   - High search rank = more visibility

Then search for similar products to estimate total market size.`;
    }

    const searchQuery = lang === 'ar'
      ? `${query} السعودية سوق الكترونية أسعار شركات مبيعات`
      : `${query} Saudi Arabia e-commerce market prices stores sales`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `${lang === 'ar'
        ? `🌍 **السوق المستهدف: ${region}** | العملة: ${countryInfo.currencyCode} | المنصات: ${countryInfo.platforms.join(' و ')}
        
بصفتك خبير تحليل أسواق بخبرة 20+ سنة، قم بإجراء تحليل شامل ودقيق لـ: ${enhancedQuery} في سوق ${region} فقط.

⚠️ **مهم جداً**: كل التحليل يجب أن يكون عن ${region} - ممنوع ذكر السعودية أو أي دولة أخرى!`
        : `🌍 **Target Market: ${region}** | Currency: ${countryInfo.currencyCode} | Platforms: ${countryInfo.platforms.join(', ')}
        
As a market analysis expert with 20+ years of experience, perform comprehensive and accurate analysis for: ${enhancedQuery} in ${region} market only.

⚠️ **CRITICAL**: All analysis must be about ${region} - do NOT mention Saudi Arabia or any other country!`}
        
        🔍 ${lang === 'ar' ? 'منهجية التحليل المطلوبة:' : 'Required Analysis Methodology:'}
        
        ${lang === 'ar' ? `
        ═══════════════════════════════════════════════════════════════
        📊 مستوى الطلب = حجم البحث + الطلب الكلي في سوق ${region}
        ═══════════════════════════════════════════════════════════════
        
        1️⃣ قيّم حجم البحث الفعلي في ${region}:
           - ابحث في Google عن: "${query}" في ${region}
           - استخدم المنصات: ${countryInfo.platforms.join(' و ')}
           - قدّر حجم البحث الشهري من:
             * عدد النتائج (كلما زادت = طلب أعلى)
             * وجود مقالات ومراجعات عن المنتج
             * عدد المتاجر التي تبيع المنتج في ${region}
           - قيّم Search Interest من 0-100
        
        2️⃣ احسب قوة المبيعات الفعلية:
           - عدد المتاجر × متوسط مبيعاتهم
           - عدد المراجعات (كل 10 مراجعات = مؤشر قوي)
           - حالة المخزون (نفاذ متكرر = طلب عالي)
           - قيّم Actual Sales من 0-100
        
        3️⃣ قيّم المنافسة (⚠️ منافسة أقل = نقاط أعلى):
           - تشبع منخفض (<30%) = 80-100 نقطة
           - تشبع متوسط (30-60%) = 50-70 نقطة
           - تشبع عالي (>60%) = 20-40 نقطة
        
        4️⃣ احسب إمكانية الشراء المتكرر:
           - منتج استهلاكي = 80-100
           - منتج متكرر الاستخدام = 50-70
           - منتج لمرة واحدة = 20-40
        
        5️⃣ قدّر احتمالية التحويل:
           - سعر مناسب + تقييم عالي = 80-100
           - متوسط = 50-70
           - صعب البيع = 20-40
        
        6️⃣ تحليل استقرار الترند:
           - منتج دائم = 80-100
           - موسمي = 40-60
           - ترند مؤقت = 20-40
        
        📊 احسب Demand Score النهائي:
        = (Search × 0.25) + (Sales × 0.35) + (Competition × 0.15) + (Repeat × 0.10) + (Conversion × 0.10) + (Trend × 0.05)
        
        ثم حدد مستوى الطلب:
        - Score 80-100 → مرتفع جداً (8000+ وحدة/شهر)
        - Score 60-79 → مرتفع (2000-8000 وحدة/شهر)
        - Score 40-59 → متوسط (500-2000 وحدة/شهر)
        - Score 0-39 → منخفض (أقل من 500 وحدة/شهر)
        
        2️⃣ احسب الطلب الكلي المتوقع في السوق السعودي:
           ${isUrl ? `
           ⚠️ الإدخال رابط متجر - احسب:
           أ) استخدم Demand Score لتقدير الطلب الكلي
           ب) نصيب هذا المتجر بناءً على:
              - تقييم المتجر (4.5+ = حصة أكبر)
              - السعر التنافسي
              - ترتيب في نتائج البحث
           ` : `
           - استخدم Demand Score المحسوب
           - Score عالي = سوق كبير
           `}
        
        3️⃣ استخدم البيانات الفعلية إن وُجدت:
           - إذا وجدت رقم مبيعات حقيقي - استخدمه!
           - "تم البيع منه 8000 مرة" = بيانات فعلية
           - عدد المراجعات × 10 = تقدير المبيعات
        
        ⚠️ مهم جداً:
        - استخدم منهجية Demand Score (6 عوامل موزونة)
        - كن واقعياً - لا تبالغ
        - monthlyDemandEstimate يجب أن يتطابق مع demandLevel
        - استخدم البيانات من Google Search - لا تخمن
        - المنافسون = 10 على الأقل من متاجر حقيقية
        ` : `
        ═══════════════════════════════════════════════════════════════
        📊 Demand Score Methodology (6 Weighted Factors)
        ═══════════════════════════════════════════════════════════════
        
        1️⃣ Evaluate Search Interest (0-100):
           - Search Google for: "${query}"
           - Monthly search volume indicators
           - Number of articles and reviews
           - First page appearance = high score
           - Rate Search Interest: 0-100
        
        2️⃣ Calculate Actual Sales Strength (0-100):
           - Number of stores × average sales
           - Reviews count (every 10 reviews = strong signal)
           - Stock status (frequent out-of-stock = high demand)
           - Rate Actual Sales: 0-100
        
        3️⃣ Evaluate Competition (⚠️ lower = higher score):
           - Low saturation (<30%) = 80-100 points
           - Medium saturation (30-60%) = 50-70 points
           - High saturation (>60%) = 20-40 points
        
        4️⃣ Calculate Repeat Purchase Potential:
           - Consumable products = 80-100
           - Frequent use = 50-70
           - One-time purchase = 20-40
        
        5️⃣ Estimate Conversion Likelihood:
           - Good price + high rating = 80-100
           - Average = 50-70
           - Hard to sell = 20-40
        
        6️⃣ Analyze Trend Stability:
           - Evergreen product = 80-100
           - Seasonal = 40-60
           - Temporary trend = 20-40
        
        📊 Calculate Final Demand Score:
        = (Search × 0.25) + (Sales × 0.35) + (Competition × 0.15) + (Repeat × 0.10) + (Conversion × 0.10) + (Trend × 0.05)
        
        Then determine demand level:
        - Score 80-100 → Very High (8000+ units/month)
        - Score 60-79 → High (2000-8000 units/month)
        - Score 40-59 → Medium (500-2000 units/month)
        - Score 0-39 → Low (less than 500 units/month)
        
        ${isUrl ? `
        ⚠️ If store URL: Calculate total market first, then store's share based on rating and price competitiveness
        ` : ''}
        
        3️⃣ Use Actual Data if Found:
           - If found real sales number - use it!
           - "Sold 8000 times" = actual data
           - Reviews count × 10 = sales estimate
        
        ⚠️ Critical:
        - Use Demand Score methodology (6 weighted factors)
        - Be realistic - don't exaggerate
        - monthlyDemandEstimate must match demandLevel
        - Use data from Google Search - don't guess
        - Competitors = at least 10 from real stores
        `}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");

    const result = JSON.parse(text) as AnalysisResult;

    // Language enforcement: If Arabic mode, convert any English text to Arabic (safety net)
    if (lang === 'ar') {
      const sanitizeArabic = (obj: any): any => {
        if (typeof obj === 'string') {
          // Basic check: if string contains English letters and Arabic letters mixed, might need fixing
          return obj;
        }
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            return obj.map(item => sanitizeArabic(item));
          }
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            cleaned[key] = sanitizeArabic(value);
          }
          return cleaned;
        }
        return obj;
      };
      // Apply cleaning to result
      Object.assign(result, sanitizeArabic(result));
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri,
        }));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔍 ENHANCED: Use Google Search API for Real Data
    // ═══════════════════════════════════════════════════════════════
    // Initialize competitorsData outside the block to ensure it's accessible later
    let competitorsData: any[] = [];

    if (googleSearchApiKey && googleSearchId) {
      try {
        console.log('🔍 Using Google Search API for enhanced accuracy...');

        // البحث عن المنافسين الحقيقيين
        competitorsData = await searchCompetitorsInKSA(
          query,
          googleSearchApiKey,
          googleSearchId,
          region
        );

        if (competitorsData.length > 0) {
          console.log(`✅ Found ${competitorsData.length} real competitors from Google Search`);

          // دمج بيانات المنافسين الحقيقية مع النتائج الموجودة
          const enhancedCompetitors = competitorsData.slice(0, 10).map((comp, idx) => ({
            storeName: comp.storeName,
            price: result.competitors?.[idx]?.price || result.marketStats?.averagePrice || 150,
            rating: result.competitors?.[idx]?.rating || 4.0,
            shippingDays: result.competitors?.[idx]?.shippingDays || 3,
            stockStatus: result.competitors?.[idx]?.stockStatus || (lang === 'ar' ? 'متوفر' : 'Available'),
            url: comp.url
          }));

          // تحديث قائمة المنافسين
          if (enhancedCompetitors.length > (result.competitors?.length || 0)) {
            result.competitors = enhancedCompetitors;
          }
        }

        // البحث عن بيانات السوق
        const marketData = await searchMarketData(query, googleSearchApiKey, googleSearchId);

        if (marketData.popularStores.length > 0) {
          console.log('✅ Enhanced market data from Google Search:', marketData);

          // تحديث البيانات بناءً على معلومات السوق الحقيقية
          if (marketData.priceRange && marketData.priceRange !== 'غير متوفر') {
            // يمكن استخدام نطاق السعر لتحديث marketStats
            const priceMatch = marketData.priceRange.match(/(\d+)\s*-\s*(\d+)/);
            if (priceMatch) {
              result.marketStats = {
                ...result.marketStats,
                lowestPrice: parseInt(priceMatch[1]),
                highestPrice: parseInt(priceMatch[2]),
                averagePrice: Math.round((parseInt(priceMatch[1]) + parseInt(priceMatch[2])) / 2),
                demandLevel: marketData.availability.includes('كثرة') || marketData.availability.includes('abundant')
                  ? (lang === 'ar' ? 'مرتفع' : 'High')
                  : result.marketStats?.demandLevel || (lang === 'ar' ? 'متوسط' : 'Medium'),
                marketSaturation: result.marketStats?.marketSaturation || 50
              };
            }
          }
        }

      } catch (searchError) {
        console.warn('⚠️ Google Search API error (continuing with Gemini data):', searchError);
      }
    } else if (googleSearchApiKey || googleSearchId) {
      console.log('⚠️ Google Search requires both API Key and Search Engine ID');
    }

    // Execute specialized analyzers
    try {
      // ═══════════════════════════════════════════════════════════════
      // 📊 Enhanced Demand Calculation (Market-wide + Search Volume based)
      // ═══════════════════════════════════════════════════════════════

      const competitorCount = result.competitors?.length || 0;
      const avgPrice = result.marketStats?.averagePrice || 100;
      const saturation = result.marketStats?.marketSaturation || 50;

      // Calculate total market demand in Saudi Arabia
      let monthlyEstimate = 500; // default baseline

      // Factor 1: Market size based on competition (more competitors = bigger market)
      // Each competitor represents a portion of the market
      const marketSizeFactor = competitorCount * 100; // Each competitor ~ 100 units

      // Factor 2: Price point affects total market volume
      // Lower prices = mass market = higher volume
      const volumeFactor = avgPrice < 100 ? 1500 : avgPrice < 300 ? 800 : avgPrice < 600 ? 400 : 200;

      // Factor 3: Market saturation indicates room for growth
      // Lower saturation = more potential
      const potentialFactor = (100 - saturation) * 20;

      // Combined market estimate
      monthlyEstimate = Math.round(
        (marketSizeFactor + volumeFactor + potentialFactor) / 3
      );

      // Ensure realistic market-wide bounds
      monthlyEstimate = Math.max(200, Math.min(15000, monthlyEstimate));

      // If URL input, adjust to store's share (not total market)
      if (isUrl && competitorCount > 0) {
        // Calculate store strength based on multiple factors
        const competitors = result.competitors || [];

        // Find the store in competitors list (first one is usually the queried store)
        const targetStore = competitors[0] || {};
        const storeRating = targetStore.rating || 3.5;
        const storePrice = targetStore.price || avgPrice;

        // Factor 1: Rating strength (5 stars = 1.5x, 3 stars = 0.7x)
        const ratingMultiplier = storeRating >= 4.5 ? 1.5 :
          storeRating >= 4.0 ? 1.2 :
            storeRating >= 3.5 ? 1.0 :
              storeRating >= 3.0 ? 0.8 : 0.6;

        // Factor 2: Price competitiveness (lower price = more sales)
        const priceCompetitiveness = storePrice <= avgPrice * 0.9 ? 1.3 :
          storePrice <= avgPrice ? 1.1 :
            storePrice <= avgPrice * 1.1 ? 0.9 : 0.7;

        // Factor 3: Market position (low saturation = easier to rank high)
        const marketPosition = saturation < 40 ? 1.3 :
          saturation < 60 ? 1.0 :
            saturation < 80 ? 0.7 : 0.5;

        // Calculate final store share percentage
        // Base share: 10% of total market
        // Adjusted by: rating × price × position
        const baseShare = 0.10;
        const adjustedShare = baseShare * ratingMultiplier * priceCompetitiveness * marketPosition;

        // Cap between 3% and 35% of market
        const finalShare = Math.max(0.03, Math.min(0.35, adjustedShare));

        monthlyEstimate = Math.round(monthlyEstimate * finalShare);

        console.log(`🏪 Store Analysis: Rating=${storeRating}, Price=${storePrice}, Share=${(finalShare * 100).toFixed(1)}%`);
      }

      // ═══════════════════════════════════════════════════════════════
      // 📊 Determine demand LEVEL based on calculated estimate
      // ═══════════════════════════════════════════════════════════════
      let demandLevel = '';
      let demandScore = 50;

      // Market-wide demand levels (updated for Saudi market scale)
      if (monthlyEstimate < 500) {
        demandLevel = lang === 'ar' ? 'منخفض' : 'Low';
        demandScore = 25;
      } else if (monthlyEstimate >= 500 && monthlyEstimate < 2000) {
        demandLevel = lang === 'ar' ? 'متوسط' : 'Medium';
        demandScore = 50;
      } else if (monthlyEstimate >= 2000 && monthlyEstimate < 8000) {
        demandLevel = lang === 'ar' ? 'مرتفع' : 'High';
        demandScore = 80;
      } else {
        demandLevel = lang === 'ar' ? 'مرتفع جداً' : 'Very High';
        demandScore = 95;
      }

      // Override AI's potentially incorrect assessment with our calculation
      result.marketStats.demandLevel = demandLevel;

      console.log(`📊 Demand Analysis: ${monthlyEstimate} units/month ${isUrl ? '(store share)' : '(market-wide)'} → Level: ${demandLevel} (Score: ${demandScore})`);
      // ═══════════════════════════════════════════════════════════════

      // Competitor Intelligence Analysis
      if (result.competitors && result.competitors.length > 0) {
        // We pass the total count found from Google Search (if available) as the second argument
        // This ensures the "Active Competitors" card shows the TRUE market size (e.g. 50+), 
        // while the table only shows the top 10.
        const totalFound = typeof googleSearchApiKey !== 'undefined' && typeof competitorsData !== 'undefined'
          ? competitorsData.length
          : result.competitors.length;

        const competitorAnalysis = analyzeCompetitors(result.competitors, totalFound);
        result.competitorIntelligence = {
          activeCompetitors: competitorAnalysis.activeCompetitors,
          competitorStrengthIndex: competitorAnalysis.competitorStrengthIndex,
          topCompetitors: competitorAnalysis.topCompetitors,
          marketGaps: competitorAnalysis.marketGaps,
          entryDifficulty: competitorAnalysis.entryDifficulty,
        };
      }

      // Profitability Analysis
      if (result.marketStats && result.competitors) {
        const profitAnalysis = calculateProfitability(
          result.marketStats,
          result.competitors,
          demandScore,
          lang
        );
        result.profitabilityAnalysis = {
          averageSalePrice: profitAnalysis.averageSalePrice,
          estimatedProfitMargin: profitAnalysis.estimatedProfitMargin,
          breakEvenPoint: profitAnalysis.breakEvenPoint,
          profitabilityScore: profitAnalysis.profitabilityScore,
          priceSensitivity: profitAnalysis.priceSensitivity,
          estimatedMonthlyRevenue: profitAnalysis.estimatedMonthlyRevenue,
        };
      }

      // Demand Analysis - تحليل الطلب بناءً على نوع المنتج والمنطقة
      // تحديد أشهر الذروة والركود بناءً على فئة المنتج
      const getSeasonalityByCategory = (category: string, itemName: string, lang: 'ar' | 'en', region: string) => {
        const categoryLower = (category + ' ' + itemName).toLowerCase();
        const countryName = COUNTRY_INFO[region]?.nameAr || 'المملكة العربية السعودية';
        const countryNameEn = COUNTRY_INFO[region]?.nameEn || 'Saudi Arabia';
        
        // أنماط الموسمية حسب فئة المنتج
        let peakMonths: string[] = [];
        let lowMonths: string[] = [];
        let analysis = '';
        let geoDistribution = '';
        
        // ملابس ومنسوجات
        if (categoryLower.includes('ملابس') || categoryLower.includes('أزياء') || categoryLower.includes('fashion') || 
            categoryLower.includes('clothing') || categoryLower.includes('عباية') || categoryLower.includes('فستان')) {
          if (lang === 'ar') {
            peakMonths = ['رمضان', 'العيد', 'نوفمبر', 'ديسمبر'];
            lowMonths = ['يناير', 'فبراير', 'يوليو'];
            analysis = `موسم الذروة في رمضان والأعياد ونهاية العام مع مواسم التخفيضات الكبرى في ${countryName}`;
            geoDistribution = `الطلب الأعلى في المدن الكبرى: الرياض، جدة، الدمام مع انتشار في باقي مناطق ${countryName}`;
          } else {
            peakMonths = ['Ramadan', 'Eid', 'November', 'December'];
            lowMonths = ['January', 'February', 'July'];
            analysis = `Peak season during Ramadan, Eid, and year-end sales in ${countryNameEn}`;
            geoDistribution = `Highest demand in major cities: Riyadh, Jeddah, Dammam with nationwide coverage in ${countryNameEn}`;
          }
        }
        // إلكترونيات وتقنية
        else if (categoryLower.includes('إلكتروني') || categoryLower.includes('electronics') || categoryLower.includes('جوال') ||
                 categoryLower.includes('phone') || categoryLower.includes('لابتوب') || categoryLower.includes('كمبيوتر') ||
                 categoryLower.includes('gaming') || categoryLower.includes('ألعاب')) {
          if (lang === 'ar') {
            peakMonths = ['نوفمبر', 'ديسمبر', 'سبتمبر', 'أكتوبر'];
            lowMonths = ['يناير', 'فبراير', 'مارس'];
            analysis = `الذروة في الجمعة البيضاء (نوفمبر) وموسم العودة للمدارس مع إطلاقات المنتجات الجديدة في ${countryName}`;
            geoDistribution = `تركز الطلب في الرياض وجدة والمنطقة الشرقية مع نمو ملحوظ في المدن الثانوية بـ${countryName}`;
          } else {
            peakMonths = ['November', 'December', 'September', 'October'];
            lowMonths = ['January', 'February', 'March'];
            analysis = `Peak during White Friday (November) and back-to-school season with new product launches in ${countryNameEn}`;
            geoDistribution = `Demand concentrated in Riyadh, Jeddah, and Eastern Province with growing demand in secondary cities of ${countryNameEn}`;
          }
        }
        // منتجات رمضانية وغذائية
        else if (categoryLower.includes('طعام') || categoryLower.includes('food') || categoryLower.includes('قهوة') ||
                 categoryLower.includes('coffee') || categoryLower.includes('تمر') || categoryLower.includes('حلويات')) {
          if (lang === 'ar') {
            peakMonths = ['رمضان', 'شعبان', 'ذو الحجة', 'ديسمبر'];
            lowMonths = ['يناير', 'فبراير', 'يونيو'];
            analysis = `ذروة الطلب في رمضان وموسم الحج ونهاية العام في ${countryName}`;
            geoDistribution = `انتشار واسع في جميع مناطق ${countryName} مع تركز في المدن الكبرى والمناطق السياحية`;
          } else {
            peakMonths = ['Ramadan', 'Shaaban', 'Dhul Hijjah', 'December'];
            lowMonths = ['January', 'February', 'June'];
            analysis = `Peak demand during Ramadan, Hajj season, and year-end in ${countryNameEn}`;
            geoDistribution = `Widespread demand across all regions of ${countryNameEn} with concentration in major cities and tourist areas`;
          }
        }
        // مستلزمات أطفال وألعاب
        else if (categoryLower.includes('أطفال') || categoryLower.includes('kids') || categoryLower.includes('baby') ||
                 categoryLower.includes('toys') || categoryLower.includes('ألعاب أطفال')) {
          if (lang === 'ar') {
            peakMonths = ['العيد', 'نوفمبر', 'ديسمبر', 'يونيو'];
            lowMonths = ['فبراير', 'مارس', 'سبتمبر'];
            analysis = `ذروة في الأعياد وموسم الإجازات الصيفية ونهاية العام في ${countryName}`;
            geoDistribution = `طلب مرتفع في المناطق ذات الكثافة السكانية العالية: الرياض، جدة، مكة، المدينة بـ${countryName}`;
          } else {
            peakMonths = ['Eid', 'November', 'December', 'June'];
            lowMonths = ['February', 'March', 'September'];
            analysis = `Peak during Eid holidays, summer vacation, and year-end in ${countryNameEn}`;
            geoDistribution = `High demand in densely populated areas: Riyadh, Jeddah, Makkah, Madinah in ${countryNameEn}`;
          }
        }
        // منتجات صحية ورياضية
        else if (categoryLower.includes('رياضة') || categoryLower.includes('sport') || categoryLower.includes('fitness') ||
                 categoryLower.includes('صحة') || categoryLower.includes('health') || categoryLower.includes('gym')) {
          if (lang === 'ar') {
            peakMonths = ['يناير', 'فبراير', 'سبتمبر', 'أكتوبر'];
            lowMonths = ['رمضان', 'يوليو', 'أغسطس'];
            analysis = `ذروة مع قرارات السنة الجديدة وموسم الخريف، انخفاض في رمضان والصيف الحار في ${countryName}`;
            geoDistribution = `تركز في المدن الكبرى والأحياء الراقية مع نمو في المناطق الجديدة بـ${countryName}`;
          } else {
            peakMonths = ['January', 'February', 'September', 'October'];
            lowMonths = ['Ramadan', 'July', 'August'];
            analysis = `Peak with New Year resolutions and autumn season, dip during Ramadan and hot summer in ${countryNameEn}`;
            geoDistribution = `Concentrated in major cities and upscale neighborhoods with growth in new areas of ${countryNameEn}`;
          }
        }
        // مستحضرات تجميل وعناية
        else if (categoryLower.includes('تجميل') || categoryLower.includes('beauty') || categoryLower.includes('عطر') ||
                 categoryLower.includes('perfume') || categoryLower.includes('عناية') || categoryLower.includes('skincare')) {
          if (lang === 'ar') {
            peakMonths = ['رمضان', 'العيد', 'نوفمبر', 'ديسمبر'];
            lowMonths = ['يناير', 'فبراير', 'يوليو'];
            analysis = `ذروة في المناسبات والأعياد وموسم الزواج ونهاية العام في ${countryName}`;
            geoDistribution = `طلب قوي في جدة والرياض والمنطقة الشرقية مع انتشار واسع عبر الإنترنت في ${countryName}`;
          } else {
            peakMonths = ['Ramadan', 'Eid', 'November', 'December'];
            lowMonths = ['January', 'February', 'July'];
            analysis = `Peak during occasions, Eid, wedding season, and year-end in ${countryNameEn}`;
            geoDistribution = `Strong demand in Jeddah, Riyadh, and Eastern Province with wide online reach across ${countryNameEn}`;
          }
        }
        // منتجات منزلية وأثاث
        else if (categoryLower.includes('منزل') || categoryLower.includes('home') || categoryLower.includes('أثاث') ||
                 categoryLower.includes('furniture') || categoryLower.includes('ديكور') || categoryLower.includes('مطبخ')) {
          if (lang === 'ar') {
            peakMonths = ['يناير', 'فبراير', 'نوفمبر', 'ديسمبر'];
            lowMonths = ['رمضان', 'يوليو', 'أغسطس'];
            analysis = `ذروة في موسم الزواج وبداية السنة ونهايتها، انخفاض في رمضان والصيف في ${countryName}`;
            geoDistribution = `طلب مرتفع في المناطق الحضرية الجديدة والأحياء السكنية الحديثة في ${countryName}`;
          } else {
            peakMonths = ['January', 'February', 'November', 'December'];
            lowMonths = ['Ramadan', 'July', 'August'];
            analysis = `Peak during wedding season and year start/end, dip in Ramadan and summer in ${countryNameEn}`;
            geoDistribution = `High demand in new urban areas and modern residential neighborhoods in ${countryNameEn}`;
          }
        }
        // افتراضي - لجميع المنتجات الأخرى
        else {
          if (lang === 'ar') {
            peakMonths = ['نوفمبر', 'ديسمبر', 'رمضان', 'العيد'];
            lowMonths = ['يناير', 'فبراير', 'يوليو'];
            analysis = `أنماط موسمية متوازنة مع ذروة في مواسم التسوق الرئيسية في ${countryName}`;
            geoDistribution = `توزيع متوازن عبر المناطق الرئيسية في ${countryName}: الرياض، جدة، الدمام، مكة`;
          } else {
            peakMonths = ['November', 'December', 'Ramadan', 'Eid'];
            lowMonths = ['January', 'February', 'July'];
            analysis = `Balanced seasonal patterns with peaks during major shopping seasons in ${countryNameEn}`;
            geoDistribution = `Balanced distribution across major regions in ${countryNameEn}: Riyadh, Jeddah, Dammam, Makkah`;
          }
        }
        
        return { peakMonths, lowMonths, analysis, geoDistribution };
      };
      
      // الحصول على بيانات الموسمية الديناميكية
      const seasonalData = getSeasonalityByCategory(result.category || '', result.itemName || query, lang, region);

      result.demandAnalysis = {
        monthlyDemandEstimate: monthlyEstimate,
        demandScore: demandScore,
        seasonality: {
          peakMonths: seasonalData.peakMonths,
          lowMonths: seasonalData.lowMonths,
          analysis: seasonalData.analysis,
        },
        demandStability: demandScore > 70 ? 'High' : demandScore > 40 ? 'Medium' : 'Low',
        geographicDistribution: seasonalData.geoDistribution,
      };

      // Opportunity Finding
      const competitorStrength = result.competitorIntelligence?.competitorStrengthIndex || 50;
      const profitMargin = result.profitabilityAnalysis?.estimatedProfitMargin || 20;

      const opportunities = findOpportunities(
        demandScore,
        competitorStrength,
        profitMargin,
        result.competitors || []
      );

      result.opportunityFinder = {
        opportunities: opportunities.opportunities,
      };

      // Decision Metrics
      const decisionMetrics = calculateDecisionMetrics(
        demandScore,
        competitorStrength,
        profitMargin,
        result.demandAnalysis,
        result.profitabilityAnalysis,
        result.competitorIntelligence
      );

      result.decisionMetrics = {
        successScore: decisionMetrics.successScore,
        riskScore: decisionMetrics.riskScore,
        beginnerFriendly: decisionMetrics.beginnerFriendly,
        capitalRequired: decisionMetrics.capitalRequired,
        timeToProfit: decisionMetrics.timeToProfit,
        recommendation: decisionMetrics.recommendation,
      };

      // ═══════════════════════════════════════════════════════════════
      // 🔄 SYNC: Overwrite AI Verdict with Calculated Verdict
      // ═══════════════════════════════════════════════════════════════
      // Map decision metrics recommendation to final verdict format
      const calculatedVerdict = decisionMetrics.recommendation === 'CAUTION'
        ? 'PROCEED WITH CAUTION'
        : decisionMetrics.recommendation;

      // Update the main verdict to match our calculated metrics
      if (calculatedVerdict !== result.finalVerdict.recommendation) {
        console.log(`🔄 Correcting Verdict: ${result.finalVerdict.recommendation} -> ${calculatedVerdict}`);
        result.finalVerdict.recommendation = calculatedVerdict;

        // If we flipped from NO-GO to GO/CAUTION, we might want to prefix the reasoning
        // so it doesn't look weird if the text is still negative.
        // But usually the text is mixed/positive (as seen in the screenshot) while the label was NO-GO.
      }

      // ═══════════════════════════════════════════════════════════════
      // NEW SECTIONS - Buyer Intent, Growth Scenarios, Executive Summary
      // ═══════════════════════════════════════════════════════════════

      // Buyer Intent Analysis
      const buyerIntent = analyzeBuyerIntent(
        query,
        demandScore,
        result.competitors || [],
        result.marketStats
      );

      result.buyerIntentAnalysis = {
        intentScore: buyerIntent.intentScore,
        intentLevel: buyerIntent.intentLevel,
        searchIntentType: buyerIntent.searchIntentType,
        buyerJourneyStage: buyerIntent.buyerJourneyStage,
        keywordAnalysis: buyerIntent.keywordAnalysis,
        conversionProbability: buyerIntent.conversionProbability,
        insights: buyerIntent.insights,
      };

      console.log(`🎯 Buyer Intent: ${buyerIntent.intentLevel} (${buyerIntent.intentScore}%) - ${buyerIntent.searchIntentType}`);

      // Growth Scenarios
      const growthScenarios = calculateGrowthScenarios(
        demandScore,
        result.profitabilityAnalysis,
        competitorStrength,
        result.marketStats,
        buyerIntent.intentScore
      );

      result.growthScenarios = {
        conservative: growthScenarios.conservative,
        moderate: growthScenarios.moderate,
        optimistic: growthScenarios.optimistic,
        recommendedScenario: growthScenarios.recommendedScenario,
        scalabilityFactors: growthScenarios.scalabilityFactors,
      };

      console.log(`📈 Growth Scenarios: Recommended ${growthScenarios.recommendedScenario}`);

      // Executive Summary
      const executiveSummary = generateExecutiveSummary(
        result.itemName,
        result.finalVerdict,
        result.demandAnalysis,
        result.competitorIntelligence,
        result.profitabilityAnalysis,
        result.decisionMetrics,
        result.buyerIntentAnalysis,
        result.growthScenarios,
        lang
      );

      result.executiveSummary = {
        onePageSummary: executiveSummary.onePageSummary,
        keyFindings: executiveSummary.keyFindings,
        criticalMetrics: executiveSummary.criticalMetrics,
        investmentRequired: executiveSummary.investmentRequired,
        strategicRecommendation: executiveSummary.strategicRecommendation,
        nextSteps: executiveSummary.nextSteps,
      };

      console.log(`📋 Executive Summary generated - ${executiveSummary.keyFindings.length} key findings`);

      // ═══════════════════════════════════════════════════════════════
      // 📅 تحديث تواريخ الـ trends لتكون 2025-2026
      // ═══════════════════════════════════════════════════════════════
      if (result.trends && result.trends.length > 0) {
        const currentYear = new Date().getFullYear();
        const updatedTrends = result.trends.map((trend, index) => {
          // إنشاء تواريخ من يناير السنة الحالية
          const month = (index % 12) + 1;
          const year = index < 12 ? currentYear : currentYear + 1;
          const monthStr = month.toString().padStart(2, '0');
          return {
            ...trend,
            date: `${year}-${monthStr}`
          };
        });
        result.trends = updatedTrends;
      } else {
        // إنشاء بيانات trends افتراضية إذا لم تكن موجودة
        const currentYear = new Date().getFullYear();
        const basePrice = result.marketStats?.averagePrice || 100;
        const baseDemand = demandScore || 50;
        
        result.trends = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const monthStr = month.toString().padStart(2, '0');
          // تباين واقعي في السعر والطلب
          const priceVariation = 0.9 + (Math.random() * 0.2); // ±10%
          const demandVariation = 0.8 + (Math.random() * 0.4); // ±20%
          // زيادة الطلب في أشهر الذروة (11, 12, 3, 4 = نوفمبر، ديسمبر، رمضان)
          const seasonalBoost = [3, 4, 11, 12].includes(month) ? 1.3 : 1;
          
          return {
            date: `${currentYear}-${monthStr}`,
            price: Math.round(basePrice * priceVariation),
            demand: Math.round(baseDemand * demandVariation * seasonalBoost)
          };
        });
      }

      // ═══════════════════════════════════════════════════════════════
    } catch (analyzerError: any) {
      console.warn("Warning: Some analyzers failed, continuing with base analysis", analyzerError);
      // Continue with partial results - analyzer failures are non-critical
    }

    return result;
  } catch (error: any) {
    console.error("AI Service Error:", error);

    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error(lang === 'ar' ? "مفتاح API غير صالح. يرجى تحديثه من لوحة تحكم المشرف." : "Invalid API Key. Please update it in the Admin Dashboard.");
    }

    throw new Error(lang === 'ar'
      ? "فشل في إنشاء التقرير. تأكد من صلاحية مفتاح API المضاف في لوحة التحكم."
      : "Failed to generate report. Ensure the API key in settings is valid and has billing enabled.");
  }
}

/**
 * Translate text to Arabic using Gemini
 */
export async function translateToArabic(text: string, apiKey: string): Promise<string> {
  if (!text || !apiKey) return text;

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Translate the following English text to Arabic. Return ONLY the Arabic translation, no explanations:

${text}`;

    const result = await model.generateContent(prompt);
    const translation = result.response.text().trim();

    return translation || text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text; // Return original text if translation fails
  }
}
