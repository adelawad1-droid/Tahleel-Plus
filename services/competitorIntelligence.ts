/**
 * Competitor Intelligence Service
 * تحليل المنافسين والعلاقات التنافسية في السوق
 */

export interface CompetitorAnalysisResult {
  activeCompetitors: number;
  competitorStrengthIndex: number;
  topCompetitors: Array<{
    name: string;
    rating: number;
    price: number;
    strength: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  marketGaps: string[];
  entryDifficulty: 'Low' | 'Medium' | 'High';
  analysisDetails: {
    strengthBreakdown: {
      volumeWeight: number;
      ratingWeight: number;
      salesWeight: number;
    };
    competitiveIntensity: number;
    marketConcentration: number;
    consolidationLevel: string;
  };
}

/**
 * Analyze competitors and generate intelligence
 * تحليل المنافسين وإنشاء بيانات استخبارية
 * @param competitors list of detailed competitors
 * @param totalMarketCompetitors optional total count of found competitors in the market
 */
export function analyzeCompetitors(competitors: any[], totalMarketCompetitors?: number): CompetitorAnalysisResult {
  if (!competitors || competitors.length === 0) {
    return {
      activeCompetitors: totalMarketCompetitors || 0,
      competitorStrengthIndex: 0,
      topCompetitors: [],
      marketGaps: ['جميع الأسواق متاحة', 'No specific market gaps identified'],
      entryDifficulty: 'Low',
      analysisDetails: {
        strengthBreakdown: {
          volumeWeight: 0.4,
          ratingWeight: 0.3,
          salesWeight: 0.3,
        },
        competitiveIntensity: 0,
        marketConcentration: 0,
        consolidationLevel: 'Minimal',
      },
    };
  }

  // Filter active competitors (rating >= 2.5)
  const activeCompetitors = competitors.filter(
    (c) => c.rating && c.rating >= 2.5
  );

  // Calculate competitor strength index (weighted)
  const competitorScores = activeCompetitors.map((competitor) => {
    const volumeScore = Math.min((competitor.salesVolume || 0) / 1000, 100);
    const ratingScore = (competitor.rating || 0) * 20;
    const priceScore = competitor.price ? 50 : 0;

    const strengthIndex =
      volumeScore * 0.4 + ratingScore * 0.3 + priceScore * 0.3;

    return {
      ...competitor,
      strengthIndex: Math.min(strengthIndex, 100),
    };
  });

  // Get top 3 competitors
  const topCompetitors = competitorScores
    .sort((a, b) => b.strengthIndex - a.strengthIndex)
    .slice(0, 3)
    .map((c) => ({
      name: c.storeName || c.name || 'Unknown',
      rating: c.rating || 0,
      price: c.price || 0,
      strength: c.strengthIndex,
      strengths: [
        `Rating: ${c.rating || 0}/5`,
        `Price Point: SAR ${c.price || 0}`,
        `Supply: ${c.stockStatus || 'Available'}`,
      ],
      weaknesses: [
        'Limited market presence',
        'Competition from larger retailers',
      ],
    }));

  // Identify market gaps - تحليل فجوات السوق المحسّن
  const marketGaps: string[] = [];

  // 1. فجوة السوق غير المشبع
  if (competitorScores.length < 3) {
    marketGaps.push(
      'سوق غير مشبع - فرصة ذهبية للدخول المبكر'
    );
  } else if (competitorScores.length < 6) {
    marketGaps.push(
      'منافسة معتدلة - فرصة جيدة للتميز'
    );
  }

  // 2. فجوة جودة الخدمة
  const avgRating =
    competitorScores.reduce((sum, c) => sum + (c.rating || 0), 0) /
    competitorScores.length;
  if (avgRating < 3.5) {
    marketGaps.push(
      'ضعف شديد في جودة الخدمة - فرصة للتفوق بخدمة عملاء ممتازة'
    );
  } else if (avgRating < 4) {
    marketGaps.push(
      'جودة خدمة متوسطة - فرصة للتميز بتجربة عملاء أفضل'
    );
  }

  // 3. فجوة التسعير
  const priceRange = competitorScores.reduce(
    (acc, c) => {
      if (c.price && c.price > 0) {
        return {
          min: Math.min(acc.min, c.price),
          max: Math.max(acc.max, c.price),
        };
      }
      return acc;
    },
    { min: Infinity, max: 0 }
  );

  if (priceRange.min !== Infinity && priceRange.max > 0) {
    const priceGap = priceRange.max - priceRange.min;
    const avgPrice = (priceRange.max + priceRange.min) / 2;
    
    if (priceGap > priceRange.max * 0.5) {
      marketGaps.push(
        'تباين سعري كبير - فرصة للتموضع في شريحة سعرية محددة'
      );
    }
    
    // فجوة الشريحة الاقتصادية
    if (priceRange.min > avgPrice * 0.7) {
      marketGaps.push(
        'غياب المنتجات الاقتصادية - فرصة لاستهداف الشريحة الحساسة للسعر'
      );
    }
    
    // فجوة الشريحة الفاخرة
    if (priceRange.max < avgPrice * 1.5) {
      marketGaps.push(
        'غياب المنتجات الفاخرة - فرصة لاستهداف الشريحة المميزة'
      );
    }
  }

  // 4. فجوة الشحن والتوصيل
  const shippingData = competitorScores.filter(c => c.shippingDays && c.shippingDays > 0);
  if (shippingData.length > 0) {
    const avgShipping = shippingData.reduce((sum, c) => sum + (c.shippingDays || 5), 0) / shippingData.length;
    if (avgShipping > 3) {
      marketGaps.push(
        'بطء في التوصيل - فرصة للتميز بالشحن السريع (يوم-يومين)'
      );
    }
  } else {
    // لا توجد بيانات شحن واضحة
    marketGaps.push(
      'نقص في وضوح خيارات التوصيل - فرصة للتميز بشفافية الشحن'
    );
  }

  // 5. فجوة التوفر والمخزون
  const outOfStockCount = competitorScores.filter(
    c => c.stockStatus && (c.stockStatus.toLowerCase().includes('out') || c.stockStatus.toLowerCase().includes('نفذ'))
  ).length;
  if (outOfStockCount > competitorScores.length * 0.3) {
    marketGaps.push(
      'مشاكل في توفر المخزون - فرصة للتميز باستمرارية التوفر'
    );
  }

  // 6. فجوة التنوع (بناءً على عدد المنافسين مع منتجات متشابهة)
  const similarPriceCompetitors = competitorScores.filter(c => {
    const avgP = (priceRange.max + priceRange.min) / 2;
    return c.price && Math.abs(c.price - avgP) < avgP * 0.15;
  });
  if (similarPriceCompetitors.length > competitorScores.length * 0.6) {
    marketGaps.push(
      'تشابه كبير في المنتجات - فرصة للتميز بتنوع الخيارات والألوان'
    );
  }

  // 7. فجوة خدمة ما بعد البيع
  if (avgRating < 4.2 && competitorScores.length >= 3) {
    marketGaps.push(
      'ضعف محتمل في خدمة ما بعد البيع - فرصة للتميز بالضمان والدعم'
    );
  }

  // 8. فجوة المحتوى والوصف
  if (competitorScores.length > 0 && competitorScores.length < 10) {
    marketGaps.push(
      'فرصة للتميز بمحتوى تسويقي احترافي وصور عالية الجودة'
    );
  }

  // 9. فجوة الحضور الرقمي (إذا كان عدد المنافسين قليل)
  if (competitorScores.length < 5) {
    marketGaps.push(
      'ضعف الحضور الرقمي للمنافسين - فرصة للسيطرة على السوق الإلكتروني'
    );
  }

  // Determine entry difficulty
  let entryDifficulty: 'Low' | 'Medium' | 'High' = 'Low';
  const competitiveIntensity = (activeCompetitors.length / 10) * 100;

  if (competitiveIntensity > 60) {
    entryDifficulty = 'High';
  } else if (competitiveIntensity > 30) {
    entryDifficulty = 'Medium';
  }

  const avgStrength =
    competitorScores.reduce((sum, c) => sum + c.strengthIndex, 0) /
    competitorScores.length;
  if (avgStrength > 70) {
    entryDifficulty =
      entryDifficulty === 'High' ? 'High' : entryDifficulty === 'Medium' ? 'Medium' : 'Medium';
  }

  // Market concentration (HHI-like calculation)
  const totalStrength = competitorScores.reduce(
    (sum, c) => sum + c.strengthIndex,
    0
  );
  const marketConcentration = (topCompetitors.length / activeCompetitors.length) * 100;

  return {
    activeCompetitors: totalMarketCompetitors && totalMarketCompetitors > activeCompetitors.length
      ? totalMarketCompetitors
      : activeCompetitors.length,
    competitorStrengthIndex: Math.round(avgStrength),
    topCompetitors,
    marketGaps: marketGaps.length > 0 ? marketGaps : ['تحليل السوق مستقر', 'Market is stable'],
    entryDifficulty,
    analysisDetails: {
      strengthBreakdown: {
        volumeWeight: 0.4,
        ratingWeight: 0.3,
        salesWeight: 0.3,
      },
      competitiveIntensity: Math.round(competitiveIntensity),
      marketConcentration: Math.round(marketConcentration),
      consolidationLevel:
        activeCompetitors.length > 10
          ? 'Fragmented'
          : activeCompetitors.length > 5
            ? 'Moderate'
            : 'Consolidated',
    },
  };
}
