import { Type } from "@google/genai";
import { Language, WeatherData, NewsResponse, PlantingResponse, PestForecast, CropInfo, AnalysisResult, RotationAdvice } from "../types";

const proxyUrl =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_GEMINI_PROXY_URL ??
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SUPABASE_URL
    ? `${(import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`
    : undefined);

const ensureProxyUrl = () => {
  if (!proxyUrl) {
    throw new Error("Gemini proxy URL is not configured.");
  }
  return proxyUrl;
};

type GenerateContentPayload = {
  endpoint: "generateContent";
  model: string;
  contents: any[];
  systemInstruction?: any;
  tools?: any[];
  responseMimeType?: string;
  responseSchema?: any;
  config?: any;
};

type GenerateImagePayload = {
  endpoint: "generateImages";
  model: string;
  prompt: { text: string };
  numberOfImages?: number;
  outputMimeType?: string;
  aspectRatio?: string;
};

type GeminiPayload = GenerateContentPayload | GenerateImagePayload;

const callGemini = async <T = any>(payload: GeminiPayload): Promise<T> => {
  const url = ensureProxyUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data && (data.error || data.message)) || "Gemini proxy error";
    throw new Error(message);
  }
  return data as T;
};

const extractText = (response: any): string => {
  const candidate = response?.candidates?.[0];
  const parts: any[] | undefined = candidate?.content?.parts || candidate?.content;
  if (Array.isArray(parts)) {
    const textParts = parts
      .map((part) => part?.text || part?.generatedText || (typeof part === "string" ? part : ""))
      .filter(Boolean);
    if (textParts.length) return textParts.join("\n");
  }
  if (candidate?.groundingMetadata?.webSearchQueries) {
    return candidate?.content?.parts?.[0]?.text ?? "";
  }
  return response?.text ?? "";
};

const CACHE_PREFIX = 'agri_connect_';

// Helper to manage local storage caching
async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T & { fromCache?: boolean }> {
  const cacheKey = CACHE_PREFIX + key;
  const cached = localStorage.getItem(cacheKey);

  // If offline, force return cache or error
  if (!navigator.onLine) {
    if (cached) {
      console.log(`[Offline] Serving ${key} from cache`);
      return { ...JSON.parse(cached), fromCache: true };
    }
    throw new Error("No internet connection and no cached data available.");
  }

  try {
    const data = await fetcher();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(`Fetch failed for ${key}, trying cache fallback`, error);
    if (cached) {
      return { ...JSON.parse(cached), fromCache: true };
    }
    throw error;
  }
}

const getSystemInstruction = (language: Language) => {
  const baseInstruction = `
    You are "AgriConnect Africa", a friendly and expert agricultural advisor specifically for farmers in Ghana and Sub-Saharan Africa.
    - Your tone is encouraging, practical, and respectful.
    - When discussing currency, use Ghana Cedis (GHS).
    - Focus on crops like Cocoa, Maize, Cassava, Yams, Plantains, and Rice.
    - Provide organic and accessible remedies for pest control when possible.
  `;

  const languageInstructions: Record<Language, string> = {
    'en': 'Respond in simple English.',
    'tw': 'Respond primarily in Ashanti Twi. You can use English for technical scientific terms if no Twi equivalent exists, but explain them.',
    'ee': 'Respond primarily in Ewe. You can use English for technical scientific terms if no Ewe equivalent exists, but explain them.',
    'ga': 'Respond primarily in Ga. You can use English for technical scientific terms if no Ga equivalent exists, but explain them.'
  };

  return `${baseInstruction}\n${languageInstructions[language]}`;
};

const getLanguageName = (language: Language): string => {
  switch (language) {
    case 'tw':
      return 'Twi';
    case 'ee':
      return 'Ewe';
    case 'ga':
      return 'Ga';
    case 'en':
    default:
      return 'English';
  }
};

export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  language: Language
): Promise<string> => {
  if (!navigator.onLine) {
    throw new Error("Offline");
  }
  try {
    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [
        ...history.map((h) => ({
          role: h.role,
          parts: h.parts,
        })),
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      systemInstruction: {
        role: "system",
        parts: [{ text: getSystemInstruction(language) }],
      },
    });

    return extractText(response) || "I understood, but I couldn't generate a text response.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw new Error("Failed to get response from AgriConnect Africa.");
  }
};

export const generateFarmingVisual = async (prompt: string): Promise<string> => {
  if (!navigator.onLine) throw new Error("Offline");

  try {
    const response = await callGemini({
      endpoint: "generateImages",
      model: "imagen-4.0-generate-001",
      prompt: {
        text: `A photorealistic and educational image for an African farmer showing: ${prompt}. The setting should be a farm in Ghana.`,
      },
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
      aspectRatio: "4:3",
    });

    if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
      return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw new Error("Failed to generate visual aid.");
  }
};

export const analyzeCropHealth = async (base64Image: string, language: Language): Promise<AnalysisResult> => {
  if (!navigator.onLine) throw new Error("Offline");

  try {
    let langName = 'English';
    if (language === 'tw') langName = 'Twi';
    if (language === 'ee') langName = 'Ewe';
    if (language === 'ga') langName = 'Ga';

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
              },
            },
            {
              text: `Analyze this image of a crop. 
            1. Identify the crop.
            2. Diagnose any visible diseases, pests, or nutrient deficiencies. 
            3. If healthy, confirm it.
            4. Provide practical treatment steps.
            
            Translate the textual content into ${langName}.
            Return the result as JSON.`
            },
          ],
        },
      ],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cropName: { type: Type.STRING },
          diagnosis: { type: Type.STRING },
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: "Bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000"
                }
              }
            }
          },
          treatment: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    });

    const jsonText = extractText(response) || "{}";
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("Vision Error:", error);
    throw new Error("Failed to analyze crop image.");
  }
};

export const getWeatherForecast = async (location: string, language: Language): Promise<WeatherData> => {
  return fetchWithCache(`weather_${location}_${language}`, async () => {
    let langName = 'English';
    if (language === 'tw') langName = 'Twi';
    if (language === 'ee') langName = 'Ewe';
    if (language === 'ga') langName = 'Ga';

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Find the current weather forecast for ${location}.
      If the location is coordinates, identify the nearest town or region name.
      
      Return the details in the following EXACT format (keep keys in English):
      CITY: [City/Region Name]
      TEMP: [Temperature e.g. 30°C]
      RAIN: [Precipitation chance e.g. 20%]
      WIND: [Wind speed e.g. 15 km/h]
      CONDITION: [Short weather description translated to ${langName}]`
        }]
      }],
      tools: [{ googleSearch: {} }],
    });

    const text = extractText(response) || "";

    const getVal = (key: string) => {
      const match = text.match(new RegExp(`${key}:\s*(.*)`, 'i'));
      return match ? match[1].trim() : '--';
    };

    return {
      locationName: getVal('CITY') !== '--' ? getVal('CITY') : location,
      temp: getVal('TEMP'),
      precipitation: getVal('RAIN'),
      wind: getVal('WIND'),
      condition: getVal('CONDITION')
    };
  });
};

export const getPestRiskForecast = async (weatherCondition: string, location: string, language: Language): Promise<PestForecast> => {
  return fetchWithCache(`pest_risk_${location}_${language}`, async () => {
    let langName = 'English';
    if (language === 'tw') langName = 'Twi';
    if (language === 'ee') langName = 'Ewe';
    if (language === 'ga') langName = 'Ga';

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Based on the current weather condition "${weatherCondition}" in Ghana, predict the risk of fungal diseases or insect pests for common crops (Cocoa, Maize, Tomato).
      
      Output format EXACTLY like this:
      RISK: [Low/Medium/High]
      ALERT: [One sentence warning in ${langName} about specific pests/diseases likely to thrive now]
      ACTION: [One simple preventive action in ${langName}]`
        }]
      }]
    });

    const text = extractText(response) || "";
    const getVal = (key: string) => {
      const match = text.match(new RegExp(`${key}:\s*(.*)`, 'i'));
      return match ? match[1].trim() : '';
    };

    return {
      riskLevel: (getVal('RISK') as any) || 'Low',
      alert: getVal('ALERT') || 'No immediate risks detected.',
      preventiveAction: getVal('ACTION') || 'Monitor crops daily.'
    };
  });
};

export const getLiveAgriUpdates = async (location: string, language: Language): Promise<NewsResponse> => {
  return fetchWithCache(`news_${location}_${language}`, async () => {
    const langName = getLanguageName(language);

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Search for the latest agricultural news, potential pest outbreaks, and market trends specifically for farmers in ${location}, Ghana. 
      Summarize the top 3 most important things a farmer needs to know today.
      
      Translate the summary into ${langName}.`
        }]
      }],
      tools: [{ googleSearch: {} }],
    });

    let text = extractText(response) || "No updates available.";

    if (language !== 'en') {
      const translated = await callGemini({
        endpoint: "generateContent",
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `Translate the following farming live insights into ${langName}. 
Keep it concise and farmer-friendly. Return only the translated text with no English explanation or prefix.

${text}`
          }]
        }]
      });
      text = extractText(translated) || text;
    }

    const links: { title: string, url: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          links.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      });
    }

    return { text, links };
  });
};

export const getPlantingRecommendations = async (region: string, crop: string, language: Language): Promise<PlantingResponse> => {
  return fetchWithCache(`planting_${region}_${crop}_${language}`, async () => {
    let langName = 'English';
    if (language === 'tw') langName = 'Twi';
    if (language === 'ee') langName = 'Ewe';
    if (language === 'ga') langName = 'Ga';

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Act as an expert Ghanaian agronomist.
      Tell me the best month(s) to plant **${crop}** in the **${region}** region of Ghana.
      If there are two seasons (Major and Minor), mention both.
      Keep the answer very short (maximum 20 words).
      Translate the answer into ${langName}.`
        }]
      }]
    });
    return { text: extractText(response) || "Info unavailable." };
  });
};

export const getCropDetails = async (crop: string, language: Language): Promise<CropInfo> => {
  return fetchWithCache(`crop_library_v2_${crop}_${language}`, async () => {
    let langName = 'English';
    if (language === 'tw') langName = 'Twi';
    if (language === 'ee') langName = 'Ewe';
    if (language === 'ga') langName = 'Ga';

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `Provide a detailed farming guide for ${crop} specifically for Ghana.
      Translate all content into ${langName}.
      Return the response as a JSON object.`
        }]
      }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the crop" },
          plantingSeason: { type: Type.STRING, description: "Best time to plant in Ghana" },
          careTips: { type: Type.STRING, description: "Key maintenance and care tips" },
          commonPests: { type: Type.ARRAY, items: { type: Type.STRING } },
          commonDiseases: { type: Type.ARRAY, items: { type: Type.STRING } },
          soilRequirements: { type: Type.STRING, description: "Ideal soil type and PH" },
          companionPlants: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Good companion plants" },
          harvesting: { type: Type.STRING, description: "Signs of maturity and harvesting advice" }
        }
      }
    });

    const jsonText = extractText(response) || "{}";
    return JSON.parse(jsonText) as CropInfo;
  });
};

export const getCropRotationAdvice = async (region: string, previousCrops: string[], language: Language): Promise<RotationAdvice> => {
  return fetchWithCache(`rotation_${region}_${previousCrops.join('_')}_${language}`, async () => {
    let langName = 'English';
    if (language === 'tw') langName = 'Twi';
    if (language === 'ee') langName = 'Ewe';
    if (language === 'ga') langName = 'Ga';

    const response = await callGemini({
      endpoint: "generateContent",
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: `I farm in ${region}, Ghana. My previously planted crops were: ${previousCrops.join(', ')}.
      Suggest the best crop to plant next for crop rotation to improve soil health and break pest cycles.
      Explain why.
      Translate to ${langName} and return JSON.`
        }]
      }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING },
          soilBenefits: { type: Type.STRING }
        }
      }
    });

    const jsonText = extractText(response) || "{}";
    return JSON.parse(jsonText) as RotationAdvice;
  });
};
