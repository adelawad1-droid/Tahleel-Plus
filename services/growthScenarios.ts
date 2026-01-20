/**
 * Growth Scenarios Service
 * خدمة سيناريوهات النمو المتوقعة
 */

export interface GrowthScenariosResult {
  conservative: {
    monthlyRevenue: number;
    monthlyProfit: number;
    growthRate: number;
    timeframe: string;
    assumptions: string[];
    costBreakdown?: {
      productCosts: number;
      marketingBudget: number;
      operationalExpenses: number;
      totalCosts: number;
      unitsSold: number;
    };
  };
  moderate: {
    monthlyRevenue: number;
    monthlyProfit: number;
    growthRate: number;
    timeframe: string;
    assumptions: string[];
    costBreakdown?: {
      productCosts: number;
      marketingBudget: number;
      operationalExpenses: number;
      totalCosts: number;
      unitsSold: number;
    };
  };
  optimistic: {
    monthlyRevenue: number;
    monthlyProfit: number;
    growthRate: number;
    timeframe: string;
    assumptions: string[];
    costBreakdown?: {
      productCosts: number;
      marketingBudget: number;
      operationalExpenses: number;
      totalCosts: number;
      unitsSold: number;
    };
  };
  recommendedScenario: 'conservative' | 'moderate' | 'optimistic';
  scalabilityFactors: string[];
}

/**
 * Calculate growth scenarios based on market data
 * حساب سيناريوهات النمو بناءً على بيانات السوق
 */
export function calculateGrowthScenarios(
  demandScore: number,
  profitabilityData: any,
  competitorStrength: number,
  marketStats: any,
  intentScore?: number
): GrowthScenariosResult {
  // ═══════════════════════════════════════════════════════════════
  // استخراج البيانات الفعلية من تحليل الربحية والسوق
  // ═══════════════════════════════════════════════════════════════
  
  // سعر المنتج الفعلي من تحليل السوق
  const averagePrice = profitabilityData?.averageSalePrice || marketStats?.averagePrice || 100;
  
  // هامش الربح الفعلي من تحليل الربحية
  const profitMargin = profitabilityData?.estimatedProfitMargin || 25;
  
  // تكلفة المنتج الفعلية من تحليل الربحية
  const productCostPerUnit = profitabilityData?.costBreakdown?.productCost || (averagePrice * 0.4);
  
  // تكلفة الشحن ورسوم المنصة
  const shippingCostPerUnit = profitabilityData?.costBreakdown?.shippingCost || (averagePrice * 0.05);
  const platformFeePerUnit = profitabilityData?.costBreakdown?.platformFee || (averagePrice * 0.05);
  
  // الربح لكل وحدة
  const profitPerUnit = profitabilityData?.profitPerUnit || (averagePrice - productCostPerUnit - shippingCostPerUnit - platformFeePerUnit);
  
  // الوحدات الشهرية المتوقعة من تحليل الربحية
  const baseMonthlyUnits = profitabilityData?.revenueBreakdown?.estimatedMonthlyUnits || Math.round((demandScore / 100) * 50);
  
  // ═══════════════════════════════════════════════════════════════
  // تعديل التقديرات بناءً على قوة المنافسة
  // ═══════════════════════════════════════════════════════════════
  const competitionMultiplier = competitorStrength > 70 ? 0.6 : competitorStrength > 50 ? 0.8 : 1.0;
  
  // ═══════════════════════════════════════════════════════════════
  // سيناريو متحفظ (Conservative)
  // ═══════════════════════════════════════════════════════════════
  const conservativeUnits = Math.max(5, Math.round(baseMonthlyUnits * 0.3 * competitionMultiplier));
  const conservativeRevenue = conservativeUnits * averagePrice;
  
  // تكاليف السيناريو المتحفظ
  const conservativeProductCosts = Math.round(conservativeUnits * productCostPerUnit);
  const conservativeShipping = Math.round(conservativeUnits * shippingCostPerUnit);
  const conservativePlatformFees = Math.round(conservativeUnits * platformFeePerUnit);
  const conservativeMarketing = Math.round(conservativeRevenue * 0.08); // 8% تسويق محدود
  const conservativeOperational = Math.round(1500 + (conservativeRevenue * 0.05)); // ثابت + متغير
  const conservativeTotalCosts = conservativeProductCosts + conservativeShipping + conservativePlatformFees + conservativeMarketing + conservativeOperational;
  const conservativeProfit = Math.max(0, conservativeRevenue - conservativeTotalCosts);
  const conservativeGrowthRate = 5;

  const conservativeAssumptions = [
    'بدء بطيء مع تركيز على تقليل المخاطر',
    'Slow start with focus on risk minimization',
    `بيع ${conservativeUnits} وحدة شهرياً في البداية`,
    `Selling ${conservativeUnits} units monthly initially`,
    `ميزانية تسويق محدودة: ${conservativeMarketing.toLocaleString()} ر.س/شهر`,
    `Limited marketing budget: SAR ${conservativeMarketing.toLocaleString()}/month`,
    `تكلفة الوحدة: ${Math.round(productCostPerUnit)} ر.س`,
    `Unit cost: SAR ${Math.round(productCostPerUnit)}`,
  ];

  // ═══════════════════════════════════════════════════════════════
  // سيناريو متوسط (Moderate)
  // ═══════════════════════════════════════════════════════════════
  const moderateUnits = Math.max(15, Math.round(baseMonthlyUnits * 0.6 * competitionMultiplier));
  const moderateRevenue = moderateUnits * averagePrice;
  
  // تكاليف السيناريو المتوسط
  const moderateProductCosts = Math.round(moderateUnits * productCostPerUnit);
  const moderateShipping = Math.round(moderateUnits * shippingCostPerUnit);
  const moderatePlatformFees = Math.round(moderateUnits * platformFeePerUnit);
  const moderateMarketing = Math.round(conservativeRevenue * 0.12); // 12% تسويق متوسط
  const moderateOperational = Math.round(2000 + (moderateRevenue * 0.04)); // ثابت + متغير (وفورات الحجم)
  const moderateTotalCosts = moderateProductCosts + moderateShipping + moderatePlatformFees + moderateMarketing + moderateOperational;
  const moderateProfit = Math.max(0, moderateRevenue - moderateTotalCosts);
  const moderateGrowthRate = 15;

  const moderateAssumptions = [
    'استراتيجية متوازنة بين النمو والحذر',
    'Balanced strategy between growth and caution',
    `بيع ${moderateUnits} وحدة شهرياً`,
    `Selling ${moderateUnits} units monthly`,
    `ميزانية تسويق متوسطة: ${moderateMarketing.toLocaleString()} ر.س/شهر`,
    `Moderate marketing budget: SAR ${moderateMarketing.toLocaleString()}/month`,
    `سعر البيع: ${Math.round(averagePrice)} ر.س`,
    `Selling price: SAR ${Math.round(averagePrice)}`,
  ];

  // ═══════════════════════════════════════════════════════════════
  // سيناريو متفائل (Optimistic)
  // ═══════════════════════════════════════════════════════════════
  const optimisticUnits = Math.max(30, Math.round(baseMonthlyUnits * competitionMultiplier));
  const optimisticRevenue = optimisticUnits * averagePrice;
  
  // تكاليف السيناريو المتفائل
  const optimisticProductCosts = Math.round(optimisticUnits * productCostPerUnit * 0.95); // خصم كمية 5%
  const optimisticShipping = Math.round(optimisticUnits * shippingCostPerUnit * 0.9); // خصم شحن 10%
  const optimisticPlatformFees = Math.round(optimisticUnits * platformFeePerUnit);
  const optimisticMarketing = Math.round(optimisticRevenue * 0.18); // 18% تسويق عدواني
  const optimisticOperational = Math.round(2500 + (optimisticRevenue * 0.03)); // ثابت + متغير (وفورات حجم أكبر)
  const optimisticTotalCosts = optimisticProductCosts + optimisticShipping + optimisticPlatformFees + optimisticMarketing + optimisticOperational;
  const optimisticProfit = Math.max(0, optimisticRevenue - optimisticTotalCosts);
  const optimisticGrowthRate = 30;

  const optimisticAssumptions = [
    'استراتيجية نمو عدوانية مع استثمار كبير',
    'Aggressive growth strategy with major investment',
    `بيع ${optimisticUnits} وحدة شهرياً`,
    `Selling ${optimisticUnits} units monthly`,
    `ميزانية تسويق قوية: ${optimisticMarketing.toLocaleString()} ر.س/شهر`,
    `Strong marketing budget: SAR ${optimisticMarketing.toLocaleString()}/month`,
    `هامش ربح متوقع: ${Math.round(profitMargin)}%`,
    `Expected profit margin: ${Math.round(profitMargin)}%`,
  ];

  // ═══════════════════════════════════════════════════════════════
  // تحديد السيناريو الموصى به
  // ═══════════════════════════════════════════════════════════════
  let recommendedScenario: 'conservative' | 'moderate' | 'optimistic';

  // Recommendation logic based on market conditions
  if (demandScore >= 70 && competitorStrength < 50 && profitMargin > 25) {
    // High demand, low competition, good margins → Optimistic
    recommendedScenario = 'optimistic';
  } else if (demandScore < 40 || competitorStrength > 70 || profitMargin < 15) {
    // Low demand or high competition or low margins → Conservative
    recommendedScenario = 'conservative';
  } else {
    // Moderate conditions → Moderate scenario
    recommendedScenario = 'moderate';
  }

  // If buyer intent is available, adjust recommendation
  if (intentScore) {
    if (intentScore >= 70) {
      // High intent can boost to optimistic
      if (recommendedScenario === 'conservative') {
        recommendedScenario = 'moderate';
      }
    } else if (intentScore < 40) {
      // Low intent should be more conservative
      if (recommendedScenario === 'optimistic') {
        recommendedScenario = 'moderate';
      }
    }
  }

  // Scalability factors
  const scalabilityFactors: string[] = [];

  if (demandScore > 60) {
    scalabilityFactors.push('طلب سوق قوي يدعم التوسع السريع');
    scalabilityFactors.push('Strong market demand supports rapid expansion');
  }

  if (profitMargin > 25) {
    scalabilityFactors.push('هوامش ربح جيدة تسمح بإعادة الاستثمار');
    scalabilityFactors.push('Good profit margins allow for reinvestment');
  }

  if (competitorStrength < 60) {
    scalabilityFactors.push('منافسة معتدلة تسهل دخول السوق');
    scalabilityFactors.push('Moderate competition facilitates market entry');
  }

  scalabilityFactors.push('إمكانية التوسع في منتجات مشابهة');
  scalabilityFactors.push('Potential to expand into similar products');

  scalabilityFactors.push('يمكن استخدام قنوات بيع متعددة (نون، أمازون، متجر خاص)');
  scalabilityFactors.push('Multiple sales channels available (Noon, Amazon, own store)');

  if (averagePrice < 500) {
    scalabilityFactors.push('منتج منخفض السعر يسهل البيع بكميات كبيرة');
    scalabilityFactors.push('Low-priced product facilitates high-volume sales');
  }

  return {
    conservative: {
      monthlyRevenue: Math.round(conservativeRevenue),
      monthlyProfit: Math.round(conservativeProfit),
      growthRate: conservativeGrowthRate,
      timeframe: '6-12 months',
      assumptions: conservativeAssumptions,
      costBreakdown: {
        productCosts: conservativeProductCosts,
        shippingCosts: conservativeShipping,
        platformFees: conservativePlatformFees,
        marketingBudget: conservativeMarketing,
        operationalExpenses: conservativeOperational,
        totalCosts: conservativeTotalCosts,
        unitsSold: conservativeUnits,
        pricePerUnit: Math.round(averagePrice),
        costPerUnit: Math.round(productCostPerUnit),
        profitPerUnit: Math.round(profitPerUnit),
      },
    },
    moderate: {
      monthlyRevenue: Math.round(moderateRevenue),
      monthlyProfit: Math.round(moderateProfit),
      growthRate: moderateGrowthRate,
      timeframe: '3-6 months',
      assumptions: moderateAssumptions,
      costBreakdown: {
        productCosts: moderateProductCosts,
        shippingCosts: moderateShipping,
        platformFees: moderatePlatformFees,
        marketingBudget: moderateMarketing,
        operationalExpenses: moderateOperational,
        totalCosts: moderateTotalCosts,
        unitsSold: moderateUnits,
        pricePerUnit: Math.round(averagePrice),
        costPerUnit: Math.round(productCostPerUnit),
        profitPerUnit: Math.round(profitPerUnit),
      },
    },
    optimistic: {
      monthlyRevenue: Math.round(optimisticRevenue),
      monthlyProfit: Math.round(optimisticProfit),
      growthRate: optimisticGrowthRate,
      timeframe: '1-3 months',
      assumptions: optimisticAssumptions,
      costBreakdown: {
        productCosts: optimisticProductCosts,
        shippingCosts: optimisticShipping,
        platformFees: optimisticPlatformFees,
        marketingBudget: optimisticMarketing,
        operationalExpenses: optimisticOperational,
        totalCosts: optimisticTotalCosts,
        unitsSold: optimisticUnits,
        pricePerUnit: Math.round(averagePrice),
        costPerUnit: Math.round(productCostPerUnit * 0.95), // خصم الكمية
        profitPerUnit: Math.round(profitPerUnit * 1.05), // ربح أعلى بفضل الوفورات
      },
    },
    recommendedScenario,
    scalabilityFactors,
  };
}
