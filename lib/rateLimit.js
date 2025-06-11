// lib/rateLimit.js
const rateLimitWindowMs = 60 * 1000; // 1 minute window
const maxRequests = 10; // max 10 requests per IP per window

const ipRequestCounts = new Map();

export function rateLimit(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const now = Date.now();
  const record = ipRequestCounts.get(ip) || { count: 0, startTime: now };

  if (now - record.startTime > rateLimitWindowMs) {
    // Reset counts after window
    record.count = 1;
    record.startTime = now;
    ipRequestCounts.set(ip, record);
    return true;
  }

  if (record.count >= maxRequests) {
    res.setHeader('Retry-After', Math.ceil((rateLimitWindowMs - (now - record.startTime)) / 1000));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return false;
  }

  record.count++;
  ipRequestCounts.set(ip, record);
  return true;
}
