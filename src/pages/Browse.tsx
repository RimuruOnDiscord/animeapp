import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, X, Home as HomeIcon, Folder,
  Filter, Star, Sparkles, ChevronDown, Play
} from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  score?: number;
  episodes?: number;
  type?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
}

interface Genre {
  mal_id: number;
  name: string;
}

const Browse: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = React.useRef<IntersectionObserver | null>(null);

  // --- SEARCH & DATA STATE ---
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [genresLoading, setGenresLoading] = useState(false);
  
  // Animation States
  const [showSearch, setShowSearch] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter States
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('popularity');

  // --- STYLE INJECTION (Synced with Home.tsx) ---
  useEffect(() => {
    const id = 'vf-ui-animations';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.innerHTML = `
      .animate-in { will-change: transform, opacity; animation: vf-fade-in .28s cubic-bezier(.2,.9,.3,1) both; }
      .animate-out { will-change: transform, opacity; animation: vf-fade-out .22s cubic-bezier(.4,.0,.2,1) both; }
      @keyframes vf-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes vf-fade-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
      
      .vf-ripple { 
        position: absolute; width: 50px; height: 50px; border-radius: 50%; 
        background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.10) 70%, transparent 100%); 
        transform: translate(-50%,-50%) scale(0); pointer-events: none; 
        box-shadow: 0 0 10px 0px rgba(255,255,255,0.17);
        animation: vf-ripple 380ms cubic-bezier(0.4, 0, 0.2, 1) forwards; 
      }
      @keyframes vf-ripple {
        0% { transform: translate(-50%,-50%) scale(0); opacity: 0.9; }
        100% { transform: translate(-50%,-50%) scale(7); opacity: 0; }
      }/* High-Intensity Ripple */
.vf-ripple { 
  position: absolute; 
  width: 50px; 
  height: 50px; 
  border-radius: 50%; 
  /* Brighter initial gradient */
  background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 70%, transparent 100%); 
  transform: translate(-50%,-50%) scale(0); 
  pointer-events: none; 
  /* Heavier glow effect */
  box-shadow: 0 0 20px 2px rgba(255,255,255,0.3);
  /* Slightly longer duration to feel the "weight" of the click */
  animation: vf-ripple 450ms cubic-bezier(0.1, 0, 0.2, 1) forwards; 
}

@keyframes vf-ripple {
  0% { 
    transform: translate(-50%,-50%) scale(0); 
    opacity: 1; /* Start fully visible */
  }
  100% { 
    transform: translate(-50%,-50%) scale(12); /* Increased from 7 to 12 */
    opacity: 0; 
  }
}

      button { position: relative; overflow: hidden; }
      .thin-scroll::-webkit-scrollbar { width: 4px; }
      .thin-scroll::-webkit-scrollbar-track { background: transparent; }
      .thin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    `;
    document.head.appendChild(s);
  }, []);

  const createRipple = (e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'vf-ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // --- DATA FETCHING ---

  // Improved Genre Fetch
  useEffect(() => {
    const fetchGenres = async () => {
      setGenresLoading(true);
      try {
        const res = await fetch('https://api.jikan.moe/v4/genres/anime');
        const data = await res.json();
        if (data.data) {
          setGenres(data.data.slice(0, 24));
        }
      } catch (e) {
        console.error("Genre error:", e);
      } finally {
        setGenresLoading(false);
      }
    };
    fetchGenres();
  }, []);

const performMainSearch = useCallback(async (query: string, pageNum: number = 1) => {
  if (pageNum === 1) setLoading(true); // Only show full loader on first load
  
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (selectedGenre) params.append('genres', selectedGenre.toString());
    if (selectedStatus) params.append('status', selectedStatus);
    
    params.append('order_by', selectedSort);
    params.append('sort', 'desc');
    params.append('sfw', 'true');
    params.append('page', pageNum.toString());
    params.append('limit', '24'); // Fetch a decent chunk

    const res = await fetch(`https://api.jikan.moe/v4/anime?${params.toString()}`);
    const data = await res.json();
    
    if (data.data) {
      setAnimeList(prev => pageNum === 1 ? data.data : [...prev, ...data.data]);
      setHasMore(data.pagination.has_next_page);
    }
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
}, [selectedGenre, selectedStatus, selectedSort]);

useEffect(() => {
  setPage(1);
  performMainSearch(searchQuery, 1);
}, [selectedGenre, selectedStatus, selectedSort]);

// 4. The Sentinel Observer (Detects the bottom of the page)
const lastElementRef = useCallback((node: HTMLDivElement) => {
  if (loading) return;
  if (observer.current) observer.current.disconnect();

  observer.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore) {
      setPage(prev => {
        const nextPage = prev + 1;
        performMainSearch(searchQuery, nextPage);
        return nextPage;
      });
    }
  });

  if (node) observer.current.observe(node);
}, [loading, hasMore, searchQuery, performMainSearch]);

  // Dropdown & Grid Update Timer
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery) {
        setIsSearching(true);
        // Header dropdown results
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=6`);
        const data = await res.json();
        setSearchResults(data.data || []);
        setShowSearch(true);
        setIsSearching(false);
        
        // Sync URL and refresh main grid
        setSearchParams({ q: searchQuery });
        performMainSearch(searchQuery);
      } else {
        setShowSearch(false);
        performMainSearch('');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, performMainSearch, setSearchParams]);

  // Handle dropdown mount/unmount animation timing
  useEffect(() => {
    if (showSearch) setSearchMounted(true);
    else if (searchMounted) {
      const t = setTimeout(() => setSearchMounted(false), 350);
      return () => clearTimeout(t);
    }
  }, [showSearch]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-violet-500/30">
      
      {/* HEADER WITH SYNCED RIPPLES & NAV STYLE */}
      <header className="sticky top-0 z-[100] w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
               <span className="text-xl font-black">🗲</span>
            </div>

            {/* SYNCED NAV LINKS */}
            <nav className="hidden md:flex items-center gap-2">
              <button 
                onClick={(e) => { createRipple(e); navigate('/'); }} 
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-white/10"
              >
                <HomeIcon size={18}/> Home
              </button>
              <button 
                onClick={(e) => { createRipple(e); navigate('/browse'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-violet-500/25"
              >
                <Folder size={18}/> Browse
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* SEARCH BAR (Matches Home.tsx) */}
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

              {/* SEARCH DROPDOWN (Matches Home.tsx) */}
              {searchMounted && (
                <div className={`absolute top-full right-0 mt-3 w-80 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden ${showSearch ? 'animate-in' : 'animate-out'}`}>
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
                    <div className="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">Searching...</div>
                  )}
                </div>
              )}
            </div>
            
<button 
  onClick={(e) => { createRipple(e); setShowFilters(!showFilters); }}
  className={`
    p-2 rounded-md border transition-all duration-200 relative overflow-hidden
    ${showFilters 
      ? 'bg-violet-600 border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
      : 'bg-violet-700 border-violet-600 hover:bg-violet-600 shadow-lg'
    }
  `}
>
  {/* The Filter Icon stays on top of the ripple usually, but we want high contrast */}
  <Filter size={18} className="relative z-10" />
</button>
          </div>
        </div>
      </header>

      {/* FILTERS PANEL */}
<div className={`overflow-hidden transition-all duration-300 ease-in-out border-b border-white/5 bg-[#0a0a0a] ${showFilters ? 'max-h-[500px] py-8' : 'max-h-0'}`}>
  <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
    
    {/* 1. GENRES */}
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
        <Filter size={12}/> Genres
      </h3>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto thin-scroll pr-2">
        {genres.map(g => (
          <button 
            key={g.mal_id} 
            onClick={(e) => { createRipple(e); setSelectedGenre(selectedGenre === g.mal_id ? null : g.mal_id); }}
            className={`text-left px-3 py-2 text-xs rounded-lg border transition-all ${
              selectedGenre === g.mal_id 
                ? 'bg-violet-600/20 border-violet-500 text-violet-300 font-bold' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>

    {/* 2. PRODUCTION STATUS */}
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Production Status</h3>
      <div className="flex flex-col gap-2">
        {['airing', 'complete', 'upcoming'].map(s => (
          <button 
            key={s} 
            onClick={(e) => { createRipple(e); setSelectedStatus(selectedStatus === s ? '' : s); }}
            className={`flex items-center justify-between px-4 py-3 text-xs font-bold uppercase rounded-xl border transition-all ${
              selectedStatus === s 
                ? 'bg-violet-600 border-violet-500 text-white' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
            }`}
          >
            {s} {selectedStatus === s && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"/>}
          </button>
        ))}
      </div>
    </div>

    {/* 3. RANKING STRATEGY (Synced Styles) */}
<div className="space-y-4">
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
    Sort by
  </h3>
  
  <div className="relative">
    {/* Trigger Button */}
    <button
      onClick={(e) => { 
        createRipple(e); 
        setIsSortOpen(!isSortOpen); 
      }}
      className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase rounded-xl border transition-all duration-300 ${
        isSortOpen 
          ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
      }`}
    >
      {/* Dynamic Label Paraphrasing */}
      <span>
        {selectedSort === 'popularity' && 'Most Popular'}
        {selectedSort === 'score' && 'Highest Rated'}
        {selectedSort === 'start_date' && 'Latest Arrivals'}
      </span>
      <ChevronDown 
        size={16} 
        className={`transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-violet-400' : 'text-gray-600'}`} 
      />
    </button>

    {/* Dropdown Menu */}
    {isSortOpen && (
      <>
        <div className="fixed inset-0 z-[110]" onClick={() => setIsSortOpen(false)} />
        
        <div className="absolute top-full left-0 w-full mt-2 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl z-[120] overflow-hidden animate-in origin-top">
          {[
            { id: 'popularity', label: 'Most Popular' },
            { id: 'score', label: 'Highest Rated' },
            { id: 'start_date', label: 'Latest Arrivals' }
          ].map((option) => (
            <div
              key={option.id}
              onClick={() => {
                setSelectedSort(option.id);
                setIsSortOpen(false);
              }}
              className={`px-4 py-3 text-xs font-bold uppercase cursor-pointer transition-all flex items-center justify-between ${
                selectedSort === option.id 
                  ? 'bg-violet-600/20 text-violet-300' 
                  : 'hover:bg-white/5 text-gray-500 hover:text-white'
              }`}
            >
              {option.label}
              {selectedSort === option.id && (
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              )}
            </div>
          ))}
        </div>
      </>
    )}
  </div>
</div>

  </div>
</div>

      {/* RESULTS GRID - SYNCED WITH RECENTLY UPDATED ANIMATIONS */}
      <main className="container mx-auto px-4 py-12 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{searchQuery ? `Search Results for: ${searchQuery}` : 'Browse'}</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {animeList.map((anime, idx) => (
            <div
              key={anime.mal_id}
              onClick={() => navigate(`/watch/${anime.mal_id}`, { state: { anime } })}
              className="group cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* IMAGE CONTAINER WITH EXACT HOME STYLE */}
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-violet-500/40 transition-all duration-300 transform-gpu">
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

              {/* TITLE AND INFO WITH EXACT HOME STYLE */}
              <h3 className="mt-3 text-sm font-bold truncate text-gray-200 group-hover:text-white transition-colors">
                {anime.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                  {anime.episodes || '?'} EPISODES
                </span>
                <span className="text-[10px] text-white-400 font-black uppercase">
                  {anime.type || 'TV'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {animeList.length === 0 && !loading && (
          <div className="py-20 text-center text-gray-600">
            <p className="text-sm font-bold uppercase tracking-widest italic opacity-40">No matching archives found.</p>
          </div>
        )}

<main className="container mx-auto px-4 py-12 space-y-6">
  
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
    {animeList.map((anime, idx) => (
      <div
        key={`${anime.mal_id}-${idx}`} // Use idx to prevent key collisions on infinite scroll
        onClick={() => navigate(`/watch/${anime.mal_id}`, { state: { anime } })}
        className="group cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-lg animate-in"
        style={{ animationDelay: `${(idx % 24) * 40}ms` }} // Delay only the current "batch"
      >
        {/* ... Card Content (Keep your existing styles) ... */}
      </div>
    ))}
  </div>

  {/* THE SENTINEL - This triggers the infinite load */}
  <div ref={lastElementRef} className="h-20 w-full flex items-center justify-center">
    {hasMore && (
      <div className="flex flex-col items-center gap-2 opacity-50">
        <div className="w-6 h-6 border-2 border-white-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white-400">
          Loading...
        </span>
      </div>
    )}
  </div>
</main>

      </main>
    </div>
  );
};

export default Browse;