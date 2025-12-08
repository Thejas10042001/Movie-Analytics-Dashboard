import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateMovieDataset } from './services/geminiService';
import { Movie, FilterState, GenreType, LanguageType } from './types';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import {
  RatingHistogram,
  GenreBarChart,
  BudgetRatingScatter,
  GenreSpreadPlot,
  RevenueByGenreScatter,
  AvgRevenueByGenreBarChart,
  MoviesPerYearChart,
  ChartSkeleton,
  RevenueBudgetScatter
} from './components/charts/Charts';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    // Select all genres except "All" by default
    selectedGenres: (Object.values(GenreType) as GenreType[]).filter(
      (g) => g !== GenreType.All
    ),
    // Select all languages by default
    selectedLanguages: Object.values(LanguageType) as LanguageType[],
    yearRange: [1980, 2025],
    ratingSource: 'imdb',
    showTopRatedOnly: false
  }));

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generateMovieDataset();
      setRawData(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load movie data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering logic
  const filteredData = useMemo(() => {
    return rawData.filter((movie) => {
      const matchGenre = filters.selectedGenres.includes(movie.genre);
      const matchLanguage = filters.selectedLanguages.includes(movie.language);
      const matchYear =
        movie.year >= filters.yearRange[0] && movie.year <= filters.yearRange[1];

      // Normalize both rating sources to a 0–10 scale
      const rating =
        filters.ratingSource === 'imdb'
          ? movie.imdbRating
          : movie.rottenTomatoesRating / 10;

      const matchRating = !filters.showTopRatedOnly || rating >= 8.0;

      return matchGenre && matchLanguage && matchYear && matchRating;
    });
  }, [rawData, filters]);

  // Statistics
  const stats = useMemo(() => {
    const count = filteredData.length;

    const avgRating =
      count > 0
        ? filteredData.reduce((acc, curr) => {
            const r =
              filters.ratingSource === 'imdb'
                ? curr.imdbRating
                : curr.rottenTomatoesRating / 10; // keep normalized
            return acc + r;
          }, 0) / count
        : 0;

    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.budget, 0);
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.revenue, 0);
    
    const avgBudget = count > 0 ? totalBudget / count : 0;
    const avgRevenue = count > 0 ? totalRevenue / count : 0;

    return { count, avgRating, totalBudget, totalRevenue, avgBudget, avgRevenue };
  }, [filteredData, filters.ratingSource]);

  // CSV Export Handler
  const handleExportData = () => {
    if (filteredData.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "ID", "Title", "Genre", "Language", "Year",
      "IMDb Rating", "Rotten Tomatoes Rating",
      "Budget (Millions)", "Revenue (Millions)"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredData.map(movie => [
        movie.id,
        `"${movie.title.replace(/"/g, '""')}"`, // Escape quotes
        movie.genre,
        movie.language,
        movie.year,
        movie.imdbRating,
        movie.rottenTomatoesRating,
        movie.budget,
        movie.revenue
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cinemetrics_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Power BI Export Handler (JSON)
  const handleExportPowerBi = () => {
    if (filteredData.length === 0) {
      alert("No data to export!");
      return;
    }

    // JSON is much better for Power BI ingestion as it preserves data structure
    // and handles special characters (commas/quotes in titles) natively.
    const jsonContent = JSON.stringify(filteredData, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cinemetrics_powerbi_dataset.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout
      onRefreshData={fetchData}
      onExportData={handleExportData}
      onExportPowerBi={handleExportPowerBi}
      isLoading={loading}
    >
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* Optional error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Movies Found</p>
          <p className="text-3xl font-bold text-white">{stats.count}</p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Avg Rating</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-indigo-400">
              {stats.avgRating.toFixed(1)}
            </p>
            <p className="mb-1 text-sm text-gray-500">/ 10</p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Source: {filters.ratingSource === 'imdb' ? 'IMDb' : 'Rotten Tomatoes (scaled)'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Avg Budget</p>
          <p className="text-3xl font-bold text-pink-400">
            ${stats.avgBudget.toFixed(1)}M
          </p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Avg Revenue</p>
          <p className="text-3xl font-bold text-emerald-400">
            ${stats.avgRevenue.toFixed(1)}M
          </p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold text-emerald-500">
            ${(stats.totalRevenue / 1000).toFixed(2)}B
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <ChartSkeleton key={i} />
          ))}
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/50 py-20 text-center">
          <p className="text-lg text-gray-400">
            No movies match your filters. Try adjusting the range, language, or genre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <RatingHistogram data={filteredData} filters={filters} />
          <GenreBarChart data={filteredData} filters={filters} />
          <BudgetRatingScatter data={filteredData} filters={filters} />
          <GenreSpreadPlot data={filteredData} filters={filters} />
          <RevenueByGenreScatter data={filteredData} filters={filters} />
          <AvgRevenueByGenreBarChart data={filteredData} filters={filters} />
          
          <div className="lg:col-span-2">
            <RevenueBudgetScatter data={filteredData} filters={filters} />
          </div>

          <div className="lg:col-span-2">
            <MoviesPerYearChart data={filteredData} filters={filters} />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;