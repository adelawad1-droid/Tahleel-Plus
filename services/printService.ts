import { AnalysisResult } from '../types';

/**
 * خدمة الطباعة الاحترافية
 * تحول النتائج إلى HTML منسق وجميل للطباعة
 */

export const generatePrintHTML = (
  data: AnalysisResult,
  lang: 'ar' | 'en',
  sectionName?: string
): string => {
  const isRtl = lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  
  // تحديد اللون حسب التوصية
  const getVerdictColor = () => {
    if (data.finalVerdict.recommendation === 'GO') return '#059669'; // green
    if (data.finalVerdict.recommendation === 'PROCEED WITH CAUTION') return '#d97706'; // amber
    return '#dc2626'; // red
  };

  const verdictColor = getVerdictColor();
  const currentYear = new Date().getFullYear();

  // HTML Template
  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isRtl ? 'تقرير تحليل بلس' : 'Tahleel Plus Report'} - ${data.itemName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: ${dir};
      background: white;
      color: #1e293b;
      line-height: 1.7;
      padding: 0;
      font-size: 14px;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Cover Page */
    /* ═══════════════════════════════════════════════════════════════ */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d4f4f 100%);
      color: white;
      padding: 40px;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 60px;
      margin-bottom: 20px;
    }
    
    .cover-title {
      font-size: 42px;
      font-weight: 900;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #10b981, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .cover-subtitle {
      font-size: 18px;
      opacity: 0.8;
      margin-bottom: 50px;
    }
    
    .cover-product {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 30px 60px;
      margin: 30px 0;
    }
    
    .cover-product-label {
      font-size: 14px;
      opacity: 0.7;
      margin-bottom: 10px;
    }
    
    .cover-product-name {
      font-size: 36px;
      font-weight: 900;
      color: #10b981;
    }
    
    .cover-verdict {
      margin-top: 40px;
      padding: 20px 50px;
      border-radius: 50px;
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .cover-verdict.go { background: linear-gradient(135deg, #059669, #10b981); }
    .cover-verdict.caution { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .cover-verdict.nogo { background: linear-gradient(135deg, #dc2626, #ef4444); }
    
    .cover-date {
      margin-top: 50px;
      font-size: 14px;
      opacity: 0.6;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Quick Summary Page */
    /* ═══════════════════════════════════════════════════════════════ */
    .quick-summary {
      page-break-after: always;
      padding: 20px 0;
    }
    
    .quick-summary-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    
    .quick-summary-header h2 {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
    }
    
    .quick-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .quick-stat {
      background: linear-gradient(135deg, #f8fafc, #e2e8f0);
      border-radius: 12px;
      padding: 20px 15px;
      text-align: center;
      border: 2px solid #e2e8f0;
    }
    
    .quick-stat.highlight {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-color: #059669;
    }
    
    .quick-stat.highlight-blue {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-color: #2563eb;
    }
    
    .quick-stat.highlight-purple {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      border-color: #7c3aed;
    }
    
    .quick-stat.highlight-amber {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-color: #d97706;
    }
    
    .quick-stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      opacity: 0.8;
    }
    
    .quick-stat-value {
      font-size: 28px;
      font-weight: 900;
      line-height: 1;
    }
    
    .quick-stat-subtext {
      font-size: 10px;
      margin-top: 5px;
      opacity: 0.7;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Header */
    /* ═══════════════════════════════════════════════════════════════ */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 3px solid #0f172a;
      margin-bottom: 25px;
    }
    
    .report-header-left h1 {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
    }
    
    .report-header-left .product-name {
      font-size: 16px;
      font-weight: 700;
      color: #059669;
    }
    
    .report-header-right {
      text-align: ${isRtl ? 'left' : 'right'};
      font-size: 12px;
      color: #64748b;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Verdict Box */
    /* ═══════════════════════════════════════════════════════════════ */
    .verdict-box {
      background: linear-gradient(135deg, ${verdictColor}08, ${verdictColor}15);
      border: 3px solid ${verdictColor};
      border-radius: 16px;
      padding: 25px;
      margin: 25px 0;
    }
    
    .verdict-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .verdict-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: ${verdictColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
    }
    
    .verdict-recommendation {
      font-size: 26px;
      font-weight: 900;
      color: ${verdictColor};
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .verdict-reasoning {
      font-size: 14px;
      color: #475569;
      line-height: 1.8;
      padding: 15px;
      background: white;
      border-radius: 8px;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Stats Grid */
    /* ═══════════════════════════════════════════════════════════════ */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    
    .stats-grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    
    .stat-card {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }
    
    .stat-card.accent-green {
      border-color: #10b981;
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    }
    
    .stat-card.accent-blue {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    }
    
    .stat-card.accent-purple {
      border-color: #8b5cf6;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    }
    
    .stat-card .label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .stat-card .value {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
    }
    
    .stat-card .subtext {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      margin-top: 4px;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Section */
    /* ═══════════════════════════════════════════════════════════════ */
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-header {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-header.green { background: linear-gradient(135deg, #059669, #10b981); }
    .section-header.blue { background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .section-header.purple { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
    .section-header.orange { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .section-header.teal { background: linear-gradient(135deg, #0d9488, #14b8a6); }
    .section-header.pink { background: linear-gradient(135deg, #db2777, #ec4899); }
    
    .section-content {
      padding: 0 10px;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Table */
    /* ═══════════════════════════════════════════════════════════════ */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 12px;
    }
    
    thead {
      background: linear-gradient(135deg, #1e293b, #334155);
      color: white;
    }
    
    th {
      padding: 12px 10px;
      text-align: ${isRtl ? 'right' : 'left'};
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tbody tr:hover {
      background: #f1f5f9;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Lists */
    /* ═══════════════════════════════════════════════════════════════ */
    .info-list {
      list-style: none;
      margin: 15px 0;
    }
    
    .info-list li {
      padding: 10px 15px;
      margin: 6px 0;
      background: #f8fafc;
      border-${isRtl ? 'right' : 'left'}: 4px solid #10b981;
      border-radius: 6px;
      font-size: 13px;
    }
    
    .info-list li.blue-border {
      border-color: #3b82f6;
    }
    
    .info-list li.purple-border {
      border-color: #8b5cf6;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Badges */
    /* ═══════════════════════════════════════════════════════════════ */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin: 3px;
    }
    
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Cost Breakdown Table */
    /* ═══════════════════════════════════════════════════════════════ */
    .cost-breakdown {
      background: #f8fafc;
      border-radius: 10px;
      padding: 15px;
      margin: 15px 0;
      border: 2px solid #e2e8f0;
    }
    
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 13px;
    }
    
    .cost-row:last-child {
      border-bottom: none;
      padding-top: 12px;
      margin-top: 5px;
      border-top: 2px solid #0f172a;
      font-weight: 900;
      font-size: 15px;
    }
    
    .cost-row .label { color: #475569; }
    .cost-row .value { font-weight: 700; }
    .cost-row .value.negative { color: #dc2626; }
    .cost-row .value.positive { color: #059669; }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* SWOT Grid */
    /* ═══════════════════════════════════════════════════════════════ */
    .swot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .swot-card {
      padding: 15px;
      border-radius: 10px;
      border: 2px solid;
    }
    
    .swot-card h4 {
      font-size: 14px;
      font-weight: 900;
      margin-bottom: 10px;
    }
    
    .swot-card ul { list-style: none; }
    .swot-card li { padding: 5px 0; font-size: 12px; }
    
    .swot-strengths { background: #d1fae5; border-color: #059669; }
    .swot-weaknesses { background: #fee2e2; border-color: #dc2626; }
    .swot-opportunities { background: #dbeafe; border-color: #2563eb; }
    .swot-threats { background: #fef3c7; border-color: #d97706; }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Footer */
    /* ═══════════════════════════════════════════════════════════════ */
    .page-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
    
    .page-footer .logo {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 5px;
    }
    
    /* ═══════════════════════════════════════════════════════════════ */
    /* Print Specific */
    /* ═══════════════════════════════════════════════════════════════ */
    .page-break { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
    
    @media print {
      body { 
        padding: 0; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .container { padding: 10mm; }
      
      .cover-page {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .stats-grid, .section, .quick-stat, .stat-card {
        page-break-inside: avoid;
      }
      
      .section-header {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    @page {
      size: A4;
      margin: 10mm;
    }
  </style>
</head>
<body>
  ${generateCoverPage(data, isRtl, verdictColor)}
  
  <div class="container">
    ${generateQuickSummaryPage(data, isRtl)}
    ${generateReportHeader(data, isRtl)}
    ${generateVerdictSection(data, isRtl)}
    ${!sectionName || sectionName === 'overview' ? generateOverviewSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'demand' ? generateDemandSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'competitors' ? generateCompetitorsSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'profitability' ? generateProfitabilitySection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'decisions' ? generateDecisionsSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'opportunities' ? generateOpportunitiesSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'buyerIntent' ? generateBuyerIntentSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'growth' ? generateGrowthScenariosSection(data, isRtl) : ''}
    ${!sectionName || sectionName === 'executive' ? generateExecutiveSummarySection(data, isRtl) : ''}
    ${generatePageFooter(isRtl)}
  </div>
  
  <script>
    // Auto print when loaded
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 800);
    };
  </script>
</body>
</html>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Cover Page
// ═══════════════════════════════════════════════════════════════
const generateCoverPage = (data: AnalysisResult, isRtl: boolean, verdictColor: string): string => {
  const date = new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const getVerdictClass = () => {
    if (data.finalVerdict.recommendation === 'GO') return 'go';
    if (data.finalVerdict.recommendation === 'PROCEED WITH CAUTION') return 'caution';
    return 'nogo';
  };
  
  const getVerdictText = () => {
    if (data.finalVerdict.recommendation === 'GO') {
      return isRtl ? '✓ انطلق - فرصة واعدة' : '✓ GO - Promising Opportunity';
    }
    if (data.finalVerdict.recommendation === 'PROCEED WITH CAUTION') {
      return isRtl ? '▲ تقدم بحذر' : '▲ PROCEED WITH CAUTION';
    }
    return isRtl ? '✗ لا ينصح' : '✗ NO-GO';
  };
  
  return `
    <div class="cover-page">
      <div class="cover-logo">📊</div>
      <h1 class="cover-title">${isRtl ? 'تحليل بلس' : 'Tahleel Plus'}</h1>
      <p class="cover-subtitle">${isRtl ? 'تقرير تحليل السوق السعودي الشامل' : 'Comprehensive Saudi Market Analysis Report'}</p>
      
      <div class="cover-product">
        <p class="cover-product-label">${isRtl ? 'المنتج المُحلَّل' : 'Analyzed Product'}</p>
        <h2 class="cover-product-name">${data.itemName}</h2>
      </div>
      
      <div class="cover-verdict ${getVerdictClass()}">${getVerdictText()}</div>
      
      <p class="cover-date">${date}</p>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Quick Summary Page
// ═══════════════════════════════════════════════════════════════
const generateQuickSummaryPage = (data: AnalysisResult, isRtl: boolean): string => {
  return `
    <div class="quick-summary">
      <div class="quick-summary-header">
        <h2>${isRtl ? '📋 ملخص سريع من جميع الأقسام' : '📋 Quick Summary from All Sections'}</h2>
      </div>
      
      <div class="quick-stats-grid">
        <div class="quick-stat highlight">
          <div class="quick-stat-label">${isRtl ? 'الطلب' : 'Demand'}</div>
          <div class="quick-stat-value">${data.demandAnalysis?.demandScore || 0}%</div>
          <div class="quick-stat-subtext">${data.demandAnalysis?.monthlyDemandEstimate || 0} ${isRtl ? 'وحدة/شهر' : 'units/mo'}</div>
        </div>
        
        <div class="quick-stat highlight-amber">
          <div class="quick-stat-label">${isRtl ? 'المنافسون' : 'Competitors'}</div>
          <div class="quick-stat-value">${data.competitorIntelligence?.activeCompetitors || 0}</div>
          <div class="quick-stat-subtext">${isRtl ? 'قوة' : 'Str.'}: ${data.competitorIntelligence?.competitorStrengthIndex || 0}%</div>
        </div>
        
        <div class="quick-stat highlight">
          <div class="quick-stat-label">${isRtl ? 'الربحية' : 'Profit'}</div>
          <div class="quick-stat-value">${data.profitabilityAnalysis?.estimatedProfitMargin || 0}%</div>
          <div class="quick-stat-subtext">${isRtl ? 'هامش الربح' : 'Margin'}</div>
        </div>
        
        <div class="quick-stat highlight-purple">
          <div class="quick-stat-label">${isRtl ? 'نية الشراء' : 'Intent'}</div>
          <div class="quick-stat-value">${data.buyerIntentAnalysis?.intentScore || 0}%</div>
          <div class="quick-stat-subtext">${data.buyerIntentAnalysis?.intentLevel === 'High' ? (isRtl ? 'عالية' : 'High') : data.buyerIntentAnalysis?.intentLevel === 'Medium' ? (isRtl ? 'متوسطة' : 'Medium') : (isRtl ? 'منخفضة' : 'Low')}</div>
        </div>
        
        <div class="quick-stat highlight-blue">
          <div class="quick-stat-label">${isRtl ? 'فرصة النجاح' : 'Success'}</div>
          <div class="quick-stat-value">${data.decisionMetrics?.successScore || 0}%</div>
          <div class="quick-stat-subtext">${isRtl ? 'احتمالية' : 'Probability'}</div>
        </div>
        
        <div class="quick-stat" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border-color: #dc2626;">
          <div class="quick-stat-label">${isRtl ? 'المخاطرة' : 'Risk'}</div>
          <div class="quick-stat-value">${data.decisionMetrics?.riskScore || 0}%</div>
          <div class="quick-stat-subtext">${isRtl ? 'مستوى' : 'Level'}</div>
        </div>
        
        <div class="quick-stat" style="background: linear-gradient(135deg, #ec4899, #db2777); color: white; border-color: #db2777;">
          <div class="quick-stat-label">${isRtl ? 'الفرص' : 'Opportunities'}</div>
          <div class="quick-stat-value">${data.opportunityFinder?.opportunities?.length || 0}</div>
          <div class="quick-stat-subtext">${isRtl ? 'فرصة متاحة' : 'Available'}</div>
        </div>
        
        <div class="quick-stat highlight-blue">
          <div class="quick-stat-label">${isRtl ? 'السيناريو' : 'Scenario'}</div>
          <div class="quick-stat-value" style="font-size: 16px;">
            ${data.growthScenarios?.recommendedScenario === 'optimistic' 
              ? (isRtl ? 'متفائل' : 'Optimistic')
              : data.growthScenarios?.recommendedScenario === 'moderate'
              ? (isRtl ? 'متوسط' : 'Moderate')
              : (isRtl ? 'متحفظ' : 'Conservative')}
          </div>
          <div class="quick-stat-subtext">${isRtl ? 'الموصى به' : 'Recommended'}</div>
        </div>
      </div>
      
      <!-- Market Stats -->
      <div class="stats-grid stats-grid-4" style="margin-top: 20px;">
        <div class="stat-card accent-green">
          <div class="label">${isRtl ? 'متوسط السعر' : 'Avg. Price'}</div>
          <div class="value">${data.marketStats.averagePrice.toFixed(0)}</div>
          <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
        </div>
        <div class="stat-card">
          <div class="label">${isRtl ? 'أقل سعر' : 'Min Price'}</div>
          <div class="value">${data.marketStats.lowestPrice.toFixed(0)}</div>
          <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
        </div>
        <div class="stat-card">
          <div class="label">${isRtl ? 'أعلى سعر' : 'Max Price'}</div>
          <div class="value">${data.marketStats.highestPrice.toFixed(0)}</div>
          <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
        </div>
        <div class="stat-card accent-blue">
          <div class="label">${isRtl ? 'تشبع السوق' : 'Saturation'}</div>
          <div class="value">${data.marketStats.marketSaturation}%</div>
        </div>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Report Header
// ═══════════════════════════════════════════════════════════════
const generateReportHeader = (data: AnalysisResult, isRtl: boolean): string => {
  const date = new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
    <div class="report-header">
      <div class="report-header-left">
        <h1>📊 ${isRtl ? 'تحليل بلس' : 'Tahleel Plus'}</h1>
        <div class="product-name">${data.itemName}</div>
      </div>
      <div class="report-header-right">
        <div>${date}</div>
        <div>${isRtl ? 'تقرير تحليل السوق' : 'Market Analysis Report'}</div>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Page Footer
// ═══════════════════════════════════════════════════════════════
const generatePageFooter = (isRtl: boolean): string => {
  return `
    <div class="page-footer">
      <div class="logo">📊 ${isRtl ? 'تحليل بلس' : 'Tahleel Plus'}</div>
      <div>${isRtl ? 'منصة تحليل السوق السعودي للتجارة الإلكترونية' : 'Saudi E-commerce Market Analysis Platform'}</div>
      <div style="margin-top: 10px;">© ${new Date().getFullYear()} Tahleel Plus - ${isRtl ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Verdict Section
// ═══════════════════════════════════════════════════════════════
const generateVerdictSection = (data: AnalysisResult, isRtl: boolean): string => {
  const getVerdictIcon = () => {
    if (data.finalVerdict.recommendation === 'GO') return '✓';
    if (data.finalVerdict.recommendation === 'PROCEED WITH CAUTION') return '▲';
    return '✗';
  };
  
  const getRecommendationText = () => {
    if (data.finalVerdict.recommendation === 'GO') {
      return isRtl ? 'انطلق - فرصة واعدة' : 'GO - Promising Opportunity';
    }
    if (data.finalVerdict.recommendation === 'PROCEED WITH CAUTION') {
      return isRtl ? 'تقدم بحذر' : 'PROCEED WITH CAUTION';
    }
    return isRtl ? 'لا ينصح - مخاطرة عالية' : 'NO-GO - High Risk';
  };
  
  return `
    <div class="verdict-box no-break">
      <div class="verdict-header">
        <div class="verdict-icon">${getVerdictIcon()}</div>
        <div class="verdict-recommendation">${getRecommendationText()}</div>
      </div>
      <div class="verdict-reasoning">${data.finalVerdict.reasoning}</div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Overview Section
// ═══════════════════════════════════════════════════════════════
const generateOverviewSection = (data: AnalysisResult, isRtl: boolean): string => {
  return `
    <div class="section no-break">
      <div class="section-header blue">📄 ${isRtl ? 'نظرة عامة' : 'Overview'}</div>
      <div class="section-content">
        <p style="font-size: 15px; line-height: 1.9; color: #374151; padding: 15px; background: #f8fafc; border-radius: 10px;">${data.summary}</p>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Demand Section
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// Generate Demand Section
// ═══════════════════════════════════════════════════════════════
const generateDemandSection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.demandAnalysis) return '';
  
  const stabilityAr = data.demandAnalysis.demandStability === 'Stable' ? 'مستقر' : 
                      data.demandAnalysis.demandStability === 'Growing' ? 'نامٍ' : 
                      data.demandAnalysis.demandStability === 'Volatile' ? 'متقلب' : data.demandAnalysis.demandStability;
  
  return `
    <div class="section page-break">
      <div class="section-header green">📈 ${isRtl ? 'تحليل الطلب' : 'Demand Analysis'}</div>
      <div class="section-content">
        <div class="stats-grid">
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'الطلب الشهري' : 'Monthly Demand'}</div>
            <div class="value">${data.demandAnalysis.monthlyDemandEstimate}</div>
            <div class="subtext">${isRtl ? 'وحدة متوقعة' : 'units estimated'}</div>
          </div>
          <div class="stat-card accent-blue">
            <div class="label">${isRtl ? 'درجة الطلب' : 'Demand Score'}</div>
            <div class="value">${data.demandAnalysis.demandScore}%</div>
            <div class="subtext">${isRtl ? 'قوة الطلب' : 'demand strength'}</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'الاستقرار' : 'Stability'}</div>
            <div class="value" style="font-size: 20px;">${isRtl ? stabilityAr : data.demandAnalysis.demandStability}</div>
            <div class="subtext">${isRtl ? 'مستوى التقلب' : 'volatility level'}</div>
          </div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">📅 ${isRtl ? 'الموسمية' : 'Seasonality'}</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div>
            <p style="margin-bottom: 8px; font-weight: 700; color: #059669;"><strong>${isRtl ? 'أشهر الذروة:' : 'Peak Months:'}</strong></p>
            <div>${data.demandAnalysis.seasonality.peakMonths.map(m => `<span class="badge badge-success">${m}</span>`).join('')}</div>
          </div>
          <div>
            <p style="margin-bottom: 8px; font-weight: 700; color: #3b82f6;"><strong>${isRtl ? 'أشهر الانخفاض:' : 'Low Months:'}</strong></p>
            <div>${data.demandAnalysis.seasonality.lowMonths.map(m => `<span class="badge badge-info">${m}</span>`).join('')}</div>
          </div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🗺️ ${isRtl ? 'التوزيع الجغرافي' : 'Geographic Distribution'}</h3>
        <p style="line-height: 1.8; color: #374151; padding: 15px; background: #f8fafc; border-radius: 8px;">${data.demandAnalysis.geographicDistribution}</p>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Competitors Section
// ═══════════════════════════════════════════════════════════════
const generateCompetitorsSection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.competitors || data.competitors.length === 0) return '';
  
  const difficultyAr = data.competitorIntelligence?.entryDifficulty === 'Low' ? 'منخفضة' :
                       data.competitorIntelligence?.entryDifficulty === 'Medium' ? 'متوسطة' :
                       data.competitorIntelligence?.entryDifficulty === 'High' ? 'عالية' : data.competitorIntelligence?.entryDifficulty;
  
  return `
    <div class="section page-break">
      <div class="section-header orange">🏪 ${isRtl ? 'تحليل المنافسين' : 'Competitor Analysis'}</div>
      <div class="section-content">
        ${data.competitorIntelligence ? `
          <div class="stats-grid">
            <div class="stat-card accent-blue">
              <div class="label">${isRtl ? 'المنافسون النشطون' : 'Active Competitors'}</div>
              <div class="value">${data.competitorIntelligence.activeCompetitors}</div>
            </div>
            <div class="stat-card">
              <div class="label">${isRtl ? 'مؤشر القوة' : 'Strength Index'}</div>
              <div class="value">${data.competitorIntelligence.competitorStrengthIndex.toFixed(0)}%</div>
            </div>
            <div class="stat-card">
              <div class="label">${isRtl ? 'صعوبة الدخول' : 'Entry Difficulty'}</div>
              <div class="value" style="font-size: 20px;">${isRtl ? difficultyAr : data.competitorIntelligence.entryDifficulty}</div>
            </div>
          </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>${isRtl ? 'المتجر' : 'Store'}</th>
              <th>${isRtl ? 'السعر' : 'Price'}</th>
              <th>${isRtl ? 'التقييم' : 'Rating'}</th>
              <th>${isRtl ? 'الشحن' : 'Shipping'}</th>
              <th>${isRtl ? 'التوفر' : 'Stock'}</th>
            </tr>
          </thead>
          <tbody>
            ${data.competitors.slice(0, 8).map(comp => `
              <tr>
                <td><strong>${comp.storeName}</strong></td>
                <td style="color: #059669; font-weight: 700;">${comp.price.toFixed(0)} ${isRtl ? 'ر.س' : 'SAR'}</td>
                <td>⭐ ${comp.rating.toFixed(1)}</td>
                <td>${comp.shippingDays} ${isRtl ? 'يوم' : 'days'}</td>
                <td><span class="badge ${comp.stockStatus === 'In Stock' ? 'badge-success' : 'badge-warning'}">${comp.stockStatus === 'In Stock' ? (isRtl ? 'متوفر' : 'In Stock') : (isRtl ? 'محدود' : 'Limited')}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${data.competitorIntelligence && data.competitorIntelligence.marketGaps.length > 0 ? `
          <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🎯 ${isRtl ? 'فجوات السوق' : 'Market Gaps'}</h3>
          <ul class="info-list">
            ${data.competitorIntelligence.marketGaps.slice(0, 5).map(gap => `<li>▸ ${gap}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Profitability Section
// ═══════════════════════════════════════════════════════════════
const generateProfitabilitySection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.profitabilityAnalysis) return '';
  
  return `
    <div class="section page-break">
      <div class="section-header green">💰 ${isRtl ? 'تحليل الربحية' : 'Profitability Analysis'}</div>
      <div class="section-content">
        <div class="stats-grid">
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'متوسط سعر البيع' : 'Avg Sale Price'}</div>
            <div class="value">${data.profitabilityAnalysis.averageSalePrice.toFixed(0)}</div>
            <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
          </div>
          <div class="stat-card accent-blue">
            <div class="label">${isRtl ? 'هامش الربح' : 'Profit Margin'}</div>
            <div class="value">${data.profitabilityAnalysis.estimatedProfitMargin.toFixed(0)}%</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'نقطة التعادل' : 'Break Even'}</div>
            <div class="value">${data.profitabilityAnalysis.breakEvenPoint}</div>
            <div class="subtext">${isRtl ? 'وحدة' : 'units'}</div>
          </div>
        </div>
        
        ${data.profitabilityAnalysis.costBreakdown ? `
          <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">📊 ${isRtl ? 'تفاصيل التكاليف (لكل وحدة)' : 'Cost Breakdown (per unit)'}</h3>
          <div class="cost-breakdown">
            <div class="cost-row">
              <span class="label">${isRtl ? 'تكلفة المنتج' : 'Product Cost'}</span>
              <span class="value negative">-${data.profitabilityAnalysis.costBreakdown.productCost?.toFixed(0) || 0} ${isRtl ? 'ر.س' : 'SAR'}</span>
            </div>
            <div class="cost-row">
              <span class="label">${isRtl ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
              <span class="value negative">-${data.profitabilityAnalysis.costBreakdown.shippingCost?.toFixed(0) || 0} ${isRtl ? 'ر.س' : 'SAR'}</span>
            </div>
            <div class="cost-row">
              <span class="label">${isRtl ? 'رسوم المنصة' : 'Platform Fee'}</span>
              <span class="value negative">-${data.profitabilityAnalysis.costBreakdown.platformFee?.toFixed(0) || 0} ${isRtl ? 'ر.س' : 'SAR'}</span>
            </div>
            <div class="cost-row">
              <span class="label">${isRtl ? 'الربح لكل وحدة' : 'Profit per Unit'}</span>
              <span class="value positive">+${data.profitabilityAnalysis.profitPerUnit?.toFixed(0) || 0} ${isRtl ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
        ` : ''}
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">💵 ${isRtl ? 'الإيرادات المتوقعة' : 'Expected Revenue'}</h3>
        <p style="font-size: 22px; font-weight: 900; color: #059669; padding: 15px; background: #d1fae5; border-radius: 10px; text-align: center;">${data.profitabilityAnalysis.estimatedMonthlyRevenue}</p>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">📉 ${isRtl ? 'حساسية السعر' : 'Price Sensitivity'}</h3>
        <p style="line-height: 1.8; color: #374151; padding: 15px; background: #f8fafc; border-radius: 8px;">${data.profitabilityAnalysis.priceSensitivity}</p>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Decisions Section
// ═══════════════════════════════════════════════════════════════
const generateDecisionsSection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.decisionMetrics) return '';
  
  return `
    <div class="section page-break">
      <div class="section-header purple">📊 ${isRtl ? 'مقاييس القرار' : 'Decision Metrics'}</div>
      <div class="section-content">
        <div class="stats-grid">
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'فرصة النجاح' : 'Success Score'}</div>
            <div class="value">${data.decisionMetrics.successScore}%</div>
          </div>
          <div class="stat-card" style="border-color: #ef4444; background: linear-gradient(135deg, #fee2e2, #fecaca);">
            <div class="label">${isRtl ? 'مستوى المخاطرة' : 'Risk Score'}</div>
            <div class="value" style="color: #dc2626;">${data.decisionMetrics.riskScore}%</div>
          </div>
          <div class="stat-card accent-blue">
            <div class="label">${isRtl ? 'الوقت للربح' : 'Time to Profit'}</div>
            <div class="value" style="font-size: 18px;">${data.decisionMetrics.timeToProfit}</div>
          </div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">💰 ${isRtl ? 'رأس المال المطلوب' : 'Capital Required'}</h3>
        <p style="font-size: 20px; font-weight: 900; color: #2563eb; padding: 15px; background: #dbeafe; border-radius: 10px; text-align: center;">${data.decisionMetrics.capitalRequired}</p>
        
        <div style="display: flex; gap: 20px; margin-top: 20px;">
          <div style="flex: 1; padding: 15px; background: ${data.decisionMetrics.beginnerFriendly ? '#d1fae5' : '#fee2e2'}; border-radius: 10px; text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">${isRtl ? 'مناسب للمبتدئين' : 'Beginner Friendly'}</p>
            <p style="font-size: 22px; font-weight: 900; color: ${data.decisionMetrics.beginnerFriendly ? '#059669' : '#dc2626'};">
              ${data.decisionMetrics.beginnerFriendly ? (isRtl ? '✓ نعم' : '✓ Yes') : (isRtl ? '✗ لا' : '✗ No')}
            </p>
          </div>
          <div style="flex: 1; padding: 15px; background: ${data.decisionMetrics.quickWin ? '#d1fae5' : '#fef3c7'}; border-radius: 10px; text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">${isRtl ? 'ربح سريع' : 'Quick Win'}</p>
            <p style="font-size: 22px; font-weight: 900; color: ${data.decisionMetrics.quickWin ? '#059669' : '#d97706'};">
              ${data.decisionMetrics.quickWin ? (isRtl ? '✓ نعم' : '✓ Yes') : (isRtl ? '▲ لا' : '▲ No')}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Opportunities Section
// ═══════════════════════════════════════════════════════════════
const generateOpportunitiesSection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.opportunityFinder || data.opportunityFinder.opportunities.length === 0) return '';
  
  return `
    <div class="section page-break">
      <div class="section-header pink">✨ ${isRtl ? 'فرص النمو' : 'Growth Opportunities'}</div>
      <div class="section-content">
        <ul class="info-list">
          ${data.opportunityFinder.opportunities.slice(0, 5).map(opp => `
            <li>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <strong style="color: #0f172a; font-size: 14px;">${isRtl && opp.titleAr ? opp.titleAr : opp.title}</strong>
                <span class="badge badge-success" style="font-size: 13px;">${opp.potentialScore}%</span>
              </div>
              <span style="color: #64748b; font-size: 12px; line-height: 1.6;">${isRtl && opp.descriptionAr ? opp.descriptionAr : opp.description}</span>
            </li>
          `).join('')}
        </ul>
        
        ${data.swot ? `
          <h3 style="margin: 30px 0 20px; font-size: 16px; font-weight: 900; color: #0f172a;">📋 ${isRtl ? 'تحليل SWOT' : 'SWOT Analysis'}</h3>
          <div class="swot-grid">
            <div class="swot-card swot-strengths">
              <h4>💪 ${isRtl ? 'نقاط القوة' : 'Strengths'}</h4>
              <ul>
                ${data.swot.strengths.slice(0, 4).map(s => `<li>▸ ${s}</li>`).join('')}
              </ul>
            </div>
            <div class="swot-card swot-weaknesses">
              <h4>⚠️ ${isRtl ? 'نقاط الضعف' : 'Weaknesses'}</h4>
              <ul>
                ${data.swot.weaknesses.slice(0, 4).map(w => `<li>▸ ${w}</li>`).join('')}
              </ul>
            </div>
            <div class="swot-card swot-opportunities">
              <h4>🚀 ${isRtl ? 'الفرص' : 'Opportunities'}</h4>
              <ul>
                ${data.swot.opportunities.slice(0, 4).map(o => `<li>▸ ${o}</li>`).join('')}
              </ul>
            </div>
            <div class="swot-card swot-threats">
              <h4>⚡ ${isRtl ? 'التهديدات' : 'Threats'}</h4>
              <ul>
                ${data.swot.threats.slice(0, 4).map(t => `<li>▸ ${t}</li>`).join('')}
              </ul>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Buyer Intent Section
// ═══════════════════════════════════════════════════════════════
const generateBuyerIntentSection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.buyerIntentAnalysis) return '';
  
  const intent = data.buyerIntentAnalysis;
  const intentLevelAr = intent.intentLevel === 'High' ? 'عالية' : intent.intentLevel === 'Medium' ? 'متوسطة' : 'منخفضة';
  const searchTypeAr = intent.searchIntentType === 'Transactional' ? 'شرائي' : intent.searchIntentType === 'Informational' ? 'معلوماتي' : 'مختلط';
  
  return `
    <div class="section page-break">
      <div class="section-header" style="background: linear-gradient(135deg, #7c3aed, #8b5cf6);">💜 ${isRtl ? 'تحليل نية الشراء' : 'Buyer Intent Analysis'}</div>
      <div class="section-content">
        <div class="stats-grid stats-grid-4">
          <div class="stat-card accent-purple">
            <div class="label">${isRtl ? 'درجة النية' : 'Intent Score'}</div>
            <div class="value">${intent.intentScore}%</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'مستوى النية' : 'Intent Level'}</div>
            <div class="value" style="font-size: 20px;">${isRtl ? intentLevelAr : intent.intentLevel}</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'نوع البحث' : 'Search Type'}</div>
            <div class="value" style="font-size: 18px;">${isRtl ? searchTypeAr : intent.searchIntentType}</div>
          </div>
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'احتمالية التحويل' : 'Conversion'}</div>
            <div class="value">${Math.round(intent.conversionProbability * 100)}%</div>
          </div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🛒 ${isRtl ? 'مرحلة رحلة المشتري' : 'Buyer Journey Stage'}</h3>
        <p style="padding: 15px; background: #ede9fe; border-${isRtl ? 'right' : 'left'}: 4px solid #8b5cf6; border-radius: 8px; font-weight: 600;">
          ${intent.buyerJourneyStage}
        </p>
        
        ${intent.keywordAnalysis.transactionalKeywords.length > 0 ? `
          <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🔑 ${isRtl ? 'الكلمات الشرائية' : 'Transactional Keywords'}</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${intent.keywordAnalysis.transactionalKeywords.slice(0, 6).map(kw => `<span class="badge badge-success">${kw}</span>`).join('')}
          </div>
        ` : ''}
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">💡 ${isRtl ? 'رؤى وتوصيات' : 'Insights'}</h3>
        <ul class="info-list">
          ${intent.insights.slice(0, 4).map(insight => `<li class="purple-border">▸ ${insight}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Growth Scenarios Section
// ═══════════════════════════════════════════════════════════════
const generateGrowthScenariosSection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.growthScenarios) return '';
  
  const scenarios = data.growthScenarios;
  const recommendedAr = scenarios.recommendedScenario === 'optimistic' ? 'متفائل' : 
                        scenarios.recommendedScenario === 'moderate' ? 'متوسط' : 'متحفظ';
  
  const generateScenarioBlock = (scenario: any, titleAr: string, titleEn: string, color: string, emoji: string) => `
    <div style="margin-bottom: 25px; border: 2px solid ${color}; border-radius: 12px; overflow: hidden;">
      <div style="background: ${color}; color: white; padding: 12px 15px; font-weight: 900; font-size: 16px;">
        ${emoji} ${isRtl ? titleAr : titleEn}
      </div>
      <div style="padding: 15px;">
        <div class="stats-grid stats-grid-4">
          <div class="stat-card">
            <div class="label">${isRtl ? 'الوحدات' : 'Units'}</div>
            <div class="value">${scenario.costBreakdown?.unitsSold || 0}</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'الإيراد' : 'Revenue'}</div>
            <div class="value" style="font-size: 18px;">${scenario.monthlyRevenue.toLocaleString()}</div>
            <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
          </div>
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'الربح' : 'Profit'}</div>
            <div class="value" style="font-size: 18px;">${scenario.monthlyProfit.toLocaleString()}</div>
            <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'النمو' : 'Growth'}</div>
            <div class="value">${scenario.growthRate}%</div>
            <div class="subtext">${isRtl ? '/شهر' : '/mo'}</div>
          </div>
        </div>
        ${scenario.costBreakdown ? `
          <div class="cost-breakdown" style="margin-top: 15px;">
            <div class="cost-row">
              <span class="label">${isRtl ? 'تكلفة المنتجات' : 'Product Costs'}</span>
              <span class="value negative">-${scenario.costBreakdown.productCosts?.toLocaleString() || 0}</span>
            </div>
            <div class="cost-row">
              <span class="label">${isRtl ? 'التسويق' : 'Marketing'}</span>
              <span class="value negative">-${scenario.costBreakdown.marketingBudget?.toLocaleString() || 0}</span>
            </div>
            <div class="cost-row">
              <span class="label">${isRtl ? 'التشغيل' : 'Operations'}</span>
              <span class="value negative">-${scenario.costBreakdown.operationalExpenses?.toLocaleString() || 0}</span>
            </div>
            <div class="cost-row">
              <span class="label">${isRtl ? 'صافي الربح' : 'Net Profit'}</span>
              <span class="value positive">+${scenario.monthlyProfit.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  return `
    <div class="section page-break">
      <div class="section-header teal">📈 ${isRtl ? 'سيناريوهات النمو' : 'Growth Scenarios'}</div>
      <div class="section-content">
        
        <div style="background: linear-gradient(135deg, #dbeafe, #e0e7ff); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #3b82f6; text-align: center;">
          <p style="font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 8px;">${isRtl ? 'السيناريو الموصى به' : 'Recommended Scenario'}</p>
          <p style="font-size: 28px; font-weight: 900; color: #3b82f6;">🎯 ${isRtl ? recommendedAr : scenarios.recommendedScenario.toUpperCase()}</p>
        </div>
        
        ${generateScenarioBlock(scenarios.optimistic, 'السيناريو المتفائل', 'Optimistic Scenario', '#059669', '🚀')}
        ${generateScenarioBlock(scenarios.moderate, 'السيناريو المتوسط', 'Moderate Scenario', '#3b82f6', '📊')}
        ${generateScenarioBlock(scenarios.conservative, 'السيناريو المتحفظ', 'Conservative Scenario', '#d97706', '🛡️')}
        
        ${scenarios.scalabilityFactors && scenarios.scalabilityFactors.length > 0 ? `
          <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🔄 ${isRtl ? 'عوامل التوسع' : 'Scalability Factors'}</h3>
          <ul class="info-list">
            ${scenarios.scalabilityFactors.filter((_: string, i: number) => isRtl ? i % 2 === 0 : i % 2 === 1).slice(0, 4).map((f: string) => `<li class="blue-border">▸ ${f}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Generate Executive Summary Section
// ═══════════════════════════════════════════════════════════════
const generateExecutiveSummarySection = (data: AnalysisResult, isRtl: boolean): string => {
  if (!data.executiveSummary) return '';
  
  const summary = data.executiveSummary;
  
  return `
    <div class="section page-break">
      <div class="section-header" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
        📋 ${isRtl ? 'الملخص التنفيذي' : 'Executive Summary'}
      </div>
      <div class="section-content">
        
        <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); padding: 20px; border-radius: 12px; border: 2px solid #f59e0b; margin-bottom: 25px;">
          <div style="white-space: pre-wrap; line-height: 1.9; font-size: 13px; color: #1e293b;">${summary.onePageSummary}</div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🔍 ${isRtl ? 'النتائج الرئيسية' : 'Key Findings'}</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${summary.keyFindings.map(finding => `
            <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border-${isRtl ? 'right' : 'left'}: 4px solid #10b981; font-size: 13px;">
              ${finding}
            </div>
          `).join('')}
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">📊 ${isRtl ? 'المقاييس الحرجة' : 'Critical Metrics'}</h3>
        <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr);">
          <div class="stat-card">
            <div class="label">${isRtl ? 'حجم السوق' : 'Market'}</div>
            <div class="value" style="font-size: 16px;">${summary.criticalMetrics.marketSize}</div>
          </div>
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'الطلب' : 'Demand'}</div>
            <div class="value" style="font-size: 20px;">${summary.criticalMetrics.demandLevel}</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'المنافسة' : 'Competition'}</div>
            <div class="value" style="font-size: 16px;">${summary.criticalMetrics.competitionLevel}</div>
          </div>
          <div class="stat-card accent-blue">
            <div class="label">${isRtl ? 'الربح' : 'Profit'}</div>
            <div class="value" style="font-size: 18px;">${summary.criticalMetrics.profitPotential}</div>
          </div>
          <div class="stat-card" style="border-color: #ef4444; background: linear-gradient(135deg, #fee2e2, #fecaca);">
            <div class="label">${isRtl ? 'المخاطر' : 'Risk'}</div>
            <div class="value" style="font-size: 20px; color: #dc2626;">${summary.criticalMetrics.riskLevel}</div>
          </div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">💰 ${isRtl ? 'الاستثمار المطلوب' : 'Investment Required'}</h3>
        <div class="stats-grid">
          <div class="stat-card accent-blue">
            <div class="label">${isRtl ? 'الاستثمار الأولي' : 'Initial'}</div>
            <div class="value">${summary.investmentRequired.initial.toLocaleString()}</div>
            <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
          </div>
          <div class="stat-card">
            <div class="label">${isRtl ? 'الشهري' : 'Monthly'}</div>
            <div class="value">${summary.investmentRequired.monthly.toLocaleString()}</div>
            <div class="subtext">${isRtl ? 'ر.س' : 'SAR'}</div>
          </div>
          <div class="stat-card accent-green">
            <div class="label">${isRtl ? 'التعادل' : 'Break Even'}</div>
            <div class="value" style="font-size: 18px;">${summary.investmentRequired.breakEven}</div>
          </div>
        </div>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">🎯 ${isRtl ? 'التوصية الاستراتيجية' : 'Strategic Recommendation'}</h3>
        <p style="padding: 20px; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 12px; font-weight: 600; line-height: 1.8;">
          ${summary.strategicRecommendation}
        </p>
        
        <h3 style="margin: 25px 0 15px; font-size: 16px; font-weight: 900; color: #0f172a;">📝 ${isRtl ? 'الخطوات التالية' : 'Next Steps'}</h3>
        <div style="display: grid; gap: 8px;">
          ${summary.nextSteps.map((step, i) => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px;">${i + 1}</div>
              <span style="font-size: 13px;">${step}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════════════
// Open Print Window
// ═══════════════════════════════════════════════════════════════
export const openPrintWindow = (
  data: AnalysisResult,
  lang: 'ar' | 'en',
  sectionName?: string
) => {
  const html = generatePrintHTML(data, lang, sectionName);
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert(lang === 'ar' ? 'فشل فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.' : 'Failed to open print window. Please allow pop-ups.');
  }
};

// ═══════════════════════════════════════════════════════════════
// Download as PDF - فتح نافذة مع زر تحميل مباشر
// ═══════════════════════════════════════════════════════════════
export const downloadAsPDF = (
  data: AnalysisResult,
  lang: 'ar' | 'en',
  sectionName?: string
) => {
  const html = generatePrintHTML(data, lang, sectionName);
  const isRtl = lang === 'ar';
  const fileName = `${data.itemName || 'Tahleel-Plus-Report'}-${new Date().toISOString().split('T')[0]}`;
  
  // إضافة شريط علوي مع زر التحميل والتعليمات
  const pdfHtml = html.replace(
    '<body>',
    `<body>
    <div id="pdf-toolbar" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #0f172a, #1e3a5f);
      color: white;
      padding: 15px 30px;
      z-index: 99999;
      font-family: Cairo, sans-serif;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      direction: ${isRtl ? 'rtl' : 'ltr'};
    ">
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 24px;">📥</span>
        <div>
          <div style="font-weight: bold; font-size: 16px;">
            ${isRtl ? 'تحميل كملف PDF' : 'Download as PDF'}
          </div>
          <div style="font-size: 12px; opacity: 0.8;">
            ${isRtl ? 'اضغط على زر التحميل ثم اختر "Save as PDF" من خيارات الطابعة' : 'Click download button, then select "Save as PDF" from printer options'}
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="window.print()" style="
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Cairo, sans-serif;
        ">
          <span>⬇️</span>
          ${isRtl ? 'تحميل PDF الآن' : 'Download PDF Now'}
        </button>
        <button onclick="document.getElementById('pdf-toolbar').style.display='none'" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          font-family: Cairo, sans-serif;
        ">
          ✕
        </button>
      </div>
    </div>
    <div style="padding-top: 80px;">`
  ).replace(
    '</body>',
    `</div>
    <style>
      @media print {
        #pdf-toolbar { display: none !important; }
        body > div:first-of-type { padding-top: 0 !important; }
      }
    </style>
    </body>`
  );
  
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  
  if (printWindow) {
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    // تركيز النافذة
    printWindow.focus();
  } else {
    alert(lang === 'ar' ? 'فشل فتح نافذة التحميل. يرجى السماح بالنوافذ المنبثقة.' : 'Failed to open download window. Please allow pop-ups.');
  }
};
