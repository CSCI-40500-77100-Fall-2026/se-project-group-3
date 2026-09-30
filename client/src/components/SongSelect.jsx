import { useMemo, useState } from "react";
import { songs } from "../data/songs.js";
import InfoPanel from "./InfoPanel.jsx";
import SongPanel from "./SongPanel.jsx";

const SORTS = ["Title", "Artist", "Difficulty"];

function sortSongs(list, sortBy) {
  const sorted = [...list];
  if (sortBy === "Artist") {
    sorted.sort((a, b) => a.artist.localeCompare(b.artist));
  } else if (sortBy === "Difficulty") {
    sorted.sort((a, b) => a.stars - b.stars);
  } else {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  return sorted;
}

export default function SongSelect({ onPlaySong }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("Title");
  const [selectedId, setSelectedId] = useState(songs[0].id);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = songs.filter(
      (song) =>
        !q || song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q)
    );
    return sortSongs(matched, sortBy);
  }, [query, sortBy]);

  const selectedSong = songs.find((song) => song.id === selectedId) ?? filteredSongs[0];

  function handlePlay() {
    if (onPlaySong) {
      onPlaySong(selectedSong);
    } else if (selectedSong?.id === "mary-had-a-little-lamb") {
      window.location.href = "/game/homepage.html";
    }
  }

  return (
    <div
      className="song-select"
      style={{
        "--accent": selectedSong?.coverColor ?? "#f97362",
      }}
    >
      <div
        className="song-select__cover"
        style={{
          "--background-image": selectedSong ? `url(${selectedSong.coverImage})` : "none",
        }}
      />
      <div className="song-select__backdrop" />

      {selectedSong && <InfoPanel song={selectedSong} />}

      <main className="song-select__panel">
        <div className="song-select__toolbar">
          <input
            type="search"
            className="song-search"
            placeholder="Type to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="sort-tabs">
            <span className="sort-tabs__label">Sort</span>
            {SORTS.map((label) => (
              <button
                key={label}
                type="button"
                className={`sort-tab${sortBy === label ? " sort-tab--active" : ""}`}
                onClick={() => setSortBy(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="song-list">
          {filteredSongs.map((song) => (
            <SongPanel
              key={song.id}
              song={song}
              active={song.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
          {filteredSongs.length === 0 && (
            <p className="song-list__empty">No songs match your search.</p>
          )}
        </div>
      </main>

      <footer className="song-select__bottombar">
        <button type="button" className="back-button">
          ← Back
        </button>
        <button type="button" className="play-button" aria-label="Play song" onClick={handlePlay}>
          ▶
        </button>
      </footer>
    </div>
  );
}
