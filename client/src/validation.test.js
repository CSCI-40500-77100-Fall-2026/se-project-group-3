import { describe, it, expect } from "vitest";
import { validateUsername, validatePassword } from "./utils/validation.js";

describe("Input Validation Rules (2 Fields)", () => {
  describe("Field 1: Username Validation (Custom Domain Logic)", () => {
    // Valid / accepted inputs
    it("accepts a standard alphanumeric username with underscores", () => {
      const result = validateUsername("pianist_99");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts a username with hyphens", () => {
      const result = validateUsername("mozart-123");
      expect(result.isValid).toBe(true);
    });

    it("accepts minimum length of 3 characters", () => {
      const result = validateUsername("abc");
      expect(result.isValid).toBe(true);
    });

    it("accepts maximum length of 40 characters", () => {
      const result = validateUsername("a".repeat(40));
      expect(result.isValid).toBe(true);
    });

    // Invalid / rejected inputs
    it("rejects empty or whitespace-only username", () => {
      expect(validateUsername("").isValid).toBe(false);
      expect(validateUsername("").error).toBe("Username is required.");

      expect(validateUsername("   ").isValid).toBe(false);
      expect(validateUsername("   ").error).toBe("Username is required.");
    });

    it("rejects null or non-string username", () => {
      expect(validateUsername(null).isValid).toBe(false);
      expect(validateUsername(undefined).isValid).toBe(false);
    });

    it("rejects username shorter than 3 characters", () => {
      const result = validateUsername("ab");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Username must be at least 3 characters long.");
    });

    it("rejects username longer than 40 characters", () => {
      const result = validateUsername("a".repeat(41));
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Username cannot exceed 40 characters.");
    });

    it("rejects username starting with a symbol (underscore or hyphen)", () => {
      const underscoreResult = validateUsername("_pianist");
      expect(underscoreResult.isValid).toBe(false);
      expect(underscoreResult.error).toBe("Username must start with a letter or number.");

      const hyphenResult = validateUsername("-pianist");
      expect(hyphenResult.isValid).toBe(false);
      expect(hyphenResult.error).toBe("Username must start with a letter or number.");
    });

    it("rejects username containing disallowed characters or spaces", () => {
      const spaceResult = validateUsername("john doe");
      expect(spaceResult.isValid).toBe(false);
      expect(spaceResult.error).toBe(
        "Username can only contain letters, numbers, underscores, and hyphens."
      );

      const symbolResult = validateUsername("user@cadenza");
      expect(symbolResult.isValid).toBe(false);
      expect(symbolResult.error).toBe(
        "Username can only contain letters, numbers, underscores, and hyphens."
      );
    });
  });

  describe("Field 2: Password Validation (Minimum Length Rule)", () => {
    // Valid / accepted inputs
    it("accepts a password meeting minimum 8 characters", () => {
      const result = validatePassword("cadenza2026");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts an 8-character password", () => {
      const result = validatePassword("12345678");
      expect(result.isValid).toBe(true);
    });

    // Invalid / rejected inputs
    it("rejects empty password", () => {
      const result = validatePassword("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Password is required.");
    });

    it("rejects null or non-string password", () => {
      expect(validatePassword(null).isValid).toBe(false);
      expect(validatePassword(undefined).isValid).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = validatePassword("pass1");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters long.");
    });
  });
});
