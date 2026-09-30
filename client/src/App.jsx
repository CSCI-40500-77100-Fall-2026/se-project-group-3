import { useState } from "react";
import SongSelect from "./components/SongSelect.jsx";
import Game from "./components/Game.jsx";
import "./App.css";

function App() {
  const [activeSong, setActiveSong] = useState(null);

  if (activeSong) {
    return <Game song={activeSong} onBack={() => setActiveSong(null)} />;
  }

  return <SongSelect onPlaySong={(song) => setActiveSong(song)} />;
}

export default App;
