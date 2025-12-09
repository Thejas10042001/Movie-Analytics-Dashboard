import { GoogleGenAI, Type } from "@google/genai";
import { Movie, GenreType, LanguageType } from "../types";

// Helper function to fetch movies for a specific time period
async function fetchMoviesForPeriod(ai: GoogleGenAI, startYear: number, endYear: number): Promise<Movie[]> {
  // 125 movies fits safely within the token limits
  const count = 125; 

  const prompt = `List ${count} of the MOST FAMOUS and POPULAR movies released between ${startYear} and ${endYear}.

CRITICAL INSTRUCTIONS:
1. MAXIMIZE OUTPUT: Use the full token limit to give me exactly ${count} movies.
2. FAMOUS MOVIES ONLY: Prioritize Top Box Office Hits, Oscar/National Award Winners, and Cult Classics.
3. DATA INTEGRITY: Real budgets and revenue in USD Millions. No estimates for unknown films.

DISTRIBUTION:
- 40% Global/Hollywood (The biggest hits of ${startYear}-${endYear})
- 60% Indian Cinema (Major Blockbusters from Hindi, Tamil, Telugu, Malayalam, Kannada)

Return ONLY valid JSON. No markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              language: {
                type: Type.STRING,
                enum: ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada"],
              },
              genre: {
                type: Type.STRING,
                enum: ["Action", "Drama", "Comedy", "Sci-Fi", "Horror", "Romance", "Thriller", "Adventure"],
              },
              year: { type: Type.INTEGER },
              imdbRating: { type: Type.NUMBER },
              rottenTomatoesRating: { type: Type.INTEGER },
              budget: { type: Type.NUMBER },
              revenue: { type: Type.NUMBER },
            },
            required: [
              "title",
              "genre",
              "language",
              "year",
              "imdbRating",
              "rottenTomatoesRating",
              "budget",
              "revenue",
            ],
          },
        },
      },
    });

    const rawText = response.text || "[]";
    
    // Aggressive JSON cleaning
    let cleanJson = rawText;
    const firstBracket = rawText.indexOf("[");
    const lastBracket = rawText.lastIndexOf("]");
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanJson = rawText.substring(firstBracket, lastBracket + 1);
    }

    const data = JSON.parse(cleanJson) as Movie[];
    // Strict year filtering
    return data.filter(m => m.year >= startYear && m.year <= endYear);
  } catch (error) {
    console.warn(`Batch failed for ${startYear}-${endYear}`, error);
    return [];
  }
}

// Fallback data if API fails completely
const FALLBACK_DATA: Movie[] = [
      // 2020s
      { id: "1", title: "Oppenheimer", language: LanguageType.English, genre: GenreType.Drama, year: 2023, imdbRating: 8.4, rottenTomatoesRating: 93, budget: 100, revenue: 957 },
      { id: "2", title: "RRR", language: LanguageType.Telugu, genre: GenreType.Action, year: 2022, imdbRating: 7.8, rottenTomatoesRating: 95, budget: 69, revenue: 160 },
      { id: "3", title: "Kantara", language: LanguageType.Kannada, genre: GenreType.Thriller, year: 2022, imdbRating: 8.2, rottenTomatoesRating: 90, budget: 2, revenue: 50 },
      { id: "4", title: "Vikram", language: LanguageType.Tamil, genre: GenreType.Action, year: 2022, imdbRating: 8.3, rottenTomatoesRating: 95, budget: 15, revenue: 60 },
      { id: "5", title: "Manjummel Boys", language: LanguageType.Malayalam, genre: GenreType.Adventure, year: 2024, imdbRating: 8.4, rottenTomatoesRating: 95, budget: 2.5, revenue: 29 },
      { id: "6", title: "Leo", language: LanguageType.Tamil, genre: GenreType.Action, year: 2023, imdbRating: 7.2, rottenTomatoesRating: 80, budget: 35, revenue: 75 },
      { id: "7", title: "Jawan", language: LanguageType.Hindi, genre: GenreType.Action, year: 2023, imdbRating: 7.0, rottenTomatoesRating: 85, budget: 36, revenue: 140 },
      { id: "8", title: "K.G.F: Chapter 2", language: LanguageType.Kannada, genre: GenreType.Action, year: 2022, imdbRating: 8.3, rottenTomatoesRating: 88, budget: 12, revenue: 150 },
      { id: "9", title: "Ponniyin Selvan: I", language: LanguageType.Tamil, genre: GenreType.Drama, year: 2022, imdbRating: 7.6, rottenTomatoesRating: 88, budget: 60, revenue: 60 },
      { id: "10", title: "Pushpa: The Rise", language: LanguageType.Telugu, genre: GenreType.Action, year: 2021, imdbRating: 7.6, rottenTomatoesRating: 85, budget: 25, revenue: 45 },

      // 2010s
      { id: "11", title: "Baahubali 2: The Conclusion", language: LanguageType.Telugu, genre: GenreType.Action, year: 2017, imdbRating: 8.2, rottenTomatoesRating: 89, budget: 37, revenue: 278 },
      { id: "12", title: "Avengers: Endgame", language: LanguageType.English, genre: GenreType.Action, year: 2019, imdbRating: 8.4, rottenTomatoesRating: 94, budget: 356, revenue: 2797 },
      { id: "13", title: "Dangal", language: LanguageType.Hindi, genre: GenreType.Drama, year: 2016, imdbRating: 8.3, rottenTomatoesRating: 88, budget: 9.5, revenue: 305 },
      { id: "14", title: "Inception", language: LanguageType.English, genre: GenreType.SciFi, year: 2010, imdbRating: 8.8, rottenTomatoesRating: 87, budget: 160, revenue: 829 },
      { id: "15", title: "Drishyam", language: LanguageType.Malayalam, genre: GenreType.Thriller, year: 2013, imdbRating: 8.3, rottenTomatoesRating: 90, budget: 0.8, revenue: 10 },
      { id: "16", title: "Interstellar", language: LanguageType.English, genre: GenreType.SciFi, year: 2014, imdbRating: 8.7, rottenTomatoesRating: 73, budget: 165, revenue: 701 },
      { id: "17", title: "Gangs of Wasseypur", language: LanguageType.Hindi, genre: GenreType.Action, year: 2012, imdbRating: 8.2, rottenTomatoesRating: 95, budget: 2.3, revenue: 6 },
      { id: "18", title: "Mahanati", language: LanguageType.Telugu, genre: GenreType.Drama, year: 2018, imdbRating: 8.5, rottenTomatoesRating: 90, budget: 4, revenue: 12 },
      { id: "19", title: "Bangalore Days", language: LanguageType.Malayalam, genre: GenreType.Romance, year: 2014, imdbRating: 8.3, rottenTomatoesRating: 100, budget: 1, revenue: 8 },
      { id: "20", title: "Super Deluxe", language: LanguageType.Tamil, genre: GenreType.Drama, year: 2019, imdbRating: 8.3, rottenTomatoesRating: 94, budget: 2, revenue: 7 },

      // 2000s
      { id: "21", title: "3 Idiots", language: LanguageType.Hindi, genre: GenreType.Comedy, year: 2009, imdbRating: 8.4, rottenTomatoesRating: 100, budget: 8, revenue: 65 },
      { id: "22", title: "The Dark Knight", language: LanguageType.English, genre: GenreType.Action, year: 2008, imdbRating: 9.0, rottenTomatoesRating: 94, budget: 185, revenue: 1005 },
      { id: "23", title: "Lagaan", language: LanguageType.Hindi, genre: GenreType.Drama, year: 2001, imdbRating: 8.1, rottenTomatoesRating: 95, budget: 5, revenue: 10 },
      { id: "24", title: "Pokiri", language: LanguageType.Telugu, genre: GenreType.Action, year: 2006, imdbRating: 8.0, rottenTomatoesRating: 80, budget: 2, revenue: 15 },
      { id: "25", title: "Anniyan", language: LanguageType.Tamil, genre: GenreType.Thriller, year: 2005, imdbRating: 8.3, rottenTomatoesRating: 85, budget: 4, revenue: 8 },
      { id: "26", title: "Avatar", language: LanguageType.English, genre: GenreType.SciFi, year: 2009, imdbRating: 7.9, rottenTomatoesRating: 82, budget: 237, revenue: 2923 },
      { id: "27", title: "Gladiator", language: LanguageType.English, genre: GenreType.Action, year: 2000, imdbRating: 8.5, rottenTomatoesRating: 77, budget: 103, revenue: 460 },
      { id: "28", title: "Ghajini", language: LanguageType.Hindi, genre: GenreType.Action, year: 2008, imdbRating: 7.3, rottenTomatoesRating: 50, budget: 8, revenue: 30 },
      { id: "29", title: "Sivaji: The Boss", language: LanguageType.Tamil, genre: GenreType.Action, year: 2007, imdbRating: 7.5, rottenTomatoesRating: 80, budget: 8, revenue: 19 },
      { id: "30", title: "Arundhati", language: LanguageType.Telugu, genre: GenreType.Horror, year: 2009, imdbRating: 7.3, rottenTomatoesRating: 80, budget: 2, revenue: 10 },

      // 1990s
      { id: "31", title: "Dilwale Dulhania Le Jayenge", language: LanguageType.Hindi, genre: GenreType.Romance, year: 1995, imdbRating: 8.0, rottenTomatoesRating: 100, budget: 4, revenue: 50 },
      { id: "32", title: "Titanic", language: LanguageType.English, genre: GenreType.Romance, year: 1997, imdbRating: 7.9, rottenTomatoesRating: 89, budget: 200, revenue: 2201 },
      { id: "33", title: "Manichitrathazhu", language: LanguageType.Malayalam, genre: GenreType.Horror, year: 1993, imdbRating: 8.8, rottenTomatoesRating: 95, budget: 0.4, revenue: 4 },
      { id: "34", title: "Jurassic Park", language: LanguageType.English, genre: GenreType.Adventure, year: 1993, imdbRating: 8.2, rottenTomatoesRating: 91, budget: 63, revenue: 1046 },
      { id: "35", title: "Baasha", language: LanguageType.Tamil, genre: GenreType.Action, year: 1995, imdbRating: 8.7, rottenTomatoesRating: 90, budget: 1, revenue: 5 },
      { id: "36", title: "The Lion King", language: LanguageType.English, genre: GenreType.Adventure, year: 1994, imdbRating: 8.5, rottenTomatoesRating: 93, budget: 45, revenue: 968 },
      { id: "37", title: "Forrest Gump", language: LanguageType.English, genre: GenreType.Drama, year: 1994, imdbRating: 8.8, rottenTomatoesRating: 71, budget: 55, revenue: 677 },
      { id: "38", title: "Roja", language: LanguageType.Tamil, genre: GenreType.Romance, year: 1992, imdbRating: 8.1, rottenTomatoesRating: 90, budget: 0.5, revenue: 2 },
      { id: "39", title: "Hum Aapke Hain Koun..!", language: LanguageType.Hindi, genre: GenreType.Romance, year: 1994, imdbRating: 7.5, rottenTomatoesRating: 80, budget: 1.5, revenue: 25 },
      { id: "40", title: "Pulp Fiction", language: LanguageType.English, genre: GenreType.Thriller, year: 1994, imdbRating: 8.9, rottenTomatoesRating: 92, budget: 8, revenue: 213 },

      // 1980s
      { id: "41", title: "Nayakan", language: LanguageType.Tamil, genre: GenreType.Drama, year: 1987, imdbRating: 8.7, rottenTomatoesRating: 92, budget: 1, revenue: 10 },
      { id: "42", title: "Shiva", language: LanguageType.Telugu, genre: GenreType.Action, year: 1989, imdbRating: 8.0, rottenTomatoesRating: 90, budget: 0.5, revenue: 5 },
      { id: "43", title: "Back to the Future", language: LanguageType.English, genre: GenreType.SciFi, year: 1985, imdbRating: 8.5, rottenTomatoesRating: 93, budget: 19, revenue: 388 },
      { id: "44", title: "Mr. India", language: LanguageType.Hindi, genre: GenreType.SciFi, year: 1987, imdbRating: 7.8, rottenTomatoesRating: 90, budget: 1.2, revenue: 5 },
      { id: "45", title: "Moondram Pirai", language: LanguageType.Tamil, genre: GenreType.Drama, year: 1982, imdbRating: 8.4, rottenTomatoesRating: 95, budget: 0.5, revenue: 2 },
      { id: "46", title: "Sagara Sangamam", language: LanguageType.Telugu, genre: GenreType.Drama, year: 1983, imdbRating: 8.8, rottenTomatoesRating: 90, budget: 0.8, revenue: 3 },
      { id: "47", title: "Thoovanathumbikal", language: LanguageType.Malayalam, genre: GenreType.Romance, year: 1987, imdbRating: 8.7, rottenTomatoesRating: 90, budget: 0.3, revenue: 1 },
      { id: "48", title: "E.T. the Extra-Terrestrial", language: LanguageType.English, genre: GenreType.SciFi, year: 1982, imdbRating: 7.9, rottenTomatoesRating: 99, budget: 10.5, revenue: 792 },
      { id: "49", title: "Blade Runner", language: LanguageType.English, genre: GenreType.SciFi, year: 1982, imdbRating: 8.1, rottenTomatoesRating: 89, budget: 30, revenue: 41 },
      { id: "50", title: "Pushpaka Vimana", language: LanguageType.Kannada, genre: GenreType.Comedy, year: 1987, imdbRating: 8.6, rottenTomatoesRating: 95, budget: 0.4, revenue: 1.5 },
];

export const generateMovieDataset = async (onProgress?: (msg: string) => void): Promise<Movie[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing! Using fallback data.");
    if (onProgress) onProgress("API Key missing. Loading offline data...");
    await new Promise(r => setTimeout(r, 1000)); // Simulate load
    return FALLBACK_DATA;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const periods: [number, number][] = [
    [1980, 1983], [1984, 1987], [1988, 1991],
    [1992, 1995], [1996, 1999], [2000, 2003],
    [2004, 2007], [2008, 2011], [2012, 2015],
    [2016, 2019], [2020, 2022], [2023, 2025]
  ];

  try {
    if (onProgress) onProgress("Initializing massive data stream...");
    
    // CONCURRENCY CONTROL:
    // We execute in batches of 4 parallel requests to prevent "429 Too Many Requests"
    // while still keeping it relatively "one shot".
    const BATCH_SIZE = 4;
    const allBatches: Movie[][] = [];

    for (let i = 0; i < periods.length; i += BATCH_SIZE) {
      const batchPeriods = periods.slice(i, i + BATCH_SIZE);
      
      if (onProgress) onProgress(`Fetching movies... (${Math.min(i + BATCH_SIZE, periods.length)} / ${periods.length} sectors)`);
      
      const batchPromises = batchPeriods.map(([start, end]) => 
        fetchMoviesForPeriod(ai, start, end)
      );

      const batchResults = await Promise.all(batchPromises);
      allBatches.push(...batchResults);
    }

    if (onProgress) onProgress("Finalizing dataset...");

    const rawMovies = allBatches.flat();
    
    if (rawMovies.length === 0) {
      throw new Error("API returned 0 movies across all batches.");
    }

    const uniqueMap = new Map<string, Movie>();
    
    // Deduplication
    rawMovies.forEach((movie) => {
      if (movie && movie.title) {
        const key = `${movie.title.toLowerCase().trim()}|${movie.year}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, movie);
        }
      }
    });

    const finalMovies: Movie[] = Array.from(uniqueMap.values()).map((movie, index) => ({
      ...movie,
      id: (index + 1).toString(),
    }));

    console.log(`Generation complete. Total unique movies: ${finalMovies.length}`);
    return finalMovies;

  } catch (error) {
    console.error("Critical error in movie generation, reverting to fallback:", error);
    if (onProgress) onProgress("Connection failed. Loading backup dataset...");
    // Return larger fallback data so user sees something substantial
    return FALLBACK_DATA;
  }
};