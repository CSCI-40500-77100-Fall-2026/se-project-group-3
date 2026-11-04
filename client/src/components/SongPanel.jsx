import StarRating from "./StarRating.jsx";

export default function SongPanel({ song, active, onSelect }) {
  return (
    <button
      type="button"
      className={`song-panel${active ? " song-panel--active" : ""}`}
      style={{ "--accent": song.coverColor }}
      onClick={() => onSelect(song.id)}
      aria-pressed={active}
    >
      <span
        className="song-panel__art"
        style={{
          backgroundImage: `url(${song.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <span className="song-panel__text">
        <span className="song-panel__title">{song.title}</span>
        <span className="song-panel__artist">{song.artist}</span>
        <StarRating value={song.stars} className="song-panel__stars" />
      </span>
    </button>
  );
}
