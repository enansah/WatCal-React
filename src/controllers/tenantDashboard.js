// controllers/tenantController.js
const Tenant = require('../models/Tenant');
const tariff = require('../../utils/tariff');
const { buildPersonalInsights } = require('../../utils/usageInsights');

// Cost of `consumption` kWh, formatted the way this endpoint has always returned it
function calculateCost(consumption) {
  const cost = tariff.calculateCost(consumption);
  return `Gh₵ ${cost.toFixed(2)}`;
}

exports.getTenantData = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ username: req.params.username }).exec();
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const currentTime = new Date();
    console.log(currentTime);
    const lastDashboardVisit = tenant.lastDashboardVisit || currentTime;

    const reading = tenant.readings[tenant.readings.length - 1] || { readingValue: 0, timestamp: currentTime };
    const lastReading = tenant.readings.find(r => r.timestamp <= lastDashboardVisit) || reading;
    console.log(lastReading);

    tenant.lastDashboardVisit = currentTime;
    await tenant.save();

    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
    const formatTime = (time) => time ? new Date(time).toLocaleTimeString() : 'N/A';
    const formatValue = (value) => value ? `${value.toFixed(1)}kW` : '0kWh'; // Format to one decimal place

    res.json({
      date: formatDate(reading.timestamp),
      readingTime: formatTime(reading.timestamp),
      readingValue: formatValue(reading.readingValue),
      lastReadingTime: formatTime(lastReading.timestamp),
      lastReadingValue: formatValue(lastReading.readingValue),
      lastReadingDate: formatDate(lastReading.timestamp),
      kwh: reading.readingValue.toFixed(1),
      cost: calculateCost(reading.readingValue)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getTenantDataByMonth = async (req, res) => {
  try {
    const { username, month, year } = req.params;
    const tenant = await Tenant.findOne({ username });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const readings = tenant.readings.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      return readingDate.getMonth() === monthIndex && readingDate.getFullYear() === parseInt(year);
    });

    const totalConsumption = readings.reduce((total, reading) => total + reading.readingValue, 0);
    const lastReading = readings[readings.length - 1] || { readingValue: 0, timestamp: 'N/A' };

    res.json({
      date: lastReading.timestamp === 'N/A' ? 'N/A' : lastReading.timestamp.toISOString().split('T')[0],
      readingTime: lastReading.timestamp === 'N/A' ? 'N/A' : lastReading.timestamp.toISOString().split('T')[1].split('.')[0],
      readingValue: `${lastReading.readingValue.toFixed(1)}kWh`,
      lastReadingTime: lastReading.timestamp === 'N/A' ? 'N/A' : lastReading.timestamp.toISOString().split('T')[1].split('.')[0],
      lastReadingValue: `${lastReading.readingValue.toFixed(1)}kWh`,
      lastReadingDate: lastReading.timestamp === 'N/A' ? 'N/A' : lastReading.timestamp.toISOString().split('T')[0],
      kwh: `${totalConsumption.toFixed(1)}KW`,
      cost: calculateCost(totalConsumption)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ---------- private user dashboard (React page /tenant/dashboard) ----------

// GET /api/tenantDashboard: the logged-in private user's readings, usage, estimated cost, forecast and tips
exports.getDashboard = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.session.tenant._id).select('username email meterSerialNumber meterType readings');
    if (!tenant) {
      return res.status(404).json({ msg: 'Account not found' });
    }

    const readings = [...tenant.readings]
      .map((r) => ({ value: r.readingValue, timestamp: new Date(r.timestamp) }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Usage, bill, forecast, tariff band, daily/monthly figures and tips (same rules as the landlord pages)
    const insights = buildPersonalInsights(tenant.readings);
    const inMonth = readings.filter((r) => r.timestamp >= insights.monthStart);
    const latest = readings[readings.length - 1] || null;
    const previous = readings[readings.length - 2] || null;

    res.json({
      account: {
        username: tenant.username,
        email: tenant.email,
        meterSerialNumber: tenant.meterSerialNumber || '',
        meterType: tenant.meterType || '',
      },
      latest,
      previous,
      // This month so far (also read by the Payment page)
      month: {
        start: insights.monthStart,
        usage: insights.monthUsage,
        cost: insights.monthCost,
        readings: inMonth.length,
      },
      insights,
      readings: readings.slice(-100).reverse(), // newest first, for downloads
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Only let a logged-in private user read their own data through /tenant/:username/... routes
exports.ownDataOnly = (req, res, next) => {
  if (req.session.tenant && req.session.tenant.username === req.params.username) return next();
  return res.status(403).json({ msg: 'You can only view your own data' });
};

// GET /api/tenantHistory/:month/:year (month 1-12): the logged-in private user's readings and usage for one month
exports.getHistory = async (req, res) => {
  const month = Number(req.params.month);
  const year = Number(req.params.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ msg: 'Month must be 1-12 and year a 4-digit number' });
  }

  try {
    const tenant = await Tenant.findById(req.session.tenant._id).select('username meterSerialNumber readings');
    if (!tenant) {
      return res.status(404).json({ msg: 'Account not found' });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const readings = [...tenant.readings]
      .map((r) => ({ value: r.readingValue, timestamp: new Date(r.timestamp) }))
      .sort((a, b) => a.timestamp - b.timestamp);
    const inMonth = readings.filter((r) => r.timestamp >= start && r.timestamp < end);

    // Usage: last reading of the month minus the last one before the month began (or the month's first)
    const before = readings.filter((r) => r.timestamp < start).pop();
    const baseline = before ? before.value : inMonth[0]?.value;
    const usage = inMonth.length && baseline !== undefined ? Math.max(0, inMonth[inMonth.length - 1].value - baseline) : 0;

    res.json({
      month,
      year,
      usage: Number(usage.toFixed(2)),
      cost: Number(tariff.calculateCost(usage).toFixed(2)),
      readings: inMonth,
      meterSerialNumber: tenant.meterSerialNumber || '',
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
