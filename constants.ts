
export const API_BASE_URL = 'https://restcountries.com/v3.1';
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

// Mapeamento de siglas que mudam entre Inglês e Português
export const LOCALIZED_ACRONYMS: Record<string, string> = {
    'USA': 'EUA', // Estados Unidos
    'ARE': 'EAU', // Emirados Árabes Unidos
    'GBR': 'RU',  // Reino Unido
    'ZAF': 'AFS', // África do Sul
    'SAU': 'ARA', // Arábia Saudita
};

export const FLAG_COLORS: { [key: string]: string } = {
    Red: '#D52B1E',
    White: '#FFFFFF',
    Blue: '#0039A6',
    Green: '#007A3D',
    Yellow: '#FFD700',
    Black: '#000000',
};

export const COLOR_TRANSLATIONS: { [key: string]: { en: string; pt: string } } = {
    Red: { en: 'Red', pt: 'Vermelho' },
    White: { en: 'White', pt: 'Branco' },
    Blue: { en: 'Blue', pt: 'Azul' },
    Green: { en: 'Green', pt: 'Verde' },
    Yellow: { en: 'Yellow', pt: 'Amarelo' },
    Black: { en: 'Black', pt: 'Preto' },
};
