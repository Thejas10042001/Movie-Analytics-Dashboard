import React, { useState, useEffect, useMemo } from 'react';
import { generateMovieDataset } from './services/geminiService';
import { Movie, FilterState, GenreType, LanguageType } from './types';
import { Layout } from './components/Layout';
import { FilterBar } from './components/FilterBar';
import { RatingHistogram, GenreBarChart, BudgetRatingScatter, GenreSpreadPlot, RevenueByGenreScatter, AvgRevenueByGenreBarChart, MoviesPerYearChart } from './components/charts/Charts';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>({
    selectedGenres: Object.values(GenreType).filter(g => g !== GenreType.All), // Select all genres by default
    selectedLanguages: Object.values(LanguageType), // Select all languages by default
    yearRange: [1980, 2025],
    ratingSource: 'imdb',
    showTopRatedOnly: false
  });

  const fetchData = async () => {
    setLoading(true);
    const data = await generateMovieDataset();
    setRawData(data);
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return rawData.filter(movie => {
      const matchGenre = filters.selectedGenres.includes(movie.genre);
      const matchLanguage = filters.selectedLanguages.includes(movie.language);
      const matchYear = movie.year >= filters.yearRange[0] && movie.year <= filters.yearRange[1];
      
      const rating = filters.ratingSource === 'imdb' ? movie.imdbRating : (movie.rottenTomatoesRating / 10);
      const matchRating = !filters.showTopRatedOnly || rating >= 8.0;

      return matchGenre && matchLanguage && matchYear && matchRating;
    });
  }, [rawData, filters]);

  // Statistics
  const stats = useMemo(() => {
    const count = filteredData.length;
    const avgRating = count > 0 
      ? (filteredData.reduce((acc, curr) => acc + (filters.ratingSource === 'imdb' ? curr.imdbRating : curr.rottenTomatoesRating), 0) / count).toFixed(1)
      : 0;
    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.budget, 0);
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.revenue, 0);

    return { count, avgRating, totalBudget, totalRevenue };
  }, [filteredData, filters.ratingSource]);

  return (
    <Layout onRefreshData={fetchData} isLoading={loading}>
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
          <p className="text-gray-400 text-sm font-medium uppercase">Movies Found</p>
          <p className="text-3xl font-bold text-white">{stats.count}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
          <p className="text-gray-400 text-sm font-medium uppercase">Avg Rating</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-indigo-400">{stats.avgRating}</p>
            <p className="text-gray-500 mb-1 text-sm">/ {filters.ratingSource === 'imdb' ? '10' : '100'}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
          <p className="text-gray-400 text-sm font-medium uppercase">Avg Budget</p>
          <p className="text-3xl font-bold text-pink-400">
            ${stats.count > 0 ? (stats.totalBudget / stats.count).toFixed(1) : 0}M
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
          <p className="text-gray-400 text-sm font-medium uppercase">Total Revenue</p>
          <p className="text-3xl font-bold text-emerald-400">
            ${(stats.totalRevenue / 1000).toFixed(2)}B
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      {filteredData.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
          <p className="text-gray-400 text-lg">No movies match your filters. Try adjusting the range, language, or genre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RatingHistogram data={filteredData} filters={filters} />
          <GenreBarChart data={filteredData} filters={filters} />
          <BudgetRatingScatter data={filteredData} filters={filters} />
          <GenreSpreadPlot data={filteredData} filters={filters} />
          <RevenueByGenreScatter data={filteredData} filters={filters} />
          <AvgRevenueByGenreBarChart data={filteredData} filters={filters} />
          
          <div className="lg:col-span-2">
            <MoviesPerYearChart data={filteredData} filters={filters} />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;