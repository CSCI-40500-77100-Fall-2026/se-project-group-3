/**
 * Validation utilities for user input fields.
 * Validates the two core fields on account registration:
 * 1. Username (Custom domain logic: format, length 3-40, allowed characters)
 * 2. Password (Minimum length requirement: at least 8 characters)
 */

/**
 * Validates a username according to custom domain rules:
 * - Must be a non-empty string.
 * - Must be between 3 and 40 characters in length.
 * - Must start with an alphanumeric character (letter or number).
 * - Can only contain letters, numbers, underscores, and hyphens.
 *
 * @param {string} username
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateUsername(username) {
  if (typeof username !== "string" || !username.trim()) {
    return { isValid: false, error: "Username is required." };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long." };
  }

  if (trimmed.length > 40) {
    return { isValid: false, error: "Username cannot exceed 40 characters." };
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

/**
 * Validates a password:
 * - Must be a non-empty string.
 * - Must be at least 8 characters long.
 *
 * @param {string} password
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePassword(password) {
  if (typeof password !== "string" || !password) {
    return { isValid: false, error: "Password is required." };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }

  return { isValid: true };
}
