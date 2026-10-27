// utils/mailer.js
const nodemailer = require('nodemailer');

/*
 * Email settings (.env):
 *   EMAIL_USER, EMAIL_PASS   account that sends the mail (Outlook365 by default, as the password reset uses)
 *   SMTP_HOST, SMTP_PORT     optional: use another SMTP server instead of Outlook365
 *                            (Gmail: smtp.gmail.com, port 587 or 465, with a Google app password as EMAIL_PASS)
 *   EMAIL_FROM               optional: "WatCal <billing@example.com>"; defaults to EMAIL_USER
 *   MAIL_TRANSPORT=json      development only: build emails without sending them (returned in the result)
 */
let transporter = null;

const isConfigured = () => process.env.MAIL_TRANSPORT === 'json' || !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

function getTransporter() {
    if (transporter) return transporter;
    if (process.env.MAIL_TRANSPORT === 'json') {
        transporter = nodemailer.createTransport({ jsonTransport: true });
    } else if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT) || 587;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465, // 465 uses TLS from the start; 587 upgrades with STARTTLS
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
    } else {
        transporter = nodemailer.createTransport({
            service: 'Outlook365',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
    }
    return transporter;
}

// Sends one email. Resolves to { status: 'sent' | 'skipped' | 'failed', error?, message? } and never throws.
async function sendMail({ to, subject, text, html }) {
    if (!isConfigured()) {
        return { status: 'skipped', error: 'Email is not set up (EMAIL_USER / EMAIL_PASS missing)' };
    }
    try {
        const info = await getTransporter().sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'WatCal <no-reply@watcal.local>',
            to, subject, text, html,
        });
        return { status: 'sent', message: info.message };
    } catch (err) {
        return { status: 'failed', error: err.message };
    }
}

module.exports = { sendMail, isConfigured };
