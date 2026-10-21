import SongSelect from "./components/SongSelect.jsx";
import UploadSong from "./components/UploadSong.jsx";
import SignUp from "./components/SignUp.jsx";
import LogIn from "./components/LogIn.jsx";
import Game from "./components/Game.jsx";

import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

function GameRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  return <Game song={location.state?.song} onBack={() => navigate("/")} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SongSelect />} />
      <Route path="/game" element={<GameRoute />} />
      <Route path="/upload" element={<UploadSong />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<LogIn />} />
    </Routes>
  );
}

export default App;
