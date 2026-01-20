/**
 * Buyer Intent Analysis Service
 * تحليل نية الشراء وسلوك المشتري
 */

export interface BuyerIntentResult {
  intentScore: number;
  intentLevel: 'High' | 'Medium' | 'Low';
  searchIntentType: 'Transactional' | 'Informational' | 'Mixed';
  buyerJourneyStage: string;
  keywordAnalysis: {
    transactionalKeywords: string[];
    informationalKeywords: string[];
    brandKeywords: string[];
  };
  conversionProbability: number;
  insights: string[];
}

/**
 * Analyze buyer intent based on query and market data
 * تحليل نية الشراء بناءً على الاستعلام وبيانات السوق
 */
export function analyzeBuyerIntent(
  query: string,
  demandScore: number,
  competitors: any[],
  marketStats: any
): BuyerIntentResult {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim();

  // Define keyword patterns
  const transactionalKeywords = [
    'شراء', 'buy', 'سعر', 'price', 'متجر', 'store', 'طلب', 'order',
    'توصيل', 'delivery', 'أفضل', 'best', 'رخيص', 'cheap', 'عرض', 'offer',
    'كوبون', 'coupon', 'تخفيض', 'discount', 'الشحن', 'shipping'
  ];

  const informationalKeywords = [
    'ما هو', 'what is', 'كيف', 'how', 'لماذا', 'why', 'طريقة', 'method',
    'معلومات', 'information', 'شرح', 'explain', 'مراجعة', 'review',
    'مقارنة', 'comparison', 'فوائد', 'benefits', 'مميزات', 'features'
  ];

  const brandKeywords = [
    'نون', 'noon', 'امازون', 'amazon', 'علي اكسبرس', 'aliexpress',
    'سوق', 'souq', 'جرير', 'jarir', 'اكسترا', 'extra'
  ];

  // Analyze query for keyword types
  let transactionalCount = 0;
  let informationalCount = 0;
  let brandCount = 0;

  const foundTransactional: string[] = [];
  const foundInformational: string[] = [];
  const foundBrand: string[] = [];

  // First, find keywords that exist in the query
  transactionalKeywords.forEach(kw => {
    if (normalizedQuery.includes(kw)) {
      transactionalCount++;
      if (!foundTransactional.includes(kw)) {
        foundTransactional.push(kw);
      }
    }
  });

  informationalKeywords.forEach(kw => {
    if (normalizedQuery.includes(kw)) {
      informationalCount++;
      if (!foundInformational.includes(kw)) {
        foundInformational.push(kw);
      }
    }
  });

  brandKeywords.forEach(kw => {
    if (normalizedQuery.includes(kw)) {
      brandCount++;
      if (!foundBrand.includes(kw)) {
        foundBrand.push(kw);
      }
    }
  });

  // Generate additional relevant keywords based on the product/query
  // This ensures we always have meaningful keywords even if the query is short
  const productName = query.trim();
  const isArabic = /[\u0600-\u06FF]/.test(productName);

  // Generate transactional keywords
  if (foundTransactional.length < 5) {
    const suggestedTransactional = isArabic
      ? [
        `شراء ${productName}`,
        `سعر ${productName}`,
        `${productName} اون لاين`,
        `${productName} توصيل`,
        `افضل ${productName}`,
        `${productName} رخيص`,
        `عروض ${productName}`,
        `${productName} تخفيضات`
      ]
      : [
        `buy ${productName}`,
        `${productName} price`,
        `${productName} online`,
        `${productName} delivery`,
        `best ${productName}`,
        `cheap ${productName}`,
        `${productName} deals`,
        `${productName} discount`
      ];

    suggestedTransactional.forEach(kw => {
      if (foundTransactional.length < 8 && !foundTransactional.includes(kw)) {
        foundTransactional.push(kw);
      }
    });
  }

  // Generate informational keywords
  if (foundInformational.length < 5) {
    const suggestedInformational = isArabic
      ? [
        `ما هو ${productName}`,
        `مميزات ${productName}`,
        `مراجعة ${productName}`,
        `${productName} تجربة`,
        `فوائد ${productName}`,
        `${productName} مقارنة`
      ]
      : [
        `what is ${productName}`,
        `${productName} features`,
        `${productName} review`,
        `${productName} experience`,
        `${productName} benefits`,
        `${productName} comparison`
      ];

    suggestedInformational.forEach(kw => {
      if (foundInformational.length < 6 && !foundInformational.includes(kw)) {
        foundInformational.push(kw);
      }
    });
  }

  // Generate brand keywords based on competitors
  if (competitors && competitors.length > 0 && foundBrand.length < 3) {
    competitors.slice(0, 5).forEach(comp => {
      const storeName = comp.storeName || comp.name;
      if (storeName && foundBrand.length < 5) {
        const brandKw = isArabic
          ? `${productName} من ${storeName}`
          : `${productName} from ${storeName}`;
        if (!foundBrand.includes(brandKw)) {
          foundBrand.push(brandKw);
        }
      }
    });
  }

  // If still no brand keywords, add generic platform keywords
  if (foundBrand.length < 3) {
    const platformKeywords = isArabic
      ? [
        `${productName} نون`,
        `${productName} امازون`,
        `${productName} سوق`
      ]
      : [
        `${productName} noon`,
        `${productName} amazon`,
        `${productName} souq`
      ];

    platformKeywords.forEach(kw => {
      if (foundBrand.length < 5 && !foundBrand.includes(kw)) {
        foundBrand.push(kw);
      }
    });
  }

  // Determine search intent type
  let searchIntentType: 'Transactional' | 'Informational' | 'Mixed';
  if (transactionalCount > informationalCount * 2) {
    searchIntentType = 'Transactional';
  } else if (informationalCount > transactionalCount * 2) {
    searchIntentType = 'Informational';
  } else {
    searchIntentType = 'Mixed';
  }

  // Calculate intent score (0-100)
  // Higher score = stronger buying intent
  let intentScore = 50; // Base score

  // Boost for transactional keywords
  intentScore += transactionalCount * 10;

  // Boost for brand keywords (shows research stage)
  intentScore += brandCount * 5;

  // Penalty for informational keywords
  intentScore -= informationalCount * 5;

  // Boost based on demand score
  intentScore += (demandScore / 100) * 20;

  // Boost if competitors exist (market validation)
  if (competitors && competitors.length > 0) {
    intentScore += Math.min(competitors.length * 2, 20);
  }

  // Normalize to 0-100
  intentScore = Math.max(0, Math.min(100, intentScore));

  // Determine intent level
  let intentLevel: 'High' | 'Medium' | 'Low';
  if (intentScore >= 70) {
    intentLevel = 'High';
  } else if (intentScore >= 40) {
    intentLevel = 'Medium';
  } else {
    intentLevel = 'Low';
  }

  // Determine buyer journey stage
  let buyerJourneyStage: string;
  if (searchIntentType === 'Informational') {
    buyerJourneyStage = 'Awareness / Research Stage';
  } else if (searchIntentType === 'Mixed') {
    buyerJourneyStage = 'Consideration / Evaluation Stage';
  } else {
    buyerJourneyStage = 'Decision / Purchase Stage';
  }

  // Calculate conversion probability
  let conversionProbability = 0;
  if (intentLevel === 'High') {
    conversionProbability = 0.60 + (Math.random() * 0.15); // 60-75%
  } else if (intentLevel === 'Medium') {
    conversionProbability = 0.30 + (Math.random() * 0.15); // 30-45%
  } else {
    conversionProbability = 0.10 + (Math.random() * 0.15); // 10-25%
  }

  // Generate insights
  const insights: string[] = [];

  if (intentLevel === 'High') {
    insights.push('نية شراء قوية - العملاء جاهزون للشراء الآن');
    insights.push('High buying intent - Customers are ready to purchase now');
    insights.push('ركز على تحسين تجربة الشراء والدفع');
    insights.push('Focus on optimizing checkout and payment experience');
  } else if (intentLevel === 'Medium') {
    insights.push('العملاء في مرحلة المقارنة والتقييم');
    insights.push('Customers are in comparison and evaluation stage');
    insights.push('قدم محتوى مقارن ومراجعات موثوقة');
    insights.push('Provide comparison content and trusted reviews');
  } else {
    insights.push('العملاء في مرحلة البحث الأولية');
    insights.push('Customers are in early research stage');
    insights.push('استثمر في المحتوى التعليمي والتوعية');
    insights.push('Invest in educational content and awareness');
  }

  if (searchIntentType === 'Transactional') {
    insights.push('استعلامات شرائية مباشرة - احتمالية تحويل عالية');
    insights.push('Direct purchase queries - High conversion probability');
  }

  if (brandCount > 0) {
    insights.push('البحث يشمل علامات تجارية محددة - عملاء متقدمون في رحلة الشراء');
    insights.push('Search includes specific brands - Advanced in buyer journey');
  }

  if (competitors.length > 5) {
    insights.push('المنافسة العالية تشير إلى طلب قوي ووعي بالمنتج');
    insights.push('High competition indicates strong demand and product awareness');
  }

  return {
    intentScore: Math.round(intentScore),
    intentLevel,
    searchIntentType,
    buyerJourneyStage,
    keywordAnalysis: {
      transactionalKeywords: foundTransactional.slice(0, 8),
      informationalKeywords: foundInformational.slice(0, 6),
      brandKeywords: foundBrand.slice(0, 5),
    },
    conversionProbability: Math.round(conversionProbability * 100) / 100,
    insights,
  };
}
