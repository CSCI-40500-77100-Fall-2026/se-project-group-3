import { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { PitchDetector } from "pitchy";
import axios from "axios";
import { API_URL } from "../api.js";
import { useAuth } from "../context/AuthContext";
import Leaderboard from "./Leaderboard.jsx";
import "./Game.css";

const ENHARMONIC_ALIASES = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#" };

function normalizeNote(note) {
  const match = /^([A-G]b?#?)(-?\d+)$/.exec(note);
  if (!match) return note;
  const [, pitch, octave] = match;
  return `${ENHARMONIC_ALIASES[pitch] ?? pitch}${octave}`;
}

const DEFAULT_NOTES = [
  "E4", "D4", "C4", "D4", "E4", "E4", "E4",
  "D4", "D4", "D4",
  "E4", "G4", "G4",
  "E4", "D4", "C4", "D4", "E4", "E4", "E4", "E4",
  "D4", "D4", "E4", "D4", "C4"
];

const MIN_CLARITY = 0.85;
const MATCH_TOLERANCE_CENTS = 60;
const BASE_POINTS_PER_BEAT = 100;

// Generous windows: mic pitch detection adds its own latency on top of the player's.
const PERFECT_WINDOW_MS = 180;
const GREAT_WINDOW_MS = 350;
const GOOD_WINDOW_MS = 600; // past this, an unmatched note is a miss

const BASE_APPROACH_MS = 1800; // fall time from top of the playfield to the keyboard, at 1x
const LEAD_IN_MS = 600; // so the first note falls in from the top instead of starting on the keys
const NOTE_HEIGHT_PX = 18;
const RESOLVE_FADE_MS = 350;
const DEFAULT_PLAYFIELD_SIZE = { width: 1040, height: 400 }; // until the live measurement arrives

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const TIER_WEIGHT = { perfect: 1, great: 0.7, good: 0.4, missed: 0 };
const TIER_LABEL = { perfect: "PERFECT", great: "GREAT", good: "GOOD", missed: "MISS" };
const EMPTY_COUNTS = { perfect: 0, great: 0, good: 0, missed: 0 };

// Full 88-key keyboard (A0–C8) from MIDI numbers, so pitch and layout share one source.
// Each key only records which white-key slot it sits at; pixel positions are computed
// at render time from the measured width (see keyGeometry below).
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
const WHITE_KEY_COUNT = 52;
const BLACK_KEY_RATIO = 0.6;

function buildPianoLayout() {
  const keys = [];
  let whiteIndex = -1;

  for (let midi = 21; midi <= 108; midi++) {
    const pitchClass = midi % 12;
    const isWhite = WHITE_PITCH_CLASSES.has(pitchClass);
    if (isWhite) whiteIndex += 1;
    keys.push({
      note: `${NOTE_NAMES[pitchClass]}${Math.floor(midi / 12) - 1}`,
      type: isWhite ? "white" : "black",
      isC: pitchClass === 0,
      // white keys: their own slot; black keys: the white key they sit just after
      slot: whiteIndex,
      freq: 440 * Math.pow(2, (midi - 69) / 12),
    });
  }
  return keys;
}

// Snap every key to whole pixels. With fractional widths (e.g. 1850 / 52 = 35.58px)
// the browser antialiases each separator differently, which reads as uneven keys.
function keyGeometry(width) {
  const whiteWidth = Math.max(1, Math.floor(width / WHITE_KEY_COUNT));
  const blackWidth = Math.round(whiteWidth * BLACK_KEY_RATIO);
  const offset = Math.floor((width - whiteWidth * WHITE_KEY_COUNT) / 2);
  return {
    // Narrow screens can't fit every label, so shorten ("C#1" -> "C#") or drop them instead of overlapping.
    labelWhiteKeys: whiteWidth >= 18,
    blackLabel(key) {
      if (blackWidth >= 20) return key.note;
      if (blackWidth >= 12) return key.note.replace(/-?\d+$/, "");
      return null;
    },
    box(key) {
      if (key.type === "white") {
        return { left: offset + key.slot * whiteWidth, width: whiteWidth };
      }
      return { left: offset + (key.slot + 1) * whiteWidth - Math.round(blackWidth / 2), width: blackWidth };
    },
  };
}

const PIANO_LAYOUT = buildPianoLayout();
const PIANO_LAYOUT_BY_NOTE = Object.fromEntries(PIANO_LAYOUT.map((k) => [k.note, k]));
const WHITE_KEYS = PIANO_LAYOUT.filter((k) => k.type === "white");
const BLACK_KEYS = PIANO_LAYOUT.filter((k) => k.type === "black");
const C_KEYS = PIANO_LAYOUT.filter((k) => k.isC);

function matchesNote(detectedHz, targetHz) {
  if (!detectedHz || detectedHz <= 0) return false;
  return Math.abs(1200 * Math.log2(detectedHz / targetHz)) <= MATCH_TOLERANCE_CENTS;
}

function noteNameFromHz(hz) {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  if (!Number.isFinite(midi) || midi < 0) return null;
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function accuracyFor(counts) {
  const attempted = counts.perfect + counts.great + counts.good + counts.missed;
  const weightedHits =
    counts.perfect * TIER_WEIGHT.perfect + counts.great * TIER_WEIGHT.great + counts.good * TIER_WEIGHT.good;
  return attempted > 0 ? (weightedHits / attempted) * 100 : 100;
}

function gradeFor(accuracy) {
  if (accuracy >= 100) return "SS";
  if (accuracy >= 95) return "S";
  if (accuracy >= 90) return "A";
  if (accuracy >= 80) return "B";
  if (accuracy >= 70) return "C";
  return "D";
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, "0")}`;
}

export default function Game({ song, onBack }) {
  const { user } = useAuth();
  const noteObjects = useMemo(
    () => song?.notes ?? DEFAULT_NOTES.map((note, index) => ({ note, start_beat: index, duration_beats: 1 })),
    [song]
  );
  const tempoBpm = song?.tempo_bpm ?? 100;
  const msPerBeat = 60000 / tempoBpm;

  const [speed, setSpeed] = useState(1);
  const approachMs = BASE_APPROACH_MS / speed;
  const leadInMs = approachMs + LEAD_IN_MS;

  const timedNotes = useMemo(
    () =>
      noteObjects.map((n, index) => {
        const note = normalizeNote(n.note);
        return {
          note,
          lane: PIANO_LAYOUT_BY_NOTE[note],
          durationBeats: n.duration_beats ?? 1,
          hitTime: leadInMs + ((n.start_beat ?? index) * msPerBeat) / speed,
        };
      }),
    [noteObjects, msPerBeat, speed, leadInMs]
  );

  const lastHitTime = timedNotes.at(-1)?.hitTime ?? leadInMs;
  const totalDurationMs = Math.max(
    lastHitTime + GOOD_WINDOW_MS,
    song?.length ? leadInMs + (song.length * 1000) / speed : 0
  );

  const [phase, setPhase] = useState("idle"); // idle | playing | paused | finished
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [heardNote, setHeardNote] = useState(null);
  const [feedback, setFeedback] = useState(null); // { id, label, kind }
  const [judgedStates, setJudgedStates] = useState({}); // { [index]: tier }
  const [hiddenNotes, setHiddenNotes] = useState({}); // { [index]: true } once faded out
  const [activeKey, setActiveKey] = useState(null); // { note, kind } — brief flash on the keyboard
  const [nextNoteIndex, setNextNoteIndex] = useState(0);
  const [playId, setPlayId] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micError, setMicError] = useState(null);
  const [playfieldSize, setPlayfieldSize] = useState(DEFAULT_PLAYFIELD_SIZE);
  // Saving the finished run to the leaderboard: idle | saving | saved | error | guest
  const [submission, setSubmission] = useState({ status: "idle" });
  const [leaderboardVersion, setLeaderboardVersion] = useState(0);

  const accuracy = accuracyFor(counts);
  const { user } = useAuth();
  const [submission, setSubmission] = useState(null); // { status, rank?, totalPlayers?, bestScore?, message? }

  const isRunningRef = useRef(false);
  const pausedRef = useRef(false);
  const pauseStartRef = useRef(0);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const pitchDetectorRef = useRef(null);
  const audioDataRef = useRef(new Float32Array(2048));
  const rafIdRef = useRef(null);
  const startTimeRef = useRef(0);
  const pendingIndexRef = useRef(0);
  const judgeStateRef = useRef(null);
  const lastHeardRef = useRef(null);
  const activeKeyTimeoutRef = useRef(null);
  const resolveTimeoutsRef = useRef([]);
  const playfieldRef = useRef(null);
  const shortcutRef = useRef(null);

  function releaseAudio() {
    isRunningRef.current = false;
    pausedRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }

  function clearTimers() {
    resolveTimeoutsRef.current.forEach(clearTimeout);
    resolveTimeoutsRef.current = [];
    if (activeKeyTimeoutRef.current) clearTimeout(activeKeyTimeoutRef.current);
  }

  useEffect(() => {
    return () => {
      releaseAudio();
      clearTimers();
    };
  }, []);

  // The playfield is flex-sized to fill the screen, so its real size is only known at render time.
  useEffect(() => {
    const el = playfieldRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setPlayfieldSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setElapsedMs(performance.now() - startTimeRef.current), 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const onKeyDown = (e) => shortcutRef.current?.(e);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function detectPitch() {
    if (!analyserRef.current || !pitchDetectorRef.current || !audioCtxRef.current) return [0, 0];
    analyserRef.current.getFloatTimeDomainData(audioDataRef.current);
    return pitchDetectorRef.current.findPitch(audioDataRef.current, audioCtxRef.current.sampleRate);
  }

  function flashKey(note, kind) {
    setActiveKey({ note, kind });
    if (activeKeyTimeoutRef.current) clearTimeout(activeKeyTimeoutRef.current);
    activeKeyTimeoutRef.current = setTimeout(() => setActiveKey(null), 160);
  }

  function judgeNote(index, tier) {
    setJudgedStates((prev) => ({ ...prev, [index]: tier }));
    resolveTimeoutsRef.current.push(
      setTimeout(() => setHiddenNotes((prev) => ({ ...prev, [index]: true })), RESOLVE_FADE_MS)
    );
    flashKey(timedNotes[index].note, tier);

    const state = judgeStateRef.current;
    state.counts = { ...state.counts, [tier]: state.counts[tier] + 1 };

    if (tier === "missed") {
      state.combo = 0;
      state.multiplier = 1;
    } else {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.multiplier = Math.min(4, 1 + Math.floor(state.combo / 5));
      state.score += Math.round(
        BASE_POINTS_PER_BEAT * timedNotes[index].durationBeats * TIER_WEIGHT[tier] * state.multiplier * speed
      );
    }

    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setMultiplier(state.multiplier);
    setCounts(state.counts);
    setFeedback({ id: index, label: TIER_LABEL[tier], kind: tier });
    setNextNoteIndex(index + 1);
  }

  // Sends the finished run to the main server, which forwards it to the scores
  // microservice. Reads judgeStateRef because state values in this closure can lag.
  async function submitScore() {
    if (!song?.id) return; // the built-in fallback song has no leaderboard
    if (!user) {
      setSubmission({ status: "guest" });
      return;
    }

    const final = judgeStateRef.current;
    const total = final.counts.perfect + final.counts.great + final.counts.good + final.counts.missed;
    const weighted =
      final.counts.perfect * TIER_WEIGHT.perfect +
      final.counts.great * TIER_WEIGHT.great +
      final.counts.good * TIER_WEIGHT.good;

    setSubmission({ status: "saving" });
    try {
      const response = await axios.post(
        `${API_URL}/scores`,
        {
          songId: song.id,
          score: final.score,
          maxCombo: final.maxCombo,
          accuracy: total > 0 ? (weighted / total) * 100 : 0,
          speed,
        },
        { withCredentials: true, timeout: 10000 }
      );
      setSubmission({ status: "saved", ...response.data });
    } catch {
      setSubmission({ status: "error" });
    } finally {
      setLeaderboardVersion((v) => v + 1);
    }
  }

  function finishSong() {
    releaseAudio();
    setElapsedMs(totalDurationMs);
    setFeedback(null);
    setPhase("finished");
    submitScore();
  }

  function tick() {
    if (!isRunningRef.current || pausedRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;

    while (
      pendingIndexRef.current < timedNotes.length &&
      elapsed > timedNotes[pendingIndexRef.current].hitTime + GOOD_WINDOW_MS
    ) {
      judgeNote(pendingIndexRef.current, "missed");
      pendingIndexRef.current += 1;
    }

    if (pendingIndexRef.current >= timedNotes.length) {
      finishSong();
      return;
    }

    const target = timedNotes[pendingIndexRef.current];
    const [detectedHz, clarity] = detectPitch();
    let heard = null;

    if (clarity >= MIN_CLARITY && detectedHz > 0) {
      heard = noteNameFromHz(detectedHz);
      if (
        matchesNote(detectedHz, target.lane?.freq ?? 440) &&
        elapsed >= target.hitTime - GOOD_WINDOW_MS
      ) {
        const offset = Math.abs(elapsed - target.hitTime);
        const tier = offset <= PERFECT_WINDOW_MS ? "perfect" : offset <= GREAT_WINDOW_MS ? "great" : "good";
        judgeNote(pendingIndexRef.current, tier);
        pendingIndexRef.current += 1;
      }
    }

    // Only re-render when what we hear actually changes, not every frame.
    if (heard !== lastHeardRef.current) {
      lastHeardRef.current = heard;
      setHeardNote(heard);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }

  async function startGame() {
    setMicError(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("Microphone access was blocked. Allow it in your browser to play.");
      return;
    }
    streamRef.current = stream;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;
    pitchDetectorRef.current = PitchDetector.forFloat32Array(2048);

    clearTimers();
    judgeStateRef.current = { score: 0, combo: 0, maxCombo: 0, multiplier: 1, counts: EMPTY_COUNTS };
    pendingIndexRef.current = 0;
    lastHeardRef.current = null;
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMultiplier(1);
    setCounts(EMPTY_COUNTS);
    setHeardNote(null);
    setJudgedStates({});
    setHiddenNotes({});
    setFeedback(null);
    setNextNoteIndex(0);
    setSubmission(null);
    setElapsedMs(0);
    setPlayId((id) => id + 1);
    setSubmission({ status: "idle" });
    setPhase("playing");

    startTimeRef.current = performance.now();
    isRunningRef.current = true;
    pausedRef.current = false;
    rafIdRef.current = requestAnimationFrame(tick);
  }

  function pauseGame() {
    if (phase !== "playing") return;
    pausedRef.current = true;
    pauseStartRef.current = performance.now();
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setPhase("paused");
  }

  function resumeGame() {
    if (phase !== "paused") return;
    startTimeRef.current += performance.now() - pauseStartRef.current;
    pausedRef.current = false;
    setPhase("playing");
    rafIdRef.current = requestAnimationFrame(tick);
  }

  function restartGame() {
    releaseAudio();
    startGame();
  }

  function quitGame() {
    releaseAudio();
    clearTimers();
    onBack?.();
  }

  shortcutRef.current = (e) => {
    if (e.repeat) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (phase === "playing") pauseGame();
      else if (phase === "paused") resumeGame();
      else startGame();
    } else if (e.code === "Escape") {
      if (phase === "playing") pauseGame();
      else if (phase === "paused") resumeGame();
    }
  };

  const inSong = phase === "playing" || phase === "paused";
  const nextKey = inSong ? timedNotes[nextNoteIndex]?.lane : null;
  const progress = Math.min(100, (elapsedMs / totalDurationMs) * 100);
  const targetTop = playfieldSize.height - NOTE_HEIGHT_PX;
  const spawnTop = -NOTE_HEIGHT_PX - 8;
  const geometry = keyGeometry(playfieldSize.width);
  const keyStyle = (key) => geometry.box(key);
  const noteStyle = (key) => {
    const { left, width } = geometry.box(key);
    return { left: left + 1, width: width - 2 };
  };

  const speedPicker = (
    <div className="cadenza-game__speed" role="radiogroup" aria-label="Speed">
      {SPEED_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={speed === option}
          className={`cadenza-game__speed-option${speed === option ? " cadenza-game__speed-option--active" : ""}`}
          onClick={() => setSpeed(option)}
        >
          {option}×
        </button>
      ))}
    </div>
  );

  return (
    <div className="cadenza-game" style={song ? { "--accent": song.coverColor } : undefined}>
      {song?.coverImage && (
        <div className="cadenza-game__backdrop" style={{ backgroundImage: `url(${song.coverImage})` }} />
      )}

      <header className="cadenza-game__topbar">
        <div className="cadenza-game__song">
          {onBack && (
            <button type="button" className="cadenza-game__icon-btn" onClick={quitGame} aria-label="Back to song select">
              ←
            </button>
          )}
          {song?.coverImage && (
            <div className="cadenza-game__cover" style={{ backgroundImage: `url(${song.coverImage})` }} />
          )}
          <div className="cadenza-game__song-text">
            <h1>{song?.title ?? "Practice"}</h1>
            <p>{song?.artist ?? "Cadenza"}</p>
          </div>
        </div>

        <div className="cadenza-game__topbar-right">
          <div className="cadenza-game__stats">
            <div className="cadenza-game__score">{score.toLocaleString()}</div>
            <div className="cadenza-game__substats">
              {accuracy.toFixed(2)}% · {formatTime(elapsedMs)} / {formatTime(totalDurationMs)}
            </div>
          </div>
          {phase === "playing" && (
            <button type="button" className="cadenza-game__icon-btn" onClick={pauseGame} aria-label="Pause">
              ❚❚
            </button>
          )}
        </div>
      </header>

      <div className="cadenza-game__progress">
        <div className="cadenza-game__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="cadenza-game__stage">
        <section
          ref={playfieldRef}
          className={`cadenza-game__playfield${phase === "paused" ? " cadenza-game__playfield--paused" : ""}`}
        >
          {BLACK_KEYS.map((key) => (
            <div key={key.note} className="cadenza-game__column" style={keyStyle(key)} />
          ))}
          {C_KEYS.map((key) => (
            <div key={key.note} className="cadenza-game__octave-line" style={{ left: keyStyle(key).left }} />
          ))}
          {nextKey && <div className="cadenza-game__lane-guide" style={keyStyle(nextKey)} />}

          {playId > 0 &&
            timedNotes.map((n, index) => {
              if (!n.lane || hiddenNotes[index]) return null;
              const tier = judgedStates[index];
              const style = {
                ...noteStyle(n.lane),
                height: NOTE_HEIGHT_PX,
                "--spawn-top": `${spawnTop}px`,
                "--target-top": `${targetTop}px`,
              };
              if (!tier) {
                style.animationDelay = `${n.hitTime - approachMs}ms`;
                style.animationDuration = `${approachMs}ms`;
              }
              const classes = [
                "cadenza-game__note",
                n.lane.type === "black" ? "cadenza-game__note--black" : "",
                tier ? (tier === "missed" ? "cadenza-game__note--missed" : "cadenza-game__note--hit") : "",
              ]
                .filter(Boolean)
                .join(" ");
              return <div key={`${playId}-${index}`} className={classes} style={style} />;
            })}

          {inSong && (
            <div className="cadenza-game__pitch">
              <span className="cadenza-game__pitch-label">Hearing</span>
              <span className="cadenza-game__pitch-value">{heardNote ?? "—"}</span>
            </div>
          )}

          {inSong && combo > 0 && (
            <div className="cadenza-game__combo">
              <span className="cadenza-game__combo-number">{combo}</span>
              <span className="cadenza-game__combo-label">
                combo{multiplier > 1 ? ` · ×${multiplier}` : ""}
              </span>
            </div>
          )}

          {feedback && (
            <div
              key={feedback.id}
              className={`cadenza-game__judgement cadenza-game__judgement--${feedback.kind}`}
            >
              {feedback.label}
            </div>
          )}

          {phase !== "playing" && (
            <div className="cadenza-game__overlay">
              {phase === "idle" && (
                <div className="cadenza-game__panel">
                  <h2>{song?.title ?? "Practice"}</h2>
                  <p className="cadenza-game__panel-meta">
                    {timedNotes.length} notes · {tempoBpm} BPM
                  </p>
                  <p className="cadenza-game__panel-label">Speed</p>
                  {speedPicker}
                  <p className="cadenza-game__panel-hint">
                    Points are multiplied by the speed you pick.
                  </p>
                  <button type="button" className="cadenza-game__primary" onClick={startGame}>
                    Start
                  </button>
                  <p className="cadenza-game__panel-hint">Space to start or pause · Esc to pause</p>
                  {micError && <p className="cadenza-game__error">{micError}</p>}
                </div>
              )}

              {phase === "paused" && (
                <div className="cadenza-game__panel">
                  <h2>Paused</h2>
                  <div className="cadenza-game__panel-actions">
                    <button type="button" className="cadenza-game__primary" onClick={resumeGame}>
                      Resume
                    </button>
                    <button type="button" className="cadenza-game__secondary" onClick={restartGame}>
                      Restart
                    </button>
                    {onBack && (
                      <button type="button" className="cadenza-game__secondary" onClick={quitGame}>
                        Quit to song select
                      </button>
                    )}
                  </div>
                </div>
              )}

              {phase === "finished" && (
                <div className="cadenza-game__panel">
                  <p className="cadenza-game__panel-label">Results</p>
                  <div className="cadenza-game__grade">{gradeFor(accuracy)}</div>
                  <div className="cadenza-game__results">
                    <div>
                      <span>{score.toLocaleString()}</span>
                      <label>Score</label>
                    </div>
                    <div>
                      <span>{accuracy.toFixed(2)}%</span>
                      <label>Accuracy</label>
                    </div>
                    <div>
                      <span>{maxCombo}</span>
                      <label>Max combo</label>
                    </div>
                  </div>
                  <div className="cadenza-game__tiers">
                    <span className="cadenza-game__tier--perfect">Perfect {counts.perfect}</span>
                    <span className="cadenza-game__tier--great">Great {counts.great}</span>
                    <span className="cadenza-game__tier--good">Good {counts.good}</span>
                    <span className="cadenza-game__tier--missed">Miss {counts.missed}</span>
                  </div>
                  {submission.status !== "idle" && (
                    <p className={`cadenza-game__save cadenza-game__save--${submission.status}`}>
                      {submission.status === "saving" && "Saving your score..."}
                      {submission.status === "saved" &&
                        (submission.isPersonalBest
                          ? `New personal best! Rank #${submission.rank}`
                          : `Score saved. Your best: ${submission.personalBest.toLocaleString()}`)}
                      {submission.status === "error" && "Couldn't save your score to the leaderboard."}
                      {submission.status === "guest" && "Log in to save your score to the leaderboard."}
                    </p>
                  )}
                  {song?.id && (
                    <Leaderboard
                      songId={song.id}
                      limit={5}
                      refreshKey={leaderboardVersion}
                      highlightUsername={user?.username}
                    />
                  )}
                  <p className="cadenza-game__panel-label">Speed</p>
                  {speedPicker}
                  <div className="cadenza-game__panel-actions">
                    <button type="button" className="cadenza-game__primary" onClick={restartGame}>
                      Retry
                    </button>
                    {onBack && (
                      <button type="button" className="cadenza-game__secondary" onClick={quitGame}>
                        Back to song select
                      </button>
                    )}
                  </div>
                  {micError && <p className="cadenza-game__error">{micError}</p>}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="cadenza-game__keyboard">
          {WHITE_KEYS.map((key) => (
            <div
              key={key.note}
              className={[
                "cadenza-game__key cadenza-game__key--white",
                nextKey?.note === key.note ? "cadenza-game__key--next" : "",
                activeKey?.note === key.note
                  ? activeKey.kind === "missed"
                    ? "cadenza-game__key--miss"
                    : "cadenza-game__key--hit"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={keyStyle(key)}
            >
              {(key.isC || geometry.labelWhiteKeys) && (
                <span className={key.isC ? "cadenza-game__key-label--c" : undefined}>{key.note}</span>
              )}
            </div>
          ))}
          {BLACK_KEYS.map((key) => (
            <div
              key={key.note}
              className={[
                "cadenza-game__key cadenza-game__key--black",
                nextKey?.note === key.note ? "cadenza-game__key--next" : "",
                activeKey?.note === key.note
                  ? activeKey.kind === "missed"
                    ? "cadenza-game__key--miss"
                    : "cadenza-game__key--hit"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={keyStyle(key)}
            >
              {geometry.blackLabel(key) && <span>{geometry.blackLabel(key)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
