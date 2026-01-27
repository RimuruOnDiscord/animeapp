import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Home as HomeIcon, Film, Tv, Folder,
  Bookmark, Megaphone, Settings, Sparkles, Play
} from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
      maximum_image_url?: string;
    };
    webp?: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
      maximum_image_url?: string;
    };
  };
  score?: number;
  episodes?: number;
  status?: string;
}

const Home: React.FC = () => {
  const [recentAnime, setRecentAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // THE "GOLD STANDARD" ANIMATION STATES
  const [showSearch, setShowSearch] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);

  const navigate = useNavigate();

  // Animation styles injection
  useEffect(() => {
    const id = 'vf-ui-animations';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.innerHTML = `
      .animate-in { will-change: transform, opacity; }
      .animate-out { will-change: transform, opacity; }
      .fade-in { animation: vf-fade-in .28s cubic-bezier(.2,.9,.3,1) both; }
      .fade-out { animation: vf-fade-out .22s cubic-bezier(.4,.0,.2,1) both; }
      .zoom-in { animation: vf-zoom-in .32s cubic-bezier(.2,.9,.3,1) both; }
      .zoom-out { animation: vf-zoom-out .22s cubic-bezier(.4,.0,.2,1) both; }
      .spin-in { animation: vf-spin-in .45s cubic-bezier(.2,.9,.3,1) both; }
      .slide-in-from-bottom { animation: vf-slide-in-from-bottom .36s cubic-bezier(.2,.9,.3,1) both; }
      .slide-in-from-bottom-4 { animation: vf-slide-in-from-bottom .36s cubic-bezier(.2,.9,.3,1) both; }
      .slide-out-to-bottom-4 { animation: vf-slide-out-to-bottom .26s cubic-bezier(.4,.0,.2,1) both; }
      .slide-in-from-left { animation: vf-slide-in-from-left .36s cubic-bezier(.2,.9,.3,1) both; }
      .slide-in-from-right { animation: vf-slide-in-from-right .36s cubic-bezier(.2,.9,.3,1) both; }
      .slide-in-from-top { animation: vf-slide-in-from-top .36s cubic-bezier(.2,.9,.3,1) both; }

      @keyframes vf-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes vf-fade-out { from { opacity: 1; } to { opacity: 0; } }
      @keyframes vf-zoom-in { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes vf-zoom-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(8px) scale(.985); } }
      @keyframes vf-spin-in { from { transform: rotate(-8deg) scale(.95); opacity:0 } to { transform: rotate(0deg) scale(1); opacity:1 } }
      @keyframes vf-slide-in-from-bottom { from { opacity: 0; transform: translateY(26px) scale(.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes vf-slide-out-to-bottom { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(18px) scale(.995); } }
      @keyframes vf-slide-in-from-left { from { opacity: 0; transform: translateX(-18px) scale(.995); } to { opacity: 1; transform: translateX(0) scale(1); } }
      @keyframes vf-slide-in-from-right { from { opacity: 0; transform: translateX(18px) scale(.995); } to { opacity: 1; transform: translateX(0) scale(1); } }
      @keyframes vf-slide-in-from-top { from { opacity: 0; transform: translateY(-18px) scale(.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
      /* Smooth transitions for drag and drop */
      .no-rise { transform: none !important; }
      /* Ripple effect - less intense */
      .vf-ripple { position: absolute; width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.10) 70%, transparent 100%); transform: translate(-50%,-50%) scale(0); pointer-events: none; box-shadow: 0 0 10px 0px rgba(255,255,255,0.17); animation: vf-ripple 380ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      @keyframes vf-ripple {
        0% { transform: translate(-50%,-50%) scale(0); opacity: 0.9; }
        100% { transform: translate(-50%,-50%) scale(7); opacity: 0; }
      }
      button { position: relative; overflow: hidden; }
      /* Slider thumb styling */
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
      }
      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

  // Ripple effect handler - creates a visible ripple on button click
  const createRipple = (e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'vf-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  // 1. Data Fetching
  useEffect(() => {
    fetchRecentAnime();
  }, []);

  // 2. The Animation Lifecycle Logic
  useEffect(() => {
    if (showSearch) {
      setSearchMounted(true);
    } else if (searchMounted) {
      // Matches the 350ms in your CSS/original logic
      const t = setTimeout(() => setSearchMounted(false), 350);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  const fetchRecentAnime = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=24');
      const data = await res.json();
      // Filter out season sequels/parts (shows with "Part", "Season X", etc.)
      const filteredAnime = (data.data || []).filter((anime: Anime) => {
        const title = anime.title.toLowerCase();
        // Hide anime with season/part indicators in title
        return !title.includes('part ') &&
               !title.includes('part 1') &&
               !title.includes('part 2') &&
               !title.includes('part 3') &&
               !title.includes('part 4') &&
               !title.includes('part 5') &&
               !title.includes('season ') &&
               !title.includes(' s2') &&
               !title.includes(' s3') &&
               !title.includes(' s4') &&
               !title.includes(' s5') &&
               !title.includes(' ii') &&
               !title.includes(' iii') &&
               !title.includes(' iv') &&
               !title.includes(' v') &&
               !title.includes(' 2nd') &&
               !title.includes(' 3rd') &&
               !title.includes(' 4th') &&
               !title.includes(' 5th') &&
               !title.includes('zenpen') && // Japanese "first part"
               !title.includes('kouhen') && // Japanese "second part"
               !title.includes(' zenpen') &&
               !title.includes(' kouhen') &&
               !title.includes(': ') && // Often indicates subtitle/part
               !title.includes(' - ') && // Often indicates subtitle/part
               !title.includes(' (part') &&
               !title.includes(' (season');
      });
      setRecentAnime(filteredAnime);
    } finally { setLoading(false); }
  };

  const searchAnime = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`);
      const data = await res.json();
      const animeList = data.data || [];

      // Check each anime against TMDB to ensure it exists and can be streamed
      const validatedResults = await Promise.all(
        animeList.map(async (anime: Anime) => {
          try {
            // Clean title for TMDB search
            let cleanTitle = anime.title
              .replace(/(?:season|season\s+\d+|\d+\w*\s*season)/i, '')
              .replace(/[^\w\s]/g, '')
              .trim();

            // Search TMDB for TV shows
            const tmdbResponse = await fetch(
              `https://api.themoviedb.org/3/search/tv?api_key=630c8f01625f3d0eb72180513daa9fca&query=${encodeURIComponent(cleanTitle)}&include_adult=false`
            );
            const tmdbData = await tmdbResponse.json();

            // Check if anime exists in TMDB
            const existsInTMDB = tmdbData.results && tmdbData.results.some((result: any) =>
              result.name.toLowerCase().includes('anime') ||
              result.overview.toLowerCase().includes('anime') ||
              result.origin_country?.includes('JP') ||
              result.original_language === 'ja'
            );

            return existsInTMDB ? anime : null;
          } catch (error) {
            console.error('TMDB validation error:', error);
            return null; // Exclude if TMDB check fails
          }
        })
      );

      // Filter out null results and limit to 6
      const finalResults = validatedResults.filter(anime => anime !== null).slice(0, 6);
      setSearchResults(finalResults);
      setShowSearch(true);
    } finally { setIsSearching(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchAnime(searchQuery);
      else setShowSearch(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-violet-500/30 animate-fade-in-scale">
      
      {/* SPENFLIX PREMIUM HEADER */}
      <header className="sticky top-0 z-[100] w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">
                 🗲
               </span>
            </div>

            {/* Nav Links - SpenFlix Style */}
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={createRipple} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-violet-500/25"><HomeIcon size={18}/> Home</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* SEARCH BAR CONTAINER */}
            <div className="relative group">
              <div className="relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  className="bg-black border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm w-[180px] md:w-[260px] focus:w-[320px] focus:border-violet-500/50 outline-none transition-all duration-300"
                  placeholder="Search..."
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              </div>

              {/* SEARCH RESULTS DROPDOWN (ANIMATED) */}
              {searchMounted && (
                <div className={`
                  absolute top-full right-0 mt-3 w-80 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden
                  ${showSearch ? 'animate-in' : 'animate-out'}
                `}>
                  {searchResults.map((anime) => (
                    <div
                      key={anime.mal_id}
                      onClick={() => navigate(`/watch/${anime.mal_id}`, { state: { anime } })}
                      className="flex gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors"
                    >
                      <img src={anime.images.jpg.image_url} className="w-10 h-14 object-cover rounded-md shadow-md" alt="" />
                      <div className="min-w-0 flex flex-col justify-center">
                        <h4 className="text-xs font-bold truncate text-gray-100">{anime.title}</h4>
                        <p className="text-[10px] text-violet-400 font-bold mt-1 uppercase">★ {anime.score || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {isSearching && (
                    <div className="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">Searching archives...</div>
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        
        {/* HERO BANNER SECTION (21/9 Aspect) */}
        <section className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden group shadow-2xl">
          {recentAnime[0] && (
            <>
              <img src="https://movieplayer.net-cdn.it/t/images/2025/01/08/fate-strange-fake-recensione-primi-episodi-anime-crunchyroll_jpg_1280x720_crop_q85.jpg" className="w-full h-full object-cover" alt="hero" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent flex flex-col justify-end p-8 md:p-12">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="bg-violet-600 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Spotlight</span>
                    <span className="text-sm font-bold text-yellow-500">★ {recentAnime[0].score}</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black mb-6 max-w-2xl leading-none uppercase italic tracking-tighter">{recentAnime[0].title}</h1>
                 <div className="flex gap-4">
                    <button onClick={createRipple} className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-xl font-black hover:bg-white/20 transition-all border border-white/10">
                      VIEW MORE
                    </button>
                 </div>
              </div>
            </>
          )}
        </section>

        {/* RECENTLY UPDATED GRID */}
<section className="space-y-6">
  <h2 className="text-2xl font-bold tracking-tight">Recently Updated</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
    {recentAnime.map((anime) => (
      <div
        key={anime.mal_id}
        onClick={() => navigate(`/watch/${anime.mal_id}`, { state: { anime } })}
        className="group cursor-pointer hover:scale-105 transition-all duration-200"
      >
        {/* FIX 1: Added 'transform-gpu' to force hardware acceleration on the container */}
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-violet-500/40 transition-all duration-300 transform-gpu">
          
          {/* FIX 2: Removed 'rounded-2xl' from the img. The parent overflow-hidden handles the rounding. */}
          <img 
            src={anime.images.jpg.image_url} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            alt="" 
          />
          
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black border border-white/10">
            HD
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="mt-3 text-sm font-bold truncate text-gray-200 group-hover:text-white transition-colors">{anime.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{anime.episodes || '?'} EPISODES</span>
          <span className="text-[10px] text-violet-400 font-black">TV</span>
        </div>
      </div>
    ))}
  </div>
</section>

      </main>

    </div>
  );
};

export default Home;
