
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
    // --- Statistical & Basic ---
    {
        title: { en: "Population Giants", pt: "Gigantes Populacionais" },
        getCountries: (countries: Country[]) => {
            return [...countries].sort((a, b) => b.population - a.population).slice(0, 15);
        }
    },
    {
        title: { en: "Largest Nations by Area", pt: "Maiores Nações por Área" },
        getCountries: (countries: Country[]) => {
            // Fix: Corrected sort subtraction from b.area - b.area to b.area - a.area for descending order
            return [...countries].sort((a, b) => b.area - a.area).slice(0, 15);
        }
    },
    {
        title: { en: "Smallest Nations by Area", pt: "Menores Nações por Área" },
        getCountries: (countries: Country[]) => {
            return [...countries].filter(c => c.area > 0).sort((a, b) => a.area - b.area).slice(0, 10);
        }
    },
    {
        title: { en: "Most Densely Populated", pt: "Mais Densamente Povoados" },
        getCountries: (countries: Country[]) => {
            return [...countries]
                .filter(c => c.area > 0 && c.population > 100000)
                .sort((a, b) => (b.population / b.area) - (a.population / a.area))
                .slice(0, 10);
        }
    },
     {
        title: { en: "Most Sparsely Populated", pt: "Menos Densamente Povoados" },
        getCountries: (countries: Country[]) => {
            return [...countries]
                .filter(c => c.area > 1000 && c.population > 100000)
                .sort((a, b) => (a.population / a.area) - (b.population / b.area))
                .slice(0, 10);
        }
    },
    {
        title: { en: "Microstates of Europe", pt: "Microestados da Europa" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AND', 'LIE', 'MLT', 'MCO', 'SMR', 'VAT'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Island Nations", pt: "Nações Insulares" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['JPN', 'GBR', 'CUB', 'IDN', 'PHL', 'MDG', 'NZL', 'IRL', 'ISL', 'JAM', 'FJI', 'CYP', 'MUS', 'COM', 'CPV', 'LKA', 'SGP', 'MLT', 'BHS', 'BRB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 15);
        }
    },
    {
        title: { en: "Landlocked & Surrounded", pt: "Cercados por Terra" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CHE', 'AUT', 'CZE', 'HUN', 'BOL', 'PRY', 'NPL', 'MNG', 'RWA', 'BFA', 'LUX', 'SVK', 'BTN', 'LAO', 'ZWE', 'AND', 'ARM', 'ETH', 'KAZ', 'UGA', 'BDI', 'CAF', 'TCD', 'LSO', 'LIE', 'MKD', 'MDA', 'NER', 'SMR', 'SRB', 'SSD', 'TJK', 'TKM', 'UZB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 15);
        }
    },

    // --- Design: Colors ---
    {
        title: { en: "The Power of Red, White, and Blue", pt: "O Poder do Vermelho, Branco e Azul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'FRA', 'GBR', 'RUS', 'NLD', 'CHL', 'CUB', 'THA', 'NOR', 'AUS', 'NZL', 'CZE', 'PAN', 'SRB', 'SVK', 'SVN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Pan-African Colors", pt: "Cores Pan-Africanas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GHA', 'ETH', 'SEN', 'GIN', 'MLI', 'CMR', 'BEN', 'TGO', 'GNB', 'COG', 'BFA', 'KEN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Pan-Slavic Colors", pt: "Cores Pan-Eslavas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['RUS', 'SRB', 'SVN', 'SVK', 'CZE', 'HRV'];
             const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Pan-Arab Colors", pt: "Cores Pan-Árabes" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['EGY', 'IRQ', 'SYR', 'YEM', 'SDN', 'JOR', 'KWT', 'ARE', 'PSE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Golden Yellow Hues", pt: "Tons de Amarelo Dourado" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'DEU', 'BEL', 'COL', 'ECU', 'VEN', 'ROU', 'LTU', 'UKR', 'SWE', 'BRA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
     {
        title: { en: "Simply Bicolor", pt: "Simplesmente Bicolores" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['IDN', 'POL', 'MCO', 'UKR', 'AUT', 'LVA', 'HTI', 'LIE', 'SMR', 'MLT', 'BHR', 'QAT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Green for Nature", pt: "Verde pela Natureza" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BRA', 'NGA', 'PAK', 'SAU', 'BGD', 'IRL', 'ITA', 'HUN', 'BGR', 'MEX', 'BOL', 'ZMB', 'ETH', 'JAM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Bold in Black", pt: "Ousadia em Preto" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DEU', 'BEL', 'EGY', 'JAM', 'AGO', 'KEN', 'UGA', 'ZAF', 'PNG', 'EST', 'ARE', 'YEM', 'TTO', 'BWA', 'SSD', 'SYR', 'KWT', 'JOR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },

    // --- Design: Symbols ---
    {
        title: { en: "Nordic Crosses", pt: "Cruzes Nórdicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DNK', 'SWE', 'NOR', 'FIN', 'ISL'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Crescent & Star", pt: "Crescente e Estrela" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['TUR', 'DZA', 'TUN', 'AZE', 'MYS', 'MRT', 'PAK', 'SGP', 'TKM', 'UZB', 'COM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Featuring Fauna", pt: "Apresentando a Fauna" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['MEX', 'EGY', 'ESP', 'ALB', 'ECU', 'UGA', 'ZMB', 'PNG', 'LKA', 'SRB', 'FJI', 'KIR', 'PLW'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Suns on Flags", pt: "Sóis em Bandeiras" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ARG', 'JPN', 'URY', 'KAZ', 'KGZ', 'MKD', 'NAM', 'NPL', 'PHL', 'RWA', 'TWN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
     {
        title: { en: "Flags With Stars", pt: "Bandeiras com Estrelas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'CHN', 'BRA', 'AUS', 'NZL', 'CHL', 'CUB', 'VNM', 'TUR', 'ISR', 'MAR', 'CMR', 'GHA', 'SOM', 'PAN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "The Southern Cross", pt: "O Cruzeiro do Sul" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AUS', 'BRA', 'NZL', 'PNG', 'WSM'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
     {
        title: { en: "Flags with Triangles", pt: "Bandeiras com Triângulos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CUB', 'PHL', 'CZE', 'JOR', 'SDN', 'SSD', 'PSE', 'GUY', 'DJI', 'BIH', 'ERI', 'MOZ', 'STP'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Flags with Shields", pt: "Bandeiras com Brasões" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'PRT', 'MEX', 'ECU', 'BOL', 'SRB', 'SVK', 'SVN', 'HRV', 'MNE', 'AND', 'SMR', 'VAT', 'KEN', 'FJI', 'ZWE'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Armed with Symbolism", pt: "Armadas com Simbolismo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['LKA', 'SAU', 'AGO', 'KEN', 'MOZ', 'OMN', 'GTM', 'BLZ'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Featuring Flora", pt: "Apresentando a Flora" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CAN', 'LBN', 'CYP', 'BLZ', 'HTI', 'ERI', 'GNQ', 'MAC'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },
    {
        title: { en: "Flags with Maps", pt: "Bandeiras com Mapas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CYP', 'KOS', 'BRA']; // Brazil's is a celestial map
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Flags with Writing", pt: "Bandeiras com Escrita" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['SAU', 'IRQ', 'BRA', 'ESP', 'SLV', 'DOM', 'BLZ', 'PRY', 'VAT', 'SMR', 'HND', 'NIC', 'GTM'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },

    // --- Design: Layouts ---
    {
        title: { en: "The Tricolore Tradition", pt: "A Tradição Tricolor" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['FRA', 'ITA', 'BEL', 'IRL', 'ROU', 'MLI', 'GIN', 'CIV', 'TCD', 'AND', 'MDA', 'SEN', 'CMR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Horizontal Tricolors", pt: "Tricolores Horizontais" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['NLD', 'DEU', 'RUS', 'HUN', 'AUT', 'BGR', 'EST', 'LTU', 'LUX', 'ARM', 'BOL', 'EGY', 'YEM', 'SYR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Diagonal Designs", pt: "Designs Diagonais" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['COG', 'NAM', 'TZA', 'DMA', 'KNA', 'TTO', 'BRN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
     {
        title: { en: "With a Canton", pt: "Com um Cantão" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['USA', 'GRC', 'CHL', 'URY', 'MYS', 'LBR', 'TWN', 'AUS', 'NZL', 'FJI', 'TUV'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Unique Aspect Ratios", pt: "Proporções Únicas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CHE', 'VAT', 'NPL', 'QAT', 'BEL', 'TGO'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },

    // --- Vexillological Features ---
    {
        title: { en: "A Symphony of Stripes", pt: "Sinfonia de Listras" },
        getCountries: (countries: Country[]) => {
            // Flags with 4 or more horizontal stripes
            const countryCodes = ['THA', 'CRI', 'GMB', 'KEN', 'SUR', 'MUS', 'URY', 'GRC', 'MYS', 'LBR', 'USA', 'CUB', 'CPV', 'TGO', 'BWA'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 12);
        }
    },
    {
        title: { en: "Fimbriated Flags", pt: "Bandeiras Fimbriadas" },
        getCountries: (countries: Country[]) => {
            // Flags with thin lines separating main color bands
            const countryCodes = ['ZAF', 'KNA', 'TTO', 'NAM', 'GUY', 'KEN', 'BWA', 'SWZ', 'CAF', 'UZB', 'GMB', 'MOZ', 'SSD'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Royal Standards", pt: "Estandartes Reais" },
        getCountries: (countries: Country[]) => {
            // Flags featuring crowns or royal tiaras
            const countryCodes = ['LIE', 'ESP', 'AND', 'SRB', 'MNE', 'VAT', 'SMR'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 8);
        }
    },

    // --- Geographical ---
    {
        title: { en: "Flags of the Caribbean", pt: "Bandeiras do Caribe" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CUB', 'JAM', 'HTI', 'DOM', 'PRI', 'TTO', 'BHS', 'BRB', 'GRD', 'LCA', 'VCT', 'ATG'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Andean Nations", pt: "Nações Andinas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['COL', 'VEN', 'ECU', 'PER', 'BOL', 'CHL', 'ARG'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Baltic States", pt: "Estados Bálticos" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['EST', 'LVA', 'LTU'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Balkan Flags", pt: "Bandeiras dos Bálcãs" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ALB', 'BIH', 'BGR', 'HRV', 'GRC', 'KOS', 'MKD', 'MNE', 'ROU', 'SRB', 'SVN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "East African Community", pt: "Comunidade da África Oriental" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BDI', 'KEN', 'RWA', 'SSD', 'TZA', 'UGA', 'COD'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Southeast Asian Nations (ASEAN)", pt: "Nações do Sudeste Asiático (ASEAN)" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['IDN', 'MYS', 'PHL', 'SGP', 'THA', 'VNM', 'LAO', 'MMR', 'KHM', 'BRN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "East Asian Flags", pt: "Bandeiras do Leste Asiático" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['CHN', 'JPN', 'KOR', 'PRK', 'TWN', 'MNG'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Central American States", pt: "Estados da América Central" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BLZ', 'GTM', 'SLV', 'HND', 'NIC', 'CRI', 'PAN'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "The Maghreb", pt: "O Magrebe" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DZA', 'LBY', 'MRT', 'MAR', 'TUN'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Benelux Countries", pt: "Países do Benelux" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BEL', 'NLD', 'LUX'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Scandinavian Flags", pt: "Bandeiras Escandinavas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DNK', 'SWE', 'NOR'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "The 'Stans' of Central Asia", pt: "Os 'Stões' da Ásia Central" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['KAZ', 'KGZ', 'TJK', 'TKM', 'UZB'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Flags of the Persian Gulf", pt: "Bandeiras do Golfo Pérsico" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['SAU', 'KWT', 'BHR', 'QAT', 'ARE', 'OMN'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "The Horn of Africa", pt: "O Chifre da África" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['DJI', 'ERI', 'ETH', 'SOM'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Iberian Peninsula", pt: "Península Ibérica" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ESP', 'PRT', 'AND'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },

    // --- Historical & Cultural ---
    {
        title: { en: "Echoes of the Union Jack", pt: "Ecos da Union Jack" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GBR', 'AUS', 'NZL', 'FJI', 'TUV'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "Former Soviet Republics", pt: "Ex-Repúblicas Soviéticas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ARM', 'AZE', 'BLR', 'EST', 'GEO', 'KAZ', 'KGZ', 'LVA', 'LTU', 'MDA', 'RUS', 'TJK', 'TKM', 'UKR', 'UZB'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "Former Yugoslav Republics", pt: "Ex-Repúblicas Iugoslavas" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['BIH', 'HRV', 'MKD', 'MNE', 'SRB', 'SVN', 'KOS'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "The Commonwealth of Nations", pt: "A Commonwealth" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['GBR', 'CAN', 'AUS', 'NZL', 'IND', 'PAK', 'ZAF', 'NGA', 'GHA', 'KEN', 'MYS', 'SGP', 'JAM', 'TTO', 'CYP', 'MLT'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "La Francophonie", pt: "A Francofonia" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['FRA', 'CAN', 'BEL', 'CHE', 'LUX', 'MCO', 'SEN', 'CIV', 'CMR', 'VUT', 'GAB', 'TUN', 'MAR', 'VNM', 'LBN'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "The Lusophone World", pt: "O Mundo Lusófono" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['PRT', 'BRA', 'AGO', 'MOZ', 'CPV', 'GNB', 'STP', 'TLS'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
     {
        title: { en: "Echoes of the Dutch Empire", pt: "Ecos do Império Holandês" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['NLD', 'IDN', 'SUR', 'ZAF'];
            return countries.filter(c => countryCodes.includes(c.cca3));
        }
    },
    {
        title: { en: "The Habsburg Legacy", pt: "O Legado Habsburgo" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['AUT', 'HUN', 'CZE', 'SVK', 'HRV', 'SVN', 'ESP', 'BEL', 'NLD', 'MEX'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
    {
        title: { en: "The Roman Eagle's Shadow", pt: "A Sombra da Águia Romana" },
        getCountries: (countries: Country[]) => {
            const countryCodes = ['ROU', 'ALB', 'DEU', 'RUS', 'SRB', 'MNE', 'MEX', 'EGY', 'POL'];
            const available = countries.filter(c => countryCodes.includes(c.cca3));
            return shuffleArray(available).slice(0, 10);
        }
    },
];

export const fetchAllCollections = (allCountries: Country[], language: string): { title: string, countries: Country[] }[] => {
    if (allCountries.length === 0) {
        return [];
    }
    
    // Select a larger random subset of collections to display
    const generatorsToUse = shuffleArray(collectionGenerators).slice(0, 12);

    return generatorsToUse.map(generator => {
        const title = generator.title[language as 'en' | 'pt'];
        const countries = generator.getCountries(allCountries);
        // Ensure a collection is only shown if it has a reasonable number of flags
        if (countries.length > 2) {
            return { title, countries };
        }
        return null;
    }).filter((collection): collection is { title: string, countries: Country[] } => collection !== null);
};
