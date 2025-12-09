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

export const generateMovieDataset = async (onProgress?: (msg: string) => void): Promise<Movie[]> => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
  });

  try {
    if (onProgress) onProgress("Fetching comprehensive movie dataset (Target: ~1500 Movies)...");
    
    // Execute all requests concurrently to load "fully at time"
    const results = await Promise.all([
      fetchMoviesForPeriod(ai, 1980, 1983),
      fetchMoviesForPeriod(ai, 1984, 1987),
      fetchMoviesForPeriod(ai, 1988, 1991),
      fetchMoviesForPeriod(ai, 1992, 1995),
      fetchMoviesForPeriod(ai, 1996, 1999),
      fetchMoviesForPeriod(ai, 2000, 2003),
      fetchMoviesForPeriod(ai, 2004, 2007),
      fetchMoviesForPeriod(ai, 2008, 2011),
      fetchMoviesForPeriod(ai, 2012, 2015),
      fetchMoviesForPeriod(ai, 2016, 2019),
      fetchMoviesForPeriod(ai, 2020, 2022),
      fetchMoviesForPeriod(ai, 2023, 2025)
    ]);

    if (onProgress) onProgress("Processing and deduplicating data...");

    const rawMovies = results.flat();
    const uniqueMap = new Map<string, Movie>();
    
    // Deduplication key: Title + Year
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

    if (finalMovies.length === 0) throw new Error("No data generated");

    return finalMovies;
  } catch (error) {
    console.error("Critical error in movie generation:", error);
    // Minimal fallback
    return [
      { id: "1", title: "Inception", language: LanguageType.English, genre: GenreType.SciFi, year: 2010, imdbRating: 8.8, rottenTomatoesRating: 87, budget: 160, revenue: 829 },
      { id: "2", title: "Baahubali 2", language: LanguageType.Telugu, genre: GenreType.Action, year: 2017, imdbRating: 8.2, rottenTomatoesRating: 89, budget: 37, revenue: 278 },
      { id: "3", title: "The Dark Knight", language: LanguageType.English, genre: GenreType.Action, year: 2008, imdbRating: 9.0, rottenTomatoesRating: 94, budget: 185, revenue: 1005 },
    ];
  }
};