// controllers/passwordReset.js
// "Forgot password" for landlords and private users. Emails go through the shared mailer (utils/mailer.js),
// so they follow the EMAIL_* / SMTP_* settings in .env.
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendMail, isConfigured } = require('../../utils/mailer');

const LINK_LIFETIME = '1h';
const MIN_PASSWORD_LENGTH = 6;
const GENERIC_REPLY = "If an account exists for that email, we've sent a link to reset your password. Check your inbox and spam folder.";
const BAD_LINK = 'This reset link is invalid or has expired. Please request a new one.';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// JWT_SECRET if set, otherwise the existing SESSION_SECRET
const baseSecret = () => process.env.JWT_SECRET || process.env.SESSION_SECRET || '';

// Including the current password hash makes each link single-use: it stops working once the password changes
const secretFor = (user) => baseSecret() + user.password;

// Where the reset page lives. Set FRONTEND_URL in production (e.g. https://watcal.com). Without it, only a
// local development address taken from the request is trusted, so a forged Origin can't redirect the link.
function siteUrl(req) {
    if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/+$/, '');
    const origin = req.get('origin') || '';
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : 'http://localhost:5173';
}

function resetEmail({ username, link }) {
    const text = [
        `Hello ${username},`,
        '',
        'We received a request to reset your WatCal password. Open this link to choose a new one:',
        link,
        '',
        'The link works once and expires in 1 hour. If you did not ask for this, you can ignore this email; your password will not change.',
        'WatCal',
    ].join('\n');

    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr><td style="background:#1a1a1a;padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold">Wat<span style="color:#06cc02">Cal</span> password reset</td></tr>
  <tr><td style="padding:24px">
    <p style="margin:0 0 8px;font-size:16px">Hello ${escapeHtml(username)},</p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.5">We received a request to reset your WatCal password. Choose a new one with the button below.</p>
    <p style="margin:0 0 22px;text-align:center"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 28px;border-radius:24px;background:#06cc02;color:#000000;font-weight:bold;text-decoration:none">Reset my password</a></p>
    <p style="margin:0 0 6px;font-size:13px;color:#666;line-height:1.5">Or paste this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="${escapeHtml(link)}" style="color:#047a02">${escapeHtml(link)}</a></p>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.5">The link works once and expires in 1 hour. If you did not ask for this, you can ignore this email; your password will not change.</p>
  </td></tr>
</table></body></html>`;

    return { subject: 'Reset your WatCal password', text, html };
}

/**
 * Builds the two handlers for one account type.
 * Model: Landlord or Tenant. resetPath: the React page that reads ?token= (e.g. "/landlord/reset-password").
 */
module.exports = function passwordReset({ Model, resetPath }) {
    // POST { email }: always the same reply, so it can't be used to check who has an account
    const forgot = async (req, res) => {
        const email = String(req.body.email || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ msg: 'Please enter a valid email address.' });
        }
        if (!isConfigured() || !baseSecret()) {
            console.error('Password reset is not set up: check EMAIL_USER / EMAIL_PASS and JWT_SECRET or SESSION_SECRET in .env');
            return res.status(503).json({ msg: "Password reset emails aren't set up yet. Please contact us for help." });
        }

        try {
            const user = await Model.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
            if (user) {
                const token = jwt.sign({ id: String(user._id) }, secretFor(user), { expiresIn: LINK_LIFETIME });
                const link = `${siteUrl(req)}${resetPath}?token=${encodeURIComponent(token)}`;
                const result = await sendMail({ to: user.email, ...resetEmail({ username: user.username, link }) });
                if (result.status !== 'sent') {
                    console.error(`Password reset email to ${user.email} ${result.status}: ${result.error}`);
                    return res.status(500).json({ msg: "We couldn't send the email right now. Please try again later." });
                }
            }
            res.status(200).json({ msg: GENERIC_REPLY });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: 'Server error' });
        }
    };

    // POST { token, newPassword }
    const reset = async (req, res) => {
        const { token, newPassword } = req.body;
        if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ msg: `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
        }

        try {
            const decoded = typeof token === 'string' ? jwt.decode(token) : null;
            const user = decoded && decoded.id ? await Model.findById(decoded.id).catch(() => null) : null;
            if (!user) return res.status(400).json({ msg: BAD_LINK });

            try {
                jwt.verify(token, secretFor(user)); // fails if expired, tampered with, or already used
            } catch {
                return res.status(400).json({ msg: BAD_LINK });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
            res.status(200).json({ msg: 'Password reset successful' });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: 'Server error' });
        }
    };

    return { forgot, reset };
};
