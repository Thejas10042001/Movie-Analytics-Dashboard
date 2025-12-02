import React from 'react';
import { FilterState, GenreType, LanguageType } from '../types';
import { Filter, Star, Calendar, Activity, Languages } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const MIN_YEAR = 1980;
  const MAX_YEAR = 2025;

  const minVal = filters.yearRange[0];
  const maxVal = filters.yearRange[1];

  // Calculate percentage positions for the slider track
  const minPercent = ((minVal - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
  const maxPercent = ((maxVal - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
  
  const handleGenreToggle = (genre: string) => {
    setFilters(prev => {
      const current = prev.selectedGenres;
      if (current.includes(genre)) {
        // Prevent deselecting the last genre
        if (current.length === 1) return prev;
        return { ...prev, selectedGenres: current.filter(g => g !== genre) };
      } else {
        return { ...prev, selectedGenres: [...current, genre] };
      }
    });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, ratingSource: e.target.value as 'imdb' | 'rottenTomatoes' }));
  };

  const handleTopRatedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, showTopRatedOnly: e.target.checked }));
  };

  const handleMinYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 1);
    setFilters(prev => ({ ...prev, yearRange: [value, prev.yearRange[1]] }));
  };

  const handleMaxYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 1);
    setFilters(prev => ({ ...prev, yearRange: [prev.yearRange[0], value] }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFilters(prev => {
      const current = prev.selectedLanguages;
      if (current.includes(lang)) {
        // Prevent deselecting the last language
        if (current.length === 1) return prev;
        return { ...prev, selectedLanguages: current.filter(l => l !== lang) };
      } else {
        return { ...prev, selectedLanguages: [...current, lang] };
      }
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-xl mb-8">
      {/* CSS for custom range sliders */}
      <style>{`
        .range-slider::-webkit-slider-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          -webkit-appearance: none;
          background-color: #6366f1; /* indigo-500 */
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          position: relative;
          z-index: 50;
        }
        .range-slider::-moz-range-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          background-color: #6366f1;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: none;
          position: relative;
          z-index: 50;
        }
      `}</style>

      <div className="flex items-center gap-2 mb-6 text-indigo-400 font-semibold uppercase text-xs tracking-wider border-b border-gray-700 pb-2">
        <Filter className="w-4 h-4" />
        Data Filters
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Col 1: Language Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Languages className="w-4 h-4" /> Languages
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(LanguageType).map((lang) => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    className="peer appearance-none w-4 h-4 border border-gray-500 rounded bg-gray-900 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                    checked={filters.selectedLanguages.includes(lang)}
                    onChange={() => handleLanguageToggle(lang)}
                  />
                   <svg
                    className="absolute w-3 h-3 text-white hidden peer-checked:block left-0.5 top-0.5 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={`text-xs ${filters.selectedLanguages.includes(lang) ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-300'} transition-colors`}>
                  {lang}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Col 2: Genre Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Genres
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(GenreType)
              .filter(g => g !== GenreType.All)
              .map((genre) => (
                <label key={genre} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox"
                      className="peer appearance-none w-4 h-4 border border-gray-500 rounded bg-gray-900 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                      checked={filters.selectedGenres.includes(genre)}
                      onChange={() => handleGenreToggle(genre)}
                    />
                     <svg
                      className="absolute w-3 h-3 text-white hidden peer-checked:block left-0.5 top-0.5 pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-xs ${filters.selectedGenres.includes(genre) ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-300'} transition-colors`}>
                    {genre}
                  </span>
                </label>
            ))}
          </div>
        </div>

        {/* Col 3: Year Range & Rating Source */}
        <div className="flex flex-col gap-6">
          {/* Year Range Slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Year Range
              </div>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-500/30">
                {minVal} — {maxVal}
              </span>
            </label>
            
            <div className="relative w-full h-6 flex items-center select-none touch-none mt-4"> 
               {/* Background Track */}
               <div className="absolute w-full h-1 bg-gray-700 rounded z-0"></div>
               
               {/* Active Range Track */}
               <div 
                 className="absolute h-1 bg-indigo-500 rounded z-0"
                 style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
               ></div>
               
               {/* Min Slider Input */}
               <input
                 type="range"
                 min={MIN_YEAR}
                 max={MAX_YEAR}
                 value={minVal}
                 onChange={handleMinYearChange}
                 className="range-slider absolute w-full h-1 bg-transparent appearance-none pointer-events-none z-20 focus:outline-none"
               />
               
               {/* Max Slider Input */}
               <input
                 type="range"
                 min={MIN_YEAR}
                 max={MAX_YEAR}
                 value={maxVal}
                 onChange={handleMaxYearChange}
                 className="range-slider absolute w-full h-1 bg-transparent appearance-none pointer-events-none z-20 focus:outline-none"
               />
            </div>
          </div>

          {/* Rating Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Star className="w-4 h-4" /> Rating Source
            </label>
            <select
              value={filters.ratingSource}
              onChange={handleSourceChange}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="imdb">IMDb (0-10)</option>
              <option value="rottenTomatoes">Rotten Tomatoes (0-100)</option>
            </select>
          </div>
        </div>

        {/* Col 4: Top Rated Toggle */}
        <div className="flex items-center h-full pt-2">
          <label className="flex items-center gap-3 cursor-pointer group select-none bg-gray-900/50 p-4 rounded-lg border border-gray-700 w-full hover:border-indigo-500/50 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={filters.showTopRatedOnly}
                onChange={handleTopRatedChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Top Rated Only (> 8.0)
            </span>
          </label>
        </div>

      </div>
    </div>
  );
};