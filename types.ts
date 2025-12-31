
export interface CountryName {
  common: string;
  official: string;
}

export interface Country {
  cca3: string;
  name: CountryName;
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
  continents: string[];
  capital: string[];
  translations: {
    por: CountryName;
    [key: string]: CountryName;
  };
  population: number;
  area: number;
  maps: {
    googleMaps: string;
  };
  coatOfArms: {
    png?: string;
    svg?: string;
  };
  latlng: [number, number];
}
