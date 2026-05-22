"use client";
// components/DoubtChat.jsx
// AI Doubt Chat — Google Meet-style interface with realistic lip-sync animation + TTS

import { useState, useRef, useEffect, useCallback } from "react";
import { askDoubt, formatAnswer, QUICK_QUESTIONS } from "../../lib/doubtApi";

// ── TTS Helpers ───────────────────────────────────────────────────────────────
function cleanForSpeech(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[-•]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/#+ /g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\.{2,}/g, ".")
    .trim();
}

function getBestVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") ||
          v.name.includes("Neural") ||
          v.name.includes("Natural") ||
          v.name.includes("Wavenet"))
    ) ||
    voices.find((v) => v.lang.startsWith("en-IN")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

function speakText(text, { onStart, onEnd } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = cleanForSpeech(text);
  if (!clean) return;
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 0.92;
  utter.pitch = 1.05;
  utter.volume = 1;
  utter.lang = "en-IN";
  const voice = getBestVoice();
  if (voice) utter.voice = voice;
  if (onStart) utter.onstart = onStart;
  if (onEnd) utter.onend = onEnd;
  utter.onerror = onEnd || null;
  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis)
    window.speechSynthesis.cancel();
}

// ── Realistic Lip Animation ───────────────────────────────────────────────────
//
// KEY FIX: The SVG is NO LONGER inside .avatar-photo (which has overflow:hidden).
// Instead it's a sibling absolutely positioned over the face — so lips are NEVER clipped.
//
// The SVG viewBox is 0 0 72 72. The mouth sits at y≈50 (lower third of face).
// upperRef  = upper lip filled path (cupid's bow shape)
// lowerRef  = lower lip filled path (fuller curve)
// teethRef  = white rect visible when mouth opens
// cavityRef = dark ellipse (mouth hole) that scales with opening

function startLipAnimation(upperRef, lowerRef, teethRef, cavityRef) {
  let t = 0;
  // Simulate phoneme rhythm: varied opening heights
  const phonemes = [0, 3, 7, 4, 9, 2, 8, 3, 6, 1, 7, 4, 10, 2, 8, 3, 5, 0, 6, 4];
  let frame = 0;

  return setInterval(() => {
    t += 0.14;
    frame = (frame + 1) % phonemes.length;

    const base = phonemes[frame];
    const noise = Math.sin(t * 3.1) * 1.5 + Math.cos(t * 7.3) * 0.7;
    const open = Math.max(0, Math.min(11, base + noise));
    const half = open / 2;
    const cy = 50; // mouth center Y

    // Upper lip — W-shape (cupid's bow), moves up
    const uy = cy - half;
    if (upperRef.current) {
      upperRef.current.setAttribute(
        "d",
        `M 19 ${uy + 1}
         C 23 ${uy - 2}, 29 ${uy - 3}, 36 ${uy + 1}
         C 43 ${uy - 3}, 49 ${uy - 2}, 53 ${uy + 1}
         C 49 ${uy + 2}, 43 ${uy + 3}, 36 ${uy + 2}
         C 29 ${uy + 3}, 23 ${uy + 2}, 19 ${uy + 1} Z`
      );
    }

    // Lower lip — fuller pout, moves down
    const ly = cy + half;
    const pout = 3 + open * 0.4;
    if (lowerRef.current) {
      lowerRef.current.setAttribute(
        "d",
        `M 19 ${ly}
         C 23 ${ly + pout}, 29 ${ly + pout + 1}, 36 ${ly + pout + 1.5}
         C 43 ${ly + pout + 1}, 49 ${ly + pout}, 53 ${ly}
         C 49 ${ly - 1}, 43 ${ly - 1}, 36 ${ly - 1}
         C 29 ${ly - 1}, 23 ${ly - 1}, 19 ${ly} Z`
      );
    }

    // Teeth: appear when open > 2.5
    if (teethRef.current) {
      const th = Math.max(0, (open - 2.5) * 1.3);
      teethRef.current.setAttribute("y", String(cy - half + 1.5));
      teethRef.current.setAttribute("height", String(th));
      teethRef.current.setAttribute("opacity", open > 2.5 ? "1" : "0");
    }

    // Mouth cavity ellipse scales with opening
    if (cavityRef.current) {
      const ry = Math.max(0.5, open * 0.5);
      cavityRef.current.setAttribute("ry", String(ry));
      cavityRef.current.setAttribute("cy", String(cy));
    }
  }, 70);
}

function resetLips(upperRef, lowerRef, teethRef, cavityRef) {
  const cy = 50;
  if (upperRef.current) {
    upperRef.current.setAttribute(
      "d",
      `M 19 ${cy}
       C 23 ${cy - 2}, 29 ${cy - 2.5}, 36 ${cy}
       C 43 ${cy - 2.5}, 49 ${cy - 2}, 53 ${cy}
       C 49 ${cy + 1}, 43 ${cy + 1.5}, 36 ${cy + 1}
       C 29 ${cy + 1.5}, 23 ${cy + 1}, 19 ${cy} Z`
    );
  }
  if (lowerRef.current) {
    lowerRef.current.setAttribute(
      "d",
      `M 19 ${cy + 1}
       C 23 ${cy + 4}, 29 ${cy + 5}, 36 ${cy + 5.5}
       C 43 ${cy + 5}, 49 ${cy + 4}, 53 ${cy + 1}
       C 49 ${cy}, 43 ${cy}, 36 ${cy}
       C 29 ${cy}, 23 ${cy}, 19 ${cy + 1} Z`
    );
  }
  if (teethRef.current) {
    teethRef.current.setAttribute("height", "0");
    teethRef.current.setAttribute("opacity", "0");
  }
  if (cavityRef.current) {
    cavityRef.current.setAttribute("ry", "0.5");
  }
}

// ── Inline SVG Avatar ─────────────────────────────────────────────────────────
// Cartoon-style pilot avatar matching the design reference.
// No mouth drawn here — the .lip-svg overlay handles all mouth animation.
// ── Inline SVG Avatar ─────────────────────────────────────────────────────────
function AvatarFaceSVG() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // Fallback: simple colored circle with initials if image fails to load
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "48px",
          fontWeight: "700",
          color: "white",
          userSelect: "none",
        }}
      >
        AI
      </div>
    );
  }

  return (
    <img
      src="/avataredit.webp"
      alt="Capt. AI avatar"
      onError={() => setImgError(true)}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
        objectPosition: "center top",
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoubtChat({ compact = false }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm Capt. AI, your DGCA exam assistant. Ask me anything about Aviation — Navigation, Meteorology, Air Regulations, Technical General, Radio Telephony, or HPL.",
      id: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyForApi, setHistoryForApi] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sessionStart] = useState(Date.now());
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [showQuick, setShowQuick] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Lip refs — SVG path elements
  const upperLipRef = useRef(null);
  const lowerLipRef = useRef(null);
  const teethRef = useRef(null);
  const cavityRef = useRef(null);
  const lipAnimRef = useRef(null);

  const msgCountRef = useRef(1);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      setTimerDisplay(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice preload + cleanup
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.onvoiceschanged = () => { };
    return () => {
      stopSpeaking();
      if (lipAnimRef.current) clearInterval(lipAnimRef.current);
    };
  }, []);

  // Speaking state helpers
  const setSpeakingState = useCallback((val) => {
    setIsSpeaking(val);
    if (val) {
      if (lipAnimRef.current) clearInterval(lipAnimRef.current);
      lipAnimRef.current = startLipAnimation(
        upperLipRef, lowerLipRef, teethRef, cavityRef
      );
    } else {
      if (lipAnimRef.current) {
        clearInterval(lipAnimRef.current);
        lipAnimRef.current = null;
      }
      resetLips(upperLipRef, lowerLipRef, teethRef, cavityRef);
    }
  }, []);

  function triggerSpeak(text) {
    if (!ttsEnabled) return;
    speakText(text, {
      onStart: () => setSpeakingState(true),
      onEnd: () => setSpeakingState(false),
    });
  }

  function stopNow() {
    stopSpeaking();
    setSpeakingState(false);
  }

  function toggleTts() {
    setTtsEnabled((v) => {
      if (v) stopNow();
      return !v;
    });
  }

  function toggleMic() { setMicOn((v) => !v); }

  async function sendMessage(questionText) {
    const q = String(questionText || input).trim();
    if (!q || loading) return;
    stopNow();
    setInput("");
    setError("");

    const userMsg = { role: "user", text: q, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    msgCountRef.current += 1;
    if (msgCountRef.current > 2) setShowQuick(false);

    try {
      const { answer } = await askDoubt(q, null, historyForApi, "chat");
      const botMsg = { role: "assistant", text: answer, id: Date.now() + 1 };
      setMessages((prev) => [...prev, botMsg]);
      setHistoryForApi((prev) => [...prev.slice(-7), { question: q, answer }]);
      triggerSpeak(answer);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Sorry, I couldn't process that. Please try again.",
          id: Date.now() + 1,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function endSession() {
    stopNow();
    setMessages([{
      role: "assistant",
      text: "Session reset. Ask me anything about DGCA exams!",
      id: Date.now(),
    }]);
    setHistoryForApi([]);
    setError("");
    setShowQuick(true);
    msgCountRef.current = 1;
  }

  const QUICK = QUICK_QUESTIONS.slice(0, 4);

  return (
    <div className={`dcw ${compact ? "compact" : ""}`}>
      <style>{CSS}</style>

      {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
      <div className="meet-topbar">
        <div className="meet-title">
          <div className="meet-dot" />
          DGCA Doubt Session
        </div>
        <div className="meet-info">{timerDisplay}</div>
      </div>

      {/* ══ MAIN AREA ════════════════════════════════════════════════════ */}
      <div className="meet-main">

        {/* ── VIDEO STAGE ─────────────────────────────────────────────── */}
        <div className="video-stage">
          <div className={`ai-tile ${isSpeaking ? "speaking" : ""}`}>
            <div className="ai-tile-glow" />
            <div className="sound-ring r1" />
            <div className="sound-ring r2" />
            <div className="sound-ring r3" />

            {/* ── FACE + LIP OVERLAY ──────────────────────────────────── */}
            {/*
              .face-wrap is position:relative, does NOT have overflow:hidden.
              .avatar-photo (circular) sits inside it — it has overflow:hidden for the crop.
              .lip-svg is absolutely positioned OVER .avatar-photo, z-index:2,
              pointing at the lower 45% of the face circle — lips are never clipped.
            */}
            <div className="face-wrap">
              {/* Circular photo crop */}
              <div className="avatar-photo">
                {/* ── Inline SVG cartoon avatar — no external image needed ── */}
                <AvatarFaceSVG />
              </div>

              {/* Lip SVG — sits on top, never clipped */}
              <svg
                className="lip-svg"
                viewBox="0 0 72 72"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Dark mouth cavity — scales with opening */}
                <ellipse
                  ref={cavityRef}
                  cx="36"
                  cy="50"
                  rx="16"
                  ry="0.5"
                  fill="#110606"
                />

                {/* Teeth — shown when open */}
                <rect
                  ref={teethRef}
                  x="21"
                  y="50"
                  width="30"
                  height="0"
                  rx="2"
                  fill="#f2ede8"
                  opacity="0"
                />

                {/* Lower lip — rendered first (behind upper) */}
                <path
                  ref={lowerLipRef}
                  d="M 19 51 C 23 54 29 55 36 55.5 C 43 55 49 54 53 51 C 49 50 43 50 36 50 C 29 50 23 50 19 51 Z"
                  fill="#c07878"
                  stroke="#a86060"
                  strokeWidth="0.3"
                />

                {/* Upper lip — on top */}
                <path
                  ref={upperLipRef}
                  d="M 19 50 C 23 48 29 47.5 36 50 C 43 47.5 49 48 53 50 C 49 51 43 51.5 36 51 C 29 51.5 23 51 19 50 Z"
                  fill="#b36868"
                  stroke="#995252"
                  strokeWidth="0.3"
                />

                {/* Lip gloss highlight */}
                <ellipse cx="36" cy="53.5" rx="7" ry="1.4"
                  fill="rgba(255,255,255,0.13)" />
                <ellipse cx="32" cy="48.5" rx="3" ry="1"
                  fill="rgba(255,255,255,0.1)" />
              </svg>
            </div>

            {/* Name tag */}
            <div className="ai-name-tag">
              <div className="live-dot" />
              Capt. AI
              {isSpeaking && <span className="speaking-label">speaking…</span>}
            </div>

            {/* Wave bars */}
            <div className="tile-waves">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="tbar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>

          {/* Self-view pip */}
          <div className="self-view">
            <div className="self-av">S</div>
            <div className="self-label">You</div>
          </div>
        </div>

        {/* ── MESSAGES ────────────────────────────────────────────────── */}
        <div className="chat-panel">
          <div className="chat-msgs">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.role === "user" ? "user" : "bot"}`}>
                <div className={`msg-av ${msg.role === "user" ? "usr" : "bot"}`}>
                  {msg.role === "user" ? "S" : "AI"}
                </div>
                <div
                  className={`bubble ${msg.role === "user" ? "usr" : "bot"}${msg.isError ? " err" : ""}`}
                  dangerouslySetInnerHTML={{ __html: formatAnswer(msg.text) }}
                />
              </div>
            ))}

            {loading && (
              <div className="msg-row bot">
                <div className="msg-av bot">AI</div>
                <div className="typing-bub">
                  <div className="tdot" /><div className="tdot" /><div className="tdot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── QUICK CHIPS ─────────────────────────────────────────────── */}
        {showQuick && (
          <div className="quick-row">
            {QUICK.map((q) => (
              <button key={q} className="quick-chip" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── INPUT BAR ───────────────────────────────────────────────── */}
        <div className="input-bar">
          {error && <div className="error-msg">⚠️ {error}</div>}

          <button
            className={`icon-btn ${ttsEnabled ? "tts-on" : "tts-off"}`}
            onClick={toggleTts}
            title={ttsEnabled ? "TTS On" : "TTS Off"}
            aria-label="Toggle text to speech"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {ttsEnabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>

          {isSpeaking && (
            <button className="icon-btn stop-speak" onClick={stopNow}
              title="Stop speaking" aria-label="Stop speaking">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Ask any aviation question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            className="icon-btn send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ══ BOTTOM CONTROLS — mic + end only ════════════════════════════ */}

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .dcw {
    font-family: 'Inter', -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 80px);
    background: #1a1c22;
    color: #e0e2ec;
    border-radius: 12px;
    overflow: hidden;
  }
  .dcw.compact { min-height: 500px; }

  /* TOP BAR */
  .meet-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; background: #1a1c22;
    border-bottom: 0.5px solid #2d2f36; flex-shrink: 0;
  }
  .meet-title {
    font-size: 13px; color: #9aa0aa; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
  }
  .meet-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #34c759; animation: blink 2s infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .meet-info { font-size: 12px; color: #5a5e6a; }

  /* MAIN */
  .meet-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* VIDEO STAGE */
  .video-stage {
    flex: 1; display: flex; align-items: center; justify-content: center;
    background: #131519; position: relative; overflow: hidden; min-height: 280px;
  }

  /* AI TILE */
  .ai-tile {
    width: 300px; height: 300px; border-radius: 20px;
    background: #1e2028; border: 2px solid #2d2f36;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative; overflow: hidden; transition: border-color 0.3s;
  }
  .ai-tile.speaking { border-color: #4f46e5; }
  .ai-tile.speaking .ai-tile-glow { opacity: 1; }
  .ai-tile-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, rgba(79,70,229,0.1) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.5s; pointer-events: none;
  }

  /* SOUND RINGS */
  .sound-ring {
    position: absolute; border-radius: 50%;
    border: 1.5px solid rgba(79,70,229,0.2);
    opacity: 0; pointer-events: none;
  }
  .sound-ring.r1 { width: 200px; height: 200px; }
  .sound-ring.r2 { width: 240px; height: 240px; }
  .sound-ring.r3 { width: 280px; height: 280px; }
  .ai-tile.speaking .sound-ring { opacity: 1; animation: sonarRing 2s ease-out infinite; }
  .ai-tile.speaking .sound-ring.r2 { animation-delay: 0.4s; }
  .ai-tile.speaking .sound-ring.r3 { animation-delay: 0.8s; }
  @keyframes sonarRing {
    0%   { transform: scale(0.85); opacity: 0.6; }
    100% { transform: scale(1.2);  opacity: 0; }
  }

  /* ── FACE WRAP ──────────────────────────────────────────────────
     CRITICAL: position:relative but NO overflow:hidden here.
     The .lip-svg floats outside the circle boundary into this space.
     Only .avatar-photo has overflow:hidden for the circular crop.
  ────────────────────────────────────────────────────────────────── */
  .face-wrap {
    position: relative;
    width: 160px;
    height: 160px;
    flex-shrink: 0;
    /* No overflow:hidden — lips must not be clipped */
  }

  .avatar-photo {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    overflow: hidden;           /* clips the SVG avatar to circle */
    border: 3px solid #2d3045;
    background: #0a0c1a;
    position: relative;
    z-index: 1;
  }

  /*
    .lip-svg overlays the lower portion of the face.
    Positioned absolutely relative to .face-wrap.
    z-index:2 puts it above the avatar SVG.
    Width covers the mouth region; height covers the bottom 45% of the face circle.
    drop-shadow makes lips legible over any skin tone.
  */
  .lip-svg {
    position: absolute;
    bottom: 4px;          /* sits just above bottom of circle  */
    left: 50%;
    transform: translateX(-50%);
    width: 88px;
    height: 62px;         /* tall enough to show full lip anim */
    z-index: 2;
    pointer-events: none;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  }

  /* NAME TAG */
  .ai-name-tag {
    position: absolute; bottom: 10px; left: 12px;
    background: rgba(0,0,0,0.65); color: #e0e2ec;
    font-size: 12px; font-weight: 500; padding: 3px 10px;
    border-radius: 20px; display: flex; align-items: center; gap: 5px;
  }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4f46e5; }
  .ai-tile.speaking .live-dot { animation: blink 0.8s infinite; }
  .speaking-label { font-size: 10px; color: #818cf8; margin-left: 2px; }

  /* WAVE BARS */
  .tile-waves {
    position: absolute; bottom: 12px; right: 12px;
    display: flex; align-items: flex-end; gap: 2px; height: 18px;
    opacity: 0; transition: opacity 0.3s;
  }
  .ai-tile.speaking .tile-waves { opacity: 1; }
  .tbar { width: 3px; border-radius: 1px; background: #6366f1; height: 4px; }
  .ai-tile.speaking .tbar { animation: tbarAnim 0.7s ease-in-out infinite alternate; }
  @keyframes tbarAnim { from{height:3px} to{height:16px} }

  /* SELF-VIEW PIP */
  .self-view {
    position: absolute; bottom: 12px; right: 12px;
    width: 80px; height: 58px; background: #1e2028;
    border-radius: 8px; border: 1.5px solid #2d2f36;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; z-index: 5;
  }
  .self-av {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: white;
  }
  .self-label { font-size: 9px; color: #5a5e6a; }

  /* CHAT PANEL */
  .chat-panel {
    height: 150px; background: #1a1c22;
    border-top: 0.5px solid #2d2f36;
    display: flex; flex-direction: column; flex-shrink: 0;
  }
  .chat-msgs {
    flex: 1; overflow-y: auto; padding: 8px 14px;
    display: flex; flex-direction: column; gap: 6px;
    scrollbar-width: thin; scrollbar-color: #2d2f36 transparent;
  }
  .chat-msgs::-webkit-scrollbar { width: 3px; }
  .chat-msgs::-webkit-scrollbar-thumb { background: #2d2f36; border-radius: 2px; }

  .msg-row { display: flex; gap: 7px; align-items: flex-start; animation: popIn 0.25s ease; }
  .msg-row.user { flex-direction: row-reverse; }
  @keyframes popIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

  .msg-av {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 600; flex-shrink: 0; margin-top: 1px;
  }
  .msg-av.bot { background: linear-gradient(135deg, #4f46e5, #0ea5e9); color: white; }
  .msg-av.usr { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; }

  .bubble {
    max-width: 72%; padding: 6px 10px; border-radius: 10px;
    font-size: 12px; line-height: 1.55;
  }
  .bubble.bot { background: #252830; color: #c8ccda; border-top-left-radius: 3px; }
  .bubble.usr { background: #2a2d6e; color: #c8d0f5; border-top-right-radius: 3px; }
  .bubble.err { background: #2a1010; color: #f87171; }
  .bubble strong { color: #93c5fd; }
  .bubble em     { color: #a5b4fc; font-style: italic; }
  .bubble ul     { padding-left: 16px; margin: 6px 0; }
  .bubble li     { margin: 3px 0; }
  .bubble p      { margin: 4px 0; }
  .bubble p:first-child { margin-top: 0; }
  .bubble p:last-child  { margin-bottom: 0; }

  .typing-bub {
    background: #252830; border-radius: 10px; border-top-left-radius: 3px;
    padding: 8px 12px; display: flex; gap: 4px; align-items: center;
  }
  .tdot { width: 6px; height: 6px; border-radius: 50%; animation: bounce 1.1s infinite; }
  .tdot:nth-child(1) { background: #4f46e5; }
  .tdot:nth-child(2) { background: #0ea5e9; animation-delay: 0.18s; }
  .tdot:nth-child(3) { background: #22c55e; animation-delay: 0.36s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

  /* QUICK CHIPS */
  .quick-row {
    display: flex; flex-wrap: wrap; gap: 5px;
    padding: 6px 12px; background: #1a1c22; flex-shrink: 0;
  }
  .quick-chip {
    background: #252830; border: 0.5px solid #3a3c46; color: #7a80a0;
    font-size: 11px; padding: 3px 10px; border-radius: 12px;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .quick-chip:hover { border-color: #4f46e5; color: #a5b0f0; background: #1e1f40; }

  /* INPUT BAR */
  .input-bar {
    display: flex; align-items: center; gap: 6px; padding: 8px 12px;
    background: #1a1c22; border-top: 0.5px solid #2d2f36;
    flex-shrink: 0; flex-wrap: wrap;
  }
  .error-msg {
    width: 100%; color: #f87171; font-size: 11px; margin-bottom: 4px;
    padding: 5px 10px; background: #1c0a0a;
    border-radius: 6px; border-left: 3px solid #ef4444;
  }
  .chat-input {
    flex: 1; background: #252830; border: 0.5px solid #3a3c46;
    border-radius: 20px; color: #e0e2ec; font-size: 13px;
    font-family: inherit; padding: 7px 14px; outline: none;
    transition: border-color 0.2s; height: 36px; min-width: 0;
  }
  .chat-input:focus { border-color: #4f46e5; }
  .chat-input::placeholder { color: #4a4e5e; }

  .icon-btn {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.2s, transform 0.1s;
    flex-shrink: 0; background: #252830; color: #9aa0aa;
  }
  .icon-btn:hover { background: #2e3140; transform: scale(1.05); }
  .icon-btn.send { background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; }
  .icon-btn.send:hover { opacity: 0.9; }
  .icon-btn.send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .icon-btn.tts-on  { background: #1a2e1a; color: #4ade80; }
  .icon-btn.tts-off { background: #252830; color: #5a5e6a; }
  .icon-btn.stop-speak { background: #2a1515; color: #f87171; animation: blink 0.9s infinite; }

  /* BOTTOM CONTROLS */
  .meet-controls {
    display: flex; align-items: center; justify-content: center;
    gap: 14px; padding: 10px 16px; background: #141618; flex-shrink: 0;
  }
  .ctrl-wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .ctrl-btn {
    width: 44px; height: 44px; border-radius: 50%; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.2s, transform 0.1s;
    background: #2d2f36; color: #9aa0aa;
  }
  .ctrl-btn:hover   { background: #3a3c46; transform: scale(1.06); }
  .ctrl-btn.active  { background: #4f46e5; color: white; }
  .ctrl-btn.muted   { background: #3d1a1a; color: #f87171; }
  .ctrl-btn.danger  { background: #c0392b; color: white; }
  .ctrl-btn.danger:hover { background: #e74c3c; }
  .ctrl-label { font-size: 9px; color: #5a5e6a; }
`;