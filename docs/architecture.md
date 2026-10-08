# Architecture

Models here are **diagrams-as-code**, kept in this repository and reviewed like
code, rather than as standalone UML documents. Mermaid renders directly on
GitHub, so a diagram in this file stays readable without any tooling. Flowchart
syntax, including `subgraph` for layers, is documented at
<https://mermaid.js.org/syntax/flowchart.html>.

## Layers

<How your system decomposes into layers, and what each layer is responsible
for. See Engineering Software Products Figures 4.10 and 4.11. Use one
`subgraph` per layer, named for the concern it owns. Replace the example
below.>

```mermaid
graph TD
    subgraph Presentation["Presentation Layer - React / Vite Client"]
        UI["UI Components - Game HUD, SongSelect, Auth Views"]
        AudioEngine["Audio Engine - Web Audio API and Pitchy"]
        GameEngine["Game Logic - Pitch Matching, Streaks, Multipliers"]
        AuthClient["Auth Context and API Client - Axios"]
    end

    subgraph Application["Application Layer - Node.js / Express Server"]
        Middleware["API Middleware - CORS, Cookie Parser, JWT Auth, Multer"]
        UserController["Users Controller - Auth, Signup, Login, Bcrypt"]
        SongController["Songs Controller - Catalog and Audio Uploads"]
    end

    subgraph Data["Data Layer - MongoDB and Storage"]
        Mongoose["Mongoose ODM"]
        MongoDB[("MongoDB Database - Users, Songs, Scores")]
        FileStorage[("File Storage - server/uploads")]
    end

    AudioEngine -->|Detected Pitch Hz| GameEngine
    GameEngine -->|Score and Real Time Feedback| UI
    UI -->|User Interactions and Session| AuthClient

    AuthClient -->|HTTP Requests and JWT Cookie| Middleware
    UI -->|Audio Uploads - multipart form data| Middleware

    Middleware -->|Users Routes| UserController
    Middleware -->|Songs Routes| SongController

    UserController -->|User Schema Operations| Mongoose
    SongController -->|Song Metadata| Mongoose
    SongController -->|Save Audio Files| FileStorage
    Mongoose -->|Read and Write| MongoDB
```

## Qualities

<The non-functional qualities you decided matter most, per Table 4.2 and
Figure 4.4, and what you traded away to get them.>

1. **Responsiveness (Low Latency)**
   - **Choice:** Real-time pitch detection runs entirely in the browser via the Web Audio API and `pitchy`.
   - **Trade-off:** Increases client-side CPU usage, but eliminates network latency and server bandwidth costs for real-time audio analysis.

2. **Usability (Zero-Install)**
   - **Choice:** Web-based SPA accessible instantly in modern browsers.
   - **Trade-off:** Constrained by browser audio permissions and sandboxing, but avoids requiring users to install native desktop software.

3. **Security (Safe Sessions)**
   - **Choice:** Passwords hashed with `bcrypt`; session JWTs stored in `httpOnly` cookies.
   - **Trade-off:** Requires explicit CORS credentials configuration, but protects authentication tokens from client-side XSS theft.

## Decisions

<Record the decisions worth remembering, and what you rejected. A design you
considered and dropped is often more informative than the one you kept, and
these notes are what a design defense draws on. Technology choices, per
Table 4.8, belong here too.>

| Decision | Alternatives considered | Why this one |
| --- | --- | --- |
| <decision> | <what else> | <reasoning> |


| **Database: MongoDB + Mongoose** | PostgreSQL / MySQL | Flexible document schema naturally fits nested song note arrays and user profiles during agile development. |

| **Platform:** Web App (React + Vite SPA) | Native iOS/Android, React Native | Zero-install accessibility in any desktop browser placed beside a piano keyboard, using standard Web Audio APIs. |

| **Server:** Public Cloud PaaS (e.g. Render / AWS + Atlas) | In-house physical servers, Serverless (AWS Lambda) | Zero hardware maintenance; containerized Node instance easily handles audio file uploads and persistent routing. |

| **Open-Source:** MIT/Apache 2.0 (`pitchy`, `bcrypt`, `multer`) | Commercial audio SDKs, GPL libraries (Aubio) | Open-source licenses avoid licensing fees and copyleft constraints while providing fast, lightweight pitch detection. |

| **Dev Tools:** Vite + Express | Next.js (SSR), Rails | Decoupled client/server architecture avoids SSR conflicts with browser-only Web Audio APIs and allows independent scaling. |