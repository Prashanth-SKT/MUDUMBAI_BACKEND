/**
 * Global error middleware (SRP).
 * Converts thrown errors into API-safe responses.
 */
import { fail } from "./responseHandler.js";
import logger from "../services/loggerService.js";

export class AppError extends Error {
  constructor(message, status = 400, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFoundHandler = (_req, res) => fail(res, 404, "Route not found");

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const msg = err.message || "Internal Server Error";
  logger.error(`[Error] status=${status} message=${msg} details=${JSON.stringify(err.details || {})}`);
  return fail(res, status, msg, err.details);
};
