//FOR PITCH ANALYSIS-
import { PitchDetector } from "pitchy";

//pitchy instance using 2048 audio samples. returns array with detected pitch and confidence
const pitchDetector = PitchDetector.forFloat32Array(2048);

//store audio into array
const audioData = new Float32Array(2048);



//ELEMENTS
const els = {
  startBtn: document.getElementById("start-btn"),
  detectedNote: document.getElementById("detected-note"),
  lane: document.getElementById("notes-lane"),
};


 //notes and their frequencies
const noteFrequencies = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
};

//initial game state
let notes = []; //stores notes of song
let currentIndex = 0; //keeps track of current note
let listening = false; 
let songsheet = ""; //song file being used
let audioCtx;
let analyser;


//extract notes from songsheet
function getNotes(songsheet) {
    //mary had a little lamb for demo
  return [
    "E4", "D4", "C4", "D4", "E4", "E4", "E4",
    "D4", "D4", "D4",
    "E4", "G4", "G4",
    "E4", "D4", "C4", "D4", "E4", "E4", "E4", "E4",
    "D4", "D4", "E4", "D4", "C4"
  ];
}


//display notes
function displayNotes(noteList) {
  els.lane.innerHTML = "";

  noteList.forEach((note, i) => {
    const chip = document.createElement("div");

    chip.className = "note-chip";
    chip.id = `note-${i}`;
    chip.textContent = note.replace(/\d/, "");

    els.lane.appendChild(chip);
  });
}

//detect user input frequency
function detectPitch(analyser, sampleRate) {
  analyser.getFloatTimeDomainData(audioData);

  const pitch = pitchDetector.findPitch(
  audioData,
  sampleRate
);
return pitch[0];
}


//checks if notes are a match
function matchesNote(detectedHz, targetHz) {
  const tolerance = 5;
  //return Math.abs(detectedHz - targetHz) <= tolerance;
  return true;
}

function program(){
    if (!listening) {
      clearInterval(interval);
      return;
    }

    if (currentIndex >= notes.length) {
      els.detectedNote.textContent = "Song complete!";
      clearInterval(interval);
      return;
    }

    //get detected pitch
    const detectedHz = detectPitch(analyser,audioCtx.sampleRate);

    //get current note from song
    const currentNote = notes[currentIndex];

    //get the frequency of the current note
    const targetHz = noteFrequencies[currentNote];

    //print the current note and the detected note
   
  // show the note immediately
    els.detectedNote.textContent = currentNote + " (listening...)";

    // wait 3 seconds before evaluating
    setTimeout(() => {
      const detectedHz = detectPitch(analyser, audioCtx.sampleRate);

      // show detected pitch
      els.detectedNote.textContent =
        currentNote + " (" + detectedHz.toFixed(1) + " Hz)";

      // always correct for now
      if (matchesNote(detectedHz, targetHz)) {
        els.detectedNote.textContent =
          currentNote+ " CORRECT";
      }
        currentIndex++;
setTimeout(() => {
      program();   // move to next note AFTER showing CORRECT
    }, 800);
 }, 1500);
}

async function setup() {
// ask permission to use mic, streams raw audio
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//creates web audio environment. we use this for capturing live mic input
audioCtx = new AudioContext();
//stores the audio stream into web audio node
const source = audioCtx.createMediaStreamSource(stream);
//initialize analyser node to read audio
analyser = audioCtx.createAnalyser();
//take 2048 samples at a time
analyser.fftSize = 2048;
//connect the web audio node to the analyser node so it can be read later
source.connect(analyser);

notes = getNotes("mary-had-a-little-lamb.pdf");
  currentIndex = 0;
  
  displayNotes(notes);
  listening = true;
  program();
}

els.startBtn.addEventListener("click", () => {
 setup();
});
