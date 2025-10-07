import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { Country } from '../types';
import { COLOR_TRANSLATIONS } from '../constants';

/**
 * =================================================================================
 * WARNING: SECURITY VULNERABILITY
 * =================================================================================
 * This service communicates directly with the Google AI API from the client-side.
 * This requires the API key (process.env.API_KEY) to be exposed in the browser,
 * which is a significant security risk in a production environment.
 *
 * For a real-world application, this logic should be moved to a secure backend
 * server (a "proxy") that manages the API key and communicates with Google.
 * The client would then make requests to your backend, not directly to Google.
 *
 * This implementation is for demonstration and development purposes only.
 * =================================================================================
 */

export const getAiAvailability = (): boolean => {
    // FIX: Use process.env.API_KEY as per coding guidelines to fix TypeScript error.
    return !!process.env.API_KEY;
};

// Lazy initialize the AI client to avoid creating an instance if not needed.
let ai: GoogleGenAI | null = null;
const getAiClient = () => {
    if (!getAiAvailability()) {
        throw new Error('AI features are unavailable. API_KEY is missing.');
    }
    if (!ai) {
        // FIX: Use process.env.API_KEY as per coding guidelines to fix TypeScript error.
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    }
    return ai;
}

export const fetchCountryQuickFact = async (countryName: string, language: string): Promise<string> => {
    const aiClient = getAiClient();
    const prompt = language === 'pt'
        ? `Me dê um fato curto e interessante sobre ${countryName} em uma única frase.`
        : `Give me a short, interesting fun fact about ${countryName} in a single sentence.`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim();
};

export const fetchFlagComparison = async (country1: Country, country2: Country, language: string): Promise<string> => {
    const aiClient = getAiClient();
    const name1 = language === 'pt' ? country1.translations.por.common : country1.name.common;
    const name2 = language === 'pt' ? country2.translations.por.common : country2.name.common;

    const prompt = language === 'pt'
        ? `Compare as bandeiras de ${name1} e ${name2}. Descreva brevemente uma semelhança e uma diferença chave em sua simbologia ou design. Responda em um parágrafo.`
        : `Compare the flags of ${name1} and ${name2}. Briefly describe one key similarity and one key difference in their symbolism or design. Respond in one paragraph.`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const editFlagWithAi = async (base64ImageData: string, mimeType: string, prompt: string): Promise<{ base64: string; mimeType: string; }> => {
    const aiClient = getAiClient();
    
    const imagePart = { inlineData: { data: base64ImageData, mimeType } };
    const textPart = { text: prompt };

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const imageOutput = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imageOutput?.inlineData) {
        return {
            base64: imageOutput.inlineData.data,
            mimeType: imageOutput.inlineData.mimeType,
        };
    }
    throw new Error('AI did not return an image.');
};

export const fetchCountryFacts = async (countryName: string, language: string): Promise<string> => {
    const aiClient = getAiClient();
    const prompt = language === 'pt'
        ? `Liste 3-4 fatos interessantes sobre ${countryName}. Formate como uma lista com marcadores (usando '-').`
        : `List 3-4 interesting facts about ${countryName}. Format as a bulleted list (using '-').`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const collectionGenerators: {
    title: { en: string; pt: string };
    getCountries: (countries: Country[]) => Country[];
}[] = [
    {
        title: { en: "Population Giants", pt: "Gigantes Populacionais" },
        getCountries: (countries: Country[]) => {
            return [...countries].sort((a, b) => b.population - a.population).slice(0, 4);
        }
    },
    {
        title: { en: "Smallest Nations by Area", pt: "Menores Nações por Área" },
        getCountries: (countries: Country[]) => {
            return [...countries].filter(c => c.area > 0).sort((a, b) => a.area - b.area).slice(0, 4);
        }
    },
    {
        title: { en: "The Power of Red, White, and Blue", pt: "O Poder do Vermelho, Branco e Azul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'FRA', 'GBR', 'RUS', 'NLD', 'CHL', 'CUB', 'THA', 'NOR', 'AUS', 'NZL', 'CZE', 'PAN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags with a Golden Touch", pt: "Bandeiras com um Toque Dourado" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'DEU', 'COL', 'BEL', 'ROU', 'VEN', 'ECU', 'BOL', 'UKR', 'SWE', 'BRA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Nordic Crosses", pt: "Cruzes Nórdicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DNK', 'SWE', 'NOR', 'FIN', 'ISL'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Green in the Flag", pt: "Verde na Bandeira" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BRA', 'NGA', 'ITA', 'IRL', 'MEX', 'PAK', 'SAU', 'BGD', 'PRT', 'ZAF'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
];

export const fetchFeaturedCountries = async (allCountries: Country[], language: string): Promise<{ title: string, countries: Country[] }> => {
    // This function no longer uses AI. It creates a random collection on each call.
    if (allCountries.length === 0) {
        return { title: '', countries: [] };
    }

    const generator = collectionGenerators[Math.floor(Math.random() * collectionGenerators.length)];
    
    const title = generator.title[language as 'en' | 'pt'];
    const countries = generator.getCountries(allCountries);
    
    return { title, countries };
};

export const fetchFlagsByQuery = async (query: string, allCountries: Country[], language: string): Promise<string[]> => {
    const aiClient = getAiClient();
    const countryNames = allCountries.map(c => language === 'pt' ? c.translations.por.common : c.name.common);

    const prompt = language === 'pt'
        ? `Você é um especialista em vexilologia. Dada a consulta de pesquisa de um usuário: "${query}". Qual dos seguintes países melhor corresponde à consulta? Responda apenas com uma lista de nomes de países que correspondam. Países disponíveis: ${countryNames.join(', ')}`
        : `You are a vexillology expert. Given a user's search query: "${query}". Which of the following countries best match the query? Respond with only a list of country names that match. Available countries: ${countryNames.join(', ')}`;
    
    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { countries: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        }
    });

    const result = JSON.parse(response.text);
    return result.countries || [];
};

export const fetchFlagsByColor = async (colors: string[], allCountries: Country[], language: 'en' | 'pt'): Promise<string[]> => {
    const aiClient = getAiClient();
    const translatedColors = colors.map(c => COLOR_TRANSLATIONS[c][language]);

    const prompt = language === 'pt'
        ? `Liste países cujas bandeiras contêm TODAS as seguintes cores: ${translatedColors.join(', ')}. Responda apenas com uma lista de nomes de países.`
        : `List countries whose flags contain ALL of the following colors: ${translatedColors.join(', ')}. Respond with only a list of country names.`;
        
    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { countries: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        }
    });

    const result = JSON.parse(response.text);
    const aiCountryNames = new Set((result.countries || []).map((c: string) => c.toLowerCase()));

    return allCountries
        .filter(country => aiCountryNames.has((language === 'pt' ? country.translations.por.common : country.name.common).toLowerCase()))
        .map(country => language === 'pt' ? country.translations.por.common : country.name.common);
};

export const fetchSimilarFlags = async (targetCountry: Country, allCountries: Country[], language: string): Promise<Country[]> => {
    const cacheKey = `similarFlags_v2_${targetCountry.cca3}_${language}`;
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
        try {
            const countryNames = JSON.parse(cachedItem);
            return countryNames.map((name: string) => 
                allCountries.find(c => (language === 'pt' ? c.translations.por.common : c.name.common).toLowerCase() === name.toLowerCase())
            ).filter((c?: Country): c is Country => c !== undefined);
        } catch (e) { sessionStorage.removeItem(cacheKey); }
    }

    const aiClient = getAiClient();
    const countryList = allCountries
        .filter(c => c.cca3 !== targetCountry.cca3)
        .map(c => language === 'pt' ? c.translations.por.common : c.name.common);
    
    const targetCountryName = language === 'pt' ? targetCountry.translations.por.common : targetCountry.name.common;

    const prompt = language === 'pt'
        ? `Com base no design visual (cores, padrões, símbolos), quais 4 países da seguinte lista têm bandeiras mais semelhantes à de ${targetCountryName}? Lista: ${countryList.join(', ')}.`
        : `Based on visual design (colors, patterns, symbols), which 4 countries from the following list have the most similar flags to ${targetCountryName}'s? List: ${countryList.join(', ')}.`;

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: { similarCountryNames: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        }
    });

    const result = JSON.parse(response.text);
    const similarCountryNames = (result.similarCountryNames || []).slice(0, 4);
    
    sessionStorage.setItem(cacheKey, JSON.stringify(similarCountryNames));

    return similarCountryNames.map((name: string) => {
        return allCountries.find(c => (language === 'pt' ? c.translations.por.common : c.name.common).toLowerCase() === name.toLowerCase());
    }).filter((c?: Country): c is Country => c !== undefined);
};