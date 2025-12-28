/**
 * Server entry point
 * ✅ Enhanced with comprehensive logging for flow tracking
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { createLogger } from "./services/loggerService.js";

const logger = createLogger(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

logger.info("startup", "🚀 Starting KLMN Backend Server...");

// Load environment variables from .env.local first, then .env
logger.info("startup", "Loading environment variables");
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config();

const PORT = process.env.PORT || 5000;
logger.info("startup", "Environment variables loaded", { PORT, NODE_ENV: process.env.NODE_ENV });

// Verify OpenAI key is loaded
if (!process.env.OPENAI_API_KEY) {
  logger.warn("startup", "OPENAI_API_KEY not found. OpenAI features will not work.");
} else {
  logger.info("startup", "OpenAI API key found");
}

// Verify Firebase configuration
if (!process.env.JAYRAM_PROJECT_ID) {
  logger.warn("startup", "JAYRAM_PROJECT_ID not found. Firebase may not work.");
} else {
  logger.info("startup", "Firebase JAYRAM configuration found");
}

if (!process.env.MUDUMBAI_PROJECT_ID) {
  logger.warn("startup", "MUDUMBAI_PROJECT_ID not found. User database may not work.");
} else {
  logger.info("startup", "Firebase MUDUMBAI configuration found");
}

// Start server
try {
  app.listen(PORT, () => {
    logger.info("startup", `✅ Server running successfully on port ${PORT}`);
    logger.info("startup", `📍 Health check: http://localhost:${PORT}/health`);
    logger.info("startup", `📍 API base: http://localhost:${PORT}/api`);
    logger.info("startup", "Server ready to accept requests");
  });
} catch (error) {
  logger.error("startup", "Failed to start server", error);
  process.exit(1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error("process", "Uncaught Exception", error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error("process", "Unhandled Rejection", reason);
});
