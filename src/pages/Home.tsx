import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  synopsis: string;
  images: { jpg: { image_url: string } };
  url: string;
  score?: number;
  episodes?: number;
  status?: string;
}

const Home: React.FC = () => {
  const [recentAnime, setRecentAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentAnime();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchAnime(searchQuery);
      } else {
        fetchRecentAnime();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRecentAnime = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.jikan.moe/v4/anime?status=airing&order_by=score&sort=desc&limit=24');
      const data = await response.json();
      setRecentAnime(data.data || []);
    } catch (error) {
      console.error('Error fetching recent anime:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchAnime = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setSearchResults(data.data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/watch/${anime.mal_id}`, { state: { anime } });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 h-16 flex items-center justify-between px-6 lg:px-8">


        {/* Centered Search Bar */}
        <div className="flex-1 max-w-lg mx-auto relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className="w-full bg-black/50 border border-white/20 rounded-xl py-3 pl-5 pr-24 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 outline-none text-sm text-white placeholder-gray-400 transition-all duration-200"
            placeholder="Search anime..."
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 p-2 rounded-lg hover:bg-white/5 transition-colors">
            {isSearching ? <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-blue-400 rounded-full"></div> : <Search size={18} />}
          </button>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-black/95 border border-white/10 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50 backdrop-blur-sm">
              {searchResults.map((anime) => (
                <div
                  key={anime.mal_id}
                  onClick={() => handleAnimeClick(anime)}
                  className="flex gap-4 p-4 hover:bg-white/5 cursor-pointer transition-all duration-200 border-b border-white/5 last:border-b-0"
                >
                  <img
                    src={anime.images?.jpg?.image_url || '/placeholder.jpg'}
                    alt={anime.title}
                    className="w-14 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate mb-1">{anime.title}</h4>
                    {anime.title_english && anime.title_english !== anime.title && (
                      <p className="text-xs text-gray-400 truncate mb-2">{anime.title_english}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-semibold border border-blue-500/30">
                        {anime.score || 'N/A'}
                      </span>
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-gray-400 border border-white/20">
                        {anime.episodes || '?'} ep
                      </span>
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-gray-400 capitalize border border-white/20">
                        {anime.status?.toLowerCase() || 'unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Icons & Sign In */}

      </nav>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-[1400px] mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN: Main Content (3/4 width) */}
        <div className="lg:col-span-3 space-y-8">
          {/* Hero Section - Carousel */}
    

          {/* Recently Updated Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'Recently Updated'}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-24">
                <div className="animate-spin w-12 h-12 border-4 border-gray-600 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-blue-600 font-bold text-lg">LOADING ANIME...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {recentAnime.slice(0, 24).map((anime) => (
                  <div
                    key={anime.mal_id}
                    onClick={() => handleAnimeClick(anime)}
                    className="relative cursor-pointer group"
                  >
                    <div className="aspect-[3/4.2] overflow-hidden bg-gray-900 border border-white/10 rounded-xl relative group-hover:border-blue-600/50 transition-all duration-300">
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                      {/* Overlay Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="bg-white text-black text-[9px] font-black px-2 py-1 rounded-md">HD</span>
                        <span className="bg-gray-800 text-white text-[9px] font-bold px-2 py-1 rounded-md">SUB</span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-md">
                        {anime.episodes ? `${anime.episodes} Ep` : 'Ongoing'}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-gray-300 leading-tight group-hover:text-blue-600 truncate uppercase transition-colors duration-300">
                      {anime.title}
                    </h3>
                    {anime.score && (
                      <div className="text-xs text-yellow-500 font-bold mt-1 flex items-center gap-1">
                        ⭐ {anime.score.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (1/4 width) */}
        <div className="space-y-6">
          {/* Quick Filter Widget */}

          {/* Top Anime Leaderboard */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
  <h3 className="font-black text-white text-lg uppercase tracking-wide mb-4">Top Anime</h3>
  <div className="space-y-2">
    {recentAnime.slice(0, 8).map((anime, idx) => (
      <div 
        key={anime.mal_id} 
        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all group"
      >
        <span className={`text-base font-bold w-6 text-center flex-shrink-0 ${
          idx < 3 ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {idx + 1}
        </span>
        
        <div className="w-12 h-16 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
          <img
            src={anime.images.jpg.image_url}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.jpg';
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-600 transition-colors">
            {anime.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400">
              {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
            </span>
            <span className="text-xs text-yellow-400 font-semibold">
              ★ {anime.score?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
        </div>
      </main>
    </div>
  );
};

export default Home;
