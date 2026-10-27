const mongoose = require('mongoose');
const dotenv = require('dotenv');
const reading = require('../src/controllers/mbusController');
const Room = require('../src/models/Room');

dotenv.config(); // Load .env

const interval = 15 * 60 * 1000; // 15 minutes
const delayBetweenReadings = 2 * 60 * 1000; // 2 minutes (you had 2*60*10 = 1200 ms, probably too short)

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI not defined in .env ❌');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected ✅');

    // Replace the old site-wide unique room name index with the per-landlord one
    await Room.syncIndexes();
  } catch (err) {
    console.error('MongoDB connection error ❌', err);
    process.exit(1);
  }

  // Only when this server runs on the same network as the meters (e.g. on site). A cloud server can't reach
  // them; there, an on-site device sends readings to /api/meterReadings instead (scripts/meter-gateway.js).
  //   METER_URLS=http://172.18.130.54:8080/MBusData1.xml,http://172.18.130.54:8080/MBusData2.xml
  const urls = String(process.env.METER_URLS || '').split(',').map((u) => u.trim()).filter(Boolean);
  if (urls.length) {
    console.log(`Reading ${urls.length} meter(s) every ${interval / 60000} minutes`);
    reading.readMetersSequentially(urls, interval, delayBetweenReadings);
  }
};

module.exports = connectDB;
