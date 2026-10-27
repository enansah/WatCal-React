// utils/usageInsights.js
// Usage figures, forecast and rule-based tips worked out from meter readings: for a landlord's rooms
// (buildInsights) and for a private user's own meter (buildPersonalInsights).
//
// Each reading's value is the meter's running total (kWh), so the usage over a period is the meter value
// at the end minus the value at the start. Between two readings the value is interpolated in a straight
// line, so daily figures stay smooth even when readings are hours apart.
const { calculateCost, bandFor } = require('./tariff');

const DAY = 24 * 60 * 60 * 1000;
const OFFLINE_AFTER = 2 * DAY;       // a meter that hasn't reported for this long is flagged
const ABOVE_AVERAGE = 0.3;           // a room using 30% more per day than the others is flagged
const SPIKE = 0.5;                   // a day 50% above the meter's normal is flagged
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const round = (n, places = 2) => (n === null || n === undefined ? null : Number(n.toFixed(places)));
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addMonths = (t, n) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime(); };
const sum = (values) => values.reduce((a, b) => a + b, 0);
const mean = (values) => (values.length ? sum(values) / values.length : null);
const money = (n) => `GH₵${n.toFixed(2)}`;
const kwh = (n) => `${n >= 100 ? Math.round(n) : round(n, 1)} kWh`;
const day = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const percent = (n) => `${Math.round(Math.abs(n) * 100)}%`;

// Sum of the known values; null when none are known
const total = (values) => {
  const known = values.filter((v) => v !== null);
  return known.length ? sum(known) : null;
};

// The meter value over time for one meter's readings
function meterLine(readings) {
  const points = (readings || [])
    .map((r) => ({ t: new Date(r.timestamp).getTime(), v: Number(r.readingValue) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
  const first = points.length ? points[0].t : null;
  const last = points.length ? points[points.length - 1].t : null;

  // Value at time t, for first <= t <= last
  const at = (t) => {
    let lo = 0, hi = points.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (points[mid].t <= t) lo = mid; else hi = mid;
    }
    const a = points[lo], b = points[hi];
    if (t <= a.t || a.t === b.t) return a.v;
    if (t >= b.t) return b.v;
    return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
  };

  // Usage between two moments; null when the meter has no readings covering that time
  const usage = (from, to) => {
    if (!points.length || to <= first || from >= last) return null;
    return Math.max(0, at(Math.min(to, last)) - at(Math.max(from, first)));
  };

  return { points, first, last, usage };
}

// The periods every figure is measured over
function periodsFor(now) {
  const monthStart = addMonths(now, 0);
  const nextMonthStart = addMonths(now, 1);
  const lastMonthStart = addMonths(now, -1);
  const today = startOfDay(now);
  return {
    now, today, monthStart, nextMonthStart, lastMonthStart,
    daysInMonth: Math.round((nextMonthStart - monthStart) / DAY),
    elapsedDays: (now - monthStart) / DAY,
    sameTimeLastMonth: Math.min(lastMonthStart + (now - monthStart), monthStart),
    // Last 30 days (oldest first, today last) and last 12 months (oldest first)
    dayStarts: Array.from({ length: 30 }, (_, i) => today - (29 - i) * DAY),
    monthStarts: Array.from({ length: 12 }, (_, i) => addMonths(now, i - 11)),
  };
}

// Figures for one meter
function meterStats(readings, p) {
  const line = meterLine(readings);
  const daily = p.dayStarts.map((start) => line.usage(start, start + DAY));
  // Whole days only: not today (it isn't over) or the day the meter started (it only covers part of it)
  const completeDays = daily.filter((v, i) => v !== null && i < daily.length - 1 && p.dayStarts[i] >= line.first);

  // Average per weekday over the last 8 weeks (whole days only)
  const byWeekday = WEEKDAYS.map(() => []);
  for (let i = 1; i <= 56; i++) {
    const start = p.today - i * DAY;
    const used = start >= line.first ? line.usage(start, start + DAY) : null;
    if (used !== null) byWeekday[(new Date(start).getDay() + 6) % 7].push(used);
  }

  return {
    line, daily, completeDays,
    monthUsage: line.usage(p.monthStart, p.now),
    sameTimeLastMonth: line.usage(p.lastMonthStart, p.sameTimeLastMonth),
    lastMonthUsage: line.usage(p.lastMonthStart, p.monthStart),
    monthly: p.monthStarts.map((start) => line.usage(start, Math.min(addMonths(start, 1), p.now))),
    avgDaily: mean(completeDays),
    weekday: byWeekday.map(mean),
    yesterday: daily[daily.length - 2],
    latest: line.points[line.points.length - 1] || null,
    previous: line.points[line.points.length - 2] || null,
  };
}

// This month's bill, forecast and tariff band, from the month's usage and the recent complete days.
// firstReading: when the earliest meter started, so a meter added mid-month isn't averaged over the whole month
function outlook({ monthUsage, lastMonthSoFar, lastMonthUsage, completeDays, firstReading }, p) {
  // Forecast: this month's pace once there are 3 days of it, otherwise the recent daily average
  const measuredDays = firstReading === null ? 0 : (p.now - Math.max(p.monthStart, firstReading)) / DAY;
  const rate = measuredDays >= 3 && monthUsage > 0 ? monthUsage / measuredDays : mean(completeDays.slice(-14));
  const projectedUsage = rate === null ? null : monthUsage + rate * ((p.nextMonthStart - p.now) / DAY);
  const band = bandFor(monthUsage);
  const toNext = Number.isFinite(band.upTo) ? band.upTo - monthUsage : null;
  const crossAt = toNext !== null && rate ? p.now + (toNext / rate) * DAY : null;

  return {
    rate,
    raw: { projectedUsage, lastMonthUsage }, // unrounded, for the tip sentences
    monthUsage: round(monthUsage),
    monthCost: round(calculateCost(monthUsage)),
    lastMonthSoFar: round(lastMonthSoFar),
    lastMonthUsage: round(lastMonthUsage),
    change: lastMonthSoFar ? round((monthUsage - lastMonthSoFar) / lastMonthSoFar, 3) : null,
    projectedUsage: round(projectedUsage),
    projectedCost: projectedUsage === null ? null : round(calculateCost(projectedUsage)),
    avgDaily: round(mean(completeDays)),
    band: {
      number: band.number,
      rate: band.rate,
      from: band.from,
      upTo: Number.isFinite(band.upTo) ? band.upTo : null,
      toNext: round(toNext),
      crossDate: crossAt && crossAt < p.nextMonthStart ? new Date(crossAt) : null,
    },
  };
}

// Tips about the month as a whole. who: "your rooms" or "you"
function outlookTips(o, p, tip, who) {
  const willUse = who === 'you' ? "you'll use" : `${who} will use`;
  const { projectedUsage, lastMonthUsage } = o.raw;
  if (projectedUsage !== null && projectedUsage > 0) {
    let text = `At this rate ${willUse} about ${kwh(projectedUsage)} this month (≈ ${money(o.projectedCost)}).`;
    if (lastMonthUsage) {
      const diff = projectedUsage / lastMonthUsage - 1;
      if (Math.abs(diff) >= 0.05) text += ` That's ${percent(diff)} ${diff > 0 ? 'more' : 'less'} than last month's ${kwh(lastMonthUsage)}.`;
    }
    tip('info', text, 'forecast');
  }
  if (o.band.crossDate) {
    const next = bandFor(o.band.upTo + 0.01);
    tip('warning', `You'll move into tariff band ${next.number} (${money(next.rate)} per kWh) around ${day(o.band.crossDate)}, after ${o.band.upTo} kWh this month.`, 'band');
    // How much less per day would keep the month in the current band, when that is within reach
    // (a cut of at most half the current daily use)
    const daysLeft = (p.nextMonthStart - p.now) / DAY;
    const cut = (projectedUsage - o.band.upTo) / daysLeft;
    if (who === 'you' && o.band.number > 1 && daysLeft >= 3 && cut > 0 && o.rate && cut <= o.rate * 0.5) {
      tip('info', `Using about ${kwh(cut)} less per day for the rest of the month (about ${percent(cut / o.rate)} less) would keep you in band ${o.band.number}.`, 'band-cut');
    }
  }
  if (projectedUsage !== null && projectedUsage > 0 && projectedUsage <= 50) {
    tip('good', "You're on track to stay in the free lifeline band (up to 50 kWh) this month.", 'lifeline');
  }
  if (o.change !== null && p.elapsedDays >= 3) {
    if (o.change <= -0.1) tip('good', `You've used ${percent(o.change)} less than at this point last month.`, 'change');
    else if (o.change >= 0.2) tip('warning', `You've used ${percent(o.change)} more than at this point last month.`, 'change');
  }
}

// Warnings first; within a level, whole-account tips before single-room ones
function sortTips(tips) {
  const order = { warning: 0, info: 1, good: 2 };
  return tips.sort((a, b) => order[a.level] - order[b.level] || (a.roomId === null ? 0 : 1) - (b.roomId === null ? 0 : 1));
}

const dailyList = (p, values) => p.dayStarts.map((start, i) => ({ date: new Date(start), usage: round(values[i]) }));
const monthlyList = (p, values) =>
  p.monthStarts.map((start, i) => ({
    month: new Date(start),
    usage: round(values[i]),
    cost: values[i] === null ? null : round(calculateCost(values[i])),
  }));
const reading = (point) => point && { value: point.v, timestamp: new Date(point.t) };

/**
 * rooms: Room documents (roomNumber, uniqueRoomId, electricityStatus, readings).
 * Returns plain numbers for the pages to format, plus tips as ready-to-show sentences.
 */
function buildInsights(rooms, now = Date.now()) {
  const p = periodsFor(now);
  const roomData = rooms.map((room) => ({ room, ...meterStats(room.readings, p) }));

  // ----- whole building -----
  const monthUsage = total(roomData.map((r) => r.monthUsage)) ?? 0;
  const buildingDaily = p.dayStarts.map((_, i) => total(roomData.map((r) => r.daily[i])));
  const o = outlook({
    monthUsage,
    lastMonthSoFar: total(roomData.map((r) => r.sameTimeLastMonth)),
    lastMonthUsage: total(roomData.map((r) => r.lastMonthUsage)),
    completeDays: buildingDaily.slice(0, -1).filter((v) => v !== null),
    firstReading: roomData.reduce((min, r) => (r.line.first !== null && (min === null || r.line.first < min) ? r.line.first : min), null),
  }, p);
  const { rate, raw, ...figures } = o;
  const building = {
    ...figures,
    daily: dailyList(p, buildingDaily),
    monthly: monthlyList(p, p.monthStarts.map((_, i) => total(roomData.map((r) => r.monthly[i])))),
  };

  // Average per day of every room except `skip`, for comparisons
  const othersAverage = (skip) => mean(roomData.filter((r) => r !== skip && r.avgDaily !== null).map((r) => r.avgDaily));
  const othersDaily = (skip) =>
    p.dayStarts.map((_, i) => mean(roomData.filter((r) => r !== skip && r.daily[i] !== null).map((r) => r.daily[i])));

  // ----- tips -----
  const tips = [];
  // kind: what the tip is about (e.g. 'spike', 'offline'), so pages can choose which ones to show
  const tip = (level, text, kind, room) => tips.push({ level, text, kind, roomId: room ? String(room._id) : null });

  if (roomData.every((r) => !r.latest)) {
    tip('info', "No meter readings yet. Usage figures and tips will appear once your meters start sending readings.", 'no-readings');
  }

  for (const r of roomData) {
    const name = r.room.roomNumber;
    if (!r.latest) {
      if (!r.room.meterId) tip('warning', `${name} has no meter number yet. Add it on the Analysis page so its readings can arrive.`, 'no-meter', r.room);
      else if (roomData.some((other) => other.latest)) tip('info', `${name}'s meter (${r.room.meterId}) hasn't sent any readings yet.`, 'no-readings', r.room);
    } else if (now - r.latest.t > OFFLINE_AFTER) {
      tip('warning', `${name}'s meter hasn't reported since ${day(r.latest.t)}. Check that it is powered and online.`, 'offline', r.room);
    }
    if (r.room.electricityStatus === false) tip('info', `Electricity is switched off in ${name}.`, 'power-off', r.room);

    if (r.yesterday !== null && r.completeDays.length >= 7 && r.avgDaily > 0.5 && r.yesterday > r.avgDaily * (1 + SPIKE)) {
      tip('warning', `${name} used ${kwh(r.yesterday)} yesterday, ${percent(r.yesterday / r.avgDaily - 1)} more than its usual ${kwh(r.avgDaily)} a day.`, 'spike', r.room);
    }

    const others = othersAverage(r);
    if (r.avgDaily !== null && others && r.avgDaily > others * (1 + ABOVE_AVERAGE)) {
      tip('info', `${name} uses ${percent(r.avgDaily / others - 1)} more per day than your other rooms on average (${kwh(r.avgDaily)} vs ${kwh(others)}).`, 'above-average', r.room);
    }

    const peak = weekdayPeak(r.weekday);
    if (peak) tip('info', `${name} uses the most on ${peak.day}s, about ${kwh(peak.usage)} on average.`, 'peak', r.room);
  }

  outlookTips(o, p, tip, 'your rooms');
  sortTips(tips);

  // ----- rooms -----
  const roomList = roomData.map((r) => {
    const share = monthUsage > 0 && r.monthUsage ? r.monthUsage / monthUsage : 0;
    return {
      _id: r.room._id,
      roomNumber: r.room.roomNumber,
      uniqueRoomId: r.room.uniqueRoomId || '',
      meterId: r.room.meterId || '',
      electricityStatus: r.room.electricityStatus !== false,
      monthUsage: round(r.monthUsage),
      share: round(share, 4),
      billShare: round(calculateCost(monthUsage) * share),   // the room's part of the building's bill, as on payment receipts
      avgDaily: round(r.avgDaily),
      othersAvgDaily: round(othersAverage(r)),
      lastMonthUsage: round(r.lastMonthUsage),
      latest: reading(r.latest),
      previous: reading(r.previous),
      offline: !r.latest || now - r.latest.t > OFFLINE_AFTER,
      daily: dailyList(p, r.daily),
      othersDaily: othersDaily(r).map(round),
      weekday: r.weekday.map(round),
      readings: r.line.points.map((pt) => ({ readingValue: pt.v, timestamp: new Date(pt.t) })),
    };
  });

  return {
    generatedAt: new Date(now),
    monthStart: new Date(p.monthStart),
    daysInMonth: p.daysInMonth,
    elapsedDays: round(p.elapsedDays),
    building,
    rooms: roomList,
    tips,
  };
}

// The weekday with clearly the highest average use (25% above the week's mean), or null
function weekdayPeak(weekday) {
  const known = weekday.filter((v) => v !== null);
  if (known.length < 5 || mean(known) <= 0.5) return null;
  const i = weekday.indexOf(Math.max(...known));
  return weekday[i] > mean(known) * 1.25 ? { day: WEEKDAYS[i], usage: weekday[i] } : null;
}

/**
 * readings: a private user's own readings ({ readingValue, timestamp }).
 * The same figures as a landlord's building, for one meter, with tips worded for the account holder.
 */
function buildPersonalInsights(readings, now = Date.now()) {
  const p = periodsFor(now);
  const m = meterStats(readings, p);
  const o = outlook({
    monthUsage: m.monthUsage ?? 0,
    lastMonthSoFar: m.sameTimeLastMonth,
    lastMonthUsage: m.lastMonthUsage,
    completeDays: m.completeDays,
    firstReading: m.line.first,
  }, p);
  const { rate, raw, ...figures } = o;

  const tips = [];
  const tip = (level, text, kind) => tips.push({ level, text, kind, roomId: null });

  if (!m.latest) {
    tip('info', "No meter readings yet. Usage figures and tips will appear once your smart meter starts sending readings.", 'no-readings');
  } else if (now - m.latest.t > OFFLINE_AFTER) {
    tip('warning', `Your meter hasn't reported since ${day(m.latest.t)}. Check that it is powered and online.`, 'offline');
  }
  if (m.yesterday !== null && m.completeDays.length >= 7 && m.avgDaily > 0.5 && m.yesterday > m.avgDaily * (1 + SPIKE)) {
    tip('warning', `You used ${kwh(m.yesterday)} yesterday, ${percent(m.yesterday / m.avgDaily - 1)} more than your usual ${kwh(m.avgDaily)} a day.`, 'spike');
  }
  const peak = weekdayPeak(m.weekday);
  if (peak) tip('info', `You use the most electricity on ${peak.day}s, about ${kwh(peak.usage)} on average.`, 'peak');
  outlookTips(o, p, tip, 'you');
  sortTips(tips);

  return {
    generatedAt: new Date(now),
    monthStart: new Date(p.monthStart),
    daysInMonth: p.daysInMonth,
    elapsedDays: round(p.elapsedDays),
    ...figures,
    offline: !m.latest || now - m.latest.t > OFFLINE_AFTER,
    daily: dailyList(p, m.daily),
    monthly: monthlyList(p, m.monthly),
    weekday: m.weekday.map(round),
    tips,
  };
}

module.exports = { buildInsights, buildPersonalInsights, meterLine };
