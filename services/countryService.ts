
import type { Country } from '../types';
import { API_BASE_URL, API_FIELDS } from '../constants';
import { COUNTRY_NAMES_PT } from '../constants/countryNamesPT';

const CACHE_KEY = 'countries_data_v14'; // Versão atualizada para refletir melhorias de tradução
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Aplica melhorias manuais nos nomes dos países para o idioma Português.
 * Isso garante que nomes técnicos ou mal traduzidos da API sejam exibidos de forma natural.
 */
const applyTranslationImprovements = (countries: Country[]): Country[] => {
    return countries.map(country => {
        const improvedName = COUNTRY_NAMES_PT[country.cca3];
        if (improvedName) {
            // Garantir que o objeto translations e por existam antes de sobrescrever
            if (!country.translations) country.translations = {} as any;
            if (!country.translations.por) country.translations.por = { common: improvedName, official: improvedName };
            
            country.translations.por.common = improvedName;
        }
        return country;
    });
};

export const fetchCountries = async (): Promise<Country[]> => {
    // 1. Tentar ler cache local primeiro
    const cachedItem = localStorage.getItem(CACHE_KEY);
    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            const isExpired = Date.now() - timestamp > CACHE_EXPIRATION_MS;
            if (!isExpired && Array.isArray(data) && data.length > 0) {
                return applyTranslationImprovements(data);
            }
        } catch (error) {
            localStorage.removeItem(CACHE_KEY);
        }
    }

    // 2. Executar fetch da API
    try {
        const url = `${API_BASE_URL}/all?fields=${API_FIELDS.join(',')}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404 || response.status === 400) {
                const fallbackResponse = await fetch(`${API_BASE_URL}/all`);
                if (!fallbackResponse.ok) throw new Error(`HTTP_ERR_${fallbackResponse.status}`);
                const fallbackData = await fallbackResponse.json();
                const improvedFallback = applyTranslationImprovements(fallbackData);
                return improvedFallback;
            }
            throw new Error(`HTTP_ERR_${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            const improvedData = applyTranslationImprovements(data);
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: improvedData,
            }));
            return improvedData;
        }
        throw new Error('EMPTY_DATA');
    } catch (error) {
        console.error("Fetch failed, attempting to use expired cache as fallback", error);
        
        // 3. Fallback de emergência: usar cache mesmo expirado
        if (cachedItem) {
            try {
                const { data } = JSON.parse(cachedItem);
                if (Array.isArray(data) && data.length > 0) return applyTranslationImprovements(data);
            } catch (e) {}
        }
        throw error;
    }
};
