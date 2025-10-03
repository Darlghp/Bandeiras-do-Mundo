// Fix: Import Modality for image editing capabilities.
import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { Country } from '../types';

let ai: GoogleGenAI | null = null;
let isAiAvailable = false;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    isAiAvailable = true;
  } else {
    console.warn("AI features disabled. API_KEY environment variable not set.");
  }
} catch (error) {
    console.warn("AI features disabled due to an error during initialization.", error);
}

export const getAiAvailability = (): boolean => {
    return isAiAvailable;
};

const textModel = "gemini-2.5-flash";

export const fetchCountryQuickFact = async (countryName: string, language: string): Promise<string> => {
    if (!ai) throw new Error("AI client is not configured.");

    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const prompt = language === 'pt'
    ? `Dê-me um único fato divertido e surpreendente sobre ${countryName}. 
O fato deve ser uma frase completa, muito curta e ter no máximo 100 caracteres.
Responda em ${langForPrompt} apenas com o fato, sem texto adicional.`
    : `Give me a single, surprising fun fact about ${countryName}. 
The fact must be one complete sentence, very short, and a maximum of 100 characters.
Respond in ${langForPrompt} with only the fact, no additional text.`;

    try {
        const response = await ai.models.generateContent({ model: textModel, contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error fetching quick fact from Gemini API:", error);
        throw new Error("Could not retrieve AI-powered quick fact.");
    }
};

export const fetchFlagComparison = async (country1: Country, country2: Country, language: string): Promise<string> => {
    if (!ai) throw new Error("AI client is not configured.");

    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const c1Name = language === 'pt' ? country1.translations.por.common : country1.name.common;
    const c2Name = language === 'pt' ? country2.translations.por.common : country2.name.common;

    const prompt = language === 'pt'
    ? `Aja como um especialista em vexilologia. Compare e contraste as bandeiras de ${c1Name} e ${c2Name}. 
Analise seus elementos visuais (cores, símbolos, layout) e explique brevemente as possíveis semelhanças ou diferenças em seu simbolismo.
A resposta deve estar em ${langForPrompt} e ser formatada como um parágrafo conciso.`
    : `Act as a vexillology expert. Compare and contrast the flags of ${c1Name} and ${c2Name}. 
Analyze their visual elements (colors, symbols, layout) and briefly explain any potential similarities or differences in their symbolism.
The response should be in ${langForPrompt} and formatted as a concise paragraph.`;

    try {
        const response = await ai.models.generateContent({ model: textModel, contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error fetching flag comparison from Gemini API:", error);
        throw new Error("Could not retrieve AI-powered comparison.");
    }
};

// Fix: Add the missing editFlagWithAi function to enable AI-powered image editing.
export const editFlagWithAi = async (base64ImageData: string, mimeType: string, prompt: string, language: string): Promise<{ base64: string; mimeType: string; }> => {
    if (!ai) {
        throw new Error("AI client is not configured.");
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }
        
        throw new Error("AI did not return an image.");

    } catch (error) {
        console.error("Error editing flag with Gemini API:", error);
        throw new Error("Could not edit flag with AI.");
    }
};


export const fetchCountryFacts = async (countryName: string, language: string): Promise<string> => {
    if (!ai) {
        throw new Error("AI client is not configured.");
    }
    
    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const prompt = language === 'pt'
    ? `Diga-me três fatos interessantes e divertidos sobre ${countryName}.
Os fatos devem ser concisos e fáceis de ler para o público em geral.
Forneça a resposta em ${langForPrompt}.
Formate a resposta como uma lista simples, com cada fato começando com um hífen (-) e um espaço. Não adicione nenhum texto introdutório ou conclusivo, apenas a lista de fatos.`
    : `Tell me three interesting and fun facts about ${countryName}. 
The facts should be concise and easy to read for a general audience.
Provide the response in ${langForPrompt}.
Format the response as a simple list, with each fact starting with a dash (-) and a space. Do not add any introductory or concluding text, just the list of facts.`;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Error fetching facts from Gemini API:", error);
        throw new Error("Could not retrieve AI-powered insights.");
    }
};

interface FeaturedCountriesResponse {
    title: string;
    countryNames: string[];
}

const FEATURED_CACHE_KEY_PREFIX = 'featuredCountries_v1';
const FEATURED_CACHE_EXPIRATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export const fetchFeaturedCountries = async (allCountries: Country[], language: string): Promise<{ title: string, countries: Country[] }> => {
    if (!ai) {
        throw new Error("AI client is not configured.");
    }
    
    const CACHE_KEY = `${FEATURED_CACHE_KEY_PREFIX}_${language}`;
    const cachedItem = localStorage.getItem(CACHE_KEY);

    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < FEATURED_CACHE_EXPIRATION_MS) {
                const featuredCountries = data.countryNames.map((name: string) => {
                    const searchName = name.toLowerCase();
                    return allCountries.find(c => 
                        c.name.common.toLowerCase() === searchName || 
                        c.translations.por.common.toLowerCase() === searchName
                    );
                }).filter((c?: Country): c is Country => c !== undefined);

                if (featuredCountries.length === data.countryNames.length) {
                    return { title: data.title, countries: featuredCountries };
                }
            }
            localStorage.removeItem(CACHE_KEY);
        } catch (error) {
            console.error("Error parsing cached featured countries data, removing it.", error);
            localStorage.removeItem(CACHE_KEY);
        }
    }

    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const countryList = allCountries.map(c => language === 'pt' ? c.translations.por.common : c.name.common).join(', ');
    
    const prompt = language === 'pt'
    ? `Da lista de países fornecida, selecione de 5 a 7 países que compartilham um tema comum e interessante relacionado às suas bandeiras (ex: contém uma cor específica, apresenta um animal, tem um formato único, etc.). Crie um título atraente para esta coleção. Os nomes dos países devem ser da lista.

Lista de países: ${countryList}

Responda em ${langForPrompt}.`
    : `From the provided list of countries, select 5-7 countries that share a common, interesting theme related to their flags (e.g., contains a specific color, features an animal, has a unique shape, etc.). Create a compelling title for this collection. The country names must be from the list.

List of countries: ${countryList}

Respond in ${langForPrompt}.`;


    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: language === 'pt' ? `Um título criativo para a coleção temática de países em ${langForPrompt}.` : `A creative title for the themed collection of countries in ${langForPrompt}.`
                        },
                        countryNames: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            },
                            description: language === 'pt' ? "Uma matriz de nomes de países da lista fornecida que se encaixam no tema." : "An array of country names from the provided list that fit the theme."
                        }
                    }
                }
            }
        });
        
        const result: FeaturedCountriesResponse = JSON.parse(response.text);
        
        try {
            const cachePayload = {
                timestamp: Date.now(),
                data: {
                    title: result.title,
                    countryNames: result.countryNames,
                },
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
        } catch (error) {
            console.error("Failed to cache featured countries data.", error);
        }

        const featuredCountries = result.countryNames
            .map(name => {
                const searchName = name.toLowerCase();
                return allCountries.find(c => 
                    c.name.common.toLowerCase() === searchName || 
                    c.translations.por.common.toLowerCase() === searchName
                );
            })
            .filter((c): c is Country => c !== undefined);

        return {
            title: result.title,
            countries: featuredCountries,
        };
    } catch (error) {
        console.error("Error fetching featured countries from Gemini API:", error);
        throw new Error("Could not retrieve AI-powered featured countries.");
    }
};

export const fetchTitleForFlag = async (country: Country, language: string): Promise<string> => {
    if (!ai) {
        throw new Error("AI client is not configured.");
    }

    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const countryName = language === 'pt' ? country.translations.por.common : country.name.common;

    const prompt = language === 'pt'
    ? `Crie um título curto, cativante e descritivo para a bandeira de ${countryName}. 
O título deve destacar uma característica única da bandeira ou do país.
Responda em ${langForPrompt} com apenas o título, sem texto adicional.`
    : `Create a short, catchy, and descriptive title for the flag of ${countryName}. 
The title should highlight a unique feature of the flag or the country.
Respond in ${langForPrompt} with only the title, no additional text.`;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: language === 'pt' ? `Um título criativo para a bandeira em ${langForPrompt}.` : `A creative title for the flag in ${langForPrompt}.`
                        }
                    }
                }
            }
        });

        const result: { title: string } = JSON.parse(response.text);
        return result.title;

    } catch (error) {
        console.error("Error fetching title for Flag of the Day from Gemini API:", error);
        // Fallback in case of API error
        return countryName;
    }
};

export const fetchFlagsByQuery = async (query: string, allCountries: Country[], language: string): Promise<string[]> => {
    if (!ai) {
        throw new Error("AI client is not configured.");
    }

    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const countryNames = allCountries.map(c => language === 'pt' ? c.translations.por.common : c.name.common);

    const prompt = language === 'pt'
    ? `A partir da seguinte lista de países, retorne uma lista de nomes de países que correspondem à consulta do usuário.
Consulta: "${query}"
Responda apenas com uma matriz JSON de strings contendo os nomes exatos dos países da lista. Se nenhum país corresponder, retorne uma matriz vazia.
Lista de países: ${countryNames.join(', ')}`
    : `From the following list of countries, return a list of country names that match the user query.
Query: "${query}"
Respond with only a JSON array of strings containing the exact country names from the list. If no countries match, return an empty array.
List of countries: ${countryNames.join(', ')}`;
    
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        countries: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                            },
                            description: "An array of country names from the provided list that match the query."
                        }
                    }
                }
            }
        });

        const result: { countries: string[] } = JSON.parse(response.text);
        return result.countries || [];

    } catch (error) {
        console.error("Error fetching flags by query from Gemini API:", error);
        throw new Error("Could not perform AI search.");
    }
};

export const fetchSimilarFlags = async (
    targetCountry: Country,
    allCountries: Country[],
    language: string
): Promise<Country[]> => {
    if (!ai) throw new Error("AI client is not configured.");

    const langForPrompt = language === 'pt' ? 'Português' : 'English';
    const targetCountryName = language === 'pt' ? targetCountry.translations.por.common : targetCountry.name.common;
    const countryList = allCountries
        .filter(c => c.cca3 !== targetCountry.cca3)
        .map(c => language === 'pt' ? c.translations.por.common : c.name.common);

    const cacheKey = `similarFlags_v1_${targetCountry.cca3}_${language}`;
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
        try {
            const countryNames = JSON.parse(cachedItem);
            return countryNames.map((name: string) => 
                allCountries.find(c => 
                    (language === 'pt' ? c.translations.por.common : c.name.common) === name
                )
            ).filter((c?: Country): c is Country => c !== undefined);
        } catch (e) {
            console.error("Error parsing cached similar flags", e);
            sessionStorage.removeItem(cacheKey);
        }
    }

    const prompt = language === 'pt'
    ? `Aja como um especialista em vexilologia. A bandeira de ${targetCountryName} está sendo exibida. 
A partir da lista de países a seguir, identifique de 3 a 5 países com bandeiras visualmente ou simbolicamente semelhantes.
Priorize semelhanças visuais (esquemas de cores, layouts, símbolos) sobre temas abstratos.
Responda APENAS com uma matriz JSON de strings, contendo os nomes exatos dos países da lista. Não inclua o país alvo (${targetCountryName}) na resposta.

Lista de países: ${countryList.join(', ')}`
    : `Act as a vexillology expert. The flag of ${targetCountryName} is being displayed. 
From the following list of countries, identify 3 to 5 countries with visually or symbolically similar flags.
Prioritize visual similarities (color schemes, layouts, symbols) over abstract themes.
Respond ONLY with a JSON array of strings, containing the exact country names from the list. Do not include the target country (${targetCountryName}) in the response.

List of countries: ${countryList.join(', ')}`;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similarCountryNames: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 3-5 country names from the list with similar flags."
                        }
                    }
                }
            }
        });

        const result: { similarCountryNames: string[] } = JSON.parse(response.text);
        const similarCountryNames = result.similarCountryNames || [];
        
        sessionStorage.setItem(cacheKey, JSON.stringify(similarCountryNames));

        return similarCountryNames.map(name => {
            return allCountries.find(c => 
                (language === 'pt' ? c.translations.por.common : c.name.common) === name
            );
        }).filter((c?: Country): c is Country => c !== undefined);

    } catch (error) {
        console.error("Error fetching similar flags from Gemini API:", error);
        throw new Error("Could not retrieve AI-powered similar flags.");
    }
};