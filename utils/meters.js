// utils/meters.js
// Links meter readings to the rooms and private-user accounts they belong to.
//
// A meter is identified by the ID it reports in its M-Bus data (SlaveInformation > Id). A landlord's room
// stores it as `meterId`; a private user's account stores it as `meterSerialNumber`. IDs match ignoring
// spaces, letter case and leading zeros, so "00012345" in the meter data matches "12345" typed by a person.
const Room = require('../src/models/Room');
const Tenant = require('../src/models/Tenant');
const Reading = require('../src/models/Reading');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The comparable form of a meter ID: no spaces, upper case, no leading zeros ("" when empty)
function normalizeMeterId(id) {
  return String(id ?? '').replace(/\s+/g, '').toUpperCase().replace(/^0+(?=.)/, '');
}

// Mongo condition matching `field` against a meter ID (stored values may have leading zeros or spaces)
function matchMeter(field, id) {
  const key = normalizeMeterId(id);
  if (!key) return null;
  return { [field]: new RegExp(`^\\s*0*${key.split('').map(escapeRegex).join('\\s*')}\\s*$`, 'i') };
}

// Multiplier to kWh for an M-Bus energy unit such as "Energy (10 Wh)", "Energy (kWh)", "Wh" or "MWh"; null if not energy
function kwhFactor(unit) {
  const m = String(unit || '').match(/(\d+(?:\.\d+)?(?:e[+-]?\d+)?)?\s*([kKM]?)Wh\b/);
  if (!m) return null;
  const scale = m[1] ? Number(m[1]) : 1;
  const prefix = { k: 1e3, K: 1e3, M: 1e6 }[m[2]] || 1;
  return (scale * prefix) / 1000;
}

/**
 * The meter's energy total in kWh from its M-Bus data records, or null when there is none.
 * Uses the current value (storage 0, not a maximum/minimum or error value); among those, tariff 0 first.
 */
function energyKwh(dataRecords) {
  const candidates = (dataRecords || [])
    .map((r) => ({ r, factor: kwhFactor(r.unit) }))
    .filter(({ r, factor }) => factor !== null && Number.isFinite(Number(r.value)))
    .filter(({ r }) => !/max|min|error/i.test(r.function || ''))
    .filter(({ r }) => !r.storageNumber || Number(r.storageNumber) === 0);
  if (!candidates.length) return null;
  const best = candidates.find(({ r }) => !r.tariff || Number(r.tariff) === 0) || candidates[0];
  return Number((Number(best.r.value) * best.factor).toFixed(3));
}

// Rooms and private-user accounts using a meter ID
async function ownersOf(id) {
  const roomQ = matchMeter('meterId', id);
  const tenantQ = matchMeter('meterSerialNumber', id);
  if (!roomQ) return { rooms: [], tenants: [] };
  const [rooms, tenants] = await Promise.all([
    Room.find(roomQ).select('_id roomNumber landlord meterId'),
    Tenant.find(tenantQ).select('_id username meterSerialNumber'),
  ]);
  return { rooms, tenants };
}

// A message when the meter already belongs to a room or account other than `except`, otherwise null
async function meterInUse(id, except = {}) {
  const { rooms, tenants } = await ownersOf(id);
  const otherRoom = rooms.find((r) => String(r._id) !== String(except.roomId || ''));
  const otherTenant = tenants.find((t) => String(t._id) !== String(except.tenantId || ''));
  if (otherRoom || otherTenant) return 'This meter number is already linked to another room or account.';
  return null;
}

// Add readings to one room or account, skipping times it already has, keeping them in time order
async function addReadings(Model, doc, readings) {
  const have = new Set((doc.readings || []).map((r) => new Date(r.timestamp).getTime()));
  const fresh = readings.filter((r) => !have.has(new Date(r.timestamp).getTime()));
  if (!fresh.length) return 0;
  await Model.updateOne(
    { _id: doc._id },
    { $push: { readings: { $each: fresh.map((r) => ({ readingValue: r.readingValue, timestamp: r.timestamp })), $sort: { timestamp: 1 } } } }
  );
  return fresh.length;
}

/**
 * Store one meter reading on every room and account using that meter.
 * Returns who received it, so callers can report meters that aren't linked to anyone yet.
 */
async function recordReading({ meterId, kwh, timestamp = new Date() }) {
  const reading = { readingValue: kwh, timestamp: new Date(timestamp) };
  const roomQ = matchMeter('meterId', meterId);
  const tenantQ = matchMeter('meterSerialNumber', meterId);
  if (!roomQ) return { meterId, linked: [] };

  const [rooms, tenants] = await Promise.all([
    Room.find(roomQ).select('_id roomNumber readings.timestamp'),
    Tenant.find(tenantQ).select('_id username readings.timestamp'),
  ]);
  const linked = [];
  for (const room of rooms) {
    if (await addReadings(Room, room, [reading])) linked.push(`room ${room.roomNumber}`);
  }
  for (const tenant of tenants) {
    if (await addReadings(Tenant, tenant, [reading])) linked.push(`account ${tenant.username}`);
  }
  if (!rooms.length && !tenants.length) console.log(`Meter ${meterId} isn't linked to a room or account yet; reading kept for later`);
  return { meterId, linked };
}

/**
 * Copy readings a meter sent before it was linked (kept in the Reading collection) to a room or account.
 * Model: Room or Tenant. Returns how many readings were added.
 */
async function importPastReadings(Model, id, meterId) {
  const q = matchMeter('id', meterId);
  if (!q) return 0;
  const raw = await Reading.find(q).select('dataRecords timestamp').sort({ timestamp: 1 }).lean();
  const readings = raw
    .map((r) => ({ readingValue: energyKwh(r.dataRecords), timestamp: r.timestamp }))
    .filter((r) => r.readingValue !== null && r.timestamp);
  if (!readings.length) return 0;
  const doc = await Model.findById(id).select('readings.timestamp');
  return doc ? addReadings(Model, doc, readings) : 0;
}

module.exports = { normalizeMeterId, energyKwh, kwhFactor, meterInUse, recordReading, importPastReadings };
