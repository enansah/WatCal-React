#!/usr/bin/env node
// scripts/meter-gateway.js
// Runs on a small computer at the building, on the same network as the M-Bus meter gateway.
// Every few minutes it reads each meter's XML and sends it to the WatCal server, with the time it was read.
// If the internet is down, readings are kept and sent on the next round (up to MAX_QUEUE of them).
//
// Settings (environment variables, or a .env file next to where you run it):
//   SERVER_URL        e.g. https://watcal.netlify.app      (the site address; /api/meterReadings is added)
//   METER_KEY         the same value as METER_INGEST_KEY on the server
//   METER_URLS        comma-separated meter XML addresses, e.g.
//                     http://172.18.130.54:8080/MBusData1.xml,http://172.18.130.54:8080/MBusData2.xml
//   INTERVAL_MINUTES  optional, default 15
//
// Run:  node scripts/meter-gateway.js        (keep it running, e.g. with pm2 or as a Windows service)
//       node scripts/meter-gateway.js --once (one round, then exit; useful for testing)
try { require('dotenv').config(); } catch { /* dotenv is optional here */ }
const axios = require('axios');

const SERVER_URL = String(process.env.SERVER_URL || '').replace(/\/+$/, '');
const METER_KEY = process.env.METER_KEY || '';
const METER_URLS = String(process.env.METER_URLS || '').split(',').map((u) => u.trim()).filter(Boolean);
const INTERVAL = (Number(process.env.INTERVAL_MINUTES) || 15) * 60 * 1000;
const MAX_QUEUE = 2000;
const once = process.argv.includes('--once');

if (!SERVER_URL || !METER_KEY || !METER_URLS.length) {
  console.error('Set SERVER_URL, METER_KEY and METER_URLS first (see the top of this file).');
  process.exit(1);
}

const queue = []; // readings not yet accepted by the server: { url, xml, timestamp }
const log = (...args) => console.log(new Date().toISOString(), ...args);

async function send(item) {
  const response = await axios.post(
    `${SERVER_URL}/api/meterReadings`,
    { xml: item.xml, timestamp: item.timestamp },
    { headers: { 'X-Meter-Key': METER_KEY }, timeout: 30000, validateStatus: () => true }
  );
  if (response.status === 200) {
    const r = response.data.results?.[0] || {};
    log(`Sent ${item.url}: meter ${r.meterId}, ${r.kwh} kWh${r.linked?.length ? ` -> ${r.linked.join(', ')}` : ' (not linked to a room or account yet)'}`);
    return 'sent';
  }
  // Wrong key or uploads not set up: keep the readings until the settings are fixed
  if (response.status === 401 || response.status === 503) {
    throw new Error(`${response.data?.msg || 'refused'} - check METER_KEY here and METER_INGEST_KEY on the server`);
  }
  // 400/422: the server rejected this reading itself, so retrying won't help
  if (response.status >= 400 && response.status < 500) {
    log(`Server rejected ${item.url} (${response.status}): ${response.data?.msg || ''}`);
    return 'rejected';
  }
  throw new Error(`server answered ${response.status}`);
}

async function round() {
  // 1. Read every meter now
  for (const url of METER_URLS) {
    try {
      const { data } = await axios.get(url, { timeout: 20000, responseType: 'text' });
      queue.push({ url, xml: String(data), timestamp: new Date().toISOString() });
    } catch (err) {
      log(`Could not read ${url}: ${err.message}`);
    }
  }
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE); // drop the oldest

  // 2. Send everything waiting, oldest first; stop at the first network/server/key failure and try again next round
  while (queue.length) {
    try {
      await send(queue[0]);
      queue.shift();
    } catch (err) {
      log(`Could not send (${err.code || err.message || 'no answer'}); ${queue.length} reading(s) waiting`);
      break;
    }
  }
}

(async () => {
  log(`Meter gateway: ${METER_URLS.length} meter(s) -> ${SERVER_URL}, every ${INTERVAL / 60000} min`);
  await round();
  if (once) process.exit(queue.length ? 1 : 0);
  setInterval(round, INTERVAL);
})();
