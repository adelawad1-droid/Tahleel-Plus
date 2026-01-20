/**
 * Executive Summary Service
 * خدمة الملخص التنفيذي
 */

export interface ExecutiveSummaryResult {
  onePageSummary: string;
  keyFindings: string[];
  criticalMetrics: {
    marketSize: string;
    demandLevel: string;
    competitionLevel: string;
    profitPotential: string;
    riskLevel: string;
  };
  investmentRequired: {
    initial: number;
    monthly: number;
    breakEven: string;
  };
  strategicRecommendation: string;
  nextSteps: string[];
}

/**
 * Generate executive summary from all analysis data
 * إنشاء ملخص تنفيذي من جميع بيانات التحليل
 */
export function generateExecutiveSummary(
  itemName: string,
  finalVerdict: any,
  demandAnalysis: any,
  competitorIntelligence: any,
  profitabilityAnalysis: any,
  decisionMetrics: any,
  buyerIntent?: any,
  growthScenarios?: any,
  lang: 'ar' | 'en' = 'en'
): ExecutiveSummaryResult {
  const isArabic = lang === 'ar';
  
  // Generate one-page summary
  const onePageSummary = isArabic
    ? `تحليل شامل لفرصة السوق: ${itemName}

التوصية النهائية: ${finalVerdict.recommendation === 'GO' ? 'انطلق - فرصة استثمارية واعدة' : finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? 'تقدم بحذر - دراسة أعمق مطلوبة' : 'لا ينصح دخول السوق في هذا المجال - مخاطرة عالية'}

الطلب السوقي: ${demandAnalysis?.demandScore ? `${demandAnalysis.demandScore}% مستوى طلب ${demandAnalysis.monthlyDemandEstimate} وحدة/شهر` : 'متوسط'}

المنافسة: ${competitorIntelligence?.activeCompetitors || 0} منافس نشط، قوة المنافسة ${competitorIntelligence?.competitorStrengthIndex || 0}%

الربحية: هامش ربح متوقع ${profitabilityAnalysis?.estimatedProfitMargin || 0}%، إيرادات شهرية متوقعة ${profitabilityAnalysis?.estimatedMonthlyRevenue || 'غير محدد'}

نية الشراء: ${buyerIntent?.intentLevel ? `${buyerIntent.intentLevel === 'High' ? 'عالية' : buyerIntent.intentLevel === 'Medium' ? 'متوسطة' : 'منخفضة'} - احتمالية تحويل ${Math.round(buyerIntent.conversionProbability * 100)}%` : 'تحليل غير متوفر'}

السيناريو الموصى به: ${growthScenarios?.recommendedScenario === 'optimistic' ? 'متفائل - نمو سريع' : growthScenarios?.recommendedScenario === 'moderate' ? 'متوسط - نمو مستقر' : 'متحفظ - نمو تدريجي'}

المخاطر: ${decisionMetrics?.riskScore ? `${decisionMetrics.riskScore}% مستوى مخاطرة` : 'متوسط'}

التقييم: هذا ${finalVerdict.recommendation === 'GO' ? 'مشروع واعد يستحق الاستثمار' : finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? 'مشروع يتطلب دراسة دقيقة وتخطيط محكم' : 'مشروع عالي المخاطر لا ينصح به حالياً'}`
    : `Comprehensive Market Opportunity Analysis: ${itemName}

Final Recommendation: ${finalVerdict.recommendation === 'GO' ? 'GO - Promising Investment Opportunity' : finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? 'PROCEED WITH CAUTION - Deeper Study Required' : 'NO-GO - High Risk'}

Market Demand: ${demandAnalysis?.demandScore ? `${demandAnalysis.demandScore}% demand level, ${demandAnalysis.monthlyDemandEstimate} units/month` : 'Average'}

Competition: ${competitorIntelligence?.activeCompetitors || 0} active competitors, ${competitorIntelligence?.competitorStrengthIndex || 0}% competition strength

Profitability: Expected ${profitabilityAnalysis?.estimatedProfitMargin || 0}% profit margin, estimated monthly revenue ${profitabilityAnalysis?.estimatedMonthlyRevenue || 'N/A'}

Buyer Intent: ${buyerIntent?.intentLevel ? `${buyerIntent.intentLevel} - ${Math.round(buyerIntent.conversionProbability * 100)}% conversion probability` : 'Analysis not available'}

Recommended Scenario: ${growthScenarios?.recommendedScenario === 'optimistic' ? 'Optimistic - Rapid Growth' : growthScenarios?.recommendedScenario === 'moderate' ? 'Moderate - Stable Growth' : 'Conservative - Gradual Growth'}

Risk: ${decisionMetrics?.riskScore ? `${decisionMetrics.riskScore}% risk level` : 'Moderate'}

Assessment: This is ${finalVerdict.recommendation === 'GO' ? 'a promising project worth investing in' : finalVerdict.recommendation === 'PROCEED WITH CAUTION' ? 'a project requiring careful study and planning' : 'a high-risk project not currently recommended'}`;
  
  // Key findings
  const keyFindings: string[] = [];
  
  if (demandAnalysis?.demandScore >= 70) {
    keyFindings.push(isArabic ? '✓ طلب سوقي قوي وواعد' : '✓ Strong and promising market demand');
  } else if (demandAnalysis?.demandScore >= 40) {
    keyFindings.push(isArabic ? '◐ طلب سوقي متوسط' : '◐ Moderate market demand');
  } else {
    keyFindings.push(isArabic ? '✗ طلب سوقي ضعيف' : '✗ Weak market demand');
  }
  
  if (competitorIntelligence?.competitorStrengthIndex < 50) {
    keyFindings.push(isArabic ? '✓ منافسة منخفضة - فرصة جيدة للدخول' : '✓ Low competition - Good entry opportunity');
  } else if (competitorIntelligence?.competitorStrengthIndex < 70) {
    keyFindings.push(isArabic ? '◐ منافسة متوسطة - يمكن المنافسة' : '◐ Moderate competition - Competitive possible');
  } else {
    keyFindings.push(isArabic ? '✗ منافسة شرسة - صعوبة في التميز' : '✗ Fierce competition - Difficult to differentiate');
  }
  
  if (profitabilityAnalysis?.estimatedProfitMargin > 25) {
    keyFindings.push(isArabic ? '✓ هوامش ربح ممتازة' : '✓ Excellent profit margins');
  } else if (profitabilityAnalysis?.estimatedProfitMargin > 15) {
    keyFindings.push(isArabic ? '◐ هوامش ربح معقولة' : '◐ Reasonable profit margins');
  } else {
    keyFindings.push(isArabic ? '✗ هوامش ربح منخفضة' : '✗ Low profit margins');
  }
  
  if (buyerIntent?.intentLevel === 'High') {
    keyFindings.push(isArabic ? '✓ نية شراء عالية - عملاء جاهزون للشراء' : '✓ High buying intent - Customers ready to buy');
  }
  
  if (decisionMetrics?.beginnerFriendly) {
    keyFindings.push(isArabic ? '✓ مناسب للمبتدئين' : '✓ Beginner-friendly');
  }
  
  // Critical metrics
  const criticalMetrics = {
    marketSize: demandAnalysis?.monthlyDemandEstimate 
      ? `${demandAnalysis.monthlyDemandEstimate} ${isArabic ? 'وحدة/شهر' : 'units/month'}`
      : isArabic ? 'متوسط' : 'Medium',
    demandLevel: demandAnalysis?.demandScore 
      ? `${demandAnalysis.demandScore}%`
      : isArabic ? 'متوسط' : 'Medium',
    competitionLevel: competitorIntelligence?.competitorStrengthIndex
      ? `${competitorIntelligence.competitorStrengthIndex}% (${competitorIntelligence.activeCompetitors} ${isArabic ? 'منافس' : 'competitors'})`
      : isArabic ? 'متوسط' : 'Medium',
    profitPotential: profitabilityAnalysis?.estimatedProfitMargin
      ? `${profitabilityAnalysis.estimatedProfitMargin}% ${isArabic ? 'هامش ربح' : 'margin'}`
      : isArabic ? 'متوسط' : 'Medium',
    riskLevel: decisionMetrics?.riskScore
      ? `${decisionMetrics.riskScore}%`
      : isArabic ? 'متوسط' : 'Medium',
  };
  
  // Investment required
  const estimatedInitial = Math.round((profitabilityAnalysis?.breakEvenPoint || 30) * (profitabilityAnalysis?.averageSalePrice || 100) * 0.5);
  const estimatedMonthly = Math.round(estimatedInitial * 0.3);
  
  const investmentRequired = {
    initial: estimatedInitial,
    monthly: estimatedMonthly,
    breakEven: profitabilityAnalysis?.breakEvenPoint 
      ? `${profitabilityAnalysis.breakEvenPoint} ${isArabic ? 'وحدة' : 'units'}`
      : isArabic ? '3-6 أشهر' : '3-6 months',
  };
  
  // Strategic recommendation
  const strategicRecommendation = finalVerdict.reasoning || (isArabic
    ? 'يتطلب هذا المشروع دراسة شاملة للسوق والمنافسة قبل اتخاذ القرار النهائي.'
    : 'This project requires comprehensive market and competition study before making final decision.');
  
  // Next steps
  const nextSteps: string[] = [];
  
  if (finalVerdict.recommendation === 'GO') {
    nextSteps.push(
      isArabic ? '1. تأمين رأس المال الأولي والموردين' : '1. Secure initial capital and suppliers',
      isArabic ? '2. تطوير استراتيجية التسويق والعلامة التجارية' : '2. Develop marketing strategy and branding',
      isArabic ? '3. اختيار قنوات البيع المناسبة (نون، أمازون، متجر خاص)' : '3. Choose appropriate sales channels (Noon, Amazon, own store)',
      isArabic ? '4. بناء سلسلة التوريد والشحن' : '4. Build supply chain and shipping',
      isArabic ? '5. إطلاق نسخة تجريبية والتحسين المستمر' : '5. Launch pilot version and continuous improvement'
    );
  } else if (finalVerdict.recommendation === 'PROCEED WITH CAUTION') {
    nextSteps.push(
      isArabic ? '1. إجراء دراسة سوق أعمق وتحليل تنافسي مفصل' : '1. Conduct deeper market research and detailed competitive analysis',
      isArabic ? '2. اختبار السوق بميزانية محدودة أولاً' : '2. Test market with limited budget first',
      isArabic ? '3. تطوير ميزة تنافسية واضحة' : '3. Develop clear competitive advantage',
      isArabic ? '4. بناء خطة مالية محافظة' : '4. Build conservative financial plan',
      isArabic ? '5. مراقبة الأداء وتعديل الاستراتيجية حسب الحاجة' : '5. Monitor performance and adjust strategy as needed'
    );
  } else {
    nextSteps.push(
      isArabic ? '1. البحث عن فرص بديلة ذات مخاطر أقل' : '1. Search for alternative opportunities with lower risks',
      isArabic ? '2. دراسة نيش أو فئة فرعية أقل تنافسية' : '2. Study niche or subcategory with less competition',
      isArabic ? '3. إعادة تقييم نموذج العمل والقيمة المقدمة' : '3. Reassess business model and value proposition',
      isArabic ? '4. بناء خبرة في المجال قبل الاستثمار الكبير' : '4. Build expertise in field before major investment',
      isArabic ? '5. استشارة خبراء التجارة الإلكترونية' : '5. Consult e-commerce experts'
    );
  }
  
  return {
    onePageSummary,
    keyFindings,
    criticalMetrics,
    investmentRequired,
    strategicRecommendation,
    nextSteps,
  };
}
