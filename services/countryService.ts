
import type { Country } from '../types';
import { API_BASE_URL, API_FIELDS } from '../constants';

const CACHE_KEY = 'countries_data_v12'; // Nova versão para forçar atualização
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export const fetchCountries = async (): Promise<Country[]> => {
    // 1. Tentar ler cache local primeiro
    const cachedItem = localStorage.getItem(CACHE_KEY);
    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            const isExpired = Date.now() - timestamp > CACHE_EXPIRATION_MS;
            if (!isExpired && Array.isArray(data) && data.length > 0) {
                return data;
            }
        } catch (error) {
            localStorage.removeItem(CACHE_KEY);
        }
    }

    // 2. Executar fetch da API
    try {
        // Endpoint correto é /v3.1/all
        const url = `${API_BASE_URL}/all?fields=${API_FIELDS.join(',')}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            // Se falhar com campos específicos (algumas redes bloqueiam URLs longas), tenta sem filtros
            if (response.status === 404 || response.status === 400) {
                const fallbackResponse = await fetch(`${API_BASE_URL}/all`);
                if (!fallbackResponse.ok) throw new Error(`HTTP_ERR_${fallbackResponse.status}`);
                const fallbackData = await fallbackResponse.json();
                return fallbackData;
            }
            throw new Error(`HTTP_ERR_${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: data,
            }));
            return data;
        }
        throw new Error('EMPTY_DATA');
    } catch (error) {
        console.error("Fetch failed, attempting to use expired cache as fallback", error);
        
        // 3. Fallback de emergência: usar cache mesmo expirado
        if (cachedItem) {
            try {
                const { data } = JSON.parse(cachedItem);
                if (Array.isArray(data) && data.length > 0) return data;
            } catch (e) {}
        }
        throw error;
    }
};
