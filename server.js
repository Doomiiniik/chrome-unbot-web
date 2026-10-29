// server.js — najprostszy możliwy backend
const express = require("express");
const path = require("path");
const { analyzeFingerprint, validateFingerprint } = require("./scoring");
const Database = require("better-sqlite3");
const rateLimit = require("express-rate-limit");
const db = new Database("scans.db");   // otwórz plik bazy (jeśli go nie ma, utworzy)

db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    score INTEGER NOT NULL,
    user_agent TEXT
  )
`);

const insertScan = db.prepare(
  "INSERT INTO scans (created_at, score, user_agent) VALUES (?, ?, ?)"
);


const statsQuery = db.prepare(`
  SELECT
    COUNT(*) AS total,
    ROUND(AVG(score),1) AS avg_score,
    SUM(score >= 50) AS likely_bots
  FROM scans
`);



const app = express();
app.set("trust proxy", 1);

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// JSON parser with limit
app.use(express.json({ limit: "10kb" }));

// Serwujemy folder web/
app.use(express.static(path.join(__dirname, "web")));

// ----------------------
// ENDPOINTS
// ----------------------
const limiter = rateLimit({
  windowMs: 60* 1000,  
  limit: 10,      
});

app.use("/analyze-web", limiter);


app.post("/analyze-web", (req, res) => {
  console.log("POST /analyze-web");
  const fp = req.body || {};
  const error = validateFingerprint(fp);
   if (error) {
      return res.status(400).json({ error });  
      }
  headerUA = req.get("User-Agent");
  const result = analyzeFingerprint(fp, req.ip, headerUA);
  insertScan.run(new Date().toISOString(), result.score, req.get("User-Agent"));
  res.json(result);
});


app.get("/stats", (req, res) => {
  const stats = statsQuery.get();
  res.json(stats);
});




// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 3000;   // weź z env, a jak nie ma → 3000

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});