/**
 * Opportunity Finder Service
 * اكتشاف الفرص المحتملة في السوق
 */

export interface Opportunity {
  type: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  potentialScore: number;
  actionItems?: string[];
  metrics?: {
    priceGap?: string;
    avgCompetitorPrice?: string;
    suggestedPrice?: string;
    marketSize?: string;
    competitorCount?: number;
    avgRating?: number;
    estimatedRevenue?: string;
  };
}

export interface OpportunityFinderResult {
  opportunities: Opportunity[];
  totalOpportunitiesFound: number;
  bestOpportunity?: Opportunity;
  opportunityMap: {
    greenZone: number;
    priceGap: number;
    contentQuality: number;
    emerging: number;
  };
}

/**
 * Find market opportunities based on multiple factors
 * اكتشاف فرص السوق بناءً على عوامل متعددة
 */
export function findOpportunities(
  demandScore: number,
  competitorStrength: number,
  profitMargin: number,
  competitors: any[]
): OpportunityFinderResult {
  const opportunities: Opportunity[] = [];

  // Opportunity 1: Green Zone - High demand + Weak competition
  if (demandScore > 60 && competitorStrength < 50) {
    const potentialScore = Math.round(
      (demandScore * 0.6 + (100 - competitorStrength) * 0.4)
    );
    opportunities.push({
      type: 'green',
      title: 'Green Zone Opportunity',
      titleAr: 'فرصة المنطقة الخضراء',
      description:
        'High demand market with weak competitive presence. Ideal for market entry.',
      descriptionAr:
        'سوق عالي الطلب مع وجود منافسة ضعيفة. مثالي لدخول السوق.',
      potentialScore,
      actionItems: [
        'Enter market quickly before competitors strengthen',
        'Build brand presence and customer loyalty',
        'Focus on quality and customer service to establish dominance',
      ],
    });
  }

  // Opportunity 2: Price Gap - High margin + High competitor prices
  if (profitMargin > 30 && competitors && competitors.length > 2) {
    const competitorPrices = competitors
      .filter((c: any) => c.price > 0)
      .map((c: any) => c.price);

    if (competitorPrices.length > 0) {
      const avgCompetitorPrice =
        competitorPrices.reduce((a: number, b: number) => a + b) /
        competitorPrices.length;
      const priceGap = (avgCompetitorPrice * profitMargin) / 100;

      if (priceGap > avgCompetitorPrice * 0.2) {
        const potentialScore = Math.round(Math.min(profitMargin * 1.5, 100));
        const suggestedPrice = Math.round(avgCompetitorPrice * 0.8); // 20% lower than average

        opportunities.push({
          type: 'priceGap',
          title: 'Price Gap Opportunity',
          titleAr: 'فرصة الفجوة السعرية',
          description:
            `Significant price gap identified. Average competitor price is ${avgCompetitorPrice.toFixed(0)} SAR. You can sell at ${suggestedPrice} SAR with ${profitMargin}% margin.`,
          descriptionAr:
            `تم تحديد فجوة سعرية كبيرة. متوسط سعر المنافسين ${avgCompetitorPrice.toFixed(0)} ر.س. يمكنك البيع بـ ${suggestedPrice} ر.س مع هامش ${profitMargin}%.`,
          potentialScore,
          metrics: {
            avgCompetitorPrice: `${avgCompetitorPrice.toFixed(0)} ر.س`,
            suggestedPrice: `${suggestedPrice} ر.س`,
            priceGap: `${(avgCompetitorPrice - suggestedPrice).toFixed(0)} ر.س`,
            competitorCount: competitors.length,
          },
          actionItems: [
            'Implement premium positioning strategy',
            'Emphasize unique value proposition',
            'Target quality-conscious customers willing to pay more',
          ],
        });
      }
    }
  }

  // Opportunity 3: Content Quality Gap - Low ratings but high demand
  if (demandScore > 50 && competitors && competitors.length > 0) {
    const avgRating =
      competitors.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) /
      competitors.length;

    if (avgRating < 3.5) {
      const potentialScore = Math.round(50 + (demandScore - avgRating * 20));
      opportunities.push({
        type: 'contentQuality',
        title: 'Content Quality Opportunity',
        titleAr: 'فرصة جودة المحتوى',
        description:
          `Competitors have low ratings (${avgRating.toFixed(1)}/5) despite high demand. Excellence in customer service and product quality can capture market share.`,
        descriptionAr:
          `المنافسون لديهم تقييمات منخفضة (${avgRating.toFixed(1)}/5) رغم الطلب العالي. التفوق في خدمة العملاء والجودة يمكنه الاستيلاء على حصة السوق.`,
        potentialScore: Math.max(0, Math.min(100, potentialScore)),
        metrics: {
          avgRating: avgRating,
          competitorCount: competitors.length,
        },
        actionItems: [
          'Focus on customer experience and satisfaction',
          'Build strong reviews and testimonials',
          'Emphasize quality control and product excellence',
          'Implement superior after-sales service',
        ],
      });
    }
  }

  // Opportunity 4: Emerging Category - Growing demand pattern
  if (demandScore > 40 && demandScore < 70 && competitorStrength < 60) {
    const potentialScore = Math.round(
      40 + (demandScore - 50) * 2 + (100 - competitorStrength) * 0.5
    );
    const estimatedMonthlyUnits = Math.round((demandScore / 100) * 2000); // Estimate based on demand

    opportunities.push({
      type: 'emerging',
      title: 'Emerging Market Opportunity',
      titleAr: 'فرصة السوق الناشئ',
      description:
        `Category showing growth potential with manageable competition. Estimated ${estimatedMonthlyUnits} units/month market size with ${competitors?.length || 0} active competitors.`,
      descriptionAr:
        `فئة تظهر إمكانية نمو مع منافسة قابلة للإدارة. حجم سوق مقدر ${estimatedMonthlyUnits} وحدة/شهر مع ${competitors?.length || 0} منافسين نشطين.`,
      potentialScore: Math.max(0, Math.min(100, potentialScore)),
      metrics: {
        marketSize: `${estimatedMonthlyUnits} وحدة/شهر`,
        competitorCount: competitors?.length || 0,
      },
      actionItems: [
        'Build brand awareness early in market development',
        'Invest in content marketing and education',
        'Establish partnerships with complementary services',
        'Create community and customer loyalty programs',
      ],
    });
  }

  // Opportunity 5: Niche Specialization - Low demand but high margin
  if (demandScore < 40 && profitMargin > 35 && competitorStrength < 40) {
    const potentialScore = Math.round(
      (profitMargin * 0.7 + (100 - competitorStrength) * 0.3)
    );
    opportunities.push({
      type: 'niche',
      title: 'Niche Market Opportunity',
      titleAr: 'فرصة السوق المتخصصة',
      description:
        'Untapped niche market with high profitability potential. Requires targeted marketing to specific audience.',
      descriptionAr:
        'سوق متخصصة غير مستغلة مع إمكانية ربحية عالية. تتطلب تسويقاً موجهاً لجمهور محدد.',
      potentialScore: Math.min(100, potentialScore),
      actionItems: [
        'Target specific customer segments with precision marketing',
        'Build expertise and thought leadership in the niche',
        'Create exclusive products or services for the niche',
        'Develop partnerships within the niche community',
      ],
    });
  }

  // Sort by potential score
  opportunities.sort((a, b) => b.potentialScore - a.potentialScore);

  // Calculate opportunity map
  const opportunityMap = {
    greenZone: opportunities.filter((o) => o.type === 'green').length,
    priceGap: opportunities.filter((o) => o.type === 'priceGap').length,
    contentQuality: opportunities.filter((o) => o.type === 'contentQuality')
      .length,
    emerging: opportunities.filter((o) => o.type === 'emerging').length,
  };

  return {
    opportunities,
    totalOpportunitiesFound: opportunities.length,
    bestOpportunity:
      opportunities.length > 0 ? opportunities[0] : undefined,
    opportunityMap,
  };
}
