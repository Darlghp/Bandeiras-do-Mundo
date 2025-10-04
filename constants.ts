export const API_BASE_URL = 'https://restcountries.com/v3.1/all';
export const API_FIELDS = ['name', 'flags', 'continents', 'cca3', 'translations', 'capital', 'population', 'area', 'maps', 'coatOfArms'];

export const CONTINENT_NAMES: { [key: string]: { en: string; pt: string } } = {
    'All': { en: 'All Continents', pt: 'Todos os Continentes' },
    'Africa': { en: 'Africa', pt: 'África' },
    'Antarctica': { en: 'Antarctica', pt: 'Antártida' },
    'Asia': { en: 'Asia', pt: 'Ásia' },
    'Europe': { en: 'Europe', pt: 'Europa' },
    'North America': { en: 'North America', pt: 'América do Norte' },
    'Oceania': { en: 'Oceania', pt: 'Oceania' },
    'South America': { en: 'South America', pt: 'América do Sul' },
    'Favorites': { en: 'Favorites', pt: 'Favoritos' }
};

export const CONTINENTS_API_VALUES: string[] = Object.keys(CONTINENT_NAMES);

export const FLAG_COLORS = {
    Red: '#EF4444',
    Blue: '#3B82F6',
    Green: '#22C55E',
    Yellow: '#EAB308',
    White: '#FFFFFF',
    Black: '#1F2937'
};

export const COLOR_TRANSLATIONS: { [key: string]: { en: string, pt: string } } = {
    'Red': { en: 'Red', pt: 'Vermelho' },
    'Blue': { en: 'Blue', pt: 'Azul' },
    'Green': { en: 'Green', pt: 'Verde' },
    'Yellow': { en: 'Yellow', pt: 'Amarelo' },
    'White': { en: 'White', pt: 'Branco' },
    'Black': { en: 'Black', pt: 'Preto' }
};