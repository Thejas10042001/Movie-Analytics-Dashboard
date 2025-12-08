export enum GenreType {
  All = 'All',
  Action = 'Action',
  Drama = 'Drama',
  Comedy = 'Comedy',
  SciFi = 'Sci-Fi',
  Horror = 'Horror',
  Romance = 'Romance',
  Thriller = 'Thriller',
  Adventure = 'Adventure',
}

export enum LanguageType {
  English = 'English',
  Hindi = 'Hindi',
  Tamil = 'Tamil',
  Telugu = 'Telugu',
  Malayalam = 'Malayalam',
  Kannada = 'Kannada',
}

export interface Movie {
  id: string;
  title: string;
  genre: GenreType;        // use enum
  language: LanguageType;  // use enum
  year: number;
  imdbRating: number;
  rottenTomatoesRating: number;
  budget: number;  // in millions
  revenue: number; // in millions
}

export interface FilterState {
  selectedGenres: GenreType[];       // use enum[]
  selectedLanguages: LanguageType[]; // use enum[]
  yearRange: [number, number];
  ratingSource: 'imdb' | 'rottenTomatoes';
  showTopRatedOnly: boolean;
}
