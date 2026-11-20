import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api.js";

export default function LogIn() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // "password" = normal form, "code" = 2FA step (password already accepted)
  const [step, setStep] = useState("password");
  const [code, setCode] = useState("");

  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/users/signin`,
        {
          username: username.trim(),
          password,
        },
        {
          withCredentials: true
        }
      );

      // 2FA is on: the password was correct, but we're not logged in yet.
      // the server set a short-lived pending2fa cookie; switch to the code step
      if (response.data.totpRequired) {
        setStep("code");
        return;
      }

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

  // step 2 of 2FA: send the 6-digit code from the authenticator app.
  // the pending2fa cookie (set by /users/signin) tells the server who we are,
  // so we only send the code, not the username/password again
  async function handleCodeSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/users/totp/verify-signin`,
        { code: code.trim() },
        { withCredentials: true }
      );

      // same success path as a normal login: the server has now set the real token cookie
      setUser(response.data.user);
      navigate("/");
    } catch (error) {
      // wrong code, or the 5-minute pending session expired
      setMessage(
        error.response?.data?.message ?? "Unable to verify code. Please try again."
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
            <h1 id="login-title">
              {step === "password" ? "Log in to Cadenza" : "Two-factor authentication"}
            </h1>
            <p>
              {step === "password"
                ? "Pick up where your next song begins."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
          </div>

          {step === "password" ? (
            // step 1: the original username/password form (unchanged)
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
          ) : (
            // step 2: the 2FA code form, shown after the password was accepted
            <form className="upload-form" onSubmit={handleCodeSubmit}>
              <label className="upload-form__label" htmlFor="login-code">
                Authentication code
              </label>
              <input
                id="login-code"
                className="upload-form__input"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />

              <button className="upload-form__submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify"}
              </button>

              {/* lets the user start over, e.g. if the 5-minute pending session expired */}
              <button
                className="upload-form__submit"
                type="button"
                onClick={() => {
                  setStep("password");
                  setCode("");
                  setMessage("");
                }}
              >
                Back
              </button>
              {message && <p className="upload-form__message">{message}</p>}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}