// models/Payment.js
const mongoose = require('mongoose');

// One email receipt sent to a tenant after a payment
const ReceiptSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    roomNumber: String,
    email: String,
    share: Number,  // % of the landlord's usage
    amount: Number, // this tenant's part of the payment (GHS)
    status: { type: String, enum: ['sent', 'skipped', 'failed'] },
    error: String,
    sentAt: Date,
}, { _id: false });

// Paid by either a landlord (receipts go to their tenants) or a private user (receipt goes to them)
const PaymentSchema = new mongoose.Schema({
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'Landlord' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    amount: { type: Number, required: true, min: 0.01 }, // GHS
    meterType: { type: String, enum: ['prepaid', 'postpaid'], required: true },
    provider: { type: String, enum: ['mtn', 'telecel'], required: true },
    phone: { type: String, required: true },
    meterNumber: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    reference: String, // the payment provider's transaction id
    paidAt: Date,
    receipts: [ReceiptSchema],
}, { timestamps: true });

PaymentSchema.pre('validate', function () {
    if (!this.landlord === !this.tenant) {
        this.invalidate('landlord', 'A payment belongs to exactly one landlord or private user');
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);
