
export type Language = 'ar' | 'en';

export interface AnalysisResult {
  itemName: string;
  category: string;
  summary: string;
  
  // 1. Market & Demand
  marketAnalysis: {
    actualDemand: string;
    problemSolved: string;
    searchVolumeKSA: 'High' | 'Medium' | 'Low';
    culturalCompatibility: string;
    scalability: string;
    seasonalFactors: string;
  };

  // 2. Audience & Marketing
  marketingStrategy: {
    targetAudience: {
      demographics: string;
      behavior: string;
      interests: string[];
    };
    bestChannels: string[];
    expectedCAC: string; // Customer Acquisition Cost
    conversionKPIs: string; // ROAS, Conversion rates
  };

  // 3. Competitive & Strategic
  strategicAnalysis: {
    directCompetitors: string[];
    usp: string; // Unique Selling Point
    saturationRisk: string;
    imitationRisk: string;
  };

  // 4. Financial & Operations
  operationsFinancials: {
    pricingViability: string;
    expectedProfitMargins: string;
    supplyChainEase: string;
    recommendedPaymentMethods: string[];
    recommendedDelivery: string[];
  };

  // 5. Final Verdict
  finalVerdict: {
    recommendation: 'GO' | 'NO-GO' | 'PROCEED WITH CAUTION';
    reasoning: string;
  };

  marketStats: {
    averagePrice: number;
    highestPrice: number;
    lowestPrice: number;
    demandLevel: 'High' | 'Medium' | 'Low';
    marketSaturation: number;
  };
  competitors: Array<{
    storeName: string;
    price: number;
    rating: number;
    shippingDays: number;
    stockStatus: string;
    url: string;
  }>;
  trends: Array<{
    date: string;
    price: number;
    demand: number;
  }>;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: string[];
  sources?: Array<{ title: string; uri: string }>;
}

export interface TranslationStrings {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchBtn: string;
  analyzing: string;
  resultsTitle: string;
  marketStats: string;
  competitorTable: string;
  swotAnalysis: string;
  recommendations: string;
  priceTrend: string;
  store: string;
  price: string;
  rating: string;
  shipping: string;
  status: string;
  avgPrice: string;
  demand: string;
  saturation: string;
  liveBadge: string;
  sourcesTitle: string;
  verdictTitle: string;
  marketDeepDive: string;
  marketingSection: string;
  opsSection: string;
  strategySection: string;
  login: string;
  logout: string;
  signup: string;
  email: string;
  password: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  adminBadge: string;
  welcome: string;
  authRequired: string;
}
