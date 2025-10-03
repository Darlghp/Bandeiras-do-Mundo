import type { Country } from '../types';
import { API_BASE_URL, API_FIELDS } from '../constants';

const API_URL = `${API_BASE_URL}?fields=${API_FIELDS.join(',')}`;

const CACHE_KEY = 'countriesData_v1';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const fetchCountries = async (): Promise<Country[]> => {
    const cachedItem = localStorage.getItem(CACHE_KEY);
    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < CACHE_EXPIRATION_MS) {
                // Return cached data if not expired
                return data;
            } else {
                // Cache expired, remove it
                localStorage.removeItem(CACHE_KEY);
            }
        } catch (error) {
            console.error("Error parsing cached country data, removing it.", error);
            localStorage.removeItem(CACHE_KEY);
        }
    }

    // Fetch from API if no valid cache
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data: Country[] = await response.json();
    
    // Store new data in cache
    try {
        const cachePayload = {
            timestamp: Date.now(),
            data: data,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (error) {
        console.error("Failed to cache country data.", error);
    }

    return data;
};
