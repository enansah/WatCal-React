// controllers/meterUpload.js
// POST /api/meterReadings: where the on-site device (gateway) sends meter readings.
//
// The request must carry the header  X-Meter-Key: <METER_INGEST_KEY from .env>. The body is either
//   - the meter's M-Bus XML as-is (Content-Type: application/xml or text/xml), or
//   - JSON: { "meterId": "12345678", "kwh": 1520.4, "timestamp": "2026-10-27T08:00:00Z" }  (timestamp optional)
//           or { "readings": [ ...up to 500 of those... ] }
//           or { "xml": "<MBusData>...</MBusData>", "timestamp": "..." }  (what scripts/meter-gateway.js sends)
const crypto = require('crypto');
const { parseMBusXml, ingestMBus } = require('./mbusController');
const { recordReading, normalizeMeterId } = require('../../utils/meters');

const MAX_BATCH = 500;
const DAY = 24 * 60 * 60 * 1000;

// Constant-time comparison of the sent key with METER_INGEST_KEY
function keyIsValid(sent) {
  const expected = process.env.METER_INGEST_KEY;
  if (!expected || typeof sent !== 'string') return false;
  const a = crypto.createHash('sha256').update(sent).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// A JSON reading checked and cleaned, or { error }
function checkReading(r, i) {
  const where = `Reading ${i + 1}`;
  const meterId = normalizeMeterId(r && r.meterId);
  const kwh = Number(r && r.kwh);
  const timestamp = r && r.timestamp !== undefined ? new Date(r.timestamp) : new Date();
  if (!meterId || meterId.length > 40) return { error: `${where}: meterId is missing or too long` };
  if (!Number.isFinite(kwh) || kwh < 0) return { error: `${where}: kwh must be a number of 0 or more` };
  if (Number.isNaN(timestamp.getTime()) || timestamp > Date.now() + 5 * 60 * 1000 || timestamp < Date.now() - 400 * DAY) {
    return { error: `${where}: timestamp is missing, in the future or more than 400 days old` };
  }
  return { meterId, kwh, timestamp };
}

exports.uploadReadings = async (req, res) => {
  if (!process.env.METER_INGEST_KEY) {
    return res.status(503).json({ msg: 'Meter uploads are not set up on this server (METER_INGEST_KEY is missing).' });
  }
  if (!keyIsValid(req.get('X-Meter-Key'))) {
    return res.status(401).json({ msg: 'Missing or wrong meter key' });
  }

  try {
    // Raw XML, either as the whole body or inside JSON
    const xml = typeof req.body === 'string' ? req.body : req.body && typeof req.body.xml === 'string' ? req.body.xml : null;
    if (xml) {
      // Optional time the meter was read (the gateway sends it when uploading readings it had to queue)
      const sentTime = typeof req.body === 'object' && req.body.timestamp !== undefined ? req.body.timestamp : undefined;
      const time = sentTime === undefined ? { timestamp: new Date() } : checkReading({ meterId: 'x', kwh: 0, timestamp: sentTime }, 0);
      if (time.error) return res.status(400).json({ msg: 'timestamp is not valid, in the future or more than 400 days old' });

      let data;
      try {
        data = await parseMBusXml(xml);
      } catch (err) {
        return res.status(400).json({ msg: `Could not read the meter XML: ${err.message}` });
      }
      const result = await ingestMBus(data, time.timestamp);
      return res.status(result.kwh === null ? 422 : 200).json({
        received: 1,
        results: [result],
        msg: result.kwh === null ? 'No energy value found in the meter data' : undefined,
      });
    }

    const list = Array.isArray(req.body && req.body.readings) ? req.body.readings : [req.body];
    if (!list.length || list.length > MAX_BATCH) {
      return res.status(400).json({ msg: `Send between 1 and ${MAX_BATCH} readings` });
    }
    const checked = list.map(checkReading);
    const errors = checked.filter((c) => c.error).map((c) => c.error);
    if (errors.length) return res.status(400).json({ msg: 'Some readings are not valid', errors: errors.slice(0, 20) });

    const results = [];
    for (const reading of checked) results.push({ ...(await recordReading(reading)), kwh: reading.kwh });
    res.status(200).json({ received: results.length, results });
  } catch (err) {
    console.error('Meter upload failed:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
