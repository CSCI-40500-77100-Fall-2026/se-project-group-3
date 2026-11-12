// Every error this service returns has the same shape, so callers can rely on it:
// { "error": { "code": "machine_readable", "message": "Human readable." } }
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

module.exports = { sendError };
