//import pitchy for pitch detection

import { PitchDetector } from "pitchy";

/*

// draws one chip per note into the lane, tagged with an id
// so matchesNote() can mark it hit/miss later
function displayNotes(noteList) {
  els.lane.innerHTML = "";
  noteList.forEach((note, i) => {
    const chip = document.createElement("div");
    chip.className = "note-chip";
    chip.id = `note-${i}`;
    chip.textContent = note.replace(/\d/, "");
    chip.style.left = `${80 + i * 70}px`;
    els.lane.appendChild(chip);
  });
}

//main function to ask for start, call store notes, index current note, get audio frequency, compare audio frequency, evaluate, change to next note
function program(){
    print("Start");
    notes = getNotes("mary-had-a-little-lamb.pdf");
    currentIndex = 0;
    while (currentIndex!= notes.length){
    currentNote = notes[currentIndex];
    //display note
    print("Play");
    matchesNote(currentNote);
    currentIndex++;
    }
}

//pitchy instance using 2048 audio samples. returns array with detected pitch and confidence
PitchDetector = PitchDetector.forFloat32Array(2048);
const audioData = new Float32Array(2048);

function detectPitch(){
const result = PitchDetector.findPitch(
  audioData,
  48000
);
const detectedHz = result[0];
return detectedHz;
};

//function to detect frequency against target
function matchesNote(currentNote) {
    targetHz = noteFrequencies[currentNote];
    detectedHz = detectPitch();
  const candidates = [detectedHz, detectedHz / 2, detectedHz * 2]; //room for some flexibility
  for(let i = 0; i <3; i++)
    if(candidates[i] === targetHz) 
        return "Correct";
    return "Incorrect";
}
------------------*/
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

function displayNotes(noteList) {
    //get the notes to display
  els.lane.innerHTML = "";

  noteList.forEach((note, i) => {
    const chip = document.createElement("div");

    chip.className = "note-chip";
    chip.id = `note-${i}`;
    chip.textContent = note.replace(/\d/, "");

    els.lane.appendChild(chip);
  });
}

//
function detectPitch() {
  //MOCK: pretend the player always plays the correct note
  const currentNote = notes[currentIndex];
  return noteFrequencies[currentNote];
}

function matchesNote(detectedHz, targetHz) {
  const tolerance = 5;
  return Math.abs(detectedHz - targetHz) <= tolerance;
}

async function program() {

  notes = getNotes("mary-had-a-little-lamb.pdf");
  currentIndex = 0;

  displayNotes(notes);

  listening = true;

  const interval = setInterval(() => {

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
    const detectedHz = detectPitch();

    //get current note from song
    const currentNote = notes[currentIndex];

    //get the frequency of the current note
    const targetHz = noteFrequencies[currentNote];

    //print the current note and the detected note
    els.detectedNote.textContent =
      `${currentNote} (${detectedHz} Hz)`;

    //if note is correct
    if (matchesNote(detectedHz, targetHz)) {
    //print correct good job etc
    }
    currentIndex++;

  }, 500);
}

els.startBtn.addEventListener("click", () => {
 program();
});
