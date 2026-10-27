// utils/tariff.js

// Ghana tariff tiers. `upTo` is the cumulative upper limit of each tier (kWh).
// Keep in sync with public/Landlord/Logic/Analysis.js
const TIERS = [
  { upTo: 50, rate: 0.0 },        // Tier 1 (Lifeline)
  { upTo: 150, rate: 0.246 },     // Tier 2
  { upTo: 300, rate: 0.3409 },    // Tier 3
  { upTo: 600, rate: 0.4642 },    // Tier 4
  { upTo: 1000, rate: 0.5693 },   // Tier 5
  { upTo: Infinity, rate: 0.6758 } // Tier 6
];

// Cost in GHS of `consumption` kWh; each tier only charges for the units that fall inside it
const calculateCost = (consumption) => {
  let cost = 0;
  let previous = 0;
  for (const { upTo, rate } of TIERS) {
    if (consumption <= previous) break;
    cost += (Math.min(consumption, upTo) - previous) * rate;
    previous = upTo;
  }
  return cost;
};

// The band `consumption` kWh falls in: { number (1-6), rate, upTo, from }
const bandFor = (consumption) => {
  let from = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (consumption <= TIERS[i].upTo || i === TIERS.length - 1) return { number: i + 1, from, ...TIERS[i] };
    from = TIERS[i].upTo;
  }
};

module.exports = { calculateCost, bandFor, TIERS };
