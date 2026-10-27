const Room = require('../models/Room');
const tariff = require('../../utils/tariff');
const landlordRoomsFilter = require('../../utils/landlordRooms');

// Helper function to calculate monthly usage
const calculateMonthlyUsage = (readings) => {
  let totalUsage = 0;
  readings.sort((a, b) => a.timestamp - b.timestamp); // Ensure readings are sorted by timestamp

  readings.forEach((reading, index) => {
    if (index > 0) {
      totalUsage += reading.readingValue - readings[index - 1].readingValue;
    }
  });

  return totalUsage;
};

// Helper function to get monthly readings
const getMonthlyReadings = (room, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  try {
    const monthlyReadings = room.readings.filter(reading =>
      reading.timestamp >= startDate && reading.timestamp < endDate
    );

    return monthlyReadings;
  } catch (error) {
    console.error('Error fetching monthly readings:', error);
    return [];
  }
};

// Cost of `consumption` kWh, formatted the way this endpoint has always returned it
function calculateCost(consumption) {
  const cost = tariff.calculateCost(consumption);
  return `GHs ${cost.toFixed(2)}`;
}

// Month (1-12) and year from the URL, or null when they are not valid numbers
const parseMonthYear = ({ month, year }) => {
  const m = Number(month);
  const y = Number(year);
  return Number.isInteger(m) && m >= 1 && m <= 12 && Number.isInteger(y) && y >= 2000 && y <= 2100
    ? { month: m, year: y }
    : null;
};

// Controller function to get total reading and cost for a specific month
exports.getTotalReadingAndCost = async (req, res) => {
    const period = parseMonthYear(req.params);
    if (!period) {
      return res.status(400).json({ error: 'Month must be 1-12 and year a 4-digit number' });
    }
    const { month, year } = period;
  
    try {
      const rooms = await Room.find(await landlordRoomsFilter(req));
      let totalReadings = 0;
  
      const data = await Promise.all(rooms.map(async (room) => {
        const monthlyReadings = getMonthlyReadings(room, month, year);
        const monthlyUsage = calculateMonthlyUsage(monthlyReadings);
        totalReadings += monthlyUsage;
  
        return {
          _id: room._id,
          roomNumber: room.roomNumber,
          uniqueRoomId: room.uniqueRoomId,
          readings: monthlyReadings.map(({ readingValue, timestamp }) => ({ readingValue, timestamp })),
          currentReading: monthlyUsage,
          price: calculateCost(monthlyUsage),
          // Initialize percentage to 0 to ensure it's defined
          percentage: 0
        };
      }));
  
      // Calculate total readings
      const totalSum = data.reduce((sum, room) => sum + room.currentReading, 0);
  
      // Update the percentage for each room
      data.forEach(item => {
        item.percentage = totalSum ? ((item.currentReading / totalSum) * 100).toFixed(2) : 0;
        // Convert NaN or undefined to 0%
        item.percentage = Number.isNaN(item.percentage) ? 0 : item.percentage;
      });
  
      res.status(200).json(data);
    } catch (error) {
      console.error('Error getting total reading and cost:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  


  exports.deleteRoomHistory = async (req, res) => {
    const { roomNumber } = req.params;
    const period = parseMonthYear(req.params);
    if (!period) {
      return res.status(400).json({ error: 'Month must be 1-12 and year a 4-digit number' });
    }
    const { month, year } = period;
  
    try {
      const room = await Room.findOne({ ...(await landlordRoomsFilter(req)), roomNumber });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
  
      // Filter out readings for the specified month and year
      room.readings = room.readings.filter(reading => {
        const readingDate = new Date(reading.timestamp);
        return !(readingDate.getMonth() === month - 1 && readingDate.getFullYear() === year);
      });
  
      await room.save();
      res.status(200).json({ message: 'Room history deleted successfully' });
    } catch (error) {
      console.error('Error deleting room history:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
