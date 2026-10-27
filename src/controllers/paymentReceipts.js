// controllers/paymentReceipts.js
const Payment = require('../models/Payment');
const Landlord = require('../models/Landlord');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const { sendMail } = require('../../utils/mailer');
const { meterLine } = require('../../utils/usageInsights');

const PROVIDERS = { mtn: 'MTN MoMo', telecel: 'Telecel Cash' };

const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `GH₵${Number(n).toFixed(2)}`;
const toPesewas = (n) => Math.round(Number(n) * 100);

// Split the amount across rooms by each room's usage this month (equally if there is none yet), the same
// shares the Dashboard shows. Works in pesewas so the parts always add up to exactly the amount paid.
function splitAmount(rooms, amount, now = Date.now()) {
    const d = new Date(now);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const usage = rooms.map((r) => meterLine(r.readings).usage(monthStart, now) || 0);
    const total = usage.reduce((a, b) => a + b, 0);
    const weights = total > 0 ? usage : rooms.map(() => 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const pesewas = toPesewas(amount);

    const parts = weights.map((w) => Math.floor((pesewas * w) / weightSum));
    const largest = weights.indexOf(Math.max(...weights));
    parts[largest] += pesewas - parts.reduce((a, b) => a + b, 0);

    return rooms.map((room, i) => ({
        room,
        share: Number(((weights[i] / weightSum) * 100).toFixed(1)),
        amount: parts[i] / 100,
    }));
}

// Builds the plain-text and HTML versions of a receipt. intro is HTML-safe text with an optional **bold** name.
function renderReceipt({ subject, intro, boldName, rows, footer }) {
    const text = [
        `Hello,`,
        ``,
        intro.replace('{name}', boldName || ''),
        ``,
        ...rows.map(([k, v]) => `${k}: ${v}`),
        ``,
        footer,
        `WatCal`,
    ].join('\n');

    const introHtml = escapeHtml(intro).replace('{name}', boldName ? `<b>${escapeHtml(boldName)}</b>` : '');
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr><td style="background:#1a1a1a;padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold">Wat<span style="color:#06cc02">Cal</span> payment receipt</td></tr>
  <tr><td style="padding:24px">
    <p style="margin:0 0 8px;font-size:16px">Hello,</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5">${introHtml}</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px">
      ${rows.map(([k, v], i) => `<tr style="background:${i % 2 ? '#ffffff' : '#f7f7f7'}"><td style="padding:9px 12px;color:#555">${escapeHtml(k)}</td><td style="padding:9px 12px;text-align:right;font-weight:bold">${escapeHtml(v)}</td></tr>`).join('')}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#666;line-height:1.5">${escapeHtml(footer)}</p>
  </td></tr>
</table></body></html>`;

    return { subject, text, html };
}

const paidDate = (payment) => payment.paidAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const paymentRows = (payment) => [
    ['Date paid', paidDate(payment)],
    ['Meter type', payment.meterType === 'prepaid' ? 'Prepaid' : 'Postpaid'],
    ['Meter number', payment.meterNumber],
    ['Paid with', PROVIDERS[payment.provider]],
    ['Reference', payment.reference || String(payment._id)],
];

// Receipt for a tenant in one of a landlord's rooms
function receiptEmail({ landlord, payment, roomNumber, share, amount }) {
    return renderReceipt({
        subject: `Electricity bill paid - receipt for ${roomNumber}`,
        intro: '{name} has paid the electricity bill for your building in full.',
        boldName: landlord.username,
        rows: [
            ['Room', roomNumber],
            ['Landlord', landlord.username],
            ...paymentRows(payment),
            ['Total paid by landlord', money(payment.amount)],
            ['Your share of usage', `${share}%`],
            ['Your part of the payment', money(amount)],
        ],
        footer: 'Keep this email as your receipt. If anything looks wrong, contact your landlord.',
    });
}

// Receipt for a private user who paid for their own meter
function privateReceiptEmail({ tenant, payment }) {
    return renderReceipt({
        subject: `Payment received - ${money(payment.amount)} for meter ${payment.meterNumber}`,
        intro: 'Thank you, {name}. We have received your electricity payment.',
        boldName: tenant.username,
        rows: [
            ['Account', tenant.username],
            ...paymentRows(payment),
            ['Mobile number', payment.phone],
            ['Amount paid', money(payment.amount)],
        ],
        footer: 'Keep this email as your receipt. If anything looks wrong, reply to this email or contact us through the WatCal website.',
    });
}

// Record a payment a landlord has started; it stays "pending" until the provider confirms it
exports.createPayment = async (landlordId, { amount, meterType, provider, phone, meterNumber }) =>
    Payment.create({ landlord: landlordId, amount, meterType, provider, phone, meterNumber });

// Record a payment a private user has started for their own meter
exports.createTenantPayment = async (tenantId, { amount, meterType, provider, phone, meterNumber }) =>
    Payment.create({ tenant: tenantId, amount, meterType, provider, phone, meterNumber });

/**
 * Call this once the payment provider confirms the payment (e.g. from its webhook).
 * Marks the payment paid and emails receipts: to every tenant of the landlord's rooms for a landlord
 * payment, or to the private user themself for a private user payment.
 * Safe to call more than once: receipts are only sent the first time.
 */
exports.markPaymentPaid = async (paymentId, reference) => {
    const payment = await Payment.findOneAndUpdate(
        { _id: paymentId, status: 'pending' },
        { status: 'paid', paidAt: new Date(), reference },
        { new: true }
    );
    if (!payment) return Payment.findById(paymentId); // already handled, or unknown

    if (payment.tenant) {
        const tenant = await Tenant.findById(payment.tenant).select('username email');
        const receipt = { email: tenant?.email, amount: payment.amount, share: 100 };
        if (tenant) {
            const result = await sendMail({ to: tenant.email, ...privateReceiptEmail({ tenant, payment }) });
            if (result.status !== 'sent') console.error(`Receipt to ${tenant.email} ${result.status}: ${result.error}`);
            Object.assign(receipt, { status: result.status, error: result.error, sentAt: result.status === 'sent' ? new Date() : undefined });
        } else {
            Object.assign(receipt, { status: 'failed', error: 'Private user account not found' });
        }
        payment.receipts = [receipt];
        await payment.save();
        return payment;
    }

    const landlord = await Landlord.findById(payment.landlord).select('username roomIds');
    const rooms = await Room.find({ _id: { $in: landlord?.roomIds || [] } });

    const receipts = [];
    for (const { room, share, amount } of splitAmount(rooms, payment.amount)) {
        const result = await sendMail({
            to: room.roomEmail,
            ...receiptEmail({ landlord, payment, roomNumber: room.roomNumber, share, amount }),
        });
        if (result.status !== 'sent') console.error(`Receipt to ${room.roomEmail} ${result.status}: ${result.error}`);
        receipts.push({
            room: room._id, roomNumber: room.roomNumber, email: room.roomEmail, share, amount,
            status: result.status, error: result.error, sentAt: result.status === 'sent' ? new Date() : undefined,
        });
    }

    payment.receipts = receipts;
    await payment.save();
    return payment;
};

exports.splitAmount = splitAmount;
exports.receiptEmail = receiptEmail;
exports.privateReceiptEmail = privateReceiptEmail;
