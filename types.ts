
export type Language = 'ar' | 'en';
export type PlanType = string;
export type UserStatus = 'ACTIVE' | 'EXPIRED' | 'BANNED';

export interface AppConfig {
  geminiApiKey: string;
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
  stripeUrl: string;
  searchLimit: number;
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
}

export interface SavedAnalysis {
  id?: string;
  userId: string;
  timestamp: number;
  query: string;
  data: AnalysisResult;
}

export interface AnalysisResult {
  itemName: string;
  category: string;
  summary: string;
  marketAnalysis: {
    actualDemand: string;
    problemSolved: string;
    searchVolumeKSA: 'High' | 'Medium' | 'Low';
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
  trends: Array<{ date: string; price: number; demand: number; }>;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; };
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
}
