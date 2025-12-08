// services/geminiService.ts (SERVER-SIDE ONLY)

import { GoogleGenAI, Type } from "@google/genai";
import type { Movie } from "../types";

// IMPORTANT: This should be defined on the server, e.g. in .env
// GEMINI_API_KEY=your_key_here
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Helper function to fetch movies for a specific time period
async function fetchMoviesForPeriod(startYear: number, endYear: number): Promise<Movie[]> {
  const count = 180; // Target ~180 per batch -> 5 batches ~900 movies

  const prompt = `Generate a dataset of ${count} REAL, VERIFIABLE movies released between ${startYear} and ${endYear}.

STRICT DATA INTEGRITY PROTOCOL:
1. REAL TITLES ONLY: Every movie title must correspond to an actual film released in theaters or on major global streaming platforms.
   - ABSOLUTELY NO FAKE SEQUELS or placeholder names.
   - Do not hallucinate data. If you run out of famous movies, include cult classics or regional hits.
2. ACCURATE METRICS: Budget and Revenue figures must be historically accurate approximations in USD Millions.

DISTRIBUTION for this specific period (${startYear}-${endYear}):
- Language Balance:
  * 40% English (Hollywood Global Blockbusters, Oscar Winners, Cult Classics)
  * 60% Indian Languages (Hindi, Tamil, Telugu, Malayalam, Kannada) - Include industry hits, critically acclaimed films, and regional blockbusters.
- Genres: Ensure a wide variety of genres (Action, Drama, Comedy, Sci-Fi, Horror, Romance, Thriller, Adventure).

Return valid JSON matching the schema.`;

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
              id: { type: Type.STRING }, // Will be overwritten later
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
              imdbRating: {
                type: Type.NUMBER,
                description: "Rating from 0 to 10",
              },
              rottenTomatoesRating: {
                type: Type.INTEGER,
                description: "Rating from 0 to 100",
              },
              budget: {
                type: Type.NUMBER,
                description: "Budget in millions of USD (approximate)",
              },
              revenue: {
                type: Type.NUMBER,
                description: "Revenue in millions of USD (approximate)",
              },
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

    // In JSON mode, response.text is a JSON string :contentReference[oaicite:1]{index=1}
    const rawText = response.text || "[]";

    // Robust JSON extraction: find the first '[' and last ']'
    const startIdx = rawText.indexOf("[");
    const endIdx = rawText.lastIndexOf("]");

    let cleanJson = rawText;
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanJson = rawText.substring(startIdx, endIdx + 1);
    }

    const data = JSON.parse(cleanJson) as Movie[];

    // Optional: filter to keep only movies actually in the requested range
    const filtered = data.filter(
      (m) => m.year >= startYear && m.year <= endYear
    );

    return filtered;
  } catch (error) {
    console.warn(`Failed to generate batch for ${startYear}-${endYear}`, error);
    return [];
  }
}

export const generateMovieDataset = async (): Promise<Movie[]> => {
  // 5 parallel batches to maximize data volume and avoid token limits
  const periods: [number, number][] = [
    [1980, 1989],
    [1990, 1999],
    [2000, 2009],
    [2010, 2019],
    [2020, 2025],
  ];

  try {
    console.log("Starting parallel batch generation...");
    const results = await Promise.all(
      periods.map(([start, end]) => fetchMoviesForPeriod(start, end))
    );

    // Merge all batches
    const rawMovies = results.flat();

    // Deduplicate based on Title (case-insensitive) to prevent overlaps
    const uniqueMap = new Map<string, Movie>();

    rawMovies.forEach((movie) => {
      if (movie && movie.title) {
        const key = movie.title.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, movie);
        }
      }
    });

    // Re-index IDs
    const finalMovies: Movie[] = Array.from(uniqueMap.values()).map(
      (movie, index) => ({
        ...movie,
        id: (index + 1).toString(),
      })
    );

    console.log(`Successfully generated ${finalMovies.length} movies.`);

    if (finalMovies.length === 0) {
      throw new Error("No data generated");
    }

    return finalMovies;
  } catch (error) {
    console.error("Failed to generate movie data:", error);

    // Extended fallback dataset covering 1980-2025
    // (your fallback list unchanged)
    const fallback: Movie[] = [
      // 2020s
      { id: "1", title: "Oppenheimer", language: "English", genre: "Drama", year: 2023, imdbRating: 8.4, rottenTomatoesRating: 93, budget: 100, revenue: 957 },
      { id: "2", title: "RRR", language: "Telugu", genre: "Action", year: 2022, imdbRating: 7.8, rottenTomatoesRating: 95, budget: 69, revenue: 160 },
      { id: "3", title: "Kantara", language: "Kannada", genre: "Thriller", year: 2022, imdbRating: 8.2, rottenTomatoesRating: 90, budget: 2, revenue: 50 },
      { id: "4", title: "Vikram", language: "Tamil", genre: "Action", year: 2022, imdbRating: 8.3, rottenTomatoesRating: 95, budget: 15, revenue: 60 },
      { id: "5", title: "Manjummel Boys", language: "Malayalam", genre: "Adventure", year: 2024, imdbRating: 8.4, rottenTomatoesRating: 95, budget: 2.5, revenue: 29 },
      { id: "6", title: "Leo", language: "Tamil", genre: "Action", year: 2023, imdbRating: 7.2, rottenTomatoesRating: 80, budget: 35, revenue: 75 },
      { id: "7", title: "Jawan", language: "Hindi", genre: "Action", year: 2023, imdbRating: 7.0, rottenTomatoesRating: 85, budget: 36, revenue: 140 },
      { id: "8", title: "K.G.F: Chapter 2", language: "Kannada", genre: "Action", year: 2022, imdbRating: 8.3, rottenTomatoesRating: 88, budget: 12, revenue: 150 },
      { id: "9", title: "Ponniyin Selvan: I", language: "Tamil", genre: "Drama", year: 2022, imdbRating: 7.6, rottenTomatoesRating: 88, budget: 60, revenue: 60 },
      { id: "10", title: "Pushpa: The Rise", language: "Telugu", genre: "Action", year: 2021, imdbRating: 7.6, rottenTomatoesRating: 85, budget: 25, revenue: 45 },

      // 2010s
      { id: "11", title: "Baahubali 2: The Conclusion", language: "Telugu", genre: "Action", year: 2017, imdbRating: 8.2, rottenTomatoesRating: 89, budget: 37, revenue: 278 },
      { id: "12", title: "Avengers: Endgame", language: "English", genre: "Action", year: 2019, imdbRating: 8.4, rottenTomatoesRating: 94, budget: 356, revenue: 2797 },
      { id: "13", title: "Dangal", language: "Hindi", genre: "Drama", year: 2016, imdbRating: 8.3, rottenTomatoesRating: 88, budget: 9.5, revenue: 305 },
      { id: "14", title: "Inception", language: "English", genre: "Sci-Fi", year: 2010, imdbRating: 8.8, rottenTomatoesRating: 87, budget: 160, revenue: 829 },
      { id: "15", title: "Drishyam", language: "Malayalam", genre: "Thriller", year: 2013, imdbRating: 8.3, rottenTomatoesRating: 90, budget: 0.8, revenue: 10 },
      { id: "16", title: "Interstellar", language: "English", genre: "Sci-Fi", year: 2014, imdbRating: 8.7, rottenTomatoesRating: 73, budget: 165, revenue: 701 },
      { id: "17", title: "Gangs of Wasseypur", language: "Hindi", genre: "Action", year: 2012, imdbRating: 8.2, rottenTomatoesRating: 95, budget: 2.3, revenue: 6 },
      { id: "18", title: "Mahanati", language: "Telugu", genre: "Drama", year: 2018, imdbRating: 8.5, rottenTomatoesRating: 90, budget: 4, revenue: 12 },
      { id: "19", title: "Bangalore Days", language: "Malayalam", genre: "Romance", year: 2014, imdbRating: 8.3, rottenTomatoesRating: 100, budget: 1, revenue: 8 },
      { id: "20", title: "Super Deluxe", language: "Tamil", genre: "Drama", year: 2019, imdbRating: 8.3, rottenTomatoesRating: 94, budget: 2, revenue: 7 },

      // 2000s
      { id: "21", title: "3 Idiots", language: "Hindi", genre: "Comedy", year: 2009, imdbRating: 8.4, rottenTomatoesRating: 100, budget: 8, revenue: 65 },
      { id: "22", title: "The Dark Knight", language: "English", genre: "Action", year: 2008, imdbRating: 9.0, rottenTomatoesRating: 94, budget: 185, revenue: 1005 },
      { id: "23", title: "Lagaan", language: "Hindi", genre: "Drama", year: 2001, imdbRating: 8.1, rottenTomatoesRating: 95, budget: 5, revenue: 10 },
      { id: "24", title: "Pokiri", language: "Telugu", genre: "Action", year: 2006, imdbRating: 8.0, rottenTomatoesRating: 80, budget: 2, revenue: 15 },
      { id: "25", title: "Anniyan", language: "Tamil", genre: "Thriller", year: 2005, imdbRating: 8.3, rottenTomatoesRating: 85, budget: 4, revenue: 8 },
      { id: "26", title: "Avatar", language: "English", genre: "Sci-Fi", year: 2009, imdbRating: 7.9, rottenTomatoesRating: 82, budget: 237, revenue: 2923 },
      { id: "27", title: "Gladiator", language: "English", genre: "Action", year: 2000, imdbRating: 8.5, rottenTomatoesRating: 77, budget: 103, revenue: 460 },
      { id: "28", title: "Ghajini", language: "Hindi", genre: "Action", year: 2008, imdbRating: 7.3, rottenTomatoesRating: 50, budget: 8, revenue: 30 },
      { id: "29", title: "Sivaji: The Boss", language: "Tamil", genre: "Action", year: 2007, imdbRating: 7.5, rottenTomatoesRating: 80, budget: 8, revenue: 19 },
      { id: "30", title: "Arundhati", language: "Telugu", genre: "Horror", year: 2009, imdbRating: 7.3, rottenTomatoesRating: 80, budget: 2, revenue: 10 },

      // 1990s
      { id: "31", title: "Dilwale Dulhania Le Jayenge", language: "Hindi", genre: "Romance", year: 1995, imdbRating: 8.0, rottenTomatoesRating: 100, budget: 4, revenue: 50 },
      { id: "32", title: "Titanic", language: "English", genre: "Romance", year: 1997, imdbRating: 7.9, rottenTomatoesRating: 89, budget: 200, revenue: 2201 },
      { id: "33", title: "Manichitrathazhu", language: "Malayalam", genre: "Horror", year: 1993, imdbRating: 8.8, rottenTomatoesRating: 95, budget: 0.4, revenue: 4 },
      { id: "34", title: "Jurassic Park", language: "English", genre: "Adventure", year: 1993, imdbRating: 8.2, rottenTomatoesRating: 91, budget: 63, revenue: 1046 },
      { id: "35", title: "Baasha", language: "Tamil", genre: "Action", year: 1995, imdbRating: 8.7, rottenTomatoesRating: 90, budget: 1, revenue: 5 },
      { id: "36", title: "The Lion King", language: "English", genre: "Adventure", year: 1994, imdbRating: 8.5, rottenTomatoesRating: 93, budget: 45, revenue: 968 },
      { id: "37", title: "Forrest Gump", language: "English", genre: "Drama", year: 1994, imdbRating: 8.8, rottenTomatoesRating: 71, budget: 55, revenue: 677 },
      { id: "38", title: "Roja", language: "Tamil", genre: "Romance", year: 1992, imdbRating: 8.1, rottenTomatoesRating: 90, budget: 0.5, revenue: 2 },
      { id: "39", title: "Hum Aapke Hain Koun..!", language: "Hindi", genre: "Romance", year: 1994, imdbRating: 7.5, rottenTomatoesRating: 80, budget: 1.5, revenue: 25 },
      { id: "40", title: "Pulp Fiction", language: "English", genre: "Thriller", year: 1994, imdbRating: 8.9, rottenTomatoesRating: 92, budget: 8, revenue: 213 },

      // 1980s
      { id: "41", title: "Nayakan", language: "Tamil", genre: "Drama", year: 1987, imdbRating: 8.7, rottenTomatoesRating: 92, budget: 1, revenue: 10 },
      { id: "42", title: "Shiva", language: "Telugu", genre: "Action", year: 1989, imdbRating: 8.0, rottenTomatoesRating: 90, budget: 0.5, revenue: 5 },
      { id: "43", title: "Back to the Future", language: "English", genre: "Sci-Fi", year: 1985, imdbRating: 8.5, rottenTomatoesRating: 93, budget: 19, revenue: 388 },
      { id: "44", title: "Mr. India", language: "Hindi", genre: "Sci-Fi", year: 1987, imdbRating: 7.8, rottenTomatoesRating: 90, budget: 1.2, revenue: 5 },
      { id: "45", title: "Moondram Pirai", language: "Tamil", genre: "Drama", year: 1982, imdbRating: 8.4, rottenTomatoesRating: 95, budget: 0.5, revenue: 2 },
      { id: "46", title: "Sagara Sangamam", language: "Telugu", genre: "Drama", year: 1983, imdbRating: 8.8, rottenTomatoesRating: 90, budget: 0.8, revenue: 3 },
      { id: "47", title: "Thoovanathumbikal", language: "Malayalam", genre: "Romance", year: 1987, imdbRating: 8.7, rottenTomatoesRating: 90, budget: 0.3, revenue: 1 },
      { id: "48", title: "E.T. the Extra-Terrestrial", language: "English", genre: "Sci-Fi", year: 1982, imdbRating: 7.9, rottenTomatoesRating: 99, budget: 10.5, revenue: 792 },
      { id: "49", title: "Blade Runner", language: "English", genre: "Sci-Fi", year: 1982, imdbRating: 8.1, rottenTomatoesRating: 89, budget: 30, revenue: 41 },
      { id: "50", title: "Pushpaka Vimana", language: "Kannada", genre: "Comedy", year: 1987, imdbRating: 8.6, rottenTomatoesRating: 95, budget: 0.4, revenue: 1.5 },
    ];

    return fallback;
  }
};
