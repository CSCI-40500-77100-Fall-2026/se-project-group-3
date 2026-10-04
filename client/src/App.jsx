import { useState } from "react";
import SongSelect from "./components/SongSelect.jsx";
import UploadSong from "./components/UploadSong.jsx";
import SignUp from "./components/SignUp.jsx";
import LogIn from "./components/LogIn.jsx";
import Game from "./components/Game.jsx";

import { Routes, Route } from "react-router-dom";
import "./App.css";

function App() {

  const [activeSong, setActiveSong] = useState(null);

  return (
    <Routes>
      <Route path="/" element={<SongSelect />} />
      <Route path="/game" element={<Game song={activeSong} onBack={() => setActiveSong(null)} />} />
      <Route path="/upload" element={<UploadSong />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<LogIn />} />
    </Routes>
  );
}

export default App;
