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
  const [loadingMessage, setLoadingMessage] = useState<string>("Initializing AI Data Engine...");
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    selectedGenres: (Object.values(GenreType) as GenreType[]).filter(
      (g) => g !== GenreType.All
    ),
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
      setLoadingMessage("Connecting to Gemini AI...");
      
      const data = await generateMovieDataset((msg) => {
        setLoadingMessage(msg);
      });
      
      setRawData(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load movie data. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage("");
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
                : curr.rottenTomatoesRating / 10; 
            return acc + r;
          }, 0) / count
        : 0;

    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.budget, 0);
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.revenue, 0);
    
    const avgBudget = count > 0 ? totalBudget / count : 0;
    const avgRevenue = count > 0 ? totalRevenue / count : 0;

    return { count, avgRating, totalBudget, totalRevenue, avgBudget, avgRevenue };
  }, [filteredData, filters.ratingSource]);

  // CSV Export
  const handleExportData = () => {
    if (filteredData.length === 0) {
      alert("No data to export!");
      return;
    }
    const headers = ["ID", "Title", "Genre", "Language", "Year", "IMDb", "RT", "Budget", "Revenue"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(m => [
        m.id, `"${m.title.replace(/"/g, '""')}"`, m.genre, m.language, m.year,
        m.imdbRating, m.rottenTomatoesRating, m.budget, m.revenue
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

  // Power BI Export
  const handleExportPowerBi = () => {
    if (filteredData.length === 0) {
      alert("No data to export!");
      return;
    }
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

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading Overlay or Message */}
      {loading && (
        <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl flex items-center justify-center gap-3 animate-pulse">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-indigo-200 font-medium font-mono">{loadingMessage}</span>
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
            <p className="text-3xl font-bold text-indigo-400">{stats.avgRating.toFixed(1)}</p>
            <p className="mb-1 text-sm text-gray-500">/ 10</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Avg Budget</p>
          <p className="text-3xl font-bold text-pink-400">${stats.avgBudget.toFixed(1)}M</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Avg Revenue</p>
          <p className="text-3xl font-bold text-emerald-400">${stats.avgRevenue.toFixed(1)}M</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
          <p className="text-sm font-medium uppercase text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold text-emerald-500">${(stats.totalRevenue / 1000).toFixed(2)}B</p>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <ChartSkeleton key={i} />
          ))}
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/50 py-20 text-center">
          <p className="text-lg text-gray-400">No movies match your filters.</p>
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