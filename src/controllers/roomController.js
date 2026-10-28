// controllers/roomController.js
const Room = require('../models/Room');
const tariff = require('../../utils/tariff');
const Landlord = require('../models/Landlord');
const landlordRoomsFilter = require('../../utils/landlordRooms');
const { buildInsights } = require('../../utils/usageInsights');
const { METER_FORMAT, meterInUse, importPastReadings } = require('../../utils/meters');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find(await landlordRoomsFilter(req));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findOne({ $and: [await landlordRoomsFilter(req), { _id: req.params.id }] });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




// Cost of `consumption` kWh, formatted the way this endpoint has always returned it
function calculateCost(consumption) {
  const cost = tariff.calculateCost(consumption);
  return `Ghs ${cost.toFixed(2)}`;
}

exports.getTotalReadingAndCost = async (req, res) => {
  try {
      const rooms = await Room.find(await landlordRoomsFilter(req));
      const totalReading = rooms.reduce((sum, room) => {
          const latestReading = room.readings?.slice(-1)[0]?.readingValue || 0;
          return sum + latestReading;
      }, 0);

      const totalCost = calculateCost(totalReading);

      res.json({ totalReading, totalCost });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching total reading and cost', error });
  }
};




// GET /api/landlordInsights: this month's usage, bill, forecast, daily/monthly figures, room breakdown and tips
exports.getInsights = async (req, res) => {
  try {
    const rooms = await Room.find(await landlordRoomsFilter(req)).select('roomNumber uniqueRoomId meterId electricityStatus readings');
    res.json(buildInsights(rooms));
  } catch (error) {
    console.error('Error building insights:', error);
    res.status(500).json({ message: 'Error loading usage figures' });
  }
};

// POST /api/roomMeter { roomId, meterId }: set (or clear, with "") the meter whose readings go to this room
exports.setRoomMeter = async (req, res) => {
  const { roomId } = req.body;
  const meterId = String(req.body.meterId ?? '').trim();
  if (meterId && !METER_FORMAT.test(meterId)) {
    return res.status(400).json({ msg: 'A meter number can only contain letters, digits, spaces and dashes (up to 40).' });
  }

  try {
    const room = await Room.findOne({ $and: [await landlordRoomsFilter(req), { _id: roomId }] });
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    if (meterId) {
      const inUse = await meterInUse(meterId, { roomId: room._id });
      if (inUse) return res.status(409).json({ msg: inUse });
    }

    room.meterId = meterId || undefined;
    await room.save();
    // Readings this meter sent before it was linked
    const imported = meterId ? await importPastReadings(Room, room._id, meterId) : 0;

    res.json({ meterId: room.meterId || '', imported });
  } catch (error) {
    console.error('Error setting room meter:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteRoom = async (req, res) => {
  const { roomNumber } = req.params;

  try {
    const room = await Room.findOne({ ...(await landlordRoomsFilter(req)), roomNumber });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await Room.deleteOne({ _id: room._id });
    await Landlord.updateOne({ _id: req.session.landlord._id }, { $pull: { roomIds: room._id } });

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
