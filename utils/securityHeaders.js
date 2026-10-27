// utils/securityHeaders.js
// Security headers for everything the Express server sends. The API only returns JSON, so its responses
// are locked down completely (no scripts, no framing, never cached). The website's own headers are set
// by Netlify from site-headers.mjs.
module.exports = function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',          // browsers must not guess a different file type
    'X-Frame-Options': 'DENY',                    // can't be shown inside another site's frame
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'same-origin', // other sites can't embed our responses
  });
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains'); // HTTPS only, 180 days

  if (req.path.startsWith('/api/')) {
    res.set({
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store', // account data must not be kept by browsers or proxies
    });
  }
  next();
};
