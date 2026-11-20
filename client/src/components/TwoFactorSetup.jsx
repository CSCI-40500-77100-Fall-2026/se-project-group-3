import { useState } from "react";
import axios from "axios";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api.js";

// settings page for turning on 2FA. the user must already be logged in
// (both endpoints sit behind the normal authenticate middleware)
//
// flow:  "start"  --click Enable-->  POST /users/totp/setup  -->  "scan"
//        "scan"   --enter code-->    POST /users/totp/verify-setup  -->  2FA on
export default function TwoFactorSetup() {
  const { user, setUser, loading } = useAuth();

  const [stage, setStage] = useState("start");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // AuthContext is still asking the server "who is logged in?" (/users/me)
  if (loading) {
    return null;
  }

  // not logged in: this page makes no sense, send them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // step 1: ask the server to create a secret and give us the QR code
  async function handleStart() {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/users/totp/setup`,
        {},
        { withCredentials: true }
      );
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStage("scan");
    } catch (error) {
      setMessage(
        error.response?.data?.message ?? "Unable to start setup. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // step 2: prove the authenticator app is set up by sending one code
  async function handleVerify(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/users/totp/verify-setup`,
        { code: code.trim() },
        { withCredentials: true }
      );

      // 2FA is now on in the database. update the app-wide user too, so this page
      // (and anything else reading user.totpEnabled) shows it without a refresh
      setUser({ ...user, totpEnabled: true });

      // the secret was only meant to be shown once; drop it from memory
      setQrCode("");
      setSecret("");
      setCode("");
    } catch (error) {
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

        <section className="upload-page__content" aria-labelledby="security-title">
          <div className="upload-page__intro">
            <p className="upload-page__eyebrow">ACCOUNT SECURITY</p>
            <h1 id="security-title">Two-factor authentication</h1>
            <p>Require a code from your authenticator app when you log in.</p>
          </div>

          {user.totpEnabled ? (
            // already on (either from before, or just now)
            <p className="upload-form__message">
              Two-factor authentication is on. You&apos;ll be asked for a code each time you log in.
            </p>
          ) : stage === "start" ? (
            // off: offer to turn it on
            <div className="upload-form">
              <button
                className="upload-form__submit"
                type="button"
                onClick={handleStart}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Starting..." : "Enable two-factor authentication"}
              </button>
              {message && <p className="upload-form__message">{message}</p>}
            </div>
          ) : (
            // setup in progress: show QR + secret, ask for the first code
            <form className="upload-form" onSubmit={handleVerify}>
              <p className="upload-form__hint">
                1. Scan this QR code with Google Authenticator, Authy, or a similar app.
              </p>
              <img src={qrCode} alt="QR code for your authenticator app" width={200} height={200} />

              <p className="upload-form__hint">
                Can&apos;t scan it? Enter this key manually: <code>{secret}</code>
              </p>

              <label className="upload-form__label" htmlFor="setup-code">
                2. Enter the 6-digit code the app shows
              </label>
              <input
                id="setup-code"
                className="upload-form__input"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />

              <button className="upload-form__submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Turn on"}
              </button>
              {message && <p className="upload-form__message">{message}</p>}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
