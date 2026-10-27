// controllers/googleAuth.js
// "Continue with Google": the browser gets an ID token from Google Identity Services and sends it here.
// Set GOOGLE_CLIENT_ID in .env (Google Cloud Console > APIs & Services > Credentials > OAuth client ID, type Web).
const { OAuth2Client } = require('google-auth-library');
const Landlord = require('../models/Landlord');
const Tenant = require('../models/Tenant');
const sessionAccount = require('../../utils/sessionAccount');

const MODELS = { landlord: Landlord, tenant: Tenant };
const SIGNUP_WINDOW_MS = 15 * 60 * 1000; // time allowed to finish sign-up after choosing a Google account

const clientId = () => process.env.GOOGLE_CLIENT_ID || '';
let client = null;
const getClient = () => (client ||= new OAuth2Client());

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byEmail = (email) => ({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });

// GET /api/auth/google/config: tells the page whether Google sign-in is set up
exports.getConfig = (req, res) => {
    res.json({ clientId: clientId() || null });
};

// POST /api/auth/google { credential, role }: log in, link an existing account, or start sign-up
exports.googleSignIn = async (req, res) => {
    const { credential, role } = req.body;
    const Model = MODELS[role];

    if (!clientId()) {
        return res.status(503).json({ msg: 'Google sign-in is not set up yet.' });
    }
    if (!Model || typeof credential !== 'string') {
        return res.status(400).json({ msg: 'Invalid Google sign-in request.' });
    }

    let profile;
    try {
        // Checks Google's signature, that the token is for this app, and that it has not expired
        const ticket = await getClient().verifyIdToken({ idToken: credential, audience: clientId() });
        profile = ticket.getPayload();
    } catch (err) {
        console.error('Google token rejected:', err.message);
        return res.status(401).json({ msg: 'Google sign-in failed. Please try again.' });
    }

    if (!profile.email || !profile.email_verified) {
        return res.status(400).json({ msg: 'Your Google account email is not verified.' });
    }

    try {
        // Match the Google account first, then an existing account with the same email
        let user = await Model.findOne({ googleId: profile.sub });
        if (!user) user = await Model.findOne(byEmail(profile.email));

        if (user && user.googleId && user.googleId !== profile.sub) {
            return res.status(409).json({ msg: 'This WatCal account is linked to a different Google account.' });
        }

        if (user) {
            if (!user.googleId) {
                user.googleId = profile.sub; // link on first Google sign-in
                await user.save();
            }
            delete req.session.googleSignup;
            req.session[role] = sessionAccount(user); // same session as the password login
            return res.status(200).json({ status: 'loggedIn', msg: 'Login successful' });
        }

        // No account yet: remember the verified Google identity so sign-up can use it
        req.session.googleSignup = {
            role,
            googleId: profile.sub,
            email: profile.email,
            name: profile.name || '',
            expires: Date.now() + SIGNUP_WINDOW_MS,
        };
        return res.status(200).json({ status: 'signup', email: profile.email, name: profile.name || '' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Used by the sign-up controllers: the googleId verified for this browser, if it matches the role and
// email being registered, otherwise null. Call clearGoogleSignup once the account has been created.
exports.pendingGoogleId = (req, role, email) => {
    const pending = req.session && req.session.googleSignup;
    if (!pending || pending.role !== role || pending.expires < Date.now()) return null;
    if (String(email || '').trim().toLowerCase() !== pending.email.toLowerCase()) return null;
    return pending.googleId;
};

exports.clearGoogleSignup = (req) => {
    if (req.session) delete req.session.googleSignup;
};
