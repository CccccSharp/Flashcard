import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Papa from "papaparse";
import {
  Languages, ArrowLeft, Volume2, Flame, Sparkles, Settings,
  Plus, Trash2, RefreshCw, Link2, Loader2, Info,
} from "lucide-react";
import { loadJSON, saveJSON } from "./storage.js";

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
const ACCENT_PRESETS = ["#E1483C", "#2BB673", "#F2B705", "#5B7FE0", "#B25BE0", "#2BB0B6"];

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
    tapFirst: "แตะการ์ดก่อน แล้วค่อยปัด",
    flashcardMode: "แฟลชการ์ด",
    quizMode: "ควิซ",
    swipeRight: "ปัดขวา = จำได้",
    swipeLeft: "ปัดซ้าย = ยังไม่ได้",
    quizPrompt: "แปลว่าอะไร?",
    correct: "ถูกต้อง!",
    wrong: "ยังไม่ถูก",
    correctAnswerIs: "เฉลย:",
    onlySwipeLeft: "ปัดซ้ายเพื่อไปต่อ",
    canSwipeRight: "ปัดขวาเพื่อไปต่อ",
    progress: (a, b) => `${a} / ${b}`,
    doneTitle: "จบชุดคำศัพท์แล้ว!",
    mastered: "จำได้แล้ว",
    toReview: "ต้องทบทวน",
    backHome: "กลับหน้าแรก",
    example: "ตัวอย่างประโยค",
    synonyms: "คำเหมือน",
    antonyms: "คำตรงข้าม",
    settings: "ตั้งค่า / เชื่อมชีต",
    settingsTitle: "หมวดหมู่จาก Google Sheets",
    settingsSub: "เพิ่มคลังคำศัพท์ของคุณเองจากชีตที่เผยแพร่เป็น CSV แล้ว",
    sheetNameTh: "ชื่อหมวดหมู่ (ไทย)",
    sheetNameEn: "ชื่อหมวดหมู่ (อังกฤษ)",
    sheetUrl: "ลิงก์ CSV ที่เผยแพร่แล้ว",
    addSheet: "เพิ่มหมวดหมู่",
    fetching: "กำลังดึงข้อมูล...",
    fetchError: "ดึงข้อมูลไม่สำเร็จ ตรวจสอบว่าลิงก์เป็น CSV ที่เผยแพร่แบบสาธารณะ",
    formatHelp: "รูปแบบคอลัมน์ที่ต้องมีในชีต (แถวแรกเป็นหัวคอลัมน์):",
    noSheets: "ยังไม่มีหมวดหมู่จาก Google Sheets",
    savedNote: "ข้อมูลจะถูกบันทึกไว้ในเบราว์เซอร์นี้เท่านั้น (ไม่ผูกบัญชี ไม่ข้ามอุปกรณ์)",
    wordsCount: (n) => `${n} คำ`,
    refresh: "รีเฟรช",
    remove: "ลบ",
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
    tapFirst: "Tap the card first, then swipe",
    flashcardMode: "Flashcard",
    quizMode: "Quiz",
    swipeRight: "Swipe right = got it",
    swipeLeft: "Swipe left = not yet",
    quizPrompt: "What does it mean?",
    correct: "Correct!",
    wrong: "Not quite",
    correctAnswerIs: "Answer:",
    onlySwipeLeft: "Swipe left to continue",
    canSwipeRight: "Swipe right to continue",
    progress: (a, b) => `${a} / ${b}`,
    doneTitle: "Deck complete!",
    mastered: "Mastered",
    toReview: "Needs review",
    backHome: "Back home",
    example: "Example",
    synonyms: "Synonyms",
    antonyms: "Antonyms",
    settings: "Settings / Connect sheet",
    settingsTitle: "Categories from Google Sheets",
    settingsSub: "Add your own word set from a sheet published as CSV.",
    sheetNameTh: "Category name (Thai)",
    sheetNameEn: "Category name (English)",
    sheetUrl: "Published CSV link",
    addSheet: "Add category",
    fetching: "Fetching...",
    fetchError: "Couldn't fetch that sheet. Make sure the link is a publicly published CSV.",
    formatHelp: "Required columns (first row = headers):",
    noSheets: "No Google Sheets categories yet",
    savedNote: "Saved in this browser only — no account, not synced across devices.",
    wordsCount: (n) => `${n} words`,
    refresh: "Refresh",
    remove: "Remove",
  },
};

/* ------------------------------------------------------------------ */
/*  SAMPLE DATA — replace or extend via Settings → Google Sheets       */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  {
    id: "tgat",
    nameTh: "TGAT ภาษาอังกฤษ",
    nameEn: "TGAT English",
    accent: "#E1483C",
    stamp: "TGAT",
    cards: [
      { id: "tgat-1", word: "ambiguous", pos: "adj.", thai: "คลุมเครือ, กำกวม", synonyms: ["vague", "unclear"], antonyms: ["clear", "precise"], example: "The instructions were so ambiguous that no one knew where to start.", exampleTh: "คำสั่งนั้นคลุมเครือมากจนไม่มีใครรู้ว่าจะเริ่มตรงไหน", quiz: { options: ["คลุมเครือ", "รวดเร็ว", "ราคาแพง", "อ่อนโยน"], correctIndex: 0 } },
      { id: "tgat-2", word: "resilient", pos: "adj.", thai: "ยืดหยุ่น, ฟื้นตัวได้เร็ว", synonyms: ["tough", "adaptable"], antonyms: ["fragile", "weak"], example: "Coastal cities need to become more resilient to flooding.", exampleTh: "เมืองชายฝั่งต้องมีความยืดหยุ่นต่อน้ำท่วมมากขึ้น", quiz: { options: ["เปราะบาง", "ยืดหยุ่นและฟื้นตัวเร็ว", "โบราณ", "หายาก"], correctIndex: 1 } },
      { id: "tgat-3", word: "meticulous", pos: "adj.", thai: "พิถีพิถัน, ละเอียดรอบคอบ", synonyms: ["thorough", "precise"], antonyms: ["careless", "sloppy"], example: "She kept meticulous records of every experiment.", exampleTh: "เธอจดบันทึกการทดลองทุกครั้งอย่างละเอียดรอบคอบ", quiz: { options: ["ประมาท", "พิถีพิถัน", "ใจร้อน", "เงียบขรึม"], correctIndex: 1 } },
      { id: "tgat-4", word: "inevitable", pos: "adj.", thai: "หลีกเลี่ยงไม่ได้", synonyms: ["unavoidable", "certain"], antonyms: ["avoidable", "uncertain"], example: "With no plan in place, the delay was inevitable.", exampleTh: "เมื่อไม่มีแผนรองรับ ความล่าช้าจึงหลีกเลี่ยงไม่ได้", quiz: { options: ["หลีกเลี่ยงไม่ได้", "น่าประหลาดใจ", "ชั่วคราว", "ผิดกฎหมาย"], correctIndex: 0 } },
      { id: "tgat-5", word: "candid", pos: "adj.", thai: "ตรงไปตรงมา, จริงใจ", synonyms: ["frank", "honest"], antonyms: ["evasive", "dishonest"], example: "The coach gave a candid assessment of the team's weaknesses.", exampleTh: "โค้ชให้ความเห็นอย่างตรงไปตรงมาเกี่ยวกับจุดอ่อนของทีม", quiz: { options: ["อ้อมค้อม", "ตรงไปตรงมา", "หรูหรา", "ขี้อาย"], correctIndex: 1 } },
      { id: "tgat-6", word: "reluctant", pos: "adj.", thai: "ลังเล, ไม่เต็มใจ", synonyms: ["hesitant", "unwilling"], antonyms: ["eager", "willing"], example: "He was reluctant to speak in front of the whole class.", exampleTh: "เขาลังเลที่จะพูดต่อหน้าเพื่อนทั้งห้อง", quiz: { options: ["กระตือรือร้น", "ลังเลไม่เต็มใจ", "ใจกว้าง", "รอบคอบ"], correctIndex: 1 } },
    ],
  },
  {
    id: "alevel",
    nameTh: "A-Level ภาษาอังกฤษ",
    nameEn: "A-Level English",
    accent: "#2BB673",
    stamp: "A-LVL",
    cards: [
      { id: "alv-1", word: "prevalent", pos: "adj.", thai: "แพร่หลาย, พบได้ทั่วไป", synonyms: ["widespread", "common"], antonyms: ["rare", "scarce"], example: "Mobile payments have become prevalent in Thai markets.", exampleTh: "การชำระเงินผ่านมือถือกลายเป็นเรื่องแพร่หลายในตลาดของไทย", quiz: { options: ["หายาก", "แพร่หลาย", "ผิดกฎหมาย", "ราคาถูก"], correctIndex: 1 } },
      { id: "alv-2", word: "controversial", pos: "adj.", thai: "เป็นที่ถกเถียง", synonyms: ["disputed", "contentious"], antonyms: ["undisputed", "agreed"], example: "The new tax policy remains a controversial topic.", exampleTh: "นโยบายภาษีใหม่ยังคงเป็นประเด็นที่ถกเถียงกัน", quiz: { options: ["เป็นที่ถกเถียง", "น่าเบื่อ", "เป็นความลับ", "เก่าแก่"], correctIndex: 0 } },
      { id: "alv-3", word: "sustainable", pos: "adj.", thai: "ยั่งยืน", synonyms: ["renewable", "viable"], antonyms: ["unsustainable", "depleting"], example: "The company switched to sustainable packaging last year.", exampleTh: "บริษัทเปลี่ยนมาใช้บรรจุภัณฑ์ที่ยั่งยืนเมื่อปีที่แล้ว", quiz: { options: ["ยั่งยืน", "แตกหักง่าย", "หรูหรา", "รวดเร็ว"], correctIndex: 0 } },
      { id: "alv-4", word: "articulate", pos: "adj./v.", thai: "พูดได้ชัดเจน, สื่อสารได้ดี", synonyms: ["eloquent", "expressive"], antonyms: ["inarticulate", "unclear"], example: "The speaker was articulate even under pressure.", exampleTh: "ผู้พูดสื่อสารได้อย่างชัดเจนแม้ภายใต้ความกดดัน", quiz: { options: ["พูดไม่รู้เรื่อง", "พูดได้ชัดเจน", "เงียบขรึม", "ก้าวร้าว"], correctIndex: 1 } },
      { id: "alv-5", word: "compromise", pos: "n./v.", thai: "การประนีประนอม", synonyms: ["settlement", "middle ground"], antonyms: ["standoff", "conflict"], example: "Both teams reached a compromise before the deadline.", exampleTh: "ทั้งสองทีมสามารถประนีประนอมกันได้ก่อนถึงกำหนด", quiz: { options: ["การประนีประนอม", "การประกาศ", "การลงโทษ", "การเลื่อน"], correctIndex: 0 } },
    ],
  },
  {
    id: "medical",
    nameTh: "คำศัพท์การแพทย์",
    nameEn: "Medical Terms",
    accent: "#F2B705",
    stamp: "MED",
    cards: [
      { id: "med-1", word: "diagnosis", pos: "n.", thai: "การวินิจฉัยโรค", synonyms: ["assessment", "identification"], antonyms: ["misdiagnosis"], example: "An early diagnosis greatly improves the treatment outcome.", exampleTh: "การวินิจฉัยตั้งแต่เนิ่นๆ ช่วยให้ผลการรักษาดีขึ้นมาก", quiz: { options: ["การผ่าตัด", "การวินิจฉัยโรค", "การพักฟื้น", "การฉีดยา"], correctIndex: 1 } },
      { id: "med-2", word: "chronic", pos: "adj.", thai: "เรื้อรัง", synonyms: ["persistent", "long-lasting"], antonyms: ["acute", "temporary"], example: "Chronic stress can weaken the immune system over time.", exampleTh: "ความเครียดเรื้อรังสามารถทำให้ภูมิคุ้มกันอ่อนแอลงเมื่อเวลาผ่านไป", quiz: { options: ["เฉียบพลัน", "เรื้อรัง", "หายาก", "ติดต่อได้"], correctIndex: 1 } },
      { id: "med-3", word: "prescribe", pos: "v.", thai: "สั่งยา, กำหนดการรักษา", synonyms: ["recommend", "order"], antonyms: [], example: "The doctor prescribed antibiotics for the infection.", exampleTh: "แพทย์สั่งยาปฏิชีวนะเพื่อรักษาการติดเชื้อ", quiz: { options: ["สั่งยา", "ผ่าตัด", "ตรวจเลือด", "เอ็กซเรย์"], correctIndex: 0 } },
      { id: "med-4", word: "symptom", pos: "n.", thai: "อาการของโรค", synonyms: ["sign", "indication"], antonyms: [], example: "Fever is a common symptom of many infections.", exampleTh: "ไข้เป็นอาการทั่วไปของการติดเชื้อหลายชนิด", quiz: { options: ["อาการของโรค", "ผลข้างเคียง", "ใบสั่งยา", "การผ่าตัด"], correctIndex: 0 } },
    ],
  },
];

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
/*  SWIPE CARD  (fixed height, quiz choices live inside the card)      */
/* ------------------------------------------------------------------ */
function SwipeCard({ card, categoryColor, stampLabel, lang, mode, onResolve, isTop }) {
  const t = STR[lang];
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ x: 0, active: false });
  const [quizState, setQuizState] = useState({ status: "unanswered", picked: null });
  const [choiceOrder] = useState(() =>
    card.quiz ? shuffle(card.quiz.options.map((opt, i) => ({ opt, i }))) : []
  );
  const startX = useRef(0);
  const cardRef = useRef(null);

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

  const commit = useCallback(
    (dir) => {
      if (locked) return;
      if (forcedLeft && dir === "right") return;
      onResolve(dir);
    },
    [locked, forcedLeft, onResolve]
  );

  const onPointerDown = (e) => {
    if (!isTop || locked) return;
    startX.current = e.clientX;
    setDrag({ x: 0, active: true });
    cardRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.active || !isTop || locked) return;
    let dx = e.clientX - startX.current;
    if (forcedLeft && dx > 0) dx = Math.min(dx, 16);
    setDrag({ x: dx, active: true });
  };
  const onPointerUp = () => {
    if (!isTop || locked) { setDrag({ x: 0, active: false }); return; }
    const threshold = 90;
    if (drag.x > threshold && !forcedLeft) commit("right");
    else if (drag.x < -threshold) commit("left");
    else setDrag({ x: 0, active: false });
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

  const rotation = Math.max(-18, Math.min(18, drag.x / 10));
  const rightGlow = Math.max(0, Math.min(1, drag.x / 120));
  const leftGlow = Math.max(0, Math.min(1, -drag.x / 120));

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: "absolute",
        inset: 0,
        height: CARD_HEIGHT,
        transform: isTop
          ? `translateX(${drag.x}px) rotate(${rotation}deg)`
          : "scale(0.96) translateY(10px)",
        transition: drag.active ? "none" : "transform 0.35s cubic-bezier(.2,.8,.2,1)",
        touchAction: "pan-y",
        cursor: isTop && !locked ? "grab" : "default",
        zIndex: isTop ? 2 : 1,
        opacity: isTop ? 1 : 0.7,
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
        <div
          style={{
            position: "absolute", top: 14, right: 14,
            border: `2px solid ${categoryColor}`, color: categoryColor,
            fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 11,
            padding: "3px 8px", borderRadius: 6, transform: "rotate(6deg)", letterSpacing: 1,
          }}
        >
          {stampLabel}
        </div>

        <div style={{ position: "absolute", inset: 0, background: GREEN, opacity: rightGlow * 0.18, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: RED, opacity: leftGlow * 0.18, pointerEvents: "none" }} />
        {isTop && drag.x > 40 && (
          <div style={{ position: "absolute", top: 20, left: 20, border: `3px solid ${GREEN}`, color: GREEN, padding: "4px 10px", fontFamily: "'Space Mono', monospace", fontWeight: 700, borderRadius: 8, transform: "rotate(-10deg)" }}>KNOW IT</div>
        )}
        {isTop && drag.x < -40 && (
          <div style={{ position: "absolute", top: 20, right: 20, border: `3px solid ${RED}`, color: RED, padding: "4px 10px", fontFamily: "'Space Mono', monospace", fontWeight: 700, borderRadius: 8, transform: "rotate(10deg)" }}>REVIEW</div>
        )}

        <div className="flex-1 flex flex-col px-6" style={{ overflowY: revealed ? "auto" : "hidden", paddingBottom: 20 }}>
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
                    ? `✓ ${t.correct} ${t.canSwipeRight}`
                    : `✕ ${t.wrong} — ${t.correctAnswerIs} ${card.thai}. ${t.onlySwipeLeft}`}
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

        {!isQuiz && locked && (
          <div style={{ textAlign: "center", padding: "8px 0", fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11, color: "rgba(20,23,43,0.35)" }}>
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
  const total = deck.cards.length;
  const done = total - queue.length;
  const currentHasQuiz = queue[0]?.quiz != null;

  useEffect(() => {
    if (!currentHasQuiz && mode === "quiz") setMode("flashcard");
  }, [currentHasQuiz]); // eslint-disable-line

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
            stampLabel={deck.stampByCard[card.id]}
            lang={lang}
            mode={mode}
            isTop={idx === arr.length - 1}
            onResolve={idx === arr.length - 1 ? handleResolve : () => {}}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-5">
        <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11, color: "rgba(247,242,231,0.45)" }}>
          {t.swipeLeft} · {t.swipeRight}
        </div>
        {currentHasQuiz && (
          <button
            onClick={() => setMode((m) => (m === "flashcard" ? "quiz" : "flashcard"))}
            style={{
              background: mode === "quiz" ? deck.color : "rgba(247,242,231,0.1)",
              color: mode === "quiz" ? INK : PAPER,
              border: "1px solid rgba(247,242,231,0.2)",
              borderRadius: 999, padding: "8px 14px",
              fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12, fontWeight: 600,
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
function Home({ lang, setLang, categories, revengeCount, onOpenCategory, onOpenRevenge, onOpenSettings }) {
  const t = STR[lang];
  return (
    <div className="flex-1 px-5 pt-6 pb-10 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 800, fontSize: 22, color: PAPER }}>{t.appName}</div>
          <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12, color: "rgba(247,242,231,0.55)" }}>{t.tagline}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            style={{ background: "rgba(247,242,231,0.1)", border: "1px solid rgba(247,242,231,0.2)", borderRadius: 999, padding: 9, color: PAPER }}
            aria-label="settings"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => setLang((l) => (l === "th" ? "en" : "th"))}
            style={{ background: "rgba(247,242,231,0.1)", border: "1px solid rgba(247,242,231,0.2)", borderRadius: 999, padding: "8px 12px", color: PAPER, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Languages size={14} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>{lang === "th" ? "TH" : "EN"}</span>
          </button>
        </div>
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

      <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 14, color: "rgba(247,242,231,0.65)", marginBottom: 12, letterSpacing: 0.5 }}>
        {t.categories.toUpperCase()}
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
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(247,242,231,0.45)" }}>
                  {cat.cards.length} {t.words}{cat.fromSheet ? " · Sheets" : ""}
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
/*  SETTINGS SCREEN — Google Sheets import                             */
/* ------------------------------------------------------------------ */
function SettingsScreen({ lang, sheetCategories, onAdd, onRemove, onRefresh, onExit, busyId }) {
  const t = STR[lang];
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [csvUrl, setCsvUrl] = useState("");
  const [accent, setAccent] = useState(ACCENT_PRESETS[3]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const inputStyle = {
    width: "100%", background: "rgba(247,242,231,0.06)", border: "1px solid rgba(247,242,231,0.18)",
    borderRadius: 10, padding: "10px 12px", color: PAPER, fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 13,
  };

  const handleAdd = async () => {
    setError("");
    if (!nameTh.trim() || !nameEn.trim() || !csvUrl.trim()) {
      setError(lang === "th" ? "กรอกข้อมูลให้ครบก่อนนะ" : "Please fill in every field.");
      return;
    }
    setAdding(true);
    const ok = await onAdd({ nameTh: nameTh.trim(), nameEn: nameEn.trim(), csvUrl: csvUrl.trim(), accent });
    setAdding(false);
    if (!ok) setError(t.fetchError);
    else { setNameTh(""); setNameEn(""); setCsvUrl(""); }
  };

  return (
    <div className="flex-1 px-5 pt-2 pb-10 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={onExit} style={{ color: PAPER }} className="opacity-80">
          <ArrowLeft size={18} />
        </button>
        <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 700, fontSize: 18, color: PAPER }}>{t.settings}</div>
      </div>

      <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 15, color: PAPER, marginBottom: 4 }}>
        {t.settingsTitle}
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12.5, color: "rgba(247,242,231,0.6)", marginBottom: 16 }}>
        {t.settingsSub}
      </div>

      <div className="flex flex-col gap-3 mb-3">
        {sheetCategories.length === 0 && (
          <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12.5, color: "rgba(247,242,231,0.4)" }}>{t.noSheets}</div>
        )}
        {sheetCategories.map((cat) => (
          <div key={cat.id} style={{ background: "rgba(247,242,231,0.06)", border: "1px solid rgba(247,242,231,0.12)", borderRadius: 14, padding: 14 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 9, height: 9, borderRadius: 999, background: cat.accent, flexShrink: 0 }} />
                <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 14, color: PAPER }}>
                  {lang === "th" ? cat.nameTh : cat.nameEn}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onRefresh(cat)} style={{ color: "rgba(247,242,231,0.6)", padding: 6 }} aria-label="refresh">
                  {busyId === cat.id ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                </button>
                <button onClick={() => onRemove(cat.id)} style={{ color: RED, padding: 6 }} aria-label="remove">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(247,242,231,0.4)", marginTop: 4 }}>
              {t.wordsCount(cat.cards.length)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(247,242,231,0.04)", border: "1px dashed rgba(247,242,231,0.2)", borderRadius: 16, padding: 16, marginTop: 12 }}>
        <div className="flex items-center gap-2 mb-3">
          <Plus size={15} color={PAPER} />
          <div style={{ fontFamily: "'Kanit', sans-serif", fontWeight: 600, fontSize: 13, color: PAPER }}>{t.addSheet}</div>
        </div>
        <div className="flex flex-col gap-2">
          <input style={inputStyle} placeholder={t.sheetNameTh} value={nameTh} onChange={(e) => setNameTh(e.target.value)} />
          <input style={inputStyle} placeholder={t.sheetNameEn} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          <div className="flex items-center gap-2">
            <Link2 size={14} color="rgba(247,242,231,0.5)" />
            <input style={inputStyle} placeholder={t.sheetUrl} value={csvUrl} onChange={(e) => setCsvUrl(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                style={{
                  width: 22, height: 22, borderRadius: 999, background: c,
                  border: accent === c ? `2px solid ${PAPER}` : "2px solid transparent",
                }}
                aria-label={c}
              />
            ))}
          </div>
          {error && <div style={{ color: RED, fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 12 }}>{error}</div>}
          <button
            onClick={handleAdd}
            disabled={adding}
            style={{ background: PAPER, color: INK, borderRadius: 10, padding: "10px 0", fontFamily: "'Kanit', sans-serif", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {adding ? t.fetching : t.addSheet}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18, background: "rgba(247,242,231,0.04)", borderRadius: 12, padding: 12 }}>
        <Info size={15} color="rgba(247,242,231,0.5)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontSize: 11.5, color: "rgba(247,242,231,0.55)", lineHeight: 1.6 }}>
          <div style={{ marginBottom: 6 }}>{t.formatHelp}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: "rgba(247,242,231,0.65)", wordBreak: "break-word" }}>
            word, pos, thai, synonyms, antonyms, example, exampleTh, choice1, choice2, choice3, choice4, correctIndex
          </div>
          <div style={{ marginTop: 6 }}>
            {lang === "th"
              ? "* synonyms/antonyms คั่นด้วย ; และคอลัมน์ choice/correctIndex เว้นว่างได้ถ้าไม่ต้องการโหมดควิซ (Google Sheets → แชร์ → เผยแพร่สู่เว็บ → เลือก CSV)"
              : "* separate synonyms/antonyms with ; — leave the choice/correctIndex columns blank to skip quiz mode. (Google Sheets → Share → Publish to web → CSV)"}
          </div>
          <div style={{ marginTop: 8 }}>{t.savedNote}</div>
        </div>
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
  const [screen, setScreen] = useState("home"); // home | deck | settings
  const [activeDeck, setActiveDeck] = useState(null);
  const [revengeDeck, setRevengeDeck] = useState(() => loadJSON("revenge-deck", []));
  const [sheetCategories, setSheetCategories] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const loadedRef = useRef(false);

  // ---- load saved sheet-category configs on mount, then fetch their live CSV data ----
  useEffect(() => {
    (async () => {
      const configs = loadJSON("sheet-categories", []);
      if (configs.length > 0) {
        const loaded = await Promise.all(
          configs.map(async (cfg) => {
            try {
              const cards = await fetchSheetCards(cfg.csvUrl, cfg.id);
              return { ...cfg, cards, fromSheet: true, stamp: cfg.nameEn.slice(0, 4).toUpperCase() };
            } catch (e) {
              return { ...cfg, cards: cfg.cachedCards || [], fromSheet: true, stamp: cfg.nameEn.slice(0, 4).toUpperCase() };
            }
          })
        );
        setSheetCategories(loaded);
      }
      loadedRef.current = true;
    })();
  }, []);

  // ---- persist revenge deck on change ----
  useEffect(() => {
    if (!loadedRef.current) return;
    saveJSON("revenge-deck", revengeDeck);
  }, [revengeDeck]);

  const persistSheetConfigs = (cats) => {
    const configs = cats.map(({ id, nameTh, nameEn, csvUrl, accent, cards }) => ({ id, nameTh, nameEn, csvUrl, accent, cachedCards: cards }));
    saveJSON("sheet-categories", configs);
  };

  const allCategories = useMemo(() => [...CATEGORIES, ...sheetCategories], [sheetCategories]);

  const cardIndex = useMemo(() => {
    const map = {};
    allCategories.forEach((cat) => cat.cards.forEach((c) => (map[c.id] = { ...c, categoryId: cat.id, color: cat.accent, stamp: cat.stamp })));
    return map;
  }, [allCategories]);

  const openCategory = (cat) => {
    setActiveDeck({
      categoryId: cat.id,
      color: cat.accent,
      cards: cat.cards,
      stampByCard: Object.fromEntries(cat.cards.map((c) => [c.id, cat.stamp])),
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
      stampByCard: Object.fromEntries(cards.map((c) => [c.id, c.stamp])),
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

  const handleAddSheet = async ({ nameTh, nameEn, csvUrl, accent }) => {
    const id = `sheet-${Date.now()}`;
    try {
      const cards = await fetchSheetCards(csvUrl, id);
      const newCat = { id, nameTh, nameEn, csvUrl, accent, cards, fromSheet: true, stamp: nameEn.slice(0, 4).toUpperCase() };
      setSheetCategories((prev) => {
        const next = [...prev, newCat];
        persistSheetConfigs(next);
        return next;
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleRemoveSheet = (id) => {
    setSheetCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistSheetConfigs(next);
      return next;
    });
  };

  const handleRefreshSheet = async (cat) => {
    setBusyId(cat.id);
    try {
      const cards = await fetchSheetCards(cat.csvUrl, cat.id);
      setSheetCategories((prev) => {
        const next = prev.map((c) => (c.id === cat.id ? { ...c, cards } : c));
        persistSheetConfigs(next);
        return next;
      });
    } catch (e) {
      // keep existing cached cards on failure
    }
    setBusyId(null);
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
            onOpenSettings={() => setScreen("settings")}
          />
        )}
        {screen === "deck" && activeDeck && (
          <DeckScreen deck={activeDeck} lang={lang} onExit={() => setScreen("home")} onSwipeResult={handleSwipeResult} />
        )}
        {screen === "settings" && (
          <SettingsScreen
            lang={lang}
            sheetCategories={sheetCategories}
            onAdd={handleAddSheet}
            onRemove={handleRemoveSheet}
            onRefresh={handleRefreshSheet}
            onExit={() => setScreen("home")}
            busyId={busyId}
          />
        )}
      </div>
    </div>
  );
}
