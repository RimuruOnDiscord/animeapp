import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Watch from './pages/Watch';

// --- Configuration & Mock Data ---
const MOCK_ANIME = {
  mal_id: 1,
  title: "Celestial Void: The Last Horizon",
  title_english: "Seresutiaru Vu~oido",
  synopsis: "In a world where gravity has shattered, humanity survives on floating archipelagos. Kael, a scrapper from the lower atmosphere, discovers a relic from the Old World that might just be the key to restoring the planet's core—or destroying it entirely.",
  genres: [{ name: "Action" }, { name: "Sci-Fi" }, { name: "Mecha" }, { name: "Psychological" }],
  score: 9.2,
  episodes: 24,
  status: "currently_airing",
  year: 2024,
  images: { jpg: { image_url: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg" } }
};

const SERVERS = [
  { id: 'vidstream', name: 'Vidstream', type: 'fast' },
  { id: 'megacloud', name: 'MegaCloud', type: 'hd' },
  { id: 'streamtape', name: 'StreamTape', type: 'slow' },
  { id: 'mp4upload', name: 'Mp4Upload', type: 'backup' }
];

const EPISODES = Array.from({ length: 24 }, (_, i) => ({
  num: i + 1,
  title: `Episode ${i + 1}`,
  filled: i < 12 // simulcasting simulation
}));

const TRENDING = [
  { id: 1, title: "Soul Reaper X", ep: 1045, rating: 9.8, img: "bg-red-900" },
  { id: 2, title: "Academy of Magic", ep: 12, rating: 8.5, img: "bg-blue-900" },
  { id: 3, title: "Cyber Runner 2099", ep: 8, rating: 9.1, img: "bg-purple-900" },
  { id: 4, title: "Slime Diaries", ep: 24, rating: 8.9, img: "bg-green-900" },
  { id: 5, title: "Titan fall", ep: 88, rating: 9.5, img: "bg-orange-900" },
];

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-screen bg-[#050505]"
            >
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/watch/:id"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-screen bg-black"
            >
              <Watch />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
