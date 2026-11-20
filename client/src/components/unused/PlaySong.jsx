import { useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";

const notes = [
    "E4", "D4", "C4", "D4", "E4", "E4", "E4",
    "D4", "D4", "D4",
    "E4", "G4", "G4",
    "E4", "D4", "C4", "D4", "E4", "E4", "E4", "E4",
    "D4", "D4", "E4", "D4", "C4",
];

const noteFrequencies = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392,
    A4: 440,
    B4: 493.88,
};

const MIN_CLARITY = 0.85;
const MATCH_TOLERANCE_CENTS = 50;
const LISTEN_TIMEOUT_MS = 4000;
const POLL_INTERVAL_MS = 100;
const NOTE_GAP_MS = 500;

function wait(ms, session) {
    return new Promise((resolve) => {
        let timer;
        const finish = () => {
            window.clearTimeout(timer);
            session.timers.delete(timer);
            session.cancelWaits.delete(finish);
            resolve();
        };

        timer = window.setTimeout(finish, ms);
        session.timers.add(timer);
        session.cancelWaits.add(finish);
    });
}

function stopSession(session) {
    session.cancelled = true;
    session.cancelWaits.forEach((cancelWait) => cancelWait());
    session.stream?.getTracks().forEach((track) => track.stop());
    if (session.audioContext && session.audioContext.state !== "closed") {
        void session.audioContext.close().catch(() => {});
    }
}

export default function PlaySong() {
    const [noteStates, setNoteStates] = useState({});
    const [detectedNote, setDetectedNote] = useState("—");
    const [status, setStatus] = useState("Mic idle");
    const [isListening, setIsListening] = useState(false);
    const sessionRef = useRef(null);

    useEffect(() => () => {
        const session = sessionRef.current;
        sessionRef.current = null;
        if (session) {
            stopSession(session);
        }
    }, []);

    async function startListening() {
        if (sessionRef.current) return;

        const session = {
            cancelled: false,
            stream: null,
            audioContext: null,
            timers: new Set(),
            cancelWaits: new Set(),
        };
        sessionRef.current = session;
        setIsListening(true);
        setNoteStates({});
        setDetectedNote("—");
        setStatus("Requesting mic access...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            session.stream = stream;
            if (session.cancelled) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            const audioContext = new window.AudioContext();
            session.audioContext = audioContext;
            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }
            if (session.cancelled) return;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            audioContext.createMediaStreamSource(stream).connect(analyser);
            const detector = PitchDetector.forFloat32Array(2048);
            const audioData = new Float32Array(2048);

            setStatus("Listening...");

            for (let index = 0; index < notes.length && !session.cancelled; index++) {
                const currentNote = notes[index];
                const targetFrequency = noteFrequencies[currentNote];
                setNoteStates((current) => ({ ...current, [index]: "current" }));
                setDetectedNote(`${currentNote} (listening...)`);

                const startedAt = performance.now();
                let matched = false;
                while (!session.cancelled && performance.now() - startedAt < LISTEN_TIMEOUT_MS) {
                    analyser.getFloatTimeDomainData(audioData);
                    const [frequency, clarity] = detector.findPitch(audioData, audioContext.sampleRate);

                    if (clarity >= MIN_CLARITY) {
                        setDetectedNote(`${currentNote} (${frequency.toFixed(1)} Hz)`);
                        if (
                            frequency > 0 &&
                            Math.abs(1200 * Math.log2(frequency / targetFrequency)) <= MATCH_TOLERANCE_CENTS
                        ) {
                            matched = true;
                            break;
                        }
                    }

                    await wait(POLL_INTERVAL_MS, session);
                }

                if (session.cancelled) break;

                setNoteStates((current) => ({ ...current, [index]: matched ? "correct" : "missed" }));
                setDetectedNote(matched ? `${currentNote} CORRECT` : `${currentNote} missed`);
                await wait(NOTE_GAP_MS, session);
            }

            if (!session.cancelled) {
                setDetectedNote("Song complete!");
                setStatus("Done");
            }
        } catch {
            if (!session.cancelled) {
                setStatus("Mic access denied");
            }
        } finally {
            stopSession(session);
            if (sessionRef.current === session) {
                sessionRef.current = null;
                setIsListening(false);
            }
        }
    }

    return (
        <div id="app">
            <link rel="stylesheet" href="/game/style.css" />
            <header>
                <h1>Cadenza</h1>
            </header>

            <section id="hud" aria-label="Game stats">
                <div className="stat"><span>0</span><label>Score</label></div>
                <div className="stat"><span>0</span><label>Streak</label></div>
                <div className="stat"><span>x1</span><label>Multiplier</label></div>
                <div className="stat"><span>{detectedNote}</span><label>Detected note</label></div>
            </section>

            <section id="track" aria-label="Song notes">
                <div id="target-marker" />
                <div id="notes-lane">
                    {notes.map((note, index) => (
                        <div className={`note-chip ${noteStates[index] ?? ""}`} key={`${note}-${index}`}>
                            {note}
                        </div>
                    ))}
                </div>
            </section>

            <section id="controls">
                <button id="start-btn" disabled={isListening} onClick={startListening}>
                    {isListening ? "Listening..." : "Start Listening"}
                </button>
                <div id="status" role="status">{status}</div>
            </section>
        </div>
    );
}