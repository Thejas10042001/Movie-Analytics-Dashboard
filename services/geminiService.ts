import { GoogleGenAI, Type } from "@google/genai";
import { Movie, GenreType, LanguageType } from "../types";

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

// Helper function to fetch movies for a specific time period
async function fetchMoviesForPeriod(startYear: number, endYear: number): Promise<Movie[]> {
  // Target high count to ensure total > 2256
  const count = 180; 

  const prompt = `Generate a dataset of ${count} REAL, VERIFIABLE movies released between ${startYear} and ${endYear}.

STRICT DATA INTEGRITY PROTOCOL:
1. REAL TITLES ONLY: Every movie title must correspond to an actual film.
2. DIVERSITY IS KEY:
   - Include major blockbusters, mid-budget hits, and critically acclaimed indie/regional films.
   - Do not repeat the same 10 movies. Dig deep into the catalog.
3. ACCURATE METRICS: Budget and Revenue must be historically accurate (USD Millions).

DISTRIBUTION for this period (${startYear}-${endYear}):
- Language Balance:
  * 35% English (Hollywood, UK)
  * 65% Indian Languages (Hindi, Tamil, Telugu, Malayalam, Kannada)
- Genres: Varied mix (Action, Drama, Comedy, Sci-Fi, Horror, Romance, Thriller, Adventure).

Return valid JSON.`;

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
    const startIdx = rawText.indexOf("[");
    const endIdx = rawText.lastIndexOf("]");

    let cleanJson = rawText;
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanJson = rawText.substring(startIdx, endIdx + 1);
    }

    const data = JSON.parse(cleanJson) as Movie[];
    return data.filter(m => m.year >= startYear && m.year <= endYear);
  } catch (error) {
    console.warn(`Failed to generate batch for ${startYear}-${endYear}`, error);
    // Return empty array so Promise.all doesn't fail completely
    return [];
  }
}

export const generateMovieDataset = async (onProgress?: (msg: string) => void): Promise<Movie[]> => {
  // Generate 3-year intervals from 1980 to 2025
  const periods: [number, number][] = [];
  const startYear = 1980;
  const endYear = 2025;
  const step = 3; 

  for (let i = startYear; i <= endYear; i += step) {
    periods.push([i, Math.min(i + step - 1, endYear)]);
  }

  try {
    if (onProgress) onProgress(`Initializing massive parallel data generation (${periods.length} streams)...`);
    
    // ONE SHOT: Execute all requests in parallel
    const results = await Promise.all(
      periods.map(([s, e]) => fetchMoviesForPeriod(s, e))
    );

    if (onProgress) onProgress("Merging, cleaning, and deduplicating data...");

    const rawMovies = results.flat();
    const uniqueMap = new Map<string, Movie>();
    
    rawMovies.forEach((movie) => {
      if (movie && movie.title) {
        const key = movie.title.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, movie);
        }
      }
    });

    const finalMovies: Movie[] = Array.from(uniqueMap.values()).map((movie, index) => ({
      ...movie,
      id: (index + 1).toString(),
    }));

    console.log(`Successfully generated ${finalMovies.length} unique movies.`);

    if (finalMovies.length === 0) throw new Error("No data generated");

    return finalMovies;
  } catch (error) {
    console.error("Failed to generate movie data:", error);
    // Return fallback if critical failure
    return [
      { id: "1", title: "Oppenheimer", language: LanguageType.English, genre: GenreType.Drama, year: 2023, imdbRating: 8.4, rottenTomatoesRating: 93, budget: 100, revenue: 957 },
      { id: "2", title: "RRR", language: LanguageType.Telugu, genre: GenreType.Action, year: 2022, imdbRating: 7.8, rottenTomatoesRating: 95, budget: 69, revenue: 160 },
      { id: "3", title: "Kantara", language: LanguageType.Kannada, genre: GenreType.Thriller, year: 2022, imdbRating: 8.2, rottenTomatoesRating: 90, budget: 2, revenue: 50 },
      { id: "4", title: "Vikram", language: LanguageType.Tamil, genre: GenreType.Action, year: 2022, imdbRating: 8.3, rottenTomatoesRating: 95, budget: 15, revenue: 60 },
      { id: "5", title: "Manjummel Boys", language: LanguageType.Malayalam, genre: GenreType.Adventure, year: 2024, imdbRating: 8.4, rottenTomatoesRating: 95, budget: 2.5, revenue: 29 },
    ];
  }
};