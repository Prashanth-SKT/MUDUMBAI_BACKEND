/**
 * Lightweight input validation (SRP).
 * Keeps controllers slim and testable.
 */
import { AppError } from "./errorHandler.js";

export const requireFields = (payload, fields = []) => {
  const missing = fields.filter((f) => payload[f] === undefined || payload[f] === null || payload[f] === "");
  if (missing.length) {
    throw new AppError(`Missing required field(s): ${missing.join(", ")}`, 422, { missing });
  }
};

export const normalizeAppName = (name) =>
  String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 64); // safe prefix

export const buildAppCollections = (appPrefix) => ([
  `${appPrefix}_pages`,
  `${appPrefix}_components`,
  `${appPrefix}_themes`,
  `${appPrefix}_actions`,
]);
