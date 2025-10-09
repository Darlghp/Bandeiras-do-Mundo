import type { Country } from '../types';

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
            return [...countries].sort((a, b) => b.population - a.population).slice(0, 8);
        }
    },
    {
        title: { en: "Smallest Nations by Area", pt: "Menores Nações por Área" },
        getCountries: (countries: Country[]) => {
            return [...countries].filter(c => c.area > 0).sort((a, b) => a.area - b.area).slice(0, 8);
        }
    },
     {
        title: { en: "The Power of Red, White, and Blue", pt: "O Poder do Vermelho, Branco e Azul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'FRA', 'GBR', 'RUS', 'NLD', 'CHL', 'CUB', 'THA', 'NOR', 'AUS', 'NZL', 'CZE', 'PAN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Nordic Crosses", pt: "Cruzes Nórdicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DNK', 'SWE', 'NOR', 'FIN', 'ISL'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Island Nations", pt: "Nações Insulares" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JPN', 'GBR', 'CUB', 'IDN', 'PHL', 'MDG', 'NZL', 'IRL', 'ISL', 'JAM', 'FJI', 'CYP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Landlocked & Surrounded", pt: "Cercados por Terra" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CHE', 'AUT', 'CZE', 'HUN', 'BOL', 'PRY', 'NPL', 'MNG', 'RWA', 'BFA', 'LUX', 'SVK'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Featuring Fauna", pt: "Apresentando a Fauna" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['MEX', 'EGY', 'ESP', 'ALB', 'ECU', 'UGA', 'ZMB', 'PNG', 'LKA', 'SRB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Echoes of the Union Jack", pt: "Ecos da Union Jack" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GBR', 'AUS', 'NZL', 'FJI', 'TUV'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
];

export const fetchAllCollections = (allCountries: Country[], language: string): { title: string, countries: Country[] }[] => {
    if (allCountries.length === 0) {
        return [];
    }
    
    const generatorsToUse = shuffleArray(collectionGenerators).slice(0, 5);

    return generatorsToUse.map(generator => {
        const title = generator.title[language as 'en' | 'pt'];
        const countries = generator.getCountries(allCountries);
        return { title, countries };
    });
};
