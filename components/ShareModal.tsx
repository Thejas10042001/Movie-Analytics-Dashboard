import React, { useState } from 'react';
import { X, Copy, Check, Linkedin } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `Check out my new project CineMetrics AI! 🚀

An interactive dashboard analyzing 40+ years of movie history across Hollywood and Indian Cinema (Hindi, Tamil, Telugu, etc.).

Features:
📊 Interactive Data Visualization with Recharts
🤖 Powered by Gemini 2.5 Flash for Data Generation
🌍 Real-time filtering (Language, Genre, Year)
📈 Analysis of trends in Budget vs. Revenue
🎥 Insights into 1000+ real movies

Tech Stack: #React #TypeScript #TailwindCSS #GeminiAPI #DataScience #WebDev

Built with Thejas and Team!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Your browser blocked clipboard access. Please copy manually.");
    }
  };

  const handleLinkedInRedirect = () => {
    window.open("https://www.linkedin.com/feed/", "_blank");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-400" />
            Share to LinkedIn
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">
            LinkedIn doesn't allow auto-filling post content. <br />
            <span className="text-indigo-400 font-medium">1️⃣ Copy the post below.</span> <br />
            <span className="text-indigo-400 font-medium">2️⃣ Open LinkedIn and paste it.</span>
          </p>

          {/* Share Text Box */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 relative">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {shareText}
            </pre>

            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-gray-800 rounded-md border border-gray-600 hover:bg-gray-700 transition-all shadow-lg"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-300" />
              )}
            </button>
          </div>

          {/* LinkedIn Button */}
          <button
            onClick={handleLinkedInRedirect}
            className="w-full flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006396] text-white py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/20"
          >
            <Linkedin className="w-5 h-5" />
            Go to LinkedIn & Paste
          </button>
        </div>
      </div>
    </div>
  );
};
