export interface Movie {
  id: string;
  title: string;
  genre: string;
  language: string;
  year: number;
  imdbRating: number;
  rottenTomatoesRating: number;
  budget: number; // in millions
  revenue: number; // in millions
}

export interface FilterState {
  selectedGenres: string[];
  selectedLanguages: string[];
  yearRange: [number, number];
  ratingSource: 'imdb' | 'rottenTomatoes';
  showTopRatedOnly: boolean;
}

export enum GenreType {
  All = 'All',
  Action = 'Action',
  Drama = 'Drama',
  Comedy = 'Comedy',
  SciFi = 'Sci-Fi',
  Horror = 'Horror',
  Romance = 'Romance',
  Thriller = 'Thriller',
  Adventure = 'Adventure'
}

export enum LanguageType {
  English = 'English',
  Hindi = 'Hindi',
  Tamil = 'Tamil',
  Telugu = 'Telugu',
  Malayalam = 'Malayalam',
  Kannada = 'Kannada'
}