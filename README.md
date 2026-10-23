# Product Name: Cadenza
**Group:** Group 3

**Members:** Fahid Ahmed (fahid82), Chris Barwicki (cbarwicki), Johnny Huang (Xcausmics), Bimukti Mozzumdar (b-mozz), Sahla Taher (sahlataher)

## Product Vision

For people practicing piano, who want to master all their favorite songs, Cadenza is a gamified piano-practice app that turns any song’s sheet music into a chord-by-chord challenge, rewarding clean streaks with combo multipliers and points, so that nailing a song flawlessly feels like a real victory. Unlike the limitations of other music learning tools, such as Yousician’s licensed-library gameplay, Cadenza lets you upload sheet music for any song, auto-generates a chord-by-chord game from it, and scores you with combos, streaks, leaderboards, and point penalties for mistakes, so you can ace any of song of your choice and have fun while learning.

## Running It

This prototype uses a React framework to run a
 HTML/JavaScript piano learning mini-game.

1. Open URL `https://se-project-group-3.vercel.app/` in the
  browser

2. Song selection screen: Navigate the song list, click a
  song to preview it, then hit the play button (Currently we only have
  Mary had a little Lamb implemented).

3. Game screen: click "Start Listening" and allow microphone
  access when prompted. Play each highlighted note on a
  piano (I used a paino emulator during testing) near your mic; 
  the app listens the notes, and matches the pitch it 
  hears against the target note, increasing your score, streak, and multiplier

### Docker

The image runs both the React client (port **5173**) and the Express API
(port **3000**). Map both ports to the same numbers on your machine, because
the client calls the API at `http://localhost:3000`.

It needs two environment variables:

- `MONGO_URI`: a MongoDB connection string (for example, a free MongoDB Atlas
  cluster). For a MongoDB running on your own machine, use
  `mongodb://host.docker.internal:27017/cadenza`.
- `JWT_SECRET`: any secret string, used to sign login tokens.

```
docker pull bmozz/cadenza:latest
docker run --rm -p 5173:5173 -p 3000:3000 \
  -e MONGO_URI="<your MongoDB connection string>" \
  -e JWT_SECRET="<any secret string>" \
  bmozz/cadenza:latest
```

Then open `http://localhost:5173` and allow microphone access when prompted.
Press `Ctrl+C` to stop the container.

To build the image yourself from the repository root:

```
docker build -t bmozz/cadenza .
```

## Testing

<How to run the tests, and what they cover.>

```
<commands>
```

## Architecture

See [docs/architecture.md](docs/architecture.md) and, for the microservice,
[docs/microservice.md](docs/microservice.md).

## Working Agreement

This repository is the single home for the group's work, and its **commit
history is part of what is assessed**. That means:

- Commit your own work under your own account. Do not hand a teammate your
  changes to commit for you.
- Write commit messages that say *why*, not just *what*.
- You are expected to be able to explain and defend any code here, including
  why it is written the way it is. Tools that help you write it are fine;
  code you cannot account for is not.
