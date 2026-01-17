
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";
import { getAppConfig } from "./userService";

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
        recommendation: { type: Type.STRING },
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
  // Fetch application configuration directly from Firestore to ensure the latest keys are used
  const dbConfig = await getAppConfig();
  
  // 1. Prioritize DB-stored key, fallback to ENV for initial setup if DB is empty
  const apiKey = dbConfig?.geminiApiKey || process.env.API_KEY;

  if (!apiKey || apiKey.length < 10) {
    throw new Error(lang === 'ar' 
      ? "خطأ في الاتصال: لم يتم ضبط مفتاح الذكاء الاصطناعي (Gemini API Key) في لوحة التحكم بشكل صحيح." 
      : "Connection Error: Gemini API Key is missing or invalid in the Admin Dashboard.");
  }

  // 2. Initialize the AI client with the provided key
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    You are an elite Saudi market strategist (Expert Level). 
    Your mission is to provide high-precision business analysis for: "${query}".
    
    CRITICAL RULES:
    - Use LIVE Search to find actual stores in KSA (Salla, Zid, Floward, Noon, etc.)
    - Analyze pricing in SAR.
    - Evaluate cultural compatibility with Saudi Vision 2030 and KSA consumer behavior.
    - Provide a definitive GO, NO-GO, or PROCEED WITH CAUTION verdict.
    
    LANGUAGE: ${lang === 'ar' ? 'Arabic' : 'English'}.
    Year: 2025.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform deep market analysis for: "${query}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        // The Google Search grounding tool automatically uses the session credentials
        // If the user provided a Custom Search ID, Gemini Pro manages the grounding internally.
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");

    const result = JSON.parse(text) as AnalysisResult;
    
    // Add grounding metadata if available
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
  } catch (error: any) {
    console.error("AI Service Error:", error);
    
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error(lang === 'ar' ? "مفتاح API غير صالح. يرجى التأكد من صحة المفتاح في لوحة التحكم." : "Invalid API Key. Please verify your Gemini API key in the admin panel.");
    }
    
    throw new Error(lang === 'ar' 
      ? "فشل في إنشاء التقرير. تأكد من تفعيل خدمة الدفع في Google AI Studio وربط المفتاح." 
      : "Failed to generate report. Ensure billing is enabled in Google AI Studio and the key is active.");
  }
}
