/**
 * Decision Metrics Service
 * حساب مقاييس القرار والتوصيات النهائية
 */

export interface DecisionMetricsResult {
  successScore: number;
  riskScore: number;
  beginnerFriendly: boolean;
  capitalRequired: string;
  timeToProfit: string;
  recommendation: 'GO' | 'NO-GO' | 'CAUTION';
  detailedAnalysis: {
    demandFactor: number;
    competitionFactor: number;
    profitFactor: number;
    riskFactors: string[];
    confidenceLevel: 'High' | 'Medium' | 'Low';
  };
  viabilityChecklist: {
    item: string;
    status: 'PASS' | 'FAIL' | 'WARN';
  }[];
}

/**
 * Calculate decision metrics and recommendations
 * حساب مقاييس القرار والتوصيات
 */
export function calculateDecisionMetrics(
  demandScore: number,
  competitorStrength: number,
  profitMargin: number,
  demandAnalysisData?: any,
  profitabilityData?: any,
  competitorData?: any
): DecisionMetricsResult {
  // Normalize inputs (0-100 scale)
  const demandFactor = Math.max(0, Math.min(100, demandScore));
  const competitionFactor = Math.max(0, Math.min(100, 100 - competitorStrength));
  const profitFactor = Math.max(0, Math.min(100, profitMargin * 2));

  // Calculate success score (weighted)
  // 30% demand, 30% competition, 40% profitability
  const successScore = Math.round(
    demandFactor * 0.3 + competitionFactor * 0.3 + profitFactor * 0.4
  );

  // Calculate risk score (inverse of success score with additional factors)
  let riskScore = Math.round(100 - successScore);

  // Adjust risk based on market saturation
  const competitorCount = competitorData?.activeCompetitors || 5;
  if (competitorCount > 15) {
    riskScore = Math.min(100, riskScore + 15);
  } else if (competitorCount > 10) {
    riskScore = Math.min(100, riskScore + 10);
  }

  // Determine capital requirements - معيارية محسّنة وأكثر واقعية
  // استخراج البيانات من تحليل الربحية
  const averagePrice = profitabilityData?.averageSalePrice || 100;
  const productCost = profitabilityData?.costBreakdown?.productCost || (averagePrice * 0.4);
  const estimatedMonthlyUnits = profitabilityData?.revenueBreakdown?.estimatedMonthlyUnits || 30;
  const monthsToBreakEven = profitabilityData?.breakEvenAnalysis?.monthsToBreakEven || 3;
  
  // حساب رأس المال المطلوب بشكل واقعي
  // 1. مخزون أولي (3 أشهر من المبيعات المتوقعة)
  const inventoryMonths = 3;
  const initialInventoryCost = productCost * estimatedMonthlyUnits * inventoryMonths;
  
  // 2. تكاليف التسويق (15% من الإيرادات المتوقعة لأول 3 أشهر)
  const marketingBudget = averagePrice * estimatedMonthlyUnits * 0.15 * 3;
  
  // 3. مصاريف تشغيلية (اشتراكات، رسوم منصات، تخزين)
  const monthlyOperatingCosts = 1500; // ريال/شهر
  const operatingReserve = monthlyOperatingCosts * 3;
  
  // 4. احتياطي طوارئ (20% من المجموع)
  const subtotal = initialInventoryCost + marketingBudget + operatingReserve;
  const emergencyReserve = subtotal * 0.2;
  
  // إجمالي رأس المال المطلوب
  const estimatedCapital = Math.round(subtotal + emergencyReserve);

  let capitalRequired = '';
  let capitalRequiredAr = '';
  
  if (estimatedCapital < 5000) {
    capitalRequired = 'Very Low (< SAR 5,000)';
    capitalRequiredAr = 'منخفض جداً (< 5,000 ر.س)';
  } else if (estimatedCapital < 15000) {
    capitalRequired = 'Low (SAR 5,000 - 15,000)';
    capitalRequiredAr = 'منخفض (5,000 - 15,000 ر.س)';
  } else if (estimatedCapital < 30000) {
    capitalRequired = 'Medium (SAR 15,000 - 30,000)';
    capitalRequiredAr = 'متوسط (15,000 - 30,000 ر.س)';
  } else if (estimatedCapital < 50000) {
    capitalRequired = 'High (SAR 30,000 - 50,000)';
    capitalRequiredAr = 'مرتفع (30,000 - 50,000 ر.س)';
  } else if (estimatedCapital < 100000) {
    capitalRequired = 'Very High (SAR 50,000 - 100,000)';
    capitalRequiredAr = 'مرتفع جداً (50,000 - 100,000 ر.س)';
  } else {
    capitalRequired = 'Enterprise (> SAR 100,000)';
    capitalRequiredAr = 'مشاريع كبرى (> 100,000 ر.س)';
  }

  // Determine beginner friendly - معايير محسّنة
  // مناسب للمبتدئين إذا: رأس مال منخفض + منافسة معتدلة + ربحية جيدة + وقت قصير للربح
  const beginnerFriendly =
    estimatedCapital < 25000 &&
    competitionFactor > 45 &&
    profitFactor > 30 &&
    monthsToBreakEven <= 4;

  // Calculate time to profit - حساب محسّن للوقت للربح
  // بناءً على الأرباح الشهرية المتوقعة مقارنة برأس المال المستثمر
  const monthlyNetProfit = profitabilityData?.profitabilityLevels?.moderate || 
    (estimatedMonthlyUnits * (averagePrice * 0.5) * 0.3); // تقدير: 30% هامش ربح صافي
  
  // الوقت للربح = رأس المال / الأرباح الشهرية
  const monthsToProfit = monthlyNetProfit > 0
    ? Math.max(1, Math.ceil(estimatedCapital / monthlyNetProfit))
    : 12;

  let timeToProfit = '';
  if (monthsToProfit <= 2) {
    timeToProfit = '1-2 months (Very Fast)';
  } else if (monthsToProfit <= 4) {
    timeToProfit = '2-4 months (Fast)';
  } else if (monthsToProfit <= 6) {
    timeToProfit = '4-6 months (Moderate)';
  } else if (monthsToProfit <= 9) {
    timeToProfit = '6-9 months (Average)';
  } else if (monthsToProfit <= 12) {
    timeToProfit = '9-12 months (Slow)';
  } else if (monthsToProfit <= 18) {
    timeToProfit = '12-18 months (Very Slow)';
  } else {
    timeToProfit = '18+ months (Long-term)';
  }

  // Identify risk factors
  const riskFactors: string[] = [];

  if (demandFactor < 30) {
    riskFactors.push('Very low demand - High volume needed to profitability');
  } else if (demandFactor < 50) {
    riskFactors.push('Moderate demand - Requires effective marketing');
  }

  if (competitorStrength > 70) {
    riskFactors.push(
      'Strong competition - Difficult to gain market share'
    );
  } else if (competitorStrength > 50) {
    riskFactors.push('Moderate competition - Need differentiation strategy');
  }

  if (profitMargin < 15) {
    riskFactors.push(
      'Low profit margins - High volume required for viability'
    );
  }

  if (competitorCount > 20) {
    riskFactors.push(
      'Highly saturated market - Difficult for new entrants'
    );
  }

  if (monthsToProfit > 12) {
    riskFactors.push('Long time to profitability - Requires sustained funding');
  }

  // Build viability checklist
  const viabilityChecklist: Array<{
    item: string;
    status: 'PASS' | 'FAIL' | 'WARN';
  }> = [
    {
      item: 'Market Demand (> 50 score)',
      status: demandFactor > 50 ? 'PASS' : demandFactor > 30 ? 'WARN' : 'FAIL',
    },
    {
      item: 'Competitive Pressure (< 60 strength)',
      status:
        competitorStrength < 60 ? 'PASS' : competitorStrength < 75 ? 'WARN' : 'FAIL',
    },
    {
      item: 'Profit Potential (> 20% margin)',
      status: profitMargin > 20 ? 'PASS' : profitMargin > 10 ? 'WARN' : 'FAIL',
    },
    {
      item: 'Capital Efficiency (< SAR 30,000)',
      status:
        estimatedCapital < 30000
          ? 'PASS'
          : estimatedCapital < 50000
            ? 'WARN'
            : 'FAIL',
    },
    {
      item: 'Time to ROI (< 6 months)',
      status:
        monthsToProfit < 6 ? 'PASS' : monthsToProfit < 12 ? 'WARN' : 'FAIL',
    },
    {
      item: 'Market Saturation (< 15 competitors)',
      status:
        competitorCount < 15
          ? 'PASS'
          : competitorCount < 25
            ? 'WARN'
            : 'FAIL',
    },
  ];

  // Determine recommendation
  let recommendation: 'GO' | 'NO-GO' | 'CAUTION' = 'GO';
  let confidenceLevel: 'High' | 'Medium' | 'Low' = 'High';

  if (successScore >= 70) {
    recommendation = 'GO';
    confidenceLevel = 'High';
  } else if (successScore >= 50) {
    recommendation = 'CAUTION';
    confidenceLevel = 'Medium';
  } else {
    recommendation = 'NO-GO';
    confidenceLevel = 'Low';
  }

  // Override if critical failures
  const failCount = viabilityChecklist.filter((item) => item.status === 'FAIL')
    .length;
  if (failCount >= 3) {
    recommendation = 'NO-GO';
    confidenceLevel = 'Low';
  } else if (failCount >= 2) {
    recommendation = 'CAUTION';
    confidenceLevel = 'Medium';
  }

  return {
    successScore: Math.max(0, Math.min(100, successScore)),
    riskScore: Math.max(0, Math.min(100, riskScore)),
    beginnerFriendly,
    capitalRequired,
    timeToProfit,
    recommendation,
    detailedAnalysis: {
      demandFactor,
      competitionFactor,
      profitFactor,
      riskFactors,
      confidenceLevel,
    },
    viabilityChecklist,
  };
}
