// utils/terms.js
// Agreement to the Terms of Service and Privacy Policy at sign-up.
// The version is the pages' "Last updated" dates (legal.json), so you can tell who agreed to which wording.
const legal = require('../legal.json');

const TERMS_VERSION = `Terms ${legal.termsUpdated}; Privacy ${legal.privacyUpdated}`;
const NOT_ACCEPTED = 'Please agree to the Terms of Service and Privacy Policy to continue.';

// The fields to save on a new account, or null when the sign-up didn't tick the box
const termsAcceptance = (body) =>
  body && body.acceptTerms === true ? { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } : null;

module.exports = { TERMS_VERSION, NOT_ACCEPTED, termsAcceptance };
