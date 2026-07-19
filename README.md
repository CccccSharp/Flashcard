# TCAS Vocab Vault

เว็บแฟลชการ์ด/ควิซคำศัพท์สำหรับสอบ TCAS / TGAT / A-Level

**คุณ (เจ้าของเว็บ) เป็นคนใส่ลิงก์ Google Sheets ไว้ในโค้ดล่วงหน้า** — ผู้ใช้ที่เข้าเว็บจะเห็นหมวดหมู่คำศัพท์
ที่ดึงมาจากชีตของคุณโดยอัตโนมัติทันที ไม่ต้องกดเพิ่มลิงก์เอง ไม่มีหน้าตั้งค่าให้ผู้ใช้ยุ่ง

ความคืบหน้าส่วนตัว (กองการ์ดล้างแค้น) ของผู้ใช้แต่ละคนจะถูกบันทึกไว้ใน**เบราว์เซอร์เครื่องนั้นๆ**
ไม่มีระบบล็อกอิน ไม่มีฐานข้อมูลภายนอก

---

## 1. เพิ่มลิงก์ Google Sheets ของคุณ (ทำครั้งเดียวตอนตั้งค่า)

เปิดไฟล์ **`src/vocabConfig.js`** — นี่คือไฟล์เดียวที่ต้องแก้

1. เปิด Google Sheets ของคุณ → **File → Share → Publish to web**
2. เลือกชีตที่ต้องการ → เลือกรูปแบบ **Comma-separated values (.csv)** → **Publish** → copy ลิงก์ที่ได้
3. ในไฟล์ `vocabConfig.js` เพิ่มรายการเข้าไปในตัวแปร `SHEET_CATEGORIES` เช่น:

```js
export const SHEET_CATEGORIES = [
  {
    id: "my-tgat",
    nameTh: "TGAT ชุดที่ 1",
    nameEn: "TGAT Set 1",
    accent: "#5B7FE0",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?output=csv",
  },
  {
    id: "my-alevel",
    nameTh: "A-Level ชุดที่ 1",
    nameEn: "A-Level Set 1",
    accent: "#2BB673",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/YYYYYYYY/pub?output=csv",
  },
];
```

เพิ่มได้กี่ชุดก็ได้ แต่ละชุดจะกลายเป็นหนึ่งหมวดหมู่บนหน้าแรกของเว็บ ผู้ใช้ทุกคนที่เข้าเว็บจะเห็นชุดเดียวกันหมด

**คอลัมน์ที่ต้องมีในชีต (แถวแรกเป็นหัวคอลัมน์):**

| word | pos | thai | synonyms | antonyms | example | exampleTh | choice1 | choice2 | choice3 | choice4 | correctIndex |
|------|-----|------|----------|----------|---------|-----------|---------|---------|---------|---------|--------------|
| ambiguous | adj. | คลุมเครือ | vague;unclear | clear;precise | The instructions were ambiguous. | คำสั่งคลุมเครือ | คลุมเครือ | รวดเร็ว | ราคาแพง | อ่อนโยน | 0 |

- `synonyms` / `antonyms` คั่นด้วย `;`
- คอลัมน์ `choice1-4` และ `correctIndex` (0 = choice1, 1 = choice2, ...) เว้นว่างได้ถ้าคำนั้นไม่ต้องการโหมดควิซ — จะเหลือแค่โหมดแฟลชการ์ด

ในไฟล์เดียวกันยังมี `SAMPLE_CATEGORIES` เป็นคำศัพท์ตัวอย่างที่ฝังมากับโค้ดเลย (ไม่ได้ดึงจาก Sheets)
ลบทิ้งได้ถ้าไม่ต้องการชุดสาธิต

## 2. รันบนเครื่องตัวเอง

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 18 ขึ้นไป

```bash
npm install
npm run dev
```

เปิด `http://localhost:5173` ลองดูว่าหมวดหมู่จาก Google Sheets ที่ใส่ไว้ขึ้นมาถูกต้องไหม

## 3. Deploy ขึ้นเว็บจริง

ไม่ต้องตั้งค่า environment variable ใดๆ เลือกทางใดทางหนึ่ง:

### ตัวเลือก A: Vercel หรือ Netlify (แนะนำ ง่ายที่สุด)
1. อัปโค้ดขึ้น GitHub repo
2. เข้า [vercel.com](https://vercel.com) หรือ [netlify.com](https://netlify.com) → New Project → เลือก repo นี้
3. Build command: `npm run build`, Output directory: `dist`
4. กด Deploy

### ตัวเลือก B: static hosting อื่นๆ (Firebase Hosting, GitHub Pages, ฯลฯ)
```bash
npm run build
```
เอาไฟล์ในโฟลเดอร์ `dist/` ที่ได้ อัปโหลดขึ้นโฮสต์ที่ต้องการ

**เวลาจะเพิ่ม/แก้ลิงก์ Google Sheets ทีหลัง** ให้แก้ที่ `src/vocabConfig.js` แล้ว commit + push ใหม่
(ถ้า deploy ผ่าน Vercel/Netlify จะ build และขึ้นเว็บให้อัตโนมัติ)

## ข้อจำกัดที่ควรรู้

- ลิงก์ Sheet ต้องเป็นแบบ **Publish to web → CSV** (ไม่ใช่ลิงก์แชร์ปกติแบบ "Anyone with the link") เพราะเว็บต้องดึงข้อมูลแบบ public ไม่ผ่าน login
- คำศัพท์จะถูกดึงสดจาก Google Sheets ทุกครั้งที่มีคนเปิดเว็บ ถ้าคุณแก้คำในชีต ผู้ใช้จะเห็นข้อมูลใหม่ทันทีโดยไม่ต้อง deploy ใหม่ (ต่างจากการแก้ `SAMPLE_CATEGORIES` ที่ต้อง build/deploy ใหม่เพราะฝังอยู่ในโค้ด)
- ถ้าลิงก์ดึงไม่สำเร็จ (เช่น ยังไม่ได้ publish หรือ URL ผิด) หมวดหมู่นั้นจะขึ้นข้อความ "โหลดไม่สำเร็จ" บนหน้าแรกแทน

## โครงสร้างไฟล์

```
tcas-vocab-vault/
├── src/
│   ├── App.jsx          ← หน้าตาแอปทั้งหมด (Home, การ์ด, ควิซ)
│   ├── vocabConfig.js   ← ★ ไฟล์ที่คุณแก้เพื่อใส่ลิงก์ Google Sheets ★
│   ├── storage.js       ← บันทึกความคืบหน้าของผู้ใช้ใน localStorage
│   ├── main.jsx
│   └── index.css
├── .gitignore
└── package.json
```
