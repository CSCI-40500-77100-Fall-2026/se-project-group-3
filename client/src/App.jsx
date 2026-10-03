import { useState } from "react";
import SongSelect from "./components/SongSelect.jsx";
import UploadSong from "./components/UploadSong.jsx";
import SignUp from "./components/SignUp.jsx";
import Game from "./components/Game.jsx";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {

  const [activeSong, setActiveSong] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SongSelect />} />
        <Route path="/game" element={<Game song={activeSong} onBack={() => setActiveSong(null)} />} />
        <Route path="/upload" element={<UploadSong />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
