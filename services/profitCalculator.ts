/**
 * Profit Calculator Service
 * حساب الربحية والهوامش والإيرادات المتوقعة
 */

export interface ProfitabilityResult {
  averageSalePrice: number;
  estimatedProfitMargin: number;
  breakEvenPoint: number;
  profitabilityScore: number;
  priceSensitivity: string;
  estimatedMonthlyRevenue: string;
  costBreakdown: {
    productCost: number;
    shippingCost: number;
    platformFee: number;
    marginPercentage: number;
  };
  breakEvenAnalysis: {
    unitsSoldNeeded: number;
    monthsToBreakEven: number;
    estimatedCapital: number;
  };
  profitabilityLevels: {
    conservative: number;
    moderate: number;
    optimistic: number;
  };
  // New fields for transparency
  revenueBreakdown?: {
    estimatedMonthlyUnits: number;
    averagePrice: number;
    totalRevenue: number;
    demandBasis: string; // e.g., "Medium demand"
  };
  profitPerUnit?: number;
}

/**
 * Calculate profitability metrics
 * حساب مقاييس الربحية
 */
export function calculateProfitability(
  marketStats: any,
  competitors: any[],
  demandScore: number,
  lang: 'ar' | 'en' = 'en'
): ProfitabilityResult {
  // Get average sale price
  const averageSalePrice =
    marketStats?.averagePrice ||
    (competitors && competitors.length > 0
      ? competitors.reduce((sum: number, c: any) => sum + (c.price || 0), 0) /
      competitors.length
      : 100);

  // Cost assumptions (in SAR)
  const productCostPercentage = 0.4; // 40% of sale price
  const shippingCostPercentage = 0.05; // 5% of sale price (average)
  const platformFeePercentage = 0.05; // 5% of sale price

  const productCost = averageSalePrice * productCostPercentage;
  const shippingCost = averageSalePrice * shippingCostPercentage;
  const platformFee = averageSalePrice * platformFeePercentage;

  const totalCost = productCost + shippingCost + platformFee;
  const profitPerUnit = averageSalePrice - totalCost;
  const profitMarginPercentage = (profitPerUnit / averageSalePrice) * 100;

  // Price sensitivity analysis
  const competitorPrices = competitors
    ?.filter((c: any) => c.price > 0)
    .map((c: any) => c.price) || [];

  let priceSensitivity = lang === 'ar' ? 'متوسط' : 'Medium';
  if (competitorPrices.length > 1) {
    const priceStdDev =
      Math.sqrt(
        competitorPrices.reduce(
          (sum: number, price: number) => sum + Math.pow(price - averageSalePrice, 2),
          0
        ) / competitorPrices.length
      ) / averageSalePrice;

    if (priceStdDev > 0.15) {
      priceSensitivity = lang === 'ar'
        ? 'مرتفع - يُنصح بالتسعير التنافسي'
        : 'High - Consider competitive pricing';
    } else if (priceStdDev < 0.05) {
      priceSensitivity = lang === 'ar'
        ? 'منخفض - سوق بأسعار موحدة'
        : 'Low - Standardized pricing market';
    }
  }

  // Break-even calculation
  // Assumptions: Fixed costs SAR 2000/month, variable cost already in COGS
  const monthlyFixedCosts = 2000;
  const contributionMargin = profitPerUnit;
  const breakEvenUnits = Math.ceil(monthlyFixedCosts / contributionMargin);
  const monthsToBreakEven = Math.max(1, Math.ceil(2 / (demandScore / 100)));

  // Revenue estimation based on demand score
  // High demand: 50-100 units/month
  // Medium demand: 20-50 units/month
  // Low demand: 5-20 units/month
  const demandPercentage = demandScore / 100;
  const estimatedMonthlyUnits = Math.max(
    5,
    Math.round(demandPercentage * 75)
  );
  const estimatedMonthlyRevenue = estimatedMonthlyUnits * averageSalePrice;

  // Profitability score (0-100)
  const marginScore = Math.min((profitMarginPercentage / 40) * 100, 100);
  const demandFactor = demandScore;
  const competitionScore = 100 - Math.min((competitors?.length || 0) * 5, 50);

  const profitabilityScore = Math.round(
    marginScore * 0.4 + demandFactor * 0.35 + competitionScore * 0.25
  );

  // Conservative, Moderate, Optimistic scenarios
  const profitabilityLevels = {
    conservative: Math.round(
      (estimatedMonthlyUnits * 0.5 - breakEvenUnits) * profitPerUnit
    ),
    moderate: Math.round(estimatedMonthlyUnits * profitPerUnit),
    optimistic: Math.round(
      (estimatedMonthlyUnits * 1.5 - breakEvenUnits) * profitPerUnit
    ),
  };

  // Ensure non-negative values
  profitabilityLevels.conservative = Math.max(
    profitabilityLevels.conservative,
    0
  );

  // Determine demand basis label
  let demandBasis = lang === 'ar' ? 'متوسط' : 'Medium';
  if (demandScore >= 80) {
    demandBasis = lang === 'ar' ? 'مرتفع جداً' : 'Very High';
  } else if (demandScore >= 60) {
    demandBasis = lang === 'ar' ? 'مرتفع' : 'High';
  } else if (demandScore < 40) {
    demandBasis = lang === 'ar' ? 'منخفض' : 'Low';
  }

  return {
    averageSalePrice: Math.round(averageSalePrice),
    estimatedProfitMargin: Math.round(profitMarginPercentage),
    breakEvenPoint: breakEvenUnits,
    profitabilityScore: Math.max(0, Math.min(100, profitabilityScore)),
    priceSensitivity,
    estimatedMonthlyRevenue: `SAR ${Math.round(estimatedMonthlyRevenue).toLocaleString()}`,
    costBreakdown: {
      productCost: Math.round(productCost),
      shippingCost: Math.round(shippingCost),
      platformFee: Math.round(platformFee),
      marginPercentage: Math.round(profitMarginPercentage),
    },
    breakEvenAnalysis: {
      unitsSoldNeeded: breakEvenUnits,
      monthsToBreakEven: monthsToBreakEven,
      estimatedCapital: Math.round(
        monthlyFixedCosts * monthsToBreakEven + productCost * breakEvenUnits
      ),
    },
    profitabilityLevels,
    revenueBreakdown: {
      estimatedMonthlyUnits: estimatedMonthlyUnits,
      averagePrice: Math.round(averageSalePrice),
      totalRevenue: Math.round(estimatedMonthlyRevenue),
      demandBasis: demandBasis,
    },
    profitPerUnit: Math.round(profitPerUnit),
  };
}
