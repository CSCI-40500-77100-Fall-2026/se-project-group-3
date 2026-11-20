# Defensive Programming

The input validation and failure handling this group added from Engineering
Software Products ch. 8.

## Rules

1. **Username (`username`) &mdash; Custom Domain Logic:**
   - **Type:** Required string.
   - **Length:** Must be between 3 and 40 characters in length (`3 <= length <= 40`).
   - **Starting character:** Must begin with an alphanumeric character (a letter `a-z`, `A-Z` or digit `0-9`).
   - **Allowed characters:** Can only contain letters, numbers, underscores (`_`), and hyphens (`-`). Spaces and special symbols (`@`, `!`, `#`, `$`, etc.) are prohibited.
   - **Clear Error Messages:**
     - Missing or empty: *"Username is required."*
     - Shorter than 3 characters: *"Username must be at least 3 characters long."*
     - Longer than 40 characters: *"Username cannot exceed 40 characters."*
     - Starts with symbol: *"Username must start with a letter or number."*
     - Disallowed characters/spaces: *"Username can only contain letters, numbers, underscores, and hyphens."*

2. **Password (`password`) &mdash; Minimum Length Requirement:**
   - **Type:** Required string.
   - **Length:** Must be at least 8 characters in length (`length >= 8`).
   - **Clear Error Messages:**
     - Missing or empty: *"Password is required."*
     - Shorter than 8 characters: *"Password must be at least 8 characters long."*

---

## Implementation

- **Explicit comparisons:**
  - Checking string lengths: `trimmed.length < 3` and `trimmed.length > 40` for usernames, and `password.length < 8` for passwords.
- **Regular expressions:**
  - Starting character pattern: `/^[a-zA-Z0-9]/` guarantees the username begins with a letter or number.
  - Character set pattern: `/^[a-zA-Z0-9_-]+$/` restricts the username strictly to letters, numbers, underscores, and hyphens.
- **Type checking / coercion:**
  - `typeof username !== "string" || !username.trim()` and `typeof password !== "string"` verify that input types are strings and cannot be bypassed with non-string payloads.

### Code Permalinks

- **Validation logic (Client & Shared):**
  [`client/src/utils/validation.js#L18-L65`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/client/src/utils/validation.js#L18-L65)
  Defines `validateUsername` and `validatePassword` with regexes and explicit comparisons.
- **Client-Side Enforcement:**
  [`client/src/components/SignUp.jsx#L16-L41`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/client/src/components/SignUp.jsx#L16-L41)
  Executes `validateAll()` on submit and updates field-level error state on input changes. Prevents form submission and renders inline error messages with `aria-invalid` if inputs are invalid.
- **Validation logic (Server):**
  [`server/utils/validation.js#L8-L47`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/server/utils/validation.js#L8-L47)
  CommonJS validation module enforcing the exact same checks on the backend.
- **Server-Side Enforcement:**
  [`server/controllers/usersController.js#L26-L39`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/server/controllers/usersController.js#L26-L39)
  Validates `req.body.username` and `req.body.password` before database queries, returning `400 Bad Request` with the clear error message if validation fails.

---

## Tests

Automated unit tests run per rule, covering both valid (accepted) inputs and invalid (rejected) edge cases.

### Permalinks to Tests

- **Client Unit Tests (Vitest):**
  [`client/src/validation.test.js#L5-L109`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/client/src/validation.test.js#L5-L109)
  - **Username Valid (accepted):** Standard username (`"pianist_99"`), hyphens (`"mozart-123"`), 3-char minimum (`"abc"`), 40-char maximum (`"a".repeat(40)`).
  - **Username Invalid (rejected):** Empty string (`""`), whitespace (`"   "`), null/undefined, too short (`"ab"`), too long (21 chars), starts with symbol (`"_pianist"`, `"-pianist"`), spaces (`"john doe"`), special characters (`"user@cadenza"`).
  - **Password Valid (accepted):** Standard password (`"cadenza2026"`), 8-character boundary (`"12345678"`).
  - **Password Invalid (rejected):** Empty string (`""`), null/undefined, too short (`"pass1"`).
- **Server Unit Tests (Node Test Runner):**
  [`server/tests/validation.test.js#L5-L27`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/server/tests/validation.test.js#L5-L27)
  Asserts valid and rejected cases on the server.
- **Failure Management Unit Tests:**
  [`client/src/failureManagement.test.jsx#L15-L49`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/client/src/failureManagement.test.jsx#L15-L49)
  Verifies that microservice network failure or 503 response renders `<p className="song-leaderboard__note">Leaderboard unavailable right now.</p>` without crashing.

### Passing CI Run

The tests run automatically in CI on every push and pull request via GitHub Actions:
- **CI Workflow Configuration:**
  [`.github/workflows/ci.yml#L26-L35`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/.github/workflows/ci.yml#L26-L35)
- **GitHub Actions Runs:**
  <https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/actions/runs/44648609266/job/135997498053>

---

## Failure Handling

### Chosen External Call: Leaderboard Microservice
The Cadenza server makes external REST calls to the separately deployed **Leaderboard Microservice** (hosted at `https://leaderboard-pi-five.vercel.app`) to record finished scores (`POST /scores`) and fetch song rankings (`GET /songs/:songId/leaderboard`).

### What Can Go Wrong
1. **Network drop or service outage:** The microservice or its MongoDB database is unreachable or down.
2. **Slow / hanging response:** Network congestion or heavy load causes requests to hang indefinitely.
3. **HTTP 5xx Server Error:** The microservice crashes or encounters an internal failure.
4. **HTTP 4xx Rejection:** The microservice rejects a malformed score or unauthorized request.

### Handling Logic
- **Timeout Management:** Every outgoing request is cut off after 2 seconds using `AbortSignal.timeout(TIMEOUT_MS)`, preventing connections from hanging:
  [`server/services/leaderboardClient.js#L45`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/server/services/leaderboardClient.js#L45)
- **Retry with Exponential Backoff:** Transient network errors, timeouts, and 5xx responses are retried up to 3 times with backoff pauses (`[250ms, 750ms]`). 4xx client errors are never retried:
  [`server/services/leaderboardClient.js#L36-L68`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/server/services/leaderboardClient.js#L36-L68)
- **Outbox Pattern Fallback:** If the leaderboard is unavailable after 3 attempts, `scoresController.js` catches `LeaderboardUnavailableError`. Instead of dropping the score or crashing, it saves the score to a local MongoDB `PendingScore` collection and returns `202 Accepted`:
  [`server/controllers/scoresController.js#L120-L127`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/server/controllers/scoresController.js#L120-L127)
- **Surfacing Clear User Messages:**
  - During game submission: When the microservice is down, the client displays: *"The leaderboard is offline. Your score will be added when it's back."*
    [`client/src/components/Game.jsx#L687-L688`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/client/src/components/Game.jsx#L687-L688)
  - On the leaderboard view: When top scores cannot be fetched, `SongLeaderboard.jsx` catches the failure and renders *"Leaderboard unavailable right now."* rather than crashing:
    [`client/src/components/SongLeaderboard.jsx#L20-L22`](https://github.com/CSCI-40500-77100-Fall-2026/se-project-group-3/blob/d58545a8c77397dc912e7e58f8b4058d6234acc6/client/src/components/SongLeaderboard.jsx#L20-L22)

---

## How to Try It

Follow these steps to trigger input rejection in the running application:

1. **Open the Sign Up page:**
   - Run the client locally (`cd client && npm run dev`) and visit `http://localhost:5173/signup`, or navigate from the Song Select screen and click the **Sign Up** button in the bottom bar.
2. **Trigger Username Rejections:**
   - **Test 2.1 (Too Short):** In the Username input, enter `ab` and click **Sign Up**.
     - **Observed message:** *"Username must be at least 3 characters long."*
   - **Test 2.2 (Illegal Characters):** Enter `user@cadenza` or `john doe`.
     - **Observed message:** *"Username can only contain letters, numbers, underscores, and hyphens."*
   - **Test 2.3 (Leading Symbol):** Enter `_pianist` or `-pianist`.
     - **Observed message:** *"Username must start with a letter or number."*
   - **Test 2.4 (Too Long):** Enter `a` 41 times (`"a".repeat(41)`).
     - **Observed message:** *"Username cannot exceed 40 characters."*
3. **Trigger Password Rejection:**
   - Enter a valid username (e.g., `pianist_99`).
   - In the Password input, enter `pass1` (fewer than 8 characters) and click **Sign Up**.
     - **Observed message:** *"Password must be at least 8 characters long."*
4. **Trigger Acceptance:**
   - Enter `pianist_99` for Username and `cadenza2026` for Password.
   - Click **Sign Up**. All validation checks pass and the account registration request proceeds.
