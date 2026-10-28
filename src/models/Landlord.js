const mongoose = require('mongoose');

const LandlordSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: String,
        required: true,
    },
    houseAddress: {
        type: String,
    },
    meterSerialNumber: {
        type: String,
    },
    meterType: {
        type: String,
    },
    roomIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }],
    uniqueId: {
        type: String,
        unique: true,
        required: true
    },
    // Google account linked for "Continue with Google" (set on first Google sign-in)
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    // Profile photo as a small data URL (the browser crops it to a 256px square before upload)
    avatar: {
        type: String,
    },
    // When the account agreed to the Terms of Service and Privacy Policy at sign-up, and which version
    termsAcceptedAt: {
        type: Date,
    },
    termsVersion: {
        type: String,
    }
});

module.exports = mongoose.model('Landlord', LandlordSchema);
