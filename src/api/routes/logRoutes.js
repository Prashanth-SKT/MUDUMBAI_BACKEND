// backend/src/api/routes/logRoutes.js
// ✅ Receives logs from frontend and writes to Winston
import express from "express";
import { createLogger } from "../../services/loggerService.js";

const logger = createLogger(import.meta.url);
const router = express.Router();

// POST /api/logs - Receive frontend logs
router.post("/", (req, res) => {
  logger.entry("POST /", { body: req.body });
  
  try {
    const { level = "info", message, data, file, method } = req.body || {};
    
    if (!message) {
      logger.warn("POST /", "Empty log message received from frontend");
      return res.status(400).json({ success: false, message: "Missing message" });
    }

    // Format frontend log with file context
    const formattedMsg = file && method 
      ? `[${file}][${method}] ${message}`
      : message;

    // Route to appropriate log level
    switch(level?.toLowerCase()) {
      case "error":
        logger.frontend(`❌ ${formattedMsg}`, data || {});
        break;
      case "warn":
        logger.frontend(`⚠️ ${formattedMsg}`, data || {});
        break;
      case "debug":
        logger.frontend(`🔍 ${formattedMsg}`, data || {});
        break;
      default:
        logger.frontend(formattedMsg, data || {});
    }

    logger.exit("POST /", { success: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("POST /", "Failed to process frontend log", error);
    return res.status(500).json({ success: false, message: "Log write failed" });
  }
});

// GET /api/logs - Retrieve recent logs (optional feature)
router.get("/", (req, res) => {
  logger.info("GET /", "Log retrieval requested");
  res.json({ success: true, message: "Log retrieval not yet implemented" });
});

export default router;
