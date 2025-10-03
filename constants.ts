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
    'South America': { en: 'South America', pt: 'América do Sul' }
};

export const CONTINENTS_API_VALUES: string[] = Object.keys(CONTINENT_NAMES);