import React, { useState, useRef, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { Languages, ArrowLeft, Volume2, Flame, Sparkles, Loader2, X, Check, RotateCcw } from "lucide-react";
import { loadJSON, saveJSON } from "./storage.js";
import { SHEET_CATEGORIES, SAMPLE_CATEGORIES } from "./vocabConfig.js";

/* ------------------------------------------------------------------ */
/*  FONTS                                                              */
/* ------------------------------------------------------------------ */
function useGoogleFonts() {
  useEffect(() => {
    const id = "vocab-app-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800&family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

const INK = "#14172B";
const PAPER = "#F7F2E7";
const GREEN = "#2BB673";
const RED = "#E1483C";
const CARD_HEIGHT = 460;

/* ------------------------------------------------------------------ */
/*  UI STRINGS                                                         */
/* ------------------------------------------------------------------ */
const STR = {
  th: {
    appName: "คลังศัพท์ TCAS",
    tagline: "จำศัพท์ให้แม่น ก่อนสอบจริง",
    revengeTitle: "กองการ์ดล้างแค้น",
    revengeSub: (n) => `มี ${n} คำที่ยังเอาชนะไม่ได้`,
    revengeEmpty: "ยังไม่มีคำที่ต้องล้างแค้น เก่งมาก 🎉",
    playRevenge: "เข้าไปสะสาง",
    categories: "หมวดหมู่คำศัพท์",
    words: "คำ",
    start: "เริ่มเรียน",
    flip: "แตะการ์ดเพื่อดูเฉลย",
    tapFirst: "แตะการ์ดก่อน แล้วค่อยกดปุ่ม",
    flashcardMode: "แฟลชการ์ด",
    quizMode: "ควิซ",
    notYet: "ยังไม่ได้",
    gotIt: "จำได้",
    backToWord: "กลับไปดูคำศัพท์",
    quizPrompt: "แปลว่าอะไร?",
    correct: "ถูกต้อง!",
    wrong: "ยังไม่ถูก",
    correctAnswerIs: "เฉลย:",
    progress: (a, b) => `${a} / ${b}`,
    doneTitle: "จบชุดคำศัพท์แล้ว!",
    mastered: "จำได้แล้ว",
    toReview: "ต้องทบทวน",
    backHome: "กลับหน้าแรก",
    example: "ตัวอย่างประโยค",
    synonyms: "คำเหมือน",
    antonyms: "คำตรงข้าม",
    loadingSheets: "กำลังโหลดคำศัพท์จาก Google Sheets...",
    sheetLoadFailed: "โหลดไม่สำเร็จ",
  },
  en: {
    appName: "TCAS Vocab Vault",
    tagline: "Master every word before exam day",
    revengeTitle: "Revenge Deck",
    revengeSub: (n) => `${n} words still owe you a win`,
    revengeEmpty: "No words to avenge right now. Nice work 🎉",
    playRevenge: "Clear it out",
    categories: "Word Sets",
    words: "words",
    start: "Start studying",
    flip: "Tap the card to reveal",
    tapFirst: "Tap the card first, then use the buttons",
    flashcardMode: "Flashcard",
    quizMode: "Quiz",
    notYet: "Not yet",
    gotIt: "Got it",
    backToWord: "Back to word",
    quizPrompt: "What does it mean?",
    correct: "Correct!",
    wrong: "Not quite",
    correctAnswerIs: "Answer:",
    progress: (a, b) => `${a} / ${b}`,
    doneTitle: "Deck complete!",
    mastered: "Mastered",
    toReview: "Needs review",
    backHome: "Back home",
    example: "Example",
    synonyms: "Synonyms",
    antonyms: "Antonyms",
    loadingSheets: "Loading words from Google Sheets...",
    sheetLoadFailed: "Failed to load",
  },
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(word) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* speech not available — silently ignore */
  }
}

// Expected CSV headers: word, pos, thai, synonyms, antonyms, example, exampleTh, choice1, choice2, choice3, choice4, correctIndex
function rowsToCards(rows, categoryId) {
  return rows
    .filter((r) => (r.word || "").trim())
    .map((r, i) => {
      const opts = [r.choice1, r.choice2, r.choice3, r.choice4].map((x) => (x || "").trim()).filter(Boolean);
      const hasQuiz = opts.length === 4 && r.correctIndex !== undefined && r.correctIndex !== "";
      return {
        id: `${categoryId}-${i}`,
        word: (r.word || "").trim(),
        pos: (r.pos || "").trim(),
        thai: (r.thai || "").trim(),
        synonyms: (r.synonyms || "").split(";").map((s) => s.trim()).filter(Boolean),
        antonyms: (r.antonyms || "").split(";").map((s) => s.trim()).filter(Boolean),
        example: (r.example || "").trim(),
        exampleTh: (r.exampleTh || "").trim(),
        quiz: hasQuiz ? { options: opts, correctIndex: parseInt(r.correctIndex, 10) || 0 } : null,
      };
    });
}

function fetchSheetCards(url, categoryId) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        try {
          const cards = rowsToCards(res.data, categoryId);
          if (cards.length === 0) reject(new Error("empty"));
          else resolve(cards);
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err),
    });
  });
}

/* ------------------------------------------------------------------ */
/*  SWIPE CARD  (now tap-only — buttons replace the drag gesture)      */
/* ------------------------------------------------------------------ */
function SwipeCard({ card, categoryColor, lang, mode, onResolve, isTop, onRevealChange }) {
  const t = STR[lang];
  const [flipped, setFlipped] = useState(false);
  const [quizState, setQuizState] = useState({ status: "unanswered", picked: null });
  const [flyDir, setFlyDir] = useState(null); // null | 'left' | 'right'
  const [choiceOrder] = useState(() =>
    card.quiz ? shuffle(card.quiz.options.map((opt, i) => ({ opt, i }))) : []
  );

  const isQuiz = mode === "quiz" && !!card.quiz;
  const revealed = isQuiz ? quizState.status !== "unanswered" : flipped;
  const locked = isQuiz ? quizState.status === "unanswered" : !flipped;
  const forcedLeft = isQuiz && quizState.status === "wrong";
  const wordCentered = !isQuiz && !revealed; // plain flashcard front only

  const showChoices = isQuiz && !revealed;
  const [choicesIn, setChoicesIn] = useState(false);
  useEffect(() => {
    if (showChoices) {
      const id = requestAnimationFrame(() => setChoicesIn(true));
      return () => cancelAnimationFrame(id);
    }
    setChoicesIn(false);
  }, [showChoices]);

  useEffect(() => {
    if (isTop && onRevealChange) onRevealChange(revealed);
  }, [isTop, revealed, onRevealChange]);

  // once a fly-out direction is chosen, animate then resolve the card
  useEffect(() => {
    if (!flyDir) return;
    const timer = setTimeout(() => onResolve(flyDir), 300);
    return () => clearTimeout(timer);
  }, [flyDir]); // eslint-disable-line

  const handleChoice = (dir) => {
    if (locked || flyDir) return;
    if (forcedLeft && dir === "right") return;
    setFlyDir(dir);
  };

  const handleTap = () => {
    if (isQuiz) return;
    setFlipped((f) => !f);
  };

  const pickChoice = (idx) => {
    if (quizState.status !== "unanswered") return;
    const isCorrect = idx === card.quiz.correctIndex;
    setQuizState({ status: isCorrect ? "correct" : "wrong", picked: idx });
  };

  const flyTransform =
    flyDir === "right" ? "translateX(560px) rotate(22deg)"
    : flyDir === "left" ? "translateX(-560px) rotate(-22deg)"
    : "translateX(0) rotate(0deg)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        height: CARD_HEIGHT,
        transform: isTop ? flyTransform : "scale(0.96) translateY(10px)",
        opacity: flyDir ? 0 : isTop ? 1 : 0.7,
        transition: flyDir
          ? "transform 0.3s cubic-bezier(.4,0,.6,1), opacity 0.3s ease-in 0.05s"
          : "transform 0.35s cubic-bezier(.2,.8,.2,1), opacity 0.2s ease",
        zIndex: isTop ? 2 : 1,
      }}
      className="select-none w-full"
    >
      <div
        onClick={handleTap}
        style={{
          background: PAPER,
          borderRadius: 22,
          boxShadow: "0 18px 40px rgba(20,23,43,0.35)",
          height: CARD_HEIGHT,
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(20,23,43,0.08)",
        }}
        className="w-full flex flex-col"
      >
        {!isQuiz && flipped && (
          <button
            onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
            style={{
              position: "absolute", top: 14, left: 14, zIndex: 3,
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(20,23,43,0.06)", border: "1px solid rgba(20,23,43,0.12)",
              color: "rgba(20,23,43,0.6)", borderRadius: 999,
              padding: "5px 10px", fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11, fontWeight: 600,
            }}
          >
            <RotateCcw size={12} /> {t.backToWord}
          </button>
        )}

        {flyDir && (
          <div style={{ position: "absolute", inset: 0, background: flyDir === "right" ? GREEN : RED, opacity: 0.18, pointerEvents: "none" }} />
        )}

        <div className="flex-1 flex flex-col px-6" style={{ overflowY: revealed ? "auto" : "hidden", paddingBottom: 8 }}>
          <div style={{ flexGrow: wordCentered ? 1 : 0, flexShrink: 0, minHeight: 0, transition: "flex-grow 0.32s ease" }} />

          <div
            className="flex flex-col items-center text-center shrink-0"
            style={{ paddingTop: wordCentered ? 0 : 22, marginBottom: wordCentered ? 0 : 14, transition: "padding-top 0.32s ease, margin-bottom 0.32s ease" }}
          >
            <div className="flex items-center gap-2">
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  color: INK,
                  fontSize: wordCentered ? 32 : 26,
                  transition: "font-size 0.32s ease",
                  wordBreak: "break-word",
                }}
              >
                {card.word}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); speak(card.word); }}
                style={{ color: categoryColor, opacity: 0.8, flexShrink: 0 }}
                aria-label="pronounce"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", color: "rgba(20,23,43,0.5)", fontSize: 12, marginTop: 2 }}>
              {card.pos}
            </div>
            {!isQuiz && !flipped && (
              <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", color: "rgba(20,23,43,0.35)", fontSize: 12, marginTop: 10 }}>
                {t.flip}
              </div>
            )}
          </div>

          {showChoices && (
            <div
              className="flex flex-col gap-2"
              style={{
                opacity: choicesIn ? 1 : 0,
                transform: choicesIn ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.28s ease, transform 0.28s ease",
              }}
            >
              {choiceOrder.map(({ opt, i }) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); pickChoice(i); }}
                  style={{
                    background: "rgba(20,23,43,0.05)",
                    border: "1px solid rgba(20,23,43,0.12)",
                    color: INK,
                    borderRadius: 12,
                    padding: "12px 14px",
                    textAlign: "left",
                    fontFamily: "'IBM Plex Sans Thai', sans-serif",
                    fontSize: 14,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {revealed && (
            <div className="flex flex-col gap-3" style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
              {isQuiz && (
                <div
                  style={{
                    background: quizState.status === "correct" ? "rgba(43,182,115,0.12)" : "rgba(225,72,60,0.12)",
                    border: `1px solid ${quizState.status === "correct" ? GREEN : RED}`,
                    color: quizState.status === "correct" ? GREEN : RED,
                    borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 600,
                  }}
                >
                  {quizState.status === "correct"
                    ? `✓ ${t.correct}`
                    : `✕ ${t.wrong} — ${t.correctAnswerIs} ${card.thai}`}
                </div>
              )}
              <div>
                <div style={{ color: categoryColor, fontWeight: 700, fontSize: 18 }}>{card.thai}</div>
              </div>
              {card.synonyms?.length > 0 && (
                <div style={{ fontSize: 13, color: "rgba(20,23,43,0.75)" }}>
                  <span style={{ fontWeight: 600 }}>{t.synonyms}: </span>{card.synonyms.join(", ")}
                </div>
              )}
              {card.antonyms?.length > 0 && (
                <div style={{ fontSize: 13, color: "rgba(20,23,43,0.75)" }}>
                  <span style={{ fontWeight: 600 }}>{t.antonyms}: </span>{card.antonyms.join(", ")}
                </div>
              )}
              {card.example && (
                <div style={{ background: "rgba(20,23,43,0.05)", borderRadius: 12, padding: 12, fontSize: 12.5, color: "rgba(20,23,43,0.85)" }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "rgba(20,23,43,0.55)", fontSize: 11 }}>{t.example}</div>
                  <div>{card.example}</div>
                  {card.exampleTh && <div style={{ marginTop: 4, color: "rgba(20,23,43,0.6)" }}>{card.exampleTh}</div>}
                </div>
              )}
            </div>
          )}

          <div style={{ flexGrow: 1, flexShrink: 0, minHeight: 0 }} />
        </div>

        {/* bottom action buttons — replace the swipe gesture entirely */}
        {isTop && (
          <div
            style={{
              display: "flex", gap: 10, padding: "10px 16px 16px",
              opacity: locked ? 0.35 : 1,
              transition: "opacity 0.25s ease",
              pointerEvents: locked ? "none" : "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleChoice("left")}
              aria-label="not yet"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "rgba(225,72,60,0.1)", border: `1.5px solid ${RED}`, color: RED,
                borderRadius: 999, padding: "10px 0", fontWeight: 700,
                fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 13,
              }}
            >
              <X size={16} /> {t.notYet}
            </button>
            <button
              onClick={() => handleChoice("right")}
              disabled={forcedLeft}
              aria-label="got it"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: forcedLeft ? "rgba(43,182,115,0.05)" : "rgba(43,182,115,0.12)",
                border: `1.5px solid ${GREEN}`, color: GREEN,
                borderRadius: 999, padding: "10px 0", fontWeight: 700,
                fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 13,
                opacity: forcedLeft ? 0.35 : 1,
                cursor: forcedLeft ? "not-allowed" : "pointer",
              }}
            >
              <Check size={16} /> {t.gotIt}
            </button>
          </div>
        )}

        {!isQuiz && locked && (
          <div style={{ textAlign: "center", paddingBottom: 8, fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11, color: "rgba(20,23,43,0.35)" }}>
            {t.tapFirst}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DECK SCREEN                                                        */
/* ------------------------------------------------------------------ */
function DeckScreen({ deck, lang, onExit, onSwipeResult }) {
  const t = STR[lang];
  const [queue, setQueue] = useState(deck.cards);
  const [mode, setMode] = useState("flashcard");
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [topRevealed, setTopRevealed] = useState(false);
  const total = deck.cards.length;
  const done = total - queue.length;
  const currentHasQuiz = queue[0]?.quiz != null;
  const topCardId = queue[0]?.id;

  useEffect(() => {
    if (!currentHasQuiz && mode === "quiz") setMode("flashcard");
  }, [currentHasQuiz]); // eslint-disable-line

  // reset the "revealed" flag whenever a new card becomes the top card
  useEffect(() => {
    setTopRevealed(false);
  }, [topCardId]);

  const handleResolve = (dir) => {
    const card = queue[0];
    if (dir === "right") setMasteredCount((c) => c + 1);
    else setReviewCount((c) => c + 1);
    onSwipeResult(card, dir, deck.categoryId);
    setQueue((q) => q.slice(1));
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 flex-1 px-6 text-center">
        <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", color: "rgba(247,242,231,0.7)" }}>
          {lang === "th" ? "หมวดหมู่นี้ยังไม่มีคำศัพท์" : "This category has no words yet."}
        </div>
        <button onClick={onExit} style={{ background: PAPER, color: INK, borderRadius: 999, padding: "10px 22px", fontFamily: "'Kanit', sans-serif", fontWeight: 600 }}>
          {t.backHome}
        </button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 flex-1 px-6 text-center">
        <Sparkles size={40} color={deck.color} />
        <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: 24, fontWeight: 700, color: PAPER }}>{t.doneTitle}</div>
        <div className="flex gap-4">
          <div style={{ background: "rgba(43,182,115,0.15)", border: `1px solid ${GREEN}`, borderRadius: 14, padding: "12px 18px", minWidth: 110 }}>
            <div style={{ color: GREEN, fontSize: 24, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{masteredCount}</div>
            <div style={{ color: "rgba(247,242,231,0.7)", fontSize: 12, fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>{t.mastered}</div>
          </div>
          <div style={{ background: "rgba(225,72,60,0.15)", border: `1px solid ${RED}`, borderRadius: 14, padding: "12px 18px", minWidth: 110 }}>
            <div style={{ color: RED, fontSize: 24, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{reviewCount}</div>
            <div style={{ color: "rgba(247,242,231,0.7)", fontSize: 12, fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>{t.toReview}</div>
          </div>
        </div>
        <button onClick={onExit} style={{ background: PAPER, color: INK, borderRadius: 999, padding: "12px 28px", fontFamily: "'Kanit', sans-serif", fontWeight: 600 }}>
          {t.backHome}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 px-5 pt-2 pb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} style={{ color: PAPER }} className="flex items-center gap-1 opacity-80">
          <ArrowLeft size={18} />
        </button>
        <div style={{ fontFamily: "'Space Mono', monospace", color: "rgba(247,242,231,0.7)", fontSize: 13 }}>
          {t.progress(done, total)}
        </div>
        <div style={{ width: 18 }} />
      </div>

      <div style={{ height: 4, background: "rgba(247,242,231,0.12)", borderRadius: 4, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ height: "100%", width: `${(done / total) * 100}%`, background: deck.color, transition: "width .3s" }} />
      </div>

      <div style={{ position: "relative", height: CARD_HEIGHT }}>
        {queue.slice(0, 2).reverse().map((card, idx, arr) => (
          <SwipeCard
            key={card.id}
            card={card}
            categoryColor={deck.colorByCard[card.id] || deck.color}
            lang={lang}
            mode={mode}
            isTop={idx === arr.length - 1}
            onResolve={idx === arr.length - 1 ? handleResolve : () => {}}
            onRevealChange={idx === arr.length - 1 ? setTopRevealed : undefined}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-5">
        <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11, color: "rgba(247,242,231,0.4)" }}>
          {lang === "th" ? "กดปุ่มด้านล่างการ์ดเพื่อไปคำถัดไป" : "Use the buttons under the card to move on"}
        </div>
        {currentHasQuiz && (
          <button
            onClick={() => setMode((m) => (m === "flashcard" ? "quiz" : "flashcard"))}
            disabled={topRevealed}
            style={{
              background: mode === "quiz" ? deck.color : "rgba(247,242,231,0.1)",
              color: mode === "quiz" ? INK : PAPER,
              border: "1px solid rgba(247,242,231,0.2)",
              borderRadius: 999, padding: "8px 14px",
              fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12, fontWeight: 600,
              opacity: topRevealed ? 0.4 : 1,
              cursor: topRevealed ? "not-allowed" : "pointer",
            }}
          >
            {mode === "flashcard" ? t.quizMode : t.flashcardMode}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME SCREEN                                                        */
/* ------------------------------------------------------------------ */
function Home({ lang, setLang, categories, revengeCount, onOpenCategory, onOpenRevenge, loadingSheets }) {
  const t = STR[lang];
  return (
    <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 800, fontSize: 22, color: PAPER }}>{t.appName}</div>
          <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12, color: "rgba(247,242,231,0.55)" }}>{t.tagline}</div>
        </div>
        <button
          onClick={() => setLang((l) => (l === "th" ? "en" : "th"))}
          style={{ background: "rgba(247,242,231,0.1)", border: "1px solid rgba(247,242,231,0.2)", borderRadius: 999, padding: "8px 12px", color: PAPER, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Languages size={14} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{lang === "th" ? "TH" : "EN"}</span>
        </button>
      </div>

      <button
        onClick={onOpenRevenge}
        disabled={revengeCount === 0}
        style={{
          width: "100%", textAlign: "left", borderRadius: 20, padding: 20, marginBottom: 28,
          background: "linear-gradient(135deg, #E1483C 0%, #a02c22 100%)",
          opacity: revengeCount === 0 ? 0.55 : 1,
          boxShadow: "0 14px 30px rgba(225,72,60,0.25)",
          position: "relative", overflow: "hidden",
        }}
      >
        <Flame size={80} color="rgba(255,255,255,0.15)" style={{ position: "absolute", right: -10, bottom: -14 }} />
        <div className="flex items-center gap-2 mb-1">
          <Flame size={18} color={PAPER} />
          <span style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 17, color: PAPER }}>{t.revengeTitle}</span>
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 13, color: "rgba(247,242,231,0.85)" }}>
          {revengeCount > 0 ? t.revengeSub(revengeCount) : t.revengeEmpty}
        </div>
        {revengeCount > 0 && (
          <div style={{ marginTop: 12, display: "inline-block", background: "rgba(20,23,43,0.35)", color: PAPER, borderRadius: 999, padding: "6px 14px", fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12, fontWeight: 600 }}>
            {t.playRevenge} →
          </div>
        )}
      </button>

      <div className="flex items-center justify-between mb-3">
        <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 14, color: "rgba(247,242,231,0.65)", letterSpacing: 0.5 }}>
          {t.categories.toUpperCase()}
        </div>
        {loadingSheets && (
          <div className="flex items-center gap-1" style={{ color: "rgba(247,242,231,0.45)" }}>
            <Loader2 size={12} className="animate-spin" />
            <span style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11 }}>{t.loadingSheets}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onOpenCategory(cat)}
            style={{
              background: "rgba(247,242,231,0.06)", border: "1px solid rgba(247,242,231,0.12)",
              borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
              textAlign: "left",
            }}
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 10, height: 10, borderRadius: 999, background: cat.accent, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 15, color: PAPER }}>
                  {lang === "th" ? cat.nameTh : cat.nameEn}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: cat.fetchFailed ? RED : "rgba(247,242,231,0.45)" }}>
                  {cat.fetchFailed ? t.sheetLoadFailed : `${cat.cards.length} ${t.words}`}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12, color: cat.accent, fontWeight: 600, flexShrink: 0 }}>
              {t.start}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP                                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  useGoogleFonts();
  const [lang, setLang] = useState("th");
  const [screen, setScreen] = useState("home"); // home | deck
  const [activeDeck, setActiveDeck] = useState(null);
  const [revengeDeck, setRevengeDeck] = useState(() => loadJSON("revenge-deck", []));
  const [sheetCategories, setSheetCategories] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(SHEET_CATEGORIES.length > 0);
  const loadedRef = useRef(false);

  // ---- fetch the owner-configured Google Sheets categories on load ----
  useEffect(() => {
    if (SHEET_CATEGORIES.length === 0) {
      loadedRef.current = true;
      return;
    }
    (async () => {
      const fetched = await Promise.all(
        SHEET_CATEGORIES.map(async (cfg) => {
          try {
            const cards = await fetchSheetCards(cfg.csvUrl, cfg.id);
            return { ...cfg, cards };
          } catch (e) {
            return { ...cfg, cards: [], fetchFailed: true };
          }
        })
      );
      setSheetCategories(fetched);
      setLoadingSheets(false);
      loadedRef.current = true;
    })();
  }, []);

  // ---- persist revenge deck (per visitor progress) ----
  useEffect(() => {
    if (!loadedRef.current) return;
    saveJSON("revenge-deck", revengeDeck);
  }, [revengeDeck]);

  const allCategories = useMemo(() => [...sheetCategories, ...SAMPLE_CATEGORIES], [sheetCategories]);

  const cardIndex = useMemo(() => {
    const map = {};
    allCategories.forEach((cat) => cat.cards.forEach((c) => (map[c.id] = { ...c, categoryId: cat.id, color: cat.accent })));
    return map;
  }, [allCategories]);

  const openCategory = (cat) => {
    setActiveDeck({
      categoryId: cat.id,
      color: cat.accent,
      cards: cat.cards,
      colorByCard: Object.fromEntries(cat.cards.map((c) => [c.id, cat.accent])),
    });
    setScreen("deck");
  };

  const openRevenge = () => {
    const cards = revengeDeck.map((r) => cardIndex[r.cardId]).filter(Boolean);
    setActiveDeck({
      categoryId: "revenge",
      color: RED,
      cards,
      colorByCard: Object.fromEntries(cards.map((c) => [c.id, c.color])),
    });
    setScreen("deck");
  };

  const handleSwipeResult = (card, dir, categoryId) => {
    setRevengeDeck((prev) => {
      const exists = prev.some((r) => r.cardId === card.id);
      if (dir === "left") return exists ? prev : [...prev, { categoryId, cardId: card.id }];
      return prev.filter((r) => r.cardId !== card.id);
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 20% 0%, #1c2040 0%, ${INK} 55%)`,
        display: "flex",
        flexDirection: "column",
      }}
      className="w-full"
    >
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {screen === "home" && (
          <Home
            lang={lang}
            setLang={setLang}
            categories={allCategories}
            revengeCount={revengeDeck.length}
            onOpenCategory={openCategory}
            onOpenRevenge={openRevenge}
            loadingSheets={loadingSheets}
          />
        )}
        {screen === "deck" && activeDeck && (
          <DeckScreen deck={activeDeck} lang={lang} onExit={() => setScreen("home")} onSwipeResult={handleSwipeResult} />
        )}
      </div>
    </div>
  );
}
