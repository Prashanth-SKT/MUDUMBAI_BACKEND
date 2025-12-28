/**
 * Express App Configuration
 * Middleware setup and route mounting
 * ✅ Enhanced with comprehensive logging for flow tracking
 */
import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import apiRoutes from "./api/index.js";
import { errorHandler, notFoundHandler } from "./utils/errorHandler.js";
import { createLogger } from "./services/loggerService.js";

const logger = createLogger(import.meta.url);
const app = express();

logger.info("init", "🔧 Initializing Express app");

// Security & parsing middleware
logger.info("init", "Setting up security middleware (Helmet)");
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
logger.info("init", `Setting up CORS (allowed origin: ${corsOrigin})`);
app.use(cors({ origin: corsOrigin }));

logger.info("init", "Setting up body parsers");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
logger.info("init", "Setting up HTTP request logging (Morgan)");
app.use(morgan("combined"));

// Health check
logger.info("init", "Mounting health check endpoint");
app.get("/health", (_req, res) => {
  logger.info("healthCheck", "Health check requested");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
logger.info("init", "Mounting API routes at /api");
app.use("/api", apiRoutes);

// Error handling (must be last)
logger.info("init", "Setting up error handlers");
app.use(notFoundHandler);
app.use(errorHandler);

logger.info("init", "✅ Express app initialized successfully");

export default app;
