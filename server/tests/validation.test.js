const test = require("node:test");
const assert = require("node:assert/strict");
const { validateUsername, validatePassword } = require("../utils/validation");

test("Server Validation - Field 1: Username format (custom domain logic)", () => {
  // Valid inputs
  assert.equal(validateUsername("pianist_99").isValid, true);
  assert.equal(validateUsername("mozart-123").isValid, true);
  assert.equal(validateUsername("abc").isValid, true);
  assert.equal(validateUsername("a".repeat(40)).isValid, true);

  // Invalid inputs
  assert.equal(validateUsername("").isValid, false);
  assert.equal(validateUsername("ab").isValid, false);
  assert.equal(validateUsername("ab").error, "Username must be at least 3 characters long.");
  assert.equal(validateUsername("a".repeat(41)).isValid, false);
  assert.equal(validateUsername("a".repeat(41)).error, "Username cannot exceed 40 characters.");
  assert.equal(validateUsername("_badstart").isValid, false);
  assert.equal(validateUsername("has space").isValid, false);
});

test("Server Validation - Field 2: Password (minimum length rule)", () => {
  // Valid inputs
  assert.equal(validatePassword("cadenza2026").isValid, true);
  assert.equal(validatePassword("12345678").isValid, true);

  // Invalid inputs
  assert.equal(validatePassword("").isValid, false);
  assert.equal(validatePassword("pass1").isValid, false);
  assert.equal(validatePassword("pass1").error, "Password must be at least 8 characters long.");
});
