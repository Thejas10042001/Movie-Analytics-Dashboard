import React from 'react';
import { Film, Database, Share2, Download, BarChart3 } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface LayoutProps {
  children: React.ReactNode;
  onRefreshData: () => void;
  onExportData: () => void;
  onExportPowerBi: () => void;
  isLoading: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onRefreshData,
  onExportData,
  onExportPowerBi,
  isLoading,
}) => {
  const [isShareOpen, setIsShareOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  CineMetrics AI
                </h1>
                <p className="text-xs text-indigo-400 font-medium">
                  POWERED BY THEJAS AND HIS TEAMMATES
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Export Power BI Button */}
              <button
                onClick={onExportPowerBi}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 text-yellow-400 transition-all border border-gray-600"
                title="Export JSON for Power BI"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Power BI</span>
              </button>

              {/* Export CSV Button */}
              <button
                onClick={onExportData}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-all border border-gray-600"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-all border border-gray-600"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Generate Button */}
              <button
                onClick={onRefreshData}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Generate New Dataset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>
            © {new Date().getFullYear()} CineMetrics AI Dashboard. Demo purposes
            only.
          </p>
        </div>
      </footer>

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
};