// ============================================================================
//  แก้ไฟล์นี้ไฟล์เดียวเพื่อจัดการหมวดหมู่คำศัพท์ทั้งหมดของเว็บ
//  This is the ONLY file you need to edit to manage word categories.
// ============================================================================
//
// มี 2 แบบ:
//
// 1) SHEET_CATEGORIES — ดึงคำศัพท์สดจาก Google Sheets ของคุณ (แนะนำ)
//    ใส่ลิงก์ CSV ที่ "Publish to web" แล้วเท่านั้น (ไม่ใช่ลิงก์แชร์ปกติ)
//    วิธีได้ลิงก์: เปิด Google Sheets → File → Share → Publish to web
//    → เลือกชีต → เลือกรูปแบบ "Comma-separated values (.csv)" → Publish → copy ลิงก์
//
//    คอลัมน์ที่ต้องมีในชีต (แถวแรกเป็นหัวคอลัมน์):
//    word, pos, thai, synonyms, antonyms, example, exampleTh,
//    choice1, choice2, choice3, choice4, correctIndex
//    - synonyms / antonyms คั่นด้วย ;
//    - choice1-4 และ correctIndex (0=choice1, 1=choice2, ...) เว้นว่างได้ถ้าไม่ต้องการโหมดควิซ
//
// 2) SAMPLE_CATEGORIES — คำศัพท์ตัวอย่างที่ฝังมากับโค้ดเลย (เผื่ออยากมีชุดสาธิต หรือไม่อยากยุ่งกับ Sheets)
//    ลบทิ้งได้ถ้าไม่ต้องการ

export const SHEET_CATEGORIES = [
   {
     id: "my-alevel",
     nameTh: "A-Level ชุดที่ 1",
     nameEn: "A-Level Set 1",
     accent: "#2BB673",
     csvUrl: "https://docs.google.com/spreadsheets/d/e/1_exFajkCwY7rw-7id_IPQBUejb9iKcPq/pub?output=csv",
   },
];

export const SAMPLE_CATEGORIES = [
  {
    id: "tgat-demo",
    nameTh: "TGAT ภาษาอังกฤษ (ตัวอย่าง)",
    nameEn: "TGAT English (sample)",
    accent: "#E1483C",
    cards: [
      { id: "tgat-1", word: "ambiguous", pos: "adj.", thai: "คลุมเครือ, กำกวม", synonyms: ["vague", "unclear"], antonyms: ["clear", "precise"], example: "The instructions were so ambiguous that no one knew where to start.", exampleTh: "คำสั่งนั้นคลุมเครือมากจนไม่มีใครรู้ว่าจะเริ่มตรงไหน", quiz: { options: ["คลุมเครือ", "รวดเร็ว", "ราคาแพง", "อ่อนโยน"], correctIndex: 0 } },
      { id: "tgat-2", word: "resilient", pos: "adj.", thai: "ยืดหยุ่น, ฟื้นตัวได้เร็ว", synonyms: ["tough", "adaptable"], antonyms: ["fragile", "weak"], example: "Coastal cities need to become more resilient to flooding.", exampleTh: "เมืองชายฝั่งต้องมีความยืดหยุ่นต่อน้ำท่วมมากขึ้น", quiz: { options: ["เปราะบาง", "ยืดหยุ่นและฟื้นตัวเร็ว", "โบราณ", "หายาก"], correctIndex: 1 } },
      { id: "tgat-3", word: "meticulous", pos: "adj.", thai: "พิถีพิถัน, ละเอียดรอบคอบ", synonyms: ["thorough", "precise"], antonyms: ["careless", "sloppy"], example: "She kept meticulous records of every experiment.", exampleTh: "เธอจดบันทึกการทดลองทุกครั้งอย่างละเอียดรอบคอบ", quiz: { options: ["ประมาท", "พิถีพิถัน", "ใจร้อน", "เงียบขรึม"], correctIndex: 1 } },
      { id: "tgat-4", word: "inevitable", pos: "adj.", thai: "หลีกเลี่ยงไม่ได้", synonyms: ["unavoidable", "certain"], antonyms: ["avoidable", "uncertain"], example: "With no plan in place, the delay was inevitable.", exampleTh: "เมื่อไม่มีแผนรองรับ ความล่าช้าจึงหลีกเลี่ยงไม่ได้", quiz: { options: ["หลีกเลี่ยงไม่ได้", "น่าประหลาดใจ", "ชั่วคราว", "ผิดกฎหมาย"], correctIndex: 0 } },
    ],
  },
  {
    id: "medical-demo",
    nameTh: "คำศัพท์การแพทย์ (ตัวอย่าง)",
    nameEn: "Medical Terms (sample)",
    accent: "#F2B705",
    cards: [
      { id: "med-1", word: "diagnosis", pos: "n.", thai: "การวินิจฉัยโรค", synonyms: ["assessment", "identification"], antonyms: ["misdiagnosis"], example: "An early diagnosis greatly improves the treatment outcome.", exampleTh: "การวินิจฉัยตั้งแต่เนิ่นๆ ช่วยให้ผลการรักษาดีขึ้นมาก", quiz: { options: ["การผ่าตัด", "การวินิจฉัยโรค", "การพักฟื้น", "การฉีดยา"], correctIndex: 1 } },
      { id: "med-2", word: "chronic", pos: "adj.", thai: "เรื้อรัง", synonyms: ["persistent", "long-lasting"], antonyms: ["acute", "temporary"], example: "Chronic stress can weaken the immune system over time.", exampleTh: "ความเครียดเรื้อรังสามารถทำให้ภูมิคุ้มกันอ่อนแอลงเมื่อเวลาผ่านไป", quiz: { options: ["เฉียบพลัน", "เรื้อรัง", "หายาก", "ติดต่อได้"], correctIndex: 1 } },
      { id: "med-3", word: "prescribe", pos: "v.", thai: "สั่งยา, กำหนดการรักษา", synonyms: ["recommend", "order"], antonyms: [], example: "The doctor prescribed antibiotics for the infection.", exampleTh: "แพทย์สั่งยาปฏิชีวนะเพื่อรักษาการติดเชื้อ", quiz: { options: ["สั่งยา", "ผ่าตัด", "ตรวจเลือด", "เอ็กซเรย์"], correctIndex: 0 } },
      { id: "med-4", word: "symptom", pos: "n.", thai: "อาการของโรค", synonyms: ["sign", "indication"], antonyms: [], example: "Fever is a common symptom of many infections.", exampleTh: "ไข้เป็นอาการทั่วไปของการติดเชื้อหลายชนิด", quiz: { options: ["อาการของโรค", "ผลข้างเคียง", "ใบสั่งยา", "การผ่าตัด"], correctIndex: 0 } },
    ],
  },
];
