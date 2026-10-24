import SongLeaderboard from "./SongLeaderboard.jsx";

function formatDuration(totalSec) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function InfoPanel({ song }) {
  return (
    <div
      className="info-panel"
      style={{
        "--accent": song.coverColor,
        "--cover-image": `url(${song.coverImage})`,
      }}
      key={song.id}
    >
      <h1 className="info-panel__title">{song.title}</h1>
      <p className="info-panel__subtitle">{song.artist}</p>
      <p className="info-panel__mapper">Arranged by {song.arranger}</p>

      <div className="info-panel__facts">
        <span>Length: {formatDuration(song.length)}</span>
      </div>

      <span className="star-rating star-rating--large">★ {song.stars.toFixed(2)}</span>

      <SongLeaderboard songId={song.id} />
    </div>
  );
}
