// utils/rateLimit.js
// Limits how often the same visitor (or the same account) can try something, e.g. logging in.
// Counts are kept in memory, which suits a single server; they reset when the server restarts.
//
// The visitor's address comes from req.ip, so `trust proxy` must match the hosting (see app.js, TRUST_PROXY).

const buckets = new Map(); // "limiter:key" -> { count, resetAt }

// Forget finished windows every minute
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}, 60 * 1000).unref();

const minutes = (ms) => Math.ceil(ms / 60000);

/**
 * name:        unique name for this limit
 * windowMs:    length of the window
 * max:         attempts allowed in a window
 * key(req):    what to count by (default: the visitor's address); return null to skip counting
 * failedOnly:  count only requests that fail (status 400+), e.g. wrong passwords, not successful logins;
 *              or a function (status) => true for the statuses to count
 */
function rateLimit({ name, windowMs, max, key = (req) => req.ip, failedOnly = false, message }) {
  return (req, res, next) => {
    const id = key(req);
    if (id === null || id === undefined || id === '') return next();
    const bucketKey = `${name}:${String(id).toLowerCase()}`;
    const now = Date.now();
    let bucket = buckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }

    if (bucket.count >= max) {
      const wait = bucket.resetAt - now;
      res.set('Retry-After', String(Math.ceil(wait / 1000)));
      return res.status(429).json({
        msg: message || `Too many attempts. Please wait ${minutes(wait)} minute${minutes(wait) === 1 ? '' : 's'} and try again.`,
      });
    }

    if (failedOnly) {
      const failed = typeof failedOnly === 'function' ? failedOnly : (status) => status >= 400 && status !== 429;
      res.on('finish', () => {
        if (failed(res.statusCode)) bucket.count += 1;
      });
    } else {
      bucket.count += 1;
    }
    next();
  };
}

// The limits WatCal uses
const MIN = 60 * 1000;
const field = (name) => (req) => (req.body && typeof req.body[name] === 'string' ? req.body[name].trim() : null);

const limits = {
  // Wrong passwords: 5 per account and 30 per visitor every 15 minutes
  login: [
    rateLimit({ name: 'login-account', windowMs: 15 * MIN, max: 5, failedOnly: true, key: (req) => field('username')(req) && `${req.path}:${field('username')(req)}` }),
    rateLimit({ name: 'login-visitor', windowMs: 15 * MIN, max: 30, failedOnly: true }),
  ],
  // New accounts: 10 per visitor per hour
  signup: [rateLimit({ name: 'signup', windowMs: 60 * MIN, max: 10 })],
  // Reset emails: 3 per email address and 10 per visitor per hour
  forgotPassword: [
    rateLimit({ name: 'forgot-email', windowMs: 60 * MIN, max: 3, key: field('email') }),
    rateLimit({ name: 'forgot-visitor', windowMs: 60 * MIN, max: 10 }),
  ],
  // Setting a new password from a link: 10 tries per visitor every 15 minutes
  resetPassword: [rateLimit({ name: 'reset', windowMs: 15 * MIN, max: 10 })],
  // Google sign-in: 30 per visitor every 15 minutes
  google: [rateLimit({ name: 'google', windowMs: 15 * MIN, max: 30 })],
  // "View your bill" with wrong IDs: 10 per visitor every 15 minutes
  viewBill: [rateLimit({ name: 'view-bill', windowMs: 15 * MIN, max: 10, failedOnly: true })],
  // Meter uploads with a wrong key: 20 per address every 15 minutes (real devices aren't affected)
  meterKey: [rateLimit({ name: 'meter-key', windowMs: 15 * MIN, max: 20, failedOnly: (status) => status === 401 })],
};

module.exports = { rateLimit, limits };
