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
  const [currentServer, setCurrentServer] = useState('vidstream');
  const [lightsOff, setLightsOff] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [isMovie, setIsMovie] = useState(true);
  const [totalEpisodes, setTotalEpisodes] = useState<number>(0);

  const SERVERS = [
    { id: 'vidstream', name: 'Vidstream', type: 'fast' },
    { id: 'megacloud', name: 'MegaCloud', type: 'hd' },
    { id: 'streamtape', name: 'StreamTape', type: 'slow' },
    { id: 'mp4upload', name: 'Mp4Upload', type: 'backup' }
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

      // Clean title for better search results
      let cleanTitle = title
        .replace(/(?:season|season\s+\d+|\d+\w*\s*season)/i, '')
        .replace(/[^\w\s]/g, '')
        .trim();

      console.log('Searching for:', cleanTitle, 'Season:', seasonNumber);

      // First search for anime specifically
      const animeResponse = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=630c8f01625f3d0eb72180513daa9fca&query=${encodeURIComponent(cleanTitle)}&include_adult=false`);
      const animeData = await animeResponse.json();

      if (animeData.results && animeData.results.length > 0) {
        // Find the best match, prioritizing anime characteristics
        let bestMatch = animeData.results.find((result: any) =>
          result.name.toLowerCase().includes('anime') ||
          result.overview.toLowerCase().includes('anime') ||
          result.origin_country?.includes('JP') ||
          result.original_language === 'ja'
        ) || animeData.results[0];

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

      // If no anime found, search movies as fallback
      const movieResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=630c8f01625f3d0eb72180513daa9fca&query=${encodeURIComponent(cleanTitle)}&include_adult=false`);
      const movieData = await movieResponse.json();

      if (movieData.results && movieData.results.length > 0) {
        const movieResult = movieData.results.find((result: any) =>
          movieResult.title.toLowerCase().includes('anime') ||
          movieResult.overview.toLowerCase().includes('anime') ||
          movieResult.original_language === 'ja'
        ) || movieData.results[0];

        setTmdbId(movieResult.id);
        setIsMovie(true);
      }
    } catch (error) {
      console.error('Error fetching TMDB ID:', error);
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
            onClick={() => navigate('/')}
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
              src={tmdbId ? (isMovie ? `https://vidfast.pro/movie/${tmdbId}` : `https://vidfast.pro/tv/${tmdbId}/1/${currentEp}`) : `https://vidfast.pro/movie/${anime.mal_id}`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="encrypted-media"
              className="w-full h-full"
            ></iframe>
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
              <h3 className="font-black italic text-white text-xl uppercase tracking-wide">Episodes</h3>
            </div>
            <div className="p-6 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
              {episodes.map((ep) => (
                <button
                  key={ep.number}
                  onClick={() => setCurrentEp(ep.number)}
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
