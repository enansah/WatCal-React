// controllers/landlordController.js
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const passwordReset = require('./passwordReset');
const sessionAccount = require('../../utils/sessionAccount');
const Landlord = require('../models/Landlord');
const Room = require('../models/Room');
const { pendingGoogleId, clearGoogleSignup } = require('./googleAuth');
const { newRoomMetersProblem, importPastReadings } = require('../../utils/meters');
const { termsAcceptance, NOT_ACCEPTED: TERMS_NOT_ACCEPTED } = require('../../utils/terms');

// Function to generate a random 8-character string
function generateRandomString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(crypto.randomInt(chars.length)); // cryptographically random: these IDs open "View your bill"
  }
  return result;
}

exports.registerLandlord = async (req, res) => {
  const {
    username,
    email,
    password,
    dateOfBirth,
    houseAddress,
    meterSerialNumber,
    meterType,
    roomsData
  } = req.body;

  let roomIds = [];

  try {
    // Check if username or email already exists
    let landlord = await Landlord.findOne({ username });
    if (landlord) {
      return res.status(400).json({ msg: 'Username already exists' });
    }

    landlord = await Landlord.findOne({ email });
    if (landlord) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    // Signing up after "Continue with Google": the password is optional (a random one is stored;
    // "Forgot password" can set a real one later)
    const googleId = pendingGoogleId(req, 'landlord', email);
    if (!password && !googleId) {
      return res.status(400).json({ msg: 'Please enter a password' });
    }

    const terms = termsAcceptance(req.body);
    if (!terms) {
      return res.status(400).json({ msg: TERMS_NOT_ACCEPTED });
    }

    if (!Array.isArray(roomsData)) {
      return res.status(400).json({ msg: 'Rooms must be a list' });
    }
    // Each room's meter number is optional; any that are given must be usable
    const meterProblem = await newRoomMetersProblem(roomsData.map((r) => ({ name: r.room, meter: r.meter })));
    if (meterProblem) {
      return res.status(400).json({ msg: meterProblem });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || crypto.randomBytes(32).toString('hex'), salt);

    // Generate uniqueRoomId for each room; ids are assigned up front so a failed signup can remove them
    const landlordId = new mongoose.Types.ObjectId();
    const roomsToInsert = roomsData.map(room => ({
      _id: new mongoose.Types.ObjectId(),
      landlord: landlordId,
      roomNumber: room.room,
      roomEmail: room.email,
      meterId: String(room.meter ?? '').trim() || undefined,
      uniqueRoomId: generateRandomString()
    }));
    roomIds = roomsToInsert.map(room => room._id);

    landlord = new Landlord({
      _id: landlordId,
      username,
      email,
      password: hashedPassword,
      dateOfBirth,
      houseAddress,
      meterSerialNumber,
      meterType,
      roomIds,
      uniqueId: generateRandomString(),
      googleId: googleId || undefined,
      ...terms,
    });

    // Check the landlord is valid before writing anything
    await landlord.validate();

    await Room.insertMany(roomsToInsert);
    await landlord.save();

    // Readings these meters sent before the rooms existed
    for (const room of roomsToInsert) {
      if (room.meterId) await importPastReadings(Room, room._id, room.meterId);
    }

    // Google sign-ups are already verified, so log them straight in
    if (googleId) {
      clearGoogleSignup(req);
      req.session.landlord = sessionAccount(landlord);
      return res.status(201).json({ msg: 'Landlord registered successfully', loggedIn: true });
    }
    res.status(201).json({ msg: 'Landlord registered successfully' });
  } catch (err) {
    console.error(err.message);

    // Remove any rooms created before the failure
    if (roomIds.length) {
      await Room.deleteMany({ _id: { $in: roomIds } }).catch(cleanupErr => console.error(cleanupErr.message));
    }

    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Each room needs a different name, and a tenant email can only be used for one room' });
    }
    res.status(500).send('Server error');
  }
};


exports.loginLandlord = async (req, res) => {
    const { username, password } = req.body;

    try {
        let landlord = await Landlord.findOne({ username });

        if (!landlord) {
        return res.status(400).json({ msg: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, landlord.password);

        if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid username or password' });
        }

        req.session.landlord = sessionAccount(landlord); // Save landlord in session (no password)
        res.status(200).json({ msg: 'Login successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



// Forgot / reset password: shared logic in passwordReset.js, emailed through utils/mailer.js
const landlordReset = passwordReset({ Model: Landlord, resetPath: '/landlord/reset-password' });
exports.forgotPasswordLandlord = landlordReset.forgot;
exports.resetPasswordLandlord = landlordReset.reset;
