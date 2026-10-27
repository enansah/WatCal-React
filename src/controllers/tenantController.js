// controllers/tenantController.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const passwordReset = require('./passwordReset');
const sessionAccount = require('../../utils/sessionAccount');
const Tenant = require('../models/Tenant');
const { pendingGoogleId, clearGoogleSignup } = require('./googleAuth');
const { meterInUse, importPastReadings } = require('../../utils/meters');

exports.registerTenant = async (req, res) => {
    const {
        username,
        email,
        password,
        dateOfBirth,
        houseAddress,
        meterSerialNumber,
        meterType
    } = req.body;

    try {
        // Check if username or email already exists
        let tenant = await Tenant.findOne({ username });
        if (tenant) {
            return res.status(400).json({ msg: 'Username already exists' });
        }

        tenant = await Tenant.findOne({ email });
        if (tenant) {
            return res.status(400).json({ msg: 'Email already exists' });
        }

        // A meter's readings go to one room or account only
        if (meterSerialNumber) {
            const inUse = await meterInUse(meterSerialNumber);
            if (inUse) return res.status(400).json({ msg: inUse });
        }

        // Signing up after "Continue with Google": the password is optional (a random one is stored;
        // "Forgot password" can set a real one later)
        const googleId = pendingGoogleId(req, 'tenant', email);
        if (!password && !googleId) {
            return res.status(400).json({ msg: 'Please enter a password' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || crypto.randomBytes(32).toString('hex'), salt);

        // Save tenant to database
        tenant = new Tenant({
            username,
            email,
            password: hashedPassword,
            dateOfBirth,
            houseAddress,
            meterSerialNumber,
            meterType,
            googleId: googleId || undefined
        });

        await tenant.save();
        // Readings the meter sent before this account existed
        if (meterSerialNumber) await importPastReadings(Tenant, tenant._id, meterSerialNumber);

        // Google sign-ups are already verified, so log them straight in
        if (googleId) {
            clearGoogleSignup(req);
            req.session.tenant = sessionAccount(tenant);
            return res.status(201).json({ msg: 'Tenant registered successfully', loggedIn: true });
        }
        res.status(201).json({ msg: 'Tenant registered successfully' });
        console.log("Tenant registered successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



exports.loginTenant = async (req, res) => {
    const { username, password } = req.body;

    try {
        let tenant = await Tenant.findOne({ username });

        if (!tenant) {
        return res.status(400).json({ msg: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, tenant.password);

        if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid username or password' });
        }

        req.session.tenant = sessionAccount(tenant); // Save tenant in session (no password or readings)
        res.status(200).json({ msg: 'Login successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



// Forgot / reset password: shared logic in passwordReset.js, emailed through utils/mailer.js
const tenantReset = passwordReset({ Model: Tenant, resetPath: '/tenant/reset-password' });
exports.forgotPasswordTenant = tenantReset.forgot;
exports.resetPasswordTenant = tenantReset.reset;
