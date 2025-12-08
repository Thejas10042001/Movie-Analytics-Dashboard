import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  Rectangle
} from 'recharts';
import { Movie, FilterState } from '../../types';

interface ChartProps {
  data: Movie[];
  filters: FilterState;
}

const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, action, children }) => (
  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg flex flex-col h-[400px]">
    <div className="mb-4 flex justify-between items-start">
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
    <div className="flex-1 w-full min-h-0">{children}</div>
  </div>
);

// --- Custom Tooltip Component ---
const CustomTooltipWithList = ({ active, payload, label, titlePrefix }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const topMovies: Movie[] = data.topMovies || [];
    const mainValue = payload[0].value;
    const mainName = payload[0].name;

    const isRevenue =
      typeof mainName === 'string' && mainName.toLowerCase().includes('revenue');

    return (
      <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-2xl text-xs z-50 relative min-w-[200px]">
        <div className="mb-2 pb-2 border-b border-gray-700">
          <p className="text-white font-bold text-sm">
            {titlePrefix ? `${titlePrefix} ${label}` : label}
          </p>
          <p className="text-indigo-400 font-medium mt-1">
            {mainName}:{' '}
            {typeof mainValue === 'number' && isRevenue ? `$${mainValue}M` : mainValue}
          </p>
        </div>

        {topMovies.length > 0 && (
          <div>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">
              Notable Movies
            </p>
            <ul className="space-y-1">
              {topMovies.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center text-gray-300"
                >
                  <span
                    className="truncate max-w-[140px] font-medium"
                    title={m.title}
                  >
                    {m.title}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {/* Dynamic metric based on context, default to revenue/rating */}
                    {m.revenue > 0 ? `$${m.revenue}M` : m.imdbRating}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Scatter Point with Hover Effect
const HoverableScatterPoint = (props: any) => {
  const { cx, cy, fill, onMouseEnter, onMouseLeave } = props;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={fill}
      stroke="white"
      vectorEffect="non-scaling-stroke"
      className="cursor-pointer"
      style={{
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformBox: 'fill-box',
        transformOrigin: 'center',
        transform: 'scale(1)',
        fillOpacity: 0.7,
        strokeWidth: 0,
        strokeOpacity: 0
      }}
      onMouseEnter={(e) => {
        const node = e.currentTarget;
        node.style.transform = 'scale(1.25)';
        node.style.fillOpacity = '1';
        node.style.strokeWidth = '2px';
        node.style.strokeOpacity = '1';

        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        const node = e.currentTarget;
        node.style.transform = 'scale(1)';
        node.style.fillOpacity = '0.7';
        node.style.strokeWidth = '0px';
        node.style.strokeOpacity = '0';

        if (onMouseLeave) onMouseLeave(e);
      }}
    />
  );
};

// --- Histogram: Rating Distribution ---
export const RatingHistogram: React.FC<ChartProps> = ({ data, filters }) => {
  const chartData = useMemo(() => {
    // 1. Create buckets with movie arrays
    const buckets = Array(10)
      .fill(0)
      .map((_, i) => ({
        range: `${i}-${i + 1}`,
        count: 0,
        movies: [] as Movie[]
      }));

    // 2. Distribute movies
    data.forEach((m) => {
      const rating =
        filters.ratingSource === 'imdb'
          ? m.imdbRating
          : m.rottenTomatoesRating / 10; // normalized
      const index = Math.min(Math.floor(rating), 9);
      if (index >= 0) {
        buckets[index].count++;
        buckets[index].movies.push(m);
      }
    });

    // 3. Format payload with top movies
    return buckets.map((b) => ({
      ...b,
      topMovies: b.movies.sort((a, b) => b.revenue - a.revenue).slice(0, 5) // Show top 5 by revenue
    }));
  }, [data, filters.ratingSource]);

  return (
    <ChartCard
      title="Rating Distribution"
      subtitle={`Based on ${
        filters.ratingSource === 'imdb' ? 'IMDb' : 'Rotten Tomatoes (scaled)'
      } scores`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="range" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#374151', opacity: 0.4 }}
            content={<CustomTooltipWithList titlePrefix="Rating Range:" />}
          />
          <Bar
            dataKey="count"
            fill="#6366F1"
            radius={[4, 4, 0, 0]}
            name="Movies"
            activeBar={<Rectangle fill="#818CF8" stroke="#C7D2FE" strokeWidth={2} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// --- Bar Chart: Movies by Genre ---
export const GenreBarChart: React.FC<ChartProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'count' | 'alpha'>('count');

  const chartData = useMemo(() => {
    const groups: Record<string, Movie[]> = {};

    // 1. Group movies
    data.forEach((m) => {
      if (!groups[m.genre]) groups[m.genre] = [];
      groups[m.genre].push(m);
    });

    // 2. Format
    const result = Object.entries(groups).map(([name, movies]) => ({
      name,
      value: movies.length,
      topMovies: movies.sort((a, b) => b.revenue - a.revenue).slice(0, 5) // Top 5 by revenue
    }));

    // 3. Sort
    if (sortBy === 'count') {
      result.sort((a, b) => b.value - a.value);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [data, sortBy]);

  const SortAction = (
    <div className="flex bg-gray-700 rounded-lg p-0.5 border border-gray-600">
      <button
        onClick={() => setSortBy('count')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          sortBy === 'count'
            ? 'bg-gray-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
        title="Sort by Count"
      >
        Count
      </button>
      <button
        onClick={() => setSortBy('alpha')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          sortBy === 'alpha'
            ? 'bg-gray-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
        title="Sort Alphabetically"
      >
        A-Z
      </button>
    </div>
  );

  return (
    <ChartCard
      title="Genre Breakdown"
      subtitle="Number of movies per genre"
      action={SortAction}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            width={80}
          />
          <Tooltip
            cursor={{ fill: '#374151', opacity: 0.4 }}
            content={<CustomTooltipWithList />}
          />
          <Bar
            dataKey="value"
            fill="#10B981"
            radius={[0, 4, 4, 0]}
            name="Count"
            activeBar={<Rectangle fill="#34D399" stroke="#A7F3D0" strokeWidth={2} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// --- Bar Chart: Average Revenue by Genre ---
export const AvgRevenueByGenreBarChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const genreStats: Record<string, { total: number; movies: Movie[] }> = {};

    data.forEach((m) => {
      if (!genreStats[m.genre]) {
        genreStats[m.genre] = { total: 0, movies: [] };
      }
      genreStats[m.genre].total += m.revenue;
      genreStats[m.genre].movies.push(m);
    });

    return Object.entries(genreStats)
      .map(([genre, stats]) => ({
        genre,
        avgRevenue: Math.round(stats.total / stats.movies.length),
        topMovies: stats.movies
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5) // Highest earners
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue);
  }, [data]);

  return (
    <ChartCard
      title="Avg. Revenue by Genre"
      subtitle="Average box office (Millions)"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="genre"
            stroke="#9CA3AF"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={40}
          />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#374151', opacity: 0.4 }}
            content={<CustomTooltipWithList />}
          />
          <Bar
            dataKey="avgRevenue"
            fill="#059669"
            radius={[4, 4, 0, 0]}
            name="Avg Revenue"
            activeBar={<Rectangle fill="#34D399" stroke="#A7F3D0" strokeWidth={2} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// --- Bar Chart: Movies Released per Year ---
export const MoviesPerYearChart: React.FC<ChartProps> = ({ data, filters }) => {
  const chartData = useMemo(() => {
    const [minYear, maxYear] = filters.yearRange;
    const yearGroups: Record<number, Movie[]> = {};

    // Initialize
    for (let i = minYear; i <= maxYear; i++) {
      yearGroups[i] = [];
    }

    // Fill
    data.forEach((m) => {
      if (m.year >= minYear && m.year <= maxYear) {
        yearGroups[m.year].push(m);
      }
    });

    return Object.entries(yearGroups)
      .map(([year, movies]) => ({
        year: parseInt(year, 10),
        count: movies.length,
        topMovies: movies
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5) // Top by revenue
      }))
      .sort((a, b) => a.year - b.year);
  }, [data, filters.yearRange]);

  return (
    <ChartCard title="Production Trend" subtitle="Movies released per year">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#374151', opacity: 0.4 }}
            content={<CustomTooltipWithList titlePrefix="Year:" />}
          />
          <Bar
            dataKey="count"
            fill="#F59E0B"
            radius={[4, 4, 0, 0]}
            name="Movies Released"
            activeBar={<Rectangle fill="#FBBF24" stroke="#FDE68A" strokeWidth={2} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// --- Scatter Plot: Budget vs Rating ---
export const BudgetRatingScatter: React.FC<ChartProps> = ({ data, filters }) => {
  const chartData = useMemo(() => {
    return data.map((m) => {
      const rating =
        filters.ratingSource === 'imdb'
          ? m.imdbRating
          : m.rottenTomatoesRating / 10; // normalized
      return {
        x: m.budget,
        y: rating,
        title: m.title,
        genre: m.genre
      };
    });
  }, [data, filters.ratingSource]);

  const yDomain: [number, number] = [0, 10];
  const yLabel =
    filters.ratingSource === 'imdb'
      ? 'IMDb Rating'
      : 'RT Rating (scaled /10)';

  return (
    <ChartCard title="Budget vs. Rating Correlation" subtitle="Does money buy quality?">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            dataKey="x"
            name="Budget"
            unit="M"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Rating"
            domain={yDomain}
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-gray-800 border border-gray-600 p-2 rounded shadow-lg text-xs z-50 relative">
                    <p className="font-bold text-white">{d.title}</p>
                    <p className="text-gray-300">Genre: {d.genre}</p>
                    <p className="text-indigo-400">Budget: ${d.x}M</p>
                    <p className="text-green-400">
                      {yLabel}: {d.y.toFixed ? d.y.toFixed(1) : d.y}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            name="Movies"
            data={chartData}
            fill="#F472B6"
            shape={<HoverableScatterPoint />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// --- Strip Plot (Box Plot Proxy): Rating Spread per Genre ---
export const GenreSpreadPlot: React.FC<ChartProps> = ({ data, filters }) => {
  const chartData = useMemo(() => {
    return data.map((m) => {
      const rating =
        filters.ratingSource === 'imdb'
          ? m.imdbRating
          : m.rottenTomatoesRating / 10; // normalized
      return {
        genre: m.genre,
        rating,
        title: m.title
      };
    });
  }, [data, filters.ratingSource]);

  const yDomain: [number, number] = [0, 10];

  return (
    <ChartCard
      title="Rating Spread by Genre"
      subtitle="Distribution of scores across categories"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="genre"
            type="category"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            allowDuplicatedCategory={false}
          />
          <YAxis
            dataKey="rating"
            type="number"
            domain={yDomain}
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            name="Rating"
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-gray-800 border border-gray-600 p-2 rounded shadow-lg text-xs z-50 relative">
                    <p className="font-bold text-white">{d.title}</p>
                    <p className="text-yellow-400">
                      Rating:{' '}
                      {d.rating.toFixed ? d.rating.toFixed(1) : d.rating}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            name="Movies"
            data={chartData}
            fill="#38BDF8"
            shape={<HoverableScatterPoint />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// --- Scatter Plot: Revenue by Genre ---
export const RevenueByGenreScatter: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(
    () =>
      data.map((m) => ({
        genre: m.genre,
        revenue: m.revenue,
        title: m.title,
        budget: m.budget
      })),
    [data]
  );

  return (
    <ChartCard
      title="Revenue by Genre"
      subtitle="Box office performance distribution"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="genre"
            type="category"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            allowDuplicatedCategory={false}
          />
          <YAxis
            dataKey="revenue"
            type="number"
            name="Revenue"
            unit="M"
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-xl text-xs z-50 relative min-w-[150px]">
                    <p className="font-bold text-white text-sm mb-2 pb-1 border-b border-gray-700">
                      {d.title}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-pink-400 font-semibold">
                          ${d.budget}M
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Revenue:</span>
                        <span className="text-emerald-400 font-semibold">
                          ${d.revenue}M
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Genre:</span>
                        <span className="text-gray-300">{d.genre}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            name="Movies"
            data={chartData}
            fill="#10B981"
            shape={<HoverableScatterPoint />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
