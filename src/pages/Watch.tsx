    import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, Maximize, Settings, Monitor, Flag, ArrowLeft } from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  title_english?: string;
  synopsis: string;
  genres: { name: string }[];
  score?: number;
  episodes?: number;
  status: string;
  year: number;
  images: { jpg: { image_url: string } };
}

interface Episode {
  number: number;
  title: string;
  href: string;
}

interface Server {
  name: string;
  url: string;
}

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [anime, setAnime] = useState<Anime | null>(location.state?.anime || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEp, setCurrentEp] = useState(1);
  const [currentServer, setCurrentServer] = useState('vidfast');
  const [lightsOff, setLightsOff] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [isMovie, setIsMovie] = useState(true);
  const [totalEpisodes, setTotalEpisodes] = useState<number>(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

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

  const SERVERS = [
    { id: 'vidfast', name: 'Vidfast', type: 'fast' },
    { id: 'mapple', name: 'Mapple', type: 'hd' },
    { id: 'vidora', name: 'Vidora', type: 'backup' }
  ];

  // Fetch anime data if not provided or incomplete
  useEffect(() => {
    if (id && (!anime || !anime.synopsis)) {
      fetchAnimeData(id);
    }
  }, [id, anime]);

  // Fetch TMDB ID and determine if movie or TV show
  useEffect(() => {
    if (anime && anime.title) {
      fetchTmdbId(anime.title);
    }
  }, [anime]);

  // Set fallback episode count from MAL data if TMDB fails
  useEffect(() => {
    if (anime && anime.episodes && totalEpisodes === 0) {
      setTotalEpisodes(anime.episodes);
    }
  }, [anime, totalEpisodes]);

  // Reset video loaded state when changing episodes or servers
  useEffect(() => {
    setVideoLoaded(false);
  }, [currentEp, currentServer]);

  // Simulate video loading - set loaded after 0.5 seconds (much faster)
  useEffect(() => {
    if (!videoLoaded) {
      const timer = setTimeout(() => {
        setVideoLoaded(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [videoLoaded]);



  const fetchAnimeData = async (animeId: string) => {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
      const data = await response.json();
      if (data.data) {
        setAnime(data.data);
      }
    } catch (error) {
      console.error('Error fetching anime data:', error);
    }
  };

  // Update episodes when totalEpisodes changes
  useEffect(() => {
    if (anime && totalEpisodes) {
      const mockEpisodes = Array.from({ length: totalEpisodes }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
        href: `/watch/${anime.mal_id}/episode/${i + 1}`
      }));
      setEpisodes(mockEpisodes);
    }
  }, [anime, totalEpisodes]);

  const fetchTmdbId = async (title: string) => {
    try {
      // Extract season information from title
      const seasonMatch = title.match(/(?:season|season\s+(\d+)|(\d+)\w*\s*season)/i);
      const seasonNumber = seasonMatch ? (parseInt(seasonMatch[1] || seasonMatch[2]) || 1) : 1;

      // Clean title for better search results - keep more original characters
      let cleanTitle = title
        .replace(/(?:season|season\s+\d+|\d+\w*\s*season)/i, '')
        .replace(/[^\w\s\-:]/g, '') // Keep hyphens and colons which are common in titles
        .trim();

      console.log('Searching for:', cleanTitle, 'Season:', seasonNumber, 'Original:', title);

      // Helper function to calculate title similarity
      const calculateSimilarity = (str1: string, str2: string): number => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) return 1.0;
        return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
      };

      const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
          matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
          for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        return matrix[str2.length][str1.length];
      };

      // First search for anime specifically in TV shows
      const animeResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=630c8f01625f3d0eb72180513daa9fca&query=${encodeURIComponent(cleanTitle)}&include_adult=false`);
      const animeData = await animeResponse.json();

      if (animeData.results && animeData.results.length > 0) {
        // Score each result based on multiple factors
        const scoredResults = animeData.results.map((result: any) => {
          let score = 0;

          // Exact title match gets highest score
          if (result.name.toLowerCase() === cleanTitle.toLowerCase()) score += 100;
          if (result.original_name?.toLowerCase() === cleanTitle.toLowerCase()) score += 100;

          // High similarity gets good score
          const nameSimilarity = calculateSimilarity(result.name.toLowerCase(), cleanTitle.toLowerCase());
          const originalNameSimilarity = result.original_name ? calculateSimilarity(result.original_name.toLowerCase(), cleanTitle.toLowerCase()) : 0;
          score += Math.max(nameSimilarity, originalNameSimilarity) * 50;

          // Japanese origin gets bonus
          if (result.origin_country?.includes('JP')) score += 30;
          if (result.original_language === 'ja') score += 30;

          // Anime keywords in overview get bonus
          if (result.overview?.toLowerCase().includes('anime')) score += 20;

          // Recent release gets slight bonus (anime are usually recent)
          const releaseYear = result.first_air_date ? new Date(result.first_air_date).getFullYear() : 0;
          if (releaseYear >= 2000) score += 10;

          return { ...result, matchScore: score };
        });

        // Sort by score and take the best match
        scoredResults.sort((a: any, b: any) => b.matchScore - a.matchScore);
        const bestMatch = scoredResults[0];

        console.log('Best TMDB match:', bestMatch.name, 'Score:', bestMatch.matchScore);

        // If we have season info and the anime has seasons, try to get season-specific data
        if (seasonNumber > 1 && bestMatch) {
          try {
            const seasonsResponse = await fetch(`https://api.themoviedb.org/3/tv/${bestMatch.id}?api_key=630c8f01625f3d0eb72180513daa9fca`);
            const seasonsData = await seasonsResponse.json();

            if (seasonsData.seasons && seasonsData.seasons.length >= seasonNumber) {
              // Use the season-specific ID if available
              const seasonData = seasonsData.seasons[seasonNumber - 1];
              if (seasonData) {
                console.log('Found season data:', seasonData);
                setTotalEpisodes(seasonData.episode_count || 12);
              }
            }
          } catch (seasonError) {
            console.log('Could not fetch season data, using default');
          }
        }

        setTmdbId(bestMatch.id);
        setIsMovie(false);

        // Fetch episode count for TV shows if not already set
        if (!totalEpisodes) {
          const detailsResponse = await fetch(`https://api.themoviedb.org/3/tv/${bestMatch.id}?api_key=630c8f01625f3d0eb72180513daa9fca`);
          const detailsData = await detailsResponse.json();
          if (detailsData.number_of_episodes) {
            setTotalEpisodes(detailsData.number_of_episodes);
          }
        }

        return;
      }

      // If no TV results, search movies as fallback
      const movieResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=630c8f01625f3d0eb72180513daa9fca&query=${encodeURIComponent(cleanTitle)}&include_adult=false`);
      const movieData = await movieResponse.json();

      if (movieData.results && movieData.results.length > 0) {
        // Score movie results similarly
        const scoredMovies = movieData.results.map((result: any) => {
          let score = 0;

          // Exact title match
          if (result.title.toLowerCase() === cleanTitle.toLowerCase()) score += 100;
          if (result.original_title?.toLowerCase() === cleanTitle.toLowerCase()) score += 100;

          // Similarity scoring
          const titleSimilarity = calculateSimilarity(result.title.toLowerCase(), cleanTitle.toLowerCase());
          const originalTitleSimilarity = result.original_title ? calculateSimilarity(result.original_title.toLowerCase(), cleanTitle.toLowerCase()) : 0;
          score += Math.max(titleSimilarity, originalTitleSimilarity) * 50;

          // Japanese language/origin
          if (result.original_language === 'ja') score += 30;

          // Anime keywords
          if (result.overview?.toLowerCase().includes('anime')) score += 20;

          return { ...result, matchScore: score };
        });

        // Sort and pick best match
        scoredMovies.sort((a: any, b: any) => b.matchScore - a.matchScore);
        const bestMovie = scoredMovies[0];

        console.log('Best TMDB movie match:', bestMovie.title, 'Score:', bestMovie.matchScore);

        setTmdbId(bestMovie.id);
        setIsMovie(true);
      } else {
        // Fallback: use MAL ID directly (less reliable but better than nothing)
        console.log('No TMDB matches found, using MAL ID as fallback');
        setTmdbId(anime?.mal_id || null);
        setIsMovie(false);
      }
    } catch (error) {
      console.error('Error fetching TMDB ID:', error);
      // Ultimate fallback
      setTmdbId(anime?.mal_id || null);
      setIsMovie(false);
    }
  };

  const getVideoSrc = () => {
    if (!anime) return '';
    const id = tmdbId || anime.mal_id;
    const season = 1; // Default season

    switch (currentServer) {
      case 'vidfast':
        return isMovie
          ? `https://vidfast.pro/movie/${id}?autoplay=true`
          : `https://vidfast.pro/tv/${id}/${season}/${currentEp}`;
      case 'mapple':
        return isMovie
          ? `https://mapple.uk/watch/movie/${id}?autoplay=true`
          : `https://mapple.uk/watch/tv/${id}/${season}/${currentEp}?nextButton=true&autoPlay=true`;
      case 'vidora':
        return isMovie
          ? `https://vidora.su/movie/${id}?autoplay=true&colour=00ff9d&backbutton=https://vidora.su/&logo=https://vidora.su/logo.png`
          : `https://vidora.su/tv/${id}/${season}/${currentEp}?autoplay=true&colour=00ff9d&autonextepisode=true&backbutton=https://vidora.su/&logo=https://vidora.su/logo.png`;
      default:
        return `https://vidfast.pro/movie/${id}?autoPlay=true`;
    }
  };

  const Tag = ({ text, color = "bg-white/10" }: { text: string, color?: string }) => (
    <span className={`${color} px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold text-gray-200 tracking-wide uppercase`}>
      {text}
    </span>
  );

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-gray-300 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Anime not found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-[#7c3aed] text-white px-4 py-2 rounded hover:bg-[#6d28d9] transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white relative transition-colors duration-500 ${lightsOff ? 'brightness-50' : ''} animate-fade-in-scale`}>
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 h-16 flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <button
            onClick={(e) => {
              createRipple(e);
              navigate('/');
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:block">Back</span>
          </button>
        </div>
      </nav>

      {/* Main Content - Bento Box Layout */}
      <main className="max-w-[1400px] mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Player & Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Video Player Container */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
            <iframe
              src={getVideoSrc()}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="encrypted-media"
              referrerPolicy="unsafe-url"
              className="w-full h-full"
            ></iframe>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <h4 className="text-xl font-roboto font-bold  text-white mb-3">Server</h4>
            <div className="flex gap-2 flex-wrap">
              {SERVERS.map((server) => (
                <button
                  key={server.id}
                  onClick={(e) => {
                    createRipple(e);
                    setCurrentServer(server.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-l font-semibold transition ${
                    currentServer === server.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {server.name}
                </button>
              ))}
            </div>
          </div>

          {/* Anime Details */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-40 flex-shrink-0">
                <div className="aspect-[2/3] bg-gray-900 rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src={anime.images?.jpg?.image_url || '/placeholder.jpg'}
                    alt={anime.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                  />
                </div>
              </div>
              

              <div className="flex-1 space-y-4">
                <h1 className="text-4xl md:text-5xl font-black italic text-white leading-tight tracking-tight">
                  {anime.title}
                </h1>
                <h2 className="text-sm font-medium text-gray-500 italic">{anime.title_english}</h2>

                <div className="flex flex-wrap gap-3 my-4">
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">HD</span>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">SUB</span>
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">DUB</span>
                  <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">{anime.score?.toString() || 'N/A'}</span>
                  <span className="bg-white/10 text-gray-400 px-3 py-1 rounded-full text-xs border border-white/20">24m</span>
                  <span className="bg-white/10 text-gray-400 px-3 py-1 rounded-full text-xs border border-white/20">{anime.year}</span>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed">
                  {anime.synopsis}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {anime.genres?.map((genre) => (
                    <span key={genre.name} className="text-xs text-gray-300 hover:text-violet-600 cursor-pointer transition border border-white/10 px-3 py-1 rounded-full hover:border-violet-600">{genre.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Episodes */}
<div className="space-y-6">
          <div className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-roboto font-bold  text-white mb">Episodes</h3>
            </div>
            <div className="p-6 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
              {episodes.map((ep) => (
                <button
                  key={ep.number}
                  onClick={(e) => {
                    createRipple(e);
                    setCurrentEp(ep.number);
                  }}
                  className={`
                    py-3 rounded-xl text-sm font-bold transition
                    ${currentEp === ep.number
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}
                  `}
                >
                  {ep.number}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Watch;
