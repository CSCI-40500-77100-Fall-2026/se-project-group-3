import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LogIn() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:3000/users/signin", 
        {
          username: username.trim(),
          password,
        },
        {
          withCredentials: true
        }
      );
      setMessage(response.data.message);
      setUser(response.data.user);
      navigate("/");
    } catch (error) {
      setMessage(
        error.response?.data?.message ?? "Unable to log in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="upload-page">
      <div className="upload-page__frame">
        <header className="upload-page__header">
          <Link to="/" className="upload-page__back">Back to songs</Link>
          <span className="upload-page__brand">CADENZA</span>
        </header>

        <section className="upload-page__content" aria-labelledby="login-title">
          <div className="upload-page__intro">
            <p className="upload-page__eyebrow">WELCOME BACK</p>
            <h1 id="login-title">Log in to Cadenza</h1>
            <p>Pick up where your next song begins.</p>
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="upload-form__label" htmlFor="login-username">
              Username
            </label>
            <input
              id="login-username"
              className="upload-form__input"
              type="text"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label className="upload-form__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="upload-form__input"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="password-checkbox">
              <input
                id="login-show-password"
                className="password-checkbox__input"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <span>Show password</span>
            </label>

            <button className="upload-form__submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging In..." : "Log In"}
            </button>
            {message && <p className="upload-form__message">{message}</p>}
          </form>
        </section>
      </div>
    </main>
  );
}