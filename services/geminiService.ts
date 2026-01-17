
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    itemName: { type: Type.STRING },
    category: { type: Type.STRING },
    summary: { type: Type.STRING },
    
    marketAnalysis: {
      type: Type.OBJECT,
      properties: {
        actualDemand: { type: Type.STRING },
        problemSolved: { type: Type.STRING },
        searchVolumeKSA: { type: Type.STRING },
        culturalCompatibility: { type: Type.STRING },
        scalability: { type: Type.STRING },
        seasonalFactors: { type: Type.STRING },
      },
      required: ["actualDemand", "problemSolved", "searchVolumeKSA", "culturalCompatibility", "scalability", "seasonalFactors"],
    },
    
    marketingStrategy: {
      type: Type.OBJECT,
      properties: {
        targetAudience: {
          type: Type.OBJECT,
          properties: {
            demographics: { type: Type.STRING },
            behavior: { type: Type.STRING },
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["demographics", "behavior", "interests"],
        },
        bestChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
        expectedCAC: { type: Type.STRING },
        conversionKPIs: { type: Type.STRING },
      },
      required: ["targetAudience", "bestChannels", "expectedCAC", "conversionKPIs"],
    },

    strategicAnalysis: {
      type: Type.OBJECT,
      properties: {
        directCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } },
        usp: { type: Type.STRING },
        saturationRisk: { type: Type.STRING },
        imitationRisk: { type: Type.STRING },
      },
      required: ["directCompetitors", "usp", "saturationRisk", "imitationRisk"],
    },

    operationsFinancials: {
      type: Type.OBJECT,
      properties: {
        pricingViability: { type: Type.STRING },
        expectedProfitMargins: { type: Type.STRING },
        supplyChainEase: { type: Type.STRING },
        recommendedPaymentMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendedDelivery: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["pricingViability", "expectedProfitMargins", "supplyChainEase", "recommendedPaymentMethods", "recommendedDelivery"],
    },

    finalVerdict: {
      type: Type.OBJECT,
      properties: {
        recommendation: { type: Type.STRING }, // GO, NO-GO, PROCEED WITH CAUTION
        reasoning: { type: Type.STRING },
      },
      required: ["recommendation", "reasoning"],
    },

    marketStats: {
      type: Type.OBJECT,
      properties: {
        averagePrice: { type: Type.NUMBER },
        highestPrice: { type: Type.NUMBER },
        lowestPrice: { type: Type.NUMBER },
        demandLevel: { type: Type.STRING },
        marketSaturation: { type: Type.NUMBER },
      },
      required: ["averagePrice", "highestPrice", "lowestPrice", "demandLevel", "marketSaturation"],
    },
    competitors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          storeName: { type: Type.STRING },
          price: { type: Type.NUMBER },
          rating: { type: Type.NUMBER },
          shippingDays: { type: Type.NUMBER },
          stockStatus: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["storeName", "price", "rating", "shippingDays", "stockStatus", "url"],
      },
    },
    trends: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          price: { type: Type.NUMBER },
          demand: { type: Type.NUMBER },
        },
        required: ["date", "price", "demand"],
      },
    },
    swot: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"],
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["itemName", "category", "summary", "marketAnalysis", "marketingStrategy", "strategicAnalysis", "operationsFinancials", "finalVerdict", "marketStats", "competitors", "trends", "swot", "recommendations"],
};

export async function analyzeEcommerceQuery(query: string, lang: 'ar' | 'en'): Promise<AnalysisResult> {
  const systemInstruction = `
    You are an elite Saudi market strategist and business consultant (Expert Level).
    Provide a hyper-professional data analysis for: "${query}".
    
    You MUST address all 18 professional pillars for the Saudi Market:
    1. Actual demand vs perceived demand.
    2. Clarity of the problem being solved.
    3. Search volume and interest within KSA (specifically).
    4. Saudi Cultural/Behavioral compatibility (buying habits).
    5. Detailed audience persona (Saudi demographics).
    6. Direct competitors (real active stores).
    7. Unique Selling Point (USP) recommendation.
    8. Pricing viability in SAR.
    9. Projected profit margins (benchmarks).
    10. Best sales channels (Snapchat/TikTok ads vs SEO vs WhatsApp).
    11. Estimated Customer Acquisition Cost (CAC) for this niche in KSA.
    12. Scalability potential.
    13. Seasonal impacts (Ramadan, Eids, Back to school).
    14. Saturation and imitation risks.
    15. Supply chain and ops ease (importing to KSA, local storage).
    16. Optimal payment/delivery (Tabby/Tamara, Aramex/SMSA/Spl).
    17. Projected KPI benchmarks (ROAS/Conversion).
    18. FINAL VERDICT: A professional GO or NO-GO decision.

    Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
    Use REAL current data from Live Search for the year 2025.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze this query for the Saudi market with full depth: "${query}"`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      tools: [{ googleSearch: {} }],
    },
  });

  try {
    const result = JSON.parse(response.text) as AnalysisResult;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri,
        }));
    }
    return result;
  } catch (error) {
    console.error("Analysis Parse Error:", error);
    throw new Error("Failed to generate strategic report. Please try again.");
  }
}
