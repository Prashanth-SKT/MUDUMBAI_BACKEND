// backend/src/utils/logger.js
// ✅ Single source of truth for all backend logging

import fs from "fs";
import path from "path";

const LOG_PATH = process.env.LOG_FILE_PATH || "mudumbai_logs.txt";

// Ensure log file exists
function ensureLogFile() {
  try {
    const abs = path.resolve(LOG_PATH);
    const dir = path.dirname(abs);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(abs)) fs.writeFileSync(abs, "---- MUDUMBAI Logs ----\n");
    return abs;
  } catch (e) {
    const fallback = path.resolve("mudumbai_logs.txt");
    if (!fs.existsSync(fallback)) fs.writeFileSync(fallback, "---- MUDUMBAI Logs ----\n");
    return fallback;
  }
}

const LOG_FILE = ensureLogFile();

function tsIST() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });
}

function line(msg, data) {
  return `[${tsIST()}] ${msg}${data ? " " + JSON.stringify(data) : ""}`;
}

export const logger = {
  log: (msg, data = null) => {
    const l = line(msg, data);
    try { 
      fs.appendFileSync(LOG_FILE, l + "\n", "utf8"); 
    } catch (err) {
      console.error("Failed to write to log file:", err);
    }
    console.log(l);
  },
  warn: (msg, data = null) => logger.log(`⚠️ ${msg}`, data),
  error: (msg, err = null) => logger.log(`❌ ${msg}${err ? " " + (err.message || err) : ""}`),
  filePath: LOG_FILE
};

// Usage across backend:
// import { logger } from "./utils/logger.js";
// logger.log("Server started", { port: 5000 });