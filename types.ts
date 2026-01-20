
export type Language = 'ar' | 'en';
export type PlanType = string;
export type UserStatus = 'ACTIVE' | 'EXPIRED' | 'BANNED';

export interface AppConfig {
  geminiApiKey: string;
  googleSearchApiKey?: string;
  googleSearchId?: string;
  siteNameAr?: string;
  siteNameEn?: string;
  siteLogo?: string;
  siteFavicon?: string;
  siteDescriptionAr?: string;
  siteDescriptionEn?: string;
  siteKeywordsAr?: string;
  siteKeywordsEn?: string;
  lastUpdated?: number;
}

export interface PlanConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  discountedPrice?: number;
  stripeUrl: string;
  searchLimit: number;
  durationMonths?: number;
  featuresAr: string[];
  featuresEn: string[];
  isPopular?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  plan: PlanType;
  status: UserStatus;
  createdAt: number;
  expiryDate: number;
  searchCount: number;
  isAdmin?: boolean;
  region?: string; // 'SA', 'EG', 'AE', 'JO', etc.
}

export interface SavedAnalysis {
  id?: string;
  userId: string;
  timestamp: number;
  query: string;
  normalizedQuery?: string;
  data: AnalysisResult;
  dataAr?: AnalysisResult; // النسخة العربية المترجمة
  dataEn?: AnalysisResult; // النسخة الإنجليزية المترجمة
  originalLang?: 'ar' | 'en'; // لغة البحث الأصلية
  region?: string; // 'SA', 'AE', 'EG', etc.
  isPublished?: boolean; // هل تم نشره في المكتبة العامة
}

export interface LibraryCategory {
  id?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  order: number;
  createdAt: number;
  createdBy: string;
}

export interface PublicAnalysis {
  id?: string;
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  itemName: string;
  query: string;
  normalizedQuery?: string;
  data: AnalysisResult;
  dataAr?: AnalysisResult; // النسخة العربية المترجمة
  dataEn?: AnalysisResult; // النسخة الإنجليزية المترجمة
  originalLang?: 'ar' | 'en'; // لغة التحليل الأصلية
  publishedAt: number;
  publishedBy: string;
  publishedByEmail?: string; // إيميل الناشر
  views: number;
  notes?: string;
  region?: string; // 'SA', 'AE', 'EG', etc.
}

export interface AnalysisResult {
  itemName: string;
  category: string;
  summary: string;
  marketAnalysis: {
    actualDemand: string;
    problemSolved: string;
    searchVolumeKSA: string;
    culturalCompatibility: string;
    scalability: string;
    seasonalFactors: string;
  };
  marketingStrategy: {
    targetAudience: { demographics: string; behavior: string; interests: string[]; };
    bestChannels: string[];
    expectedCAC: string;
    conversionKPIs: string;
  };
  strategicAnalysis: {
    directCompetitors: string[];
    usp: string;
    saturationRisk: string;
    imitationRisk: string;
  };
  operationsFinancials: {
    pricingViability: string;
    expectedProfitMargins: string;
    supplyChainEase: string;
    recommendedPaymentMethods: string[];
    recommendedDelivery: string[];
  };
  finalVerdict: {
    recommendation: string;
    reasoning: string;
  };
  marketStats: {
    averagePrice: number;
    highestPrice: number;
    lowestPrice: number;
    demandLevel: string;
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
  trends: Array<{ date: string; price: number; demand: number; }>;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; };
  recommendations: string[];
  sources?: Array<{ title: string; uri: string }>;
  demandAnalysis?: {
    monthlyDemandEstimate: number;
    demandScore: number;
    seasonality: {
      peakMonths: string[];
      lowMonths: string[];
      analysis: string;
    };
    demandStability: 'High' | 'Medium' | 'Low';
    geographicDistribution: string;
  };
  competitorIntelligence?: {
    activeCompetitors: number;
    competitorStrengthIndex: number;
    topCompetitors: any[];
    marketGaps: string[];
    entryDifficulty: 'Low' | 'Medium' | 'High';
  };
  profitabilityAnalysis?: {
    averageSalePrice: number;
    estimatedProfitMargin: number;
    breakEvenPoint: number;
    profitabilityScore: number;
    priceSensitivity: string;
    estimatedMonthlyRevenue: string;
  };
  decisionMetrics?: {
    successScore: number;
    riskScore: number;
    beginnerFriendly: boolean;
    capitalRequired: string;
    timeToProfit: string;
    recommendation: 'GO' | 'NO-GO' | 'CAUTION';
  };
  opportunityFinder?: {
    opportunities: Array<{
      type: string;
      title: string;
      titleAr?: string;
      description: string;
      descriptionAr?: string;
      potentialScore: number;
    }>;
  };
  buyerIntentAnalysis?: {
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
  };
  growthScenarios?: {
    conservative: {
      monthlyRevenue: number;
      monthlyProfit: number;
      growthRate: number;
      timeframe: string;
      assumptions: string[];
    };
    moderate: {
      monthlyRevenue: number;
      monthlyProfit: number;
      growthRate: number;
      timeframe: string;
      assumptions: string[];
    };
    optimistic: {
      monthlyRevenue: number;
      monthlyProfit: number;
      growthRate: number;
      timeframe: string;
      assumptions: string[];
    };
    recommendedScenario: 'conservative' | 'moderate' | 'optimistic';
    scalabilityFactors: string[];
  };
  executiveSummary?: {
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
  };
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
  pricingTitle: string;
  pricingSubtitle: string;
  subscribeNow: string;
  manageUsers: string;
  userEmail: string;
  userPlan: string;
  userStatus: string;
  actions: string;
  noAccess: string;
  forgotPassword: string;
  resetSent: string;
  emailInUse: string;
  wrongPassword: string;
  getKey: string;
  profile: string;
  updateProfile: string;
  displayName: string;
  saveChanges: string;
  changePassword: string;
  newPassword: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  reauthRequired: string;
  // Dynamic Mappings
  verdicts: Record<string, string>;
  levels: Record<string, string>;
}
