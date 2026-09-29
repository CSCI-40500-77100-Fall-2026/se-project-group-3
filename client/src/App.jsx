import SongSelect from "./components/SongSelect.jsx";
import PlaySong from "./components/PlaySong.jsx";
import UploadSong from "./components/UploadSong.jsx";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SongSelect />} />
        <Route path="/play" element={<PlaySong />} />
        <Route path="/upload" element={<UploadSong />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
