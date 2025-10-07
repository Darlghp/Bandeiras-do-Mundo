import { GoogleGenAI, Type, Modality } from '@google/genai';
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
    {
        title: { en: "Island Nations", pt: "Nações Insulares" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JPN', 'GBR', 'CUB', 'IDN', 'PHL', 'MDG', 'NZL', 'IRL', 'ISL', 'JAM', 'FJI', 'CYP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Landlocked & Surrounded", pt: "Cercados por Terra" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CHE', 'AUT', 'CZE', 'HUN', 'BOL', 'PRY', 'NPL', 'MNG', 'RWA', 'BFA', 'LUX', 'SVK'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Featuring Fauna", pt: "Apresentando a Fauna" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['MEX', 'EGY', 'ESP', 'ALB', 'ECU', 'UGA', 'ZMB', 'PNG', 'LKA', 'SRB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Crescent & Star", pt: "Crescente e Estrela" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['TUR', 'DZA', 'MYS', 'PAK', 'SGP', 'TUN', 'TKM', 'UZB', 'MRT', 'COM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Black, Yellow, and Red Triumvirate", pt: "Triunvirato de Preto, Amarelo e Vermelho" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DEU', 'BEL', 'AGO', 'UGA', 'PNG', 'TLS'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Vibrancy of Pan-African Colors", pt: "Vibração das Cores Pan-Africanas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GHA', 'SEN', 'MLI', 'GIN', 'CMR', 'ETH', 'BEN', 'COG'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Unity in Pan-Arab Hues", pt: "Unidade em Tons Pan-Árabes" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['EGY', 'IRQ', 'JOR', 'KWT', 'PSE', 'SDN', 'SYR', 'ARE', 'YEM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Minimalist Palettes: Two Colors", pt: "Paletas Minimalistas: Duas Cores" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JPN', 'CAN', 'CHE', 'TUR', 'BRA', 'KOR', 'GRC', 'ISR', 'VNM', 'BGD', 'POL', 'IDN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "An Orange Presence", pt: "Uma Presença Laranja" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['IND', 'IRL', 'CIV', 'ARM', 'BTN', 'NER', 'ZMB', 'LKA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Guided by the Southern Cross", pt: "Guiados pelo Cruzeiro do Sul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AUS', 'NZL', 'BRA', 'PNG', 'WSM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags of the Sun", pt: "Bandeiras do Sol" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ARG', 'URY', 'JPN', 'TWN', 'KAZ', 'KGZ', 'MKD', 'MWI', 'RWA', 'PHL'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags Bearing a Shield", pt: "Bandeiras com um Escudo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'PRT', 'SRB', 'KEN', 'SWZ', 'FJI', 'ECU', 'MEX', 'ZWE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Weaponry on Display", pt: "Armas em Exibição" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['SAU', 'AGO', 'MOZ', 'KEN', 'GTM', 'OMN', 'HTI'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Architectural Flags", pt: "Bandeiras Arquitetônicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AFG', 'KHM', 'PRT', 'SMR', 'ESP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Nature's Emblems: Flora", pt: "Emblemas da Natureza: Flora" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CAN', 'LBN', 'CYP', 'FJI', 'GNQ', 'HTI', 'MEX'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Echoes of the Union Jack", pt: "Ecos da Union Jack" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GBR', 'AUS', 'NZL', 'FJI', 'TUV'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Lone Star", pt: "A Estrela Solitária" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['VNM', 'CUB', 'CHL', 'GHA', 'CMR', 'SEN', 'TUR', 'MAR', 'SOM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Constellations of Stars", pt: "Constelações de Estrelas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'BRA', 'AUS', 'CHN', 'UZB', 'TUV', 'CPV'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Mythical & Heraldic Creatures", pt: "Criaturas Míticas e Heráldicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BTN', 'MEX', 'ALB', 'SRB', 'EGY'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Purity of Stripes", pt: "A Pureza das Listras" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DEU', 'RUS', 'NLD', 'FRA', 'ITA', 'IRL', 'HUN', 'AUT', 'POL', 'IDN', 'EST', 'LUX', 'YEM', 'COL', 'ECU', 'VEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "A Circle in the Center", pt: "Um Círculo no Centro" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JPN', 'KOR', 'BRA', 'BGD', 'NER', 'PLW', 'IND'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags of the Cross", pt: "Bandeiras da Cruz" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CHE', 'DNK', 'SWE', 'NOR', 'FIN', 'ISL', 'GRC', 'GEO', 'GBR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Triangular Designs", pt: "Designs Triangulares" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CUB', 'CZE', 'PHL', 'JOR', 'SDN', 'DJI', 'GUY', 'BHS', 'TLS'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags Taking Flight with Birds", pt: "Bandeiras Alçando Voo com Pássaros" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['MEX', 'EGY', 'ALB', 'ECU', 'ZMB', 'UGA', 'SRB', 'DMA', 'KIR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Vertical Tricolors", pt: "Tricolores Verticais" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['FRA', 'ITA', 'IRL', 'BEL', 'ROU', 'MLI', 'GIN', 'TCD', 'CIV'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Horizontal Tricolors", pt: "Tricolores Horizontais" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DEU', 'RUS', 'NLD', 'HUN', 'AUT', 'EST', 'LUX', 'YEM', 'BGR', 'ARM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Dynamic Diagonals", pt: "Diagonais Dinâmicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['TTO', 'COG', 'COD', 'NAM', 'TZA', 'KNA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "A Vertical Band of Color", pt: "Uma Faixa Vertical de Cor" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['PRT', 'PAK', 'BLR', 'MDG', 'ARE', 'BEN', 'GNB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags with Unique Borders", pt: "Bandeiras com Bordas Únicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['QAT', 'BHR', 'BLR', 'LKA', 'BRN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags of the Andes", pt: "Bandeiras dos Andes" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['COL', 'ECU', 'PER', 'BOL', 'CHL', 'ARG', 'VEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Colors of the Caribbean", pt: "Cores do Caribe" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CUB', 'JAM', 'DOM', 'HTI', 'BRB', 'TTO', 'BHS', 'GRD'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags Over the Sahara", pt: "Bandeiras Sobre o Saara" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DZA', 'EGY', 'LBY', 'MLI', 'MAR', 'MRT', 'NER', 'TCD', 'SDN', 'TUN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Himalayan Heraldry", pt: "Heráldica do Himalaia" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['NPL', 'BTN', 'IND', 'CHN', 'PAK'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags of the European Microstates", pt: "Bandeiras dos Microestados Europeus" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AND', 'LIE', 'LUX', 'MLT', 'MCO', 'SMR', 'VAT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Simply Red and White", pt: "Simplesmente Vermelho e Branco" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['POL', 'IDN', 'MCO', 'AUT', 'CAN', 'DNK', 'JPN', 'CHE', 'TUR', 'TUN', 'BHR', 'QAT', 'PER', 'SGP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags That Speak", pt: "Bandeiras que Falam" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['SAU', 'IRQ', 'BRA', 'ESP', 'SMR', 'AFG'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Modern Flags (21st Century)", pt: "Bandeiras Modernas (Século 21)" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['RWA', 'COM', 'GEO', 'COD', 'IRQ', 'LBY', 'SSD', 'MWI'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Blue and Yellow Duos", pt: "Duplas de Azul e Amarelo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['UKR', 'SWE', 'KAZ', 'PLW', 'BRB', 'BIH'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Ancient Flags Still Flying", pt: "Bandeiras Antigas Ainda Hasteadas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DNK', 'AUT', 'LVA', 'NLD', 'CHE', 'ESP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags with a Canton", pt: "Bandeiras com um Cantão" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'AUS', 'NZL', 'GRC', 'MYS', 'LBR', 'TGO', 'URY', 'CHL'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Green, White, and Red", pt: "O Verde, Branco e Vermelho" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ITA', 'HUN', 'BGR', 'IRN', 'MEX', 'OMN', 'MDG', 'TJK'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Ocean and Sky Blues", pt: "Azuis do Oceano e do Céu" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ARG', 'URY', 'FJI', 'SOM', 'KAZ', 'EST', 'FIN', 'GRC', 'BHS'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Central American Neighbors", pt: "Vizinhos da América Central" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GTM', 'SLV', 'HND', 'NIC', 'CRI', 'PAN', 'BLZ'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Dividing Lines: Fimbriation", pt: "Linhas Divisórias: Fimbriação" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ZAF', 'PRK', 'TTO', 'KEN', 'BWA', 'NOR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Lions of Heraldry", pt: "Os Leões da Heráldica" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'LKA', 'FJI', 'MNE', 'BEL', 'FIN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Eagles Taking Flight", pt: "Águias Alçando Voo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['MEX', 'EGY', 'ALB', 'ZMB', 'POL', 'SRB', 'KAZ', 'DEU'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Green and Gold Glory", pt: "Glória em Verde e Dourado" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BRA', 'LTU', 'JAM', 'GHA', 'SEN', 'TGO', 'MRT', 'ZAF', 'AUS'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "No Red, White, or Blue", pt: "Sem Vermelho, Branco ou Azul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JAM', 'MRT', 'LKA', 'BRA', 'ZAF', 'UKR', 'LTU', 'GHA', 'SEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags of the Balkans", pt: "Bandeiras dos Bálcãs" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ALB', 'BIH', 'BGR', 'HRV', 'GRC', 'MNE', 'MKD', 'ROU', 'SRB', 'SVN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Colors of Southeast Asia", pt: "Cores do Sudeste Asiático" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BRN', 'KHM', 'IDN', 'LAO', 'MYS', 'MMR', 'PHL', 'SGP', 'THA', 'TLS', 'VNM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Featuring a Trident", pt: "Apresentando um Tridente" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BRB', 'UKR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Former Yugoslavian Nations", pt: "Nações da Antiga Iugoslávia" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BIH', 'HRV', 'MNE', 'MKD', 'SRB', 'SVN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Baltic States", pt: "Os Estados Bálticos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['EST', 'LVA', 'LTU'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "The Benelux Countries", pt: "Os Países do Benelux" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BEL', 'NLD', 'LUX'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "A Touch of Purple", pt: "Um Toque de Roxo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DMA', 'NIC', 'ESP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "The Maghreb Nations", pt: "As Nações do Magrebe" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DZA', 'LBY', 'MRT', 'MAR', 'TUN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Asian Tigers", pt: "Os Tigres Asiáticos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['HKG', 'SGP', 'KOR', 'TWN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The 'Stans' of Central Asia", pt: "Os 'Stões' da Ásia Central" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['KAZ', 'KGZ', 'TJK', 'TKM', 'UZB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Islands of the Indian Ocean", pt: "Ilhas do Oceano Índico" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['COM', 'MDG', 'MDV', 'MUS', 'SYC', 'LKA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Nations of the Caucasus", pt: "Nações do Cáucaso" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ARM', 'AZE', 'GEO'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "Flags with a Dragon", pt: "Bandeiras com um Dragão" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BTN', 'MLT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 2);
        }
    },
    {
        title: { en: "The Southern Cone", pt: "O Cone Sul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ARG', 'CHL', 'PRY', 'URY'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Visegrád Group", pt: "O Grupo de Visegrád" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CZE', 'HUN', 'POL', 'SVK'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Gulf Monarchies", pt: "As Monarquias do Golfo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BHR', 'KWT', 'OMN', 'QAT', 'SAU', 'ARE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Horn of Africa", pt: "O Chifre da África" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DJI', 'ERI', 'ETH', 'SOM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Rainbow of Colors", pt: "Arco-íris de Cores" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ZAF', 'CAF', 'SYC', 'SSD', 'COM', 'MUS'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Featuring a Map", pt: "Apresentando um Mapa" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CYP', 'BRA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 2);
        }
    },
    {
        title: { en: "The Saltire Cross", pt: "A Cruz de Santo André" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JAM', 'BDI', 'GRD'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "Serrated Flags", pt: "Bandeiras Serrilhadas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['QAT', 'BHR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 2);
        }
    },
    {
        title: { en: "Unique Shapes", pt: "Formatos Únicos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['NPL', 'CHE', 'VAT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "Echoes of Gran Colombia", pt: "Ecos da Grã-Colômbia" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['COL', 'ECU', 'VEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "Francophone African Flags", pt: "Bandeiras da África Francófona" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['SEN', 'CIV', 'MLI', 'GIN', 'CMR', 'TCD', 'GAB', 'COG', 'BFA', 'NER', 'TGO', 'BEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Mirrored Designs", pt: "Designs Espelhados" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['IDN', 'MCO', 'POL', 'ROU', 'TCD', 'IRL', 'CIV', 'MLI', 'GIN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Inverted Comrades", pt: "Camaradas Invertidos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['NLD', 'YUG', 'POL', 'MCO', 'IDN', 'GIN', 'MLI'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags with a Fess (Horizontal Band)", pt: "Bandeiras com uma Faixa Horizontal" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'LVA', 'AUT', 'ISR', 'BWA', 'THA', 'LAO', 'KEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags with a Pale (Vertical Band)", pt: "Bandeiras com uma Pala Vertical" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CAN', 'PER', 'NGA', 'DZA', 'PAK', 'BRB', 'PRT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Quarters of Culture (Cantons)", pt: "Quartos de Cultura (Cantões)" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'CHL', 'GRC', 'MYS', 'LBR', 'AUS', 'NZL', 'URY', 'TWN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Scandinavian Cross Family", pt: "A Família da Cruz Escandinava" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DNK', 'SWE', 'NOR', 'FIN', 'ISL'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Islands of the Pacific", pt: "Ilhas do Pacífico" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['FJI', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'PNG', 'WSM', 'SLB', 'TON', 'TUV', 'VUT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Arab Revolt Descendants", pt: "Descendentes da Revolta Árabe" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JOR', 'PSE', 'KWT', 'ARE', 'SDN', 'IRQ', 'SYR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Red, White, and Green", pt: "Vermelho, Branco e Verde" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ITA', 'HUN', 'BGR', 'IRN', 'MDG', 'OMN', 'MEX', 'TJK', 'DZA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Slavic Tricolors", pt: "Tricolores Eslavos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['RUS', 'SRB', 'SVN', 'SVK', 'HRV', 'CZE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "A Chevron of Hope", pt: "Um Chevron de Esperança" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['PHL', 'CZE', 'ZAF', 'SSD', 'VUT', 'BHS', 'GUY'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Double-Headed Eagle", pt: "A Águia de Duas Cabeças" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ALB', 'SRB', 'MNE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "Black, Red, and Gold", pt: "Preto, Vermelho e Dourado" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DEU', 'BEL', 'AGO', 'UGA', 'PNG', 'TLS'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The African Great Lakes Region", pt: "A Região dos Grandes Lagos Africanos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BDI', 'KEN', 'MWI', 'RWA', 'SSD', 'TZA', 'UGA', 'COD'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The Iberian Peninsula", pt: "A Península Ibérica" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'PRT', 'AND'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 3);
        }
    },
    {
        title: { en: "Nations Named After People", pt: "Nações com Nomes de Pessoas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['COL', 'BOL', 'SAU', 'PHL', 'USA', 'ISR', 'MOZ'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags with an Armillary Sphere", pt: "Bandeiras com uma Esfera Armilar" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['PRT', 'BRA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 2);
        }
    },
    {
        title: { en: "A Sea of Blue", pt: "Um Mar de Azul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GRC', 'FIN', 'ISR', 'SOM', 'ARG', 'URY', 'FSM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Flags of the Commonwealth", pt: "Bandeiras da Commonwealth" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GBR', 'CAN', 'AUS', 'NZL', 'IND', 'PAK', 'ZAF', 'NGA', 'GHA', 'MYS', 'SGP', 'KEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "The World's Newest Flags", pt: "As Bandeiras Mais Novas do Mundo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['SSD', 'LBY', 'MWI', 'MRT', 'MSR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Red and Yellow Bicolors", pt: "Bicolores Vermelhos e Amarelos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'CHN', 'VNM', 'MKD', 'KGZ', 'MNE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    },
    {
        title: { en: "Gems of Oceania", pt: "Joias da Oceania" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AUS', 'NZL', 'FJI', 'PNG', 'WSM', 'SLB', 'VUT', 'PLW'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 4);
        }
    }
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

// FIX: Add the missing `editFlagWithAi` function for image editing.
export const editFlagWithAi = async (base64ImageData: string, mimeType: string, prompt: string): Promise<{ base64: string, mimeType: string }> => {
    const aiClient = getAiClient();

    const imagePart = {
        inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: prompt,
    };

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }
    }

    throw new Error("AI did not return an image. Please try a different prompt.");
};