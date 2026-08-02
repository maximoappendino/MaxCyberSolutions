// Per-IP rate limiter backed by D1.
// Returns false if the caller has exceeded `max` requests in the current minute.
export async function rateLimit(env, key, max) {
  const window = Math.floor(Date.now() / 60000);
  try {
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, window, count) VALUES (?, ?, 1) ON CONFLICT (key, window) DO UPDATE SET count = count + 1'
    ).bind(key, window).run();
    const row = await env.DB.prepare(
      'SELECT count FROM rate_limits WHERE key = ? AND window = ?'
    ).bind(key, window).first();
    // Probabilistically clean up windows older than 10 minutes
    if (Math.random() < 0.02) {
      env.DB.prepare('DELETE FROM rate_limits WHERE window < ?').bind(window - 10).run();
    }
    return (row?.count ?? 0) <= max;
  } catch {
    return true; // fail open on DB error
  }
}
