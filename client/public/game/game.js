import { PitchDetector } from "pitchy";

const pitchDetector = PitchDetector.forFloat32Array(2048);

const audioData = new Float32Array(2048);

const els = {
  startBtn: document.getElementById("start-btn"),
  detectedNote: document.getElementById("detected-note"),
  lane: document.getElementById("notes-lane"),
  status: document.getElementById("status"),
};

const noteFrequencies = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
};

const MIN_CLARITY = 0.85;
const MATCH_TOLERANCE_CENTS = 50;
const LISTEN_TIMEOUT_MS = 4000;
const POLL_INTERVAL_MS = 100;
const NOTE_GAP_MS = 500;

let notes = [];
let currentIndex = 0;
let listening = false;
let audioCtx;
let analyser;

function getNotes(songsheet) {
  return [
    "E4", "D4", "C4", "D4", "E4", "E4", "E4",
    "D4", "D4", "D4",
    "E4", "G4", "G4",
    "E4", "D4", "C4", "D4", "E4", "E4", "E4", "E4",
    "D4", "D4", "E4", "D4", "C4"
  ];
}

function displayNotes(noteList) {
  els.lane.innerHTML = "";

  noteList.forEach((note, i) => {
    const chip = document.createElement("div");
    chip.className = "note-chip";
    chip.id = `note-${i}`;
    chip.textContent = note;
    els.lane.appendChild(chip);
  });
}

function setChipState(index, state) {
  const chip = document.getElementById(`note-${index}`);
  if (!chip) return;
  chip.classList.remove("current", "correct", "missed");
  if (state) chip.classList.add(state);
}

function detectPitch() {
  analyser.getFloatTimeDomainData(audioData);
  return pitchDetector.findPitch(audioData, audioCtx.sampleRate);
}

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

function listenForNote(targetHz, currentNote) {
  return new Promise((resolve) => {
    const startedAt = performance.now();

    const poll = () => {
      if (!listening) {
        resolve(false);
        return;
      }

      const [detectedHz, clarity] = detectPitch();

      if (clarity >= MIN_CLARITY) {
        els.detectedNote.textContent = `${currentNote} (${detectedHz.toFixed(1)} Hz)`;
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

async function program() {
  while (listening && currentIndex < notes.length) {
    const currentNote = notes[currentIndex];
    const targetHz = noteFrequencies[currentNote];

    setChipState(currentIndex, "current");
    els.detectedNote.textContent = `${currentNote} (listening...)`;

    const isCorrect = await listenForNote(targetHz, currentNote);
    if (!listening) break;

    setChipState(currentIndex, isCorrect ? "correct" : "missed");
    els.detectedNote.textContent = isCorrect
      ? `${currentNote} CORRECT`
      : `${currentNote} missed`;

    currentIndex++;
    await wait(NOTE_GAP_MS);
  }

  if (listening) {
    els.detectedNote.textContent = "Song complete!";
    els.status.textContent = "Done";
    listening = false;
  }
}

async function setup() {
  els.status.textContent = "Requesting mic access...";

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    els.status.textContent = "Mic access denied";
    return;
  }

  audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  notes = getNotes("mary-had-a-little-lamb.pdf");
  currentIndex = 0;

  displayNotes(notes);
  listening = true;
  els.status.textContent = "Listening...";
  program();
}

els.startBtn.addEventListener("click", () => {
  setup();
});
