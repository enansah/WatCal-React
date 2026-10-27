// Security headers for the website's pages. `npm run build` writes them to dist/_headers, which Netlify
// applies to every page; `npm run preview` sends the same headers so they can be checked locally.
// If you add something from another site (a script, font, image or frame), allow its address below.

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com/gsi/client",                                    // Google sign-in
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src 'self' https://fonts.gstatic.com",                                                   // Lexend font
  "img-src 'self' data: blob: https://*.googleusercontent.com",                                  // profile photos
  "connect-src 'self' https://accounts.google.com/gsi/",
  "frame-src https://accounts.google.com/gsi/",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export const siteHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // Google sign-in opens a popup
  'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
};

// Netlify's _headers file format
export const netlifyHeadersFile = () =>
  `/*\n${Object.entries(siteHeaders).map(([name, value]) => `  ${name}: ${value}`).join('\n')}\n`;
