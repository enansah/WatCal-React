const crypto = require('crypto');
const mongoose = require('mongoose');
const Landlord = require('../models/Landlord');
const Room = require('../models/Room');

// Function to generate a random 8-character ID
function generateUniqueId(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(crypto.randomInt(characters.length)); // cryptographically random: these IDs open "View your bill"
    }
    return result;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { avatarError } = require('../../utils/avatar');
const sessionAccount = require('../../utils/sessionAccount');

// Keep the logged-in session in step with the saved profile (the header reads it)
const refreshSession = (req, landlord) => {
    req.session.landlord = sessionAccount(landlord);
};

exports.updateUserProfile = async (req, res) => {
    const {
        username,
        email,
        dateOfBirth,
        houseAddress,
        meterSerialNumber,
        meterType,
        roomsData = []
    } = req.body;

    if (!Array.isArray(roomsData)) {
        return res.status(400).json({ msg: 'Rooms must be a list' });
    }
    if (email !== undefined && !EMAIL.test(String(email).trim())) {
        return res.status(400).json({ msg: 'Please enter a valid email address' });
    }
    const rooms = roomsData.map(r => ({ room: String(r.room || '').trim(), email: String(r.email || '').trim() }));
    if (rooms.some(r => !r.room || !EMAIL.test(r.email))) {
        return res.status(400).json({ msg: 'Each new room needs a name and a valid tenant email' });
    }

    let roomIds = [];

    try {
        const landlord = await Landlord.findById(req.session.landlord._id);

        if (!landlord) {
            return res.status(400).json({ msg: 'User not found' });
        }

        // Username and email must stay unique across landlords
        const nextUsername = username ? String(username).trim() : landlord.username;
        const nextEmail = email ? String(email).trim() : landlord.email;
        const taken = await Landlord.findOne({
            _id: { $ne: landlord._id },
            $or: [{ username: nextUsername }, { email: nextEmail }]
        }).select('username email');
        if (taken) {
            return res.status(400).json({ msg: taken.username === nextUsername ? 'Username already exists' : 'Email already exists' });
        }

        landlord.username = nextUsername;
        landlord.email = nextEmail;
        landlord.dateOfBirth = dateOfBirth || landlord.dateOfBirth;
        if (houseAddress !== undefined) landlord.houseAddress = String(houseAddress).trim(); // optional, may be cleared
        landlord.meterSerialNumber = meterSerialNumber || landlord.meterSerialNumber;
        landlord.meterType = meterType || landlord.meterType;

        // Insert new rooms; ids are assigned up front so a failed save can remove them
        const roomsToInsert = rooms.map(room => ({
            _id: new mongoose.Types.ObjectId(),
            landlord: landlord._id,
            roomNumber: room.room,
            roomEmail: room.email,
            uniqueRoomId: generateUniqueId()  // Add uniqueRoomId here
        }));
        roomIds = roomsToInsert.map(room => room._id);

        await landlord.validate();
        if (roomsToInsert.length) await Room.insertMany(roomsToInsert);

        // Add new roomIds to existing roomIds
        landlord.roomIds = landlord.roomIds.concat(roomIds);
        await landlord.save();
        refreshSession(req, landlord);

        res.status(201).json({ msg: 'Landlord profile updated successfully', addedRooms: roomIds.length });
        console.log("Landlord profile updated successfully");
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

// Set the profile photo (a data URL) or remove it with { avatar: null }
exports.updateAvatar = async (req, res) => {
    const { avatar } = req.body;
    const invalid = avatarError(avatar);
    if (invalid) {
        return res.status(400).json({ msg: invalid });
    }

    try {
        const landlord = await Landlord.findById(req.session.landlord._id);
        if (!landlord) {
            return res.status(400).json({ msg: 'User not found' });
        }

        landlord.avatar = avatar || undefined;
        await landlord.save();
        refreshSession(req, landlord);

        res.status(200).json({ msg: avatar ? 'Profile photo updated' : 'Profile photo removed', avatar: landlord.avatar || null });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const landlord = await Landlord.findById(req.session.landlord._id).select('-password');
        res.status(200).json(landlord);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
