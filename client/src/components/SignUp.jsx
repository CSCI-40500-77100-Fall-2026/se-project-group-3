import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../api.js";

export default function SignUp() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage("");

        try {
            await axios.post(`${API_URL}/users/signup`, {
                username: username.trim(),
                password,
            });
            setMessage("Account created successfully.");
            setUsername("");
            setPassword("");
        } catch (error) {
            setMessage(
                error.response?.data?.message ?? "Unable to create your account. Please try again."
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

                <section className="upload-page__content" aria-labelledby="signup-title">
                    <div className="upload-page__intro">
                        <p className="upload-page__eyebrow">JOIN CADENZA</p>
                        <h1 id="signup-title">Create your account</h1>
                        <p>Make a home for the songs you love to play.</p>
                    </div>

                    <form className="upload-form" onSubmit={handleSubmit}>
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
                            onChange={(event) => setUsername(event.target.value)}
                            required
                        />

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
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
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
                        {message && <p className="upload-form__hint" role="status">{message}</p>}
                    </form>
                </section>
            </div>
        </main>
    );
}