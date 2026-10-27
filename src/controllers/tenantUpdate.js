const Tenant = require('../models/Tenant');
const { avatarError } = require('../../utils/avatar');
const sessionAccount = require('../../utils/sessionAccount');
const { meterInUse, importPastReadings, normalizeMeterId } = require('../../utils/meters');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Keep the logged-in session in step with the saved profile (the header reads it)
const refreshSession = (req, tenant) => {
    req.session.tenant = sessionAccount(tenant);
};

exports.updateUserProfile = async (req, res) => {
    const {
        username,
        email,
        dateOfBirth,
        houseAddress,
        meterSerialNumber,
        meterType
    } = req.body;

    if (email !== undefined && !EMAIL.test(String(email).trim())) {
        return res.status(400).json({ msg: 'Please enter a valid email address' });
    }

    try {
        const tenant = await Tenant.findById(req.session.tenant._id);

        if (!tenant) {
            return res.status(400).json({ msg: 'User not found' });
        }

        // Username and email must stay unique across private users
        const nextUsername = username ? String(username).trim() : tenant.username;
        const nextEmail = email ? String(email).trim() : tenant.email;
        const taken = await Tenant.findOne({
            _id: { $ne: tenant._id },
            $or: [{ username: nextUsername }, { email: nextEmail }]
        }).select('username email');
        if (taken) {
            return res.status(400).json({ msg: taken.username === nextUsername ? 'Username already exists' : 'Email already exists' });
        }

        // A new meter number must not belong to another room or account
        const nextMeter = meterSerialNumber ? String(meterSerialNumber).trim() : '';
        const meterChanged = nextMeter && normalizeMeterId(nextMeter) !== normalizeMeterId(tenant.meterSerialNumber);
        if (meterChanged) {
            const inUse = await meterInUse(nextMeter, { tenantId: tenant._id });
            if (inUse) return res.status(400).json({ msg: inUse });
        }

        // Save updated tenant profile
        tenant.username = nextUsername;
        tenant.email = nextEmail;
        tenant.dateOfBirth = dateOfBirth || tenant.dateOfBirth;
        if (houseAddress !== undefined) tenant.houseAddress = String(houseAddress).trim(); // optional, may be cleared
        tenant.meterSerialNumber = nextMeter || tenant.meterSerialNumber;
        tenant.meterType = meterType || tenant.meterType;

        await tenant.save();
        // Readings the new meter sent before it was linked to this account
        if (meterChanged) await importPastReadings(Tenant, tenant._id, nextMeter);
        refreshSession(req, tenant);

        res.status(201).json({ msg: 'Tenant profile updated successfully' });
        console.log("Tenant profile updated successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Set the profile photo (a data URL) or remove it with { avatar: null }
exports.updateAvatar = async (req, res) => {
    const { avatar } = req.body;
    const invalid = avatarError(avatar);
    if (invalid) {
        return res.status(400).json({ msg: invalid });
    }

    try {
        const tenant = await Tenant.findById(req.session.tenant._id);
        if (!tenant) {
            return res.status(400).json({ msg: 'User not found' });
        }

        tenant.avatar = avatar || undefined;
        await tenant.save();
        refreshSession(req, tenant);

        res.status(200).json({ msg: avatar ? 'Profile photo updated' : 'Profile photo removed', avatar: tenant.avatar || null });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getUserProfile = async (req, res) => {

    try {
        // Readings are left out; the dashboard and history pages load them
        const tenant = await Tenant.findById(req.session.tenant._id).select('-password -readings');
        res.status(200).json(tenant);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
