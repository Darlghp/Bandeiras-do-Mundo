
import type { Country } from '../types';
import { API_BASE_URL, API_FIELDS } from '../constants';
import { COUNTRY_NAMES_PT } from '../constants/countryNamesPT';

// Versão v17 para forçar limpeza profunda de nomes técnicos e geográficos
const CACHE_KEY = 'countries_data_v17_clean'; 
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Remove termos técnicos, descritores geográficos e resíduos de tradução.
 * Trata especificamente o caso da Palestina e nomes coloniais/técnicos.
 */
const cleanName = (name: string): string => {
    if (!name) return "";
    return name
        .replace(/Republic of /gi, '')
        .replace(/State of /gi, '')
        .replace(/, State of/gi, '')
        .replace(/, Republic of/gi, '')
        .replace(/, Commonwealth of/gi, '')
        .replace(/Commonwealth of /gi, '')
        .replace(/, Kingdom of/gi, '')
        .replace(/Kingdom of /gi, '')
        .replace(/, Estado da/gi, '')
        .replace(/Estado da /gi, '')
        .replace(/Margem Ocidental/gi, '')
        .replace(/as margens do rio/gi, '') // Remove o resíduo citado pelo usuário
        .replace(/West Bank/gi, '')
        .replace(/ \(the former.*\)/gi, '')
        .replace(/ \(the\)/gi, '')
        .replace(/ \(.+\)/g, '') // Remove qualquer conteúdo entre parênteses
        .replace(/, /g, '') // Remove vírgulas residuais
        .trim();
};

/**
 * Aplica mapeamentos manuais e limpezas automáticas nos dados dos países.
 */
const applyImprovements = (countries: Country[]): Country[] => {
    return countries.map(country => {
        // 1. Limpeza básica nos nomes originais (inglês)
        country.name.common = cleanName(country.name.common);
        
        // 2. Prioridade Máxima: Mapeamento manual em Português
        const improvedName = COUNTRY_NAMES_PT[country.cca3];
        
        if (!country.translations) country.translations = {} as any;
        
        // Inicializa tradução por se não existir
        if (!country.translations.por) {
            country.translations.por = { 
                common: country.name.common, 
                official: country.name.official 
            };
        }

        if (improvedName) {
            // Se temos no nosso dicionário (ex: PSE -> Palestina), usamos ele cegamente
            country.translations.por.common = improvedName;
        } else {
            // Caso contrário, limpamos o que veio da API
            country.translations.por.common = cleanName(country.translations.por.common);
        }

        // 3. Limpeza das capitais (ex: "Ramallah (Margem Ocidental)" -> "Ramallah")
        if (country.capital && country.capital.length > 0) {
            country.capital = country.capital.map(cap => cleanName(cap));
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
                return applyImprovements(data);
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
                return applyImprovements(fallbackData);
            }
            throw new Error(`HTTP_ERR_${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            const improvedData = applyImprovements(data);
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: improvedData,
            }));
            return improvedData;
        }
        throw new Error('EMPTY_DATA');
    } catch (error) {
        console.error("Fetch failed, using cache as fallback", error);
        
        // 3. Fallback de emergência: usar cache mesmo expirado se disponível
        if (cachedItem) {
            try {
                const { data } = JSON.parse(cachedItem);
                if (Array.isArray(data) && data.length > 0) return applyImprovements(data);
            } catch (e) {}
        }
        throw error;
    }
};
