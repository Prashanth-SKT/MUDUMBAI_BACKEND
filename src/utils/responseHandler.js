/**
 * Unified response helpers (SRP).
 * Always return a predictable envelope to the frontend.
 */
export const ok = (res, data = {}, message = "OK", status = 200) =>
  res.status(status).json({ success: true, message, ...("data" in data ? data : { data }) });

export const created = (res, data = {}, message = "Created") =>
  ok(res, data, message, 201);

export const fail = (res, status = 400, message = "Bad Request", details = undefined) =>
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
