/**
 * Server-side validation utilities for defensive programming.
 * Validates:
 * 1. Username (Custom domain logic: format, length 3-40, allowed characters)
 * 2. Password (Minimum length requirement: at least 8 characters)
 */

function validateUsername(username) {
  if (typeof username !== "string" || !username.trim()) {
    return { isValid: false, error: "Username is required." };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long." };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "Username cannot exceed 20 characters." };
  }

  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, error: "Username must start with a letter or number." };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens.",
    };
  }

  return { isValid: true };
}

function validatePassword(password) {
  if (typeof password !== "string" || !password) {
    return { isValid: false, error: "Password is required." };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }

  return { isValid: true };
}

module.exports = {
  validateUsername,
  validatePassword,
};
