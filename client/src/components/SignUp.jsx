import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../api.js";
import { validateUsername, validatePassword } from "../utils/validation.js";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "success" | "error"

  function validateAll() {
    const errors = {};

    const userCheck = validateUsername(username);
    if (!userCheck.isValid) {
      errors.username = userCheck.error;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      errors.password = passCheck.error;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!validateAll()) {
      setMessageType("error");
      setMessage("Please fix the errors below before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_URL}/users/signup`,
        {
          username: username.trim(),
          password,
        },
        {
          timeout: 10000,
        }
      );

      setMessageType("success");
      setMessage(response.data?.message ?? "Account created successfully.");
      setUsername("");
      setPassword("");
      setFieldErrors({});
    } catch (error) {
      setMessageType("error");
      if (error.code === "ECONNABORTED" || !error.response) {
        setMessage("Unable to reach the server. Please check your connection and try again.");
      } else {
        setMessage(
          error.response.data?.message ?? "Unable to create your account. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="upload-page">
      <div className="upload-page__frame">
        <header className="upload-page__header">
          <Link to="/" className="upload-page__back">
            Back to songs
          </Link>
          <span className="upload-page__brand">CADENZA</span>
        </header>

        <section className="upload-page__content" aria-labelledby="signup-title">
          <div className="upload-page__intro">
            <p className="upload-page__eyebrow">JOIN CADENZA</p>
            <h1 id="signup-title">Create your account</h1>
            <p>Make a home for the songs you love to play.</p>
          </div>

          <form className="upload-form" onSubmit={handleSubmit} noValidate>
            <label className="upload-form__label" htmlFor="signup-username">
              Username
            </label>
            <input
              id="signup-username"
              className="upload-form__input"
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              aria-invalid={!!fieldErrors.username}
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
              onChange={(event) => {
                setUsername(event.target.value);
                if (fieldErrors.username) {
                  const check = validateUsername(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, username: check.error }));
                }
              }}
              required
            />
            {fieldErrors.username && (
              <p id="username-error" className="upload-form__error" role="alert">
                {fieldErrors.username}
              </p>
            )}

            <label className="upload-form__label" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              className="upload-form__input"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  const check = validatePassword(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: check.error }));
                }
              }}
              required
            />
            {fieldErrors.password && (
              <p id="password-error" className="upload-form__error" role="alert">
                {fieldErrors.password}
              </p>
            )}

            <label className="password-checkbox">
              <input
                id="signup-show-password"
                className="password-checkbox__input"
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
              />
              <span>Show password</span>
            </label>

            <button className="upload-form__submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>

            {message && (
              <p
                className={
                  messageType === "error"
                    ? "upload-form__error"
                    : messageType === "success"
                      ? "upload-form__success"
                      : "upload-form__hint"
                }
                role="status"
              >
                {message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
