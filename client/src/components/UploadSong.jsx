import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../api.js";

export default function UploadSong() {
  const [file, setFile] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();

    formData.append("audio", file);

    const response = await axios.post(`${API_URL}/songs/upload`, formData);

    const data = response.data;

    console.log(data);
  };

  return (
    <main className="upload-page">
      <div className="upload-page__frame">
        <header className="upload-page__header">
          <Link to="/" className="upload-page__back">Back to songs</Link>
          <span className="upload-page__brand">CADENZA</span>
        </header>

        <section className="upload-page__content" aria-labelledby="upload-title">
          <div className="upload-page__intro">
            <p className="upload-page__eyebrow">YOUR MUSIC LIBRARY</p>
            <h1 id="upload-title">Upload a song</h1>
            <p>Choose an audio file to add to your collection.</p>
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="upload-form__label" htmlFor="song-file">Audio file</label>
            <input
              id="song-file"
              className="upload-form__input"
              type="file"
              accept=".mp3,.mp4"
              onChange={(event) => setFile(event.target.files[0] ?? null)}
            />
            <p className="upload-form__hint">MP3 or MP4 files</p>
            <button className="upload-form__submit" type="submit" disabled={!file}>
              Upload song
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}