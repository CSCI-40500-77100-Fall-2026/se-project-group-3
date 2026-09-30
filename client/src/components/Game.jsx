import { useState, useRef, useEffect, useCallback } from "react";
import { PitchDetector } from "pitchy";
import "./Game.css";

const NOTE_FREQUENCIES = {
  C4: 261.63,
  "C#4": 277.18,
  Db4: 277.18,
  D4: 293.66,
  "D#4": 311.13,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  Gb4: 369.99,
  G4: 392.0,
  "G#4": 415.3,
  Ab4: 415.3,
  A4: 440.0,
  "A#4": 466.16,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
};

const DEFAULT_NOTES = [
  "E4", "D4", "C4", "D4", "E4", "E4", "E4",
  "D4", "D4", "D4",
  "E4", "G4", "G4",
  "E4", "D4", "C4", "D4", "E4", "E4", "E4", "E4",
  "D4", "D4", "E4", "D4", "C4"
];

const MIN_CLARITY = 0.85;
const MATCH_TOLERANCE_CENTS = 50;
const LISTEN_TIMEOUT_MS = 4000;
const POLL_INTERVAL_MS = 100;
const NOTE_GAP_MS = 500;

function centsOff(detectedHz, targetHz) {
  return 1200 * Math.log2(detectedHz / targetHz);
}

function matchesNote(detectedHz, targetHz) {
  if (!detectedHz || detectedHz <= 0) return false;
  return Math.abs(centsOff(detectedHz, targetHz)) <= MATCH_TOLERANCE_CENTS;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Game({ song, onBack }) {
  const notes = song?.notes?.map((n) => (typeof n === "string" ? n : n.note)) ?? DEFAULT_NOTES;

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [detectedNoteText, setDetectedNoteText] = useState("—");
  const [statusText, setStatusText] = useState("Mic idle");
  const [listening, setListening] = useState(false);
  const [chipStates, setChipStates] = useState({}); // { [index]: "current" | "correct" | "missed" }

  const isListeningRef = useRef(false);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const pitchDetectorRef = useRef(null);
  const audioDataRef = useRef(new Float32Array(2048));
  const loopActiveRef = useRef(false);

  const cleanupAudio = useCallback(() => {
    isListeningRef.current = false;
    setListening(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  function detectPitch() {
    if (!analyserRef.current || !pitchDetectorRef.current || !audioCtxRef.current) {
      return [0, 0];
    }
    analyserRef.current.getFloatTimeDomainData(audioDataRef.current);
    return pitchDetectorRef.current.findPitch(
      audioDataRef.current,
      audioCtxRef.current.sampleRate
    );
  }

  function listenForNote(targetHz, currentNote) {
    return new Promise((resolve) => {
      const startedAt = performance.now();

      const poll = () => {
        if (!isListeningRef.current) {
          resolve(false);
          return;
        }

        const [detectedHz, clarity] = detectPitch();

        if (clarity >= MIN_CLARITY) {
          setDetectedNoteText(`${currentNote} (${detectedHz.toFixed(1)} Hz)`);
          if (matchesNote(detectedHz, targetHz)) {
            resolve(true);
            return;
          }
        }

        if (performance.now() - startedAt >= LISTEN_TIMEOUT_MS) {
          resolve(false);
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      };

      poll();
    });
  }

  async function runGameProgram(songNotes) {
    loopActiveRef.current = true;
    let currentScore = 0;
    let currentStreak = 0;
    let currentMultiplier = 1;

    for (let i = 0; i < songNotes.length; i++) {
      if (!isListeningRef.current) break;

      const currentNote = songNotes[i];
      const targetHz = NOTE_FREQUENCIES[currentNote] || 440;

      // Mark current chip
      setChipStates((prev) => ({ ...prev, [i]: "current" }));
      setDetectedNoteText(`${currentNote} (listening...)`);

      const isCorrect = await listenForNote(targetHz, currentNote);
      if (!isListeningRef.current) break;

      if (isCorrect) {
        currentStreak += 1;
        currentMultiplier = Math.min(4, 1 + Math.floor(currentStreak / 5));
        currentScore += 100 * currentMultiplier;

        setStreak(currentStreak);
        setMultiplier(currentMultiplier);
        setScore(currentScore);
        setChipStates((prev) => ({ ...prev, [i]: "correct" }));
        setDetectedNoteText(`${currentNote} CORRECT`);
      } else {
        currentStreak = 0;
        currentMultiplier = 1;

        setStreak(0);
        setMultiplier(1);
        setChipStates((prev) => ({ ...prev, [i]: "missed" }));
        setDetectedNoteText(`${currentNote} missed`);
      }

      await wait(NOTE_GAP_MS);
    }

    if (isListeningRef.current) {
      setDetectedNoteText("Song complete!");
      setStatusText("Done");
      cleanupAudio();
    }
    loopActiveRef.current = false;
  }

  async function handleStart() {
    if (listening) {
      cleanupAudio();
      setStatusText("Stopped");
      setDetectedNoteText("—");
      return;
    }

    setStatusText("Requesting mic access...");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {
      setStatusText("Mic access denied");
      return;
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    pitchDetectorRef.current = PitchDetector.forFloat32Array(2048);

    // Reset game state
    setScore(0);
    setStreak(0);
    setMultiplier(1);
    setChipStates({});
    isListeningRef.current = true;
    setListening(true);
    setStatusText("Listening...");

    runGameProgram(notes);
  }

  return (
    <div className="cadenza-game" id="app">
      <div className="cadenza-game__container">
        <header className="cadenza-game__header">
          <h1>Cadenza</h1>
          {onBack && (
            <button
              type="button"
              className="cadenza-game__back-btn"
              onClick={() => {
                cleanupAudio();
                onBack();
              }}
            >
              ← Back to Select
            </button>
          )}
        </header>

        <section className="cadenza-game__hud" id="hud">
          <div className="cadenza-game__stat stat">
            <span id="score">{score}</span>
            <label>Score</label>
          </div>
          <div className="cadenza-game__stat stat">
            <span id="streak">{streak}</span>
            <label>Streak</label>
          </div>
          <div className="cadenza-game__stat stat">
            <span id="multiplier">x{multiplier}</span>
            <label>Multiplier</label>
          </div>
          <div className="cadenza-game__stat stat">
            <span id="detected-note">{detectedNoteText}</span>
            <label>Pitch</label>
          </div>
        </section>

        <section className="cadenza-game__track" id="track">
          <div className="cadenza-game__target-marker" id="target-marker" />
          <div className="cadenza-game__notes-lane" id="notes-lane">
            {notes.map((note, index) => {
              const state = chipStates[index];
              const stateClass = state ? ` cadenza-game__note-chip--${state} ${state}` : "";
              return (
                <div
                  key={index}
                  id={`note-${index}`}
                  className={`cadenza-game__note-chip note-chip${stateClass}`}
                >
                  {note}
                </div>
              );
            })}
          </div>
        </section>

        <section className="cadenza-game__controls" id="controls">
          <button
            type="button"
            id="start-btn"
            className={`cadenza-game__btn ${listening ? "cadenza-game__btn--stop" : ""}`}
            onClick={handleStart}
          >
            {listening ? "Stop Listening" : "Start Listening"}
          </button>
          <div className="cadenza-game__status" id="status">
            {statusText}
          </div>
        </section>
      </div>
    </div>
  );
}
