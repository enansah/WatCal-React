// models/Room.js
const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
    readingValue: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
});

const RoomSchema = new mongoose.Schema({
    landlord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Landlord',
    },
    roomNumber: {
        type: String,
        required: true,
    },
    roomEmail: {
        type: String,
        required: true,
        unique: true,
    },
    uniqueRoomId: {
        type: String,
    },
    // The room's meter, as the meter reports itself in its M-Bus data; readings for it are added to this room
    meterId: {
      type: String,
      trim: true,
      index: true,
    },
    electricityStatus: {
      type: Boolean,
      default: true
    },
    readings: [readingSchema],
});

// Room names only need to be unique within one landlord's rooms
RoomSchema.index({ landlord: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);
