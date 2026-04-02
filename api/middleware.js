// Rate limiting + API key validation middleware
// No auth for reads (GET), rate limit + optional API key for writes (POST/PATCH)



// In-memory rate limit store (resets on cold start, good enough for serverless)
const rateLimits = {};

function rateLimit(ip, limit, windowMs) {
  const now = Date.now();
  const key = ip || 'unknown';
  
  if (!rateLimits[key] || rateLimits[key].reset < now) {
    rateLimits[key] = { count: 1, reset: now + windowMs };
    return { allowed: true, remaining: limit - 1 };
  }
  
  rateLimits[key].count++;
  if (rateLimits[key].count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((rateLimits[key].reset - now) / 1000) };
  }
  return { allowed: true, remaining: limit - rateLimits[key].count };
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.socket?.remoteAddress || 'unknown';
}

// Validate API key for write operations (optional — if CHAIN911_API_KEY env var is set)
function validateApiKey(req) {
  const requiredKey = process.env.CHAIN911_API_KEY;
  if (!requiredKey) return true; // No key configured = open access

  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  return providedKey === requiredKey;
}

function protect(handler, opts = {}) {
  const { ratePerMinute = 10, requireAuth = false } = opts;

  return async function(req, res) {
    // GET requests: higher rate limit, no auth needed
    if (req.method === 'GET') {
      const rl = rateLimit(getClientIp(req), 60, 60000); // 60 reads/min
      if (!rl.allowed) {
        return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: rl.retryAfter });
      }
      res.setHeader('X-RateLimit-Remaining', rl.remaining);
      return handler(req, res);
    }

    // Write requests: stricter rate limit + optional auth
    const rl = rateLimit(getClientIp(req), ratePerMinute, 60000);
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in ' + rl.retryAfter + 's', retryAfter: rl.retryAfter });
    }

    if (requireAuth && !validateApiKey(req)) {
      return res.status(401).json({ error: 'API key required. Set x-api-key header.' });
    }

    res.setHeader('X-RateLimit-Remaining', rl.remaining);
    return handler(req, res);
  };
}

module.exports = { protect, rateLimit, validateApiKey, getClientIp };
