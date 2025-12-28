/**
 * backend/src/services/loggerService.js
 * ✅ UNIFIED LOGGER - Single source of truth for all backend logging
 * Provides file-scoped logging with automatic context for easy debugging
 */
import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Ensure logs directory exists
const logsDir = "logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format with file context
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [
    // Console output (colored for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // File output - all logs
    new winston.transports.File({ 
      filename: "logs/backend.log",
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // File output - errors only
    new winston.transports.File({ 
      filename: "logs/backend-errors.log",
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Frontend logs (from POST /api/logs)
    new winston.transports.File({ 
      filename: "logs/frontend.log",
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Helper to create file-scoped logger with automatic context
export const createLogger = (filePath) => {
  let fileName;
  
  // Handle both import.meta.url and regular file paths
  if (filePath.startsWith('file://')) {
    const fullPath = fileURLToPath(filePath);
    fileName = path.basename(fullPath, path.extname(fullPath));
  } else {
    fileName = path.basename(filePath, path.extname(filePath));
  }
  
  return {
    info: (method, message, meta = {}) => {
      logger.info(`[${fileName}][${method}] ${message}`, meta);
    },
    warn: (method, message, meta = {}) => {
      logger.warn(`[${fileName}][${method}] ${message}`, meta);
    },
    error: (method, message, error = null, meta = {}) => {
      const errorInfo = error ? {
        error: error.message || error,
        stack: error.stack,
        ...meta
      } : meta;
      logger.error(`[${fileName}][${method}] ${message}`, errorInfo);
    },
    debug: (method, message, meta = {}) => {
      logger.debug(`[${fileName}][${method}] ${message}`, meta);
    },
    // Shorthand for entry/exit logs
    entry: (method, params = {}) => {
      logger.info(`[${fileName}][${method}] ▶️ Entry`, params);
    },
    exit: (method, result = {}) => {
      logger.info(`[${fileName}][${method}] ✅ Exit`, result);
    },
    // Frontend logs helper
    frontend: (message, meta = {}) => {
      logger.info(`[FRONTEND] ${message}`, meta);
    }
  };
};

// Default logger for files that don't need file context
export default logger;
