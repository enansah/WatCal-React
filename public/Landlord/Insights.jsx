import React from "react";
import "./css/Insights.css";

// ---------- formatting ----------

export const kwh = (n, empty = "--") =>
  n === null || n === undefined ? empty : `${n >= 100 ? Math.round(n).toLocaleString() : Number(n.toFixed(1))} kWh`;
export const money = (n, empty = "GH₵--") => (n === null || n === undefined ? empty : `GH₵${n.toFixed(2)}`);
export const pct = (n) => `${Math.round(n * 100)}%`;
export const shortDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const monthName = (d, style = "short") => new Date(d).toLocaleDateString("en-GB", { month: style });

export function timeAgo(d) {
  if (!d) return "never";
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

// The tariff band line under "Bill so far"
export function bandNote(band) {
  if (band.rate === 0) return `Band 1, the free lifeline band${band.toNext !== null ? ` · ${kwh(band.toNext)} until band 2` : ""}`;
  return `Band ${band.number} · GH₵${band.rate}/kWh${band.toNext !== null ? ` · ${kwh(band.toNext)} until band ${band.number + 1}` : ""}`;
}

// Value, note and colour for the "Compared with last month" figure
export function changeKpi(o) {
  if (o.change === null) return { value: "--", note: "No readings for last month to compare with yet" };
  if (Math.abs(o.change) < 0.01) return { value: "≈ 0%", note: `About the same as at this point last month (${kwh(o.lastMonthSoFar)})` };
  return {
    value: `${o.change > 0 ? "▲" : "▼"} ${pct(Math.abs(o.change))}`,
    note: `${o.change > 0 ? "More" : "Less"} than at this point last month (${kwh(o.lastMonthSoFar)})`,
    tone: o.change > 0.05 ? "up" : o.change < -0.05 ? "down" : "",
  };
}

// Daily points for the bar chart: the last `days` days, today last
export const dailyPoints = (daily, days) =>
  daily.slice(-days).map((d, i, list) => {
    const today = i === list.length - 1;
    return {
      key: String(d.date),
      label: days > 7 ? String(new Date(d.date).getDate()) : new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" }),
      title: `${new Date(d.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${today ? " (so far)" : ""}`,
      value: d.usage,
      current: today,
    };
  });

export const monthlyPoints = (monthly) =>
  monthly.map((m, i) => ({
    key: String(m.month),
    label: monthName(m.month),
    title: `${monthName(m.month, "long")} ${new Date(m.month).getFullYear()}${i === monthly.length - 1 ? " (so far)" : ""}${m.cost !== null ? ` · ${money(m.cost)}` : ""}`,
    value: m.usage,
    current: i === monthly.length - 1,
  }));

// ---------- bar chart ----------

// A round number at or above `n` for the top of the scale (divides neatly into 4 gridlines)
function niceMax(n) {
  if (!n || n <= 0) return 4;
  const power = 10 ** Math.floor(Math.log10(n));
  const step = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => s * power >= n);
  return step * power;
}

/**
 * points: [{ key, label, title, value (kWh or null), current }]
 * reference: optional numbers (same length) drawn as a dashed line, e.g. the other rooms' average
 */
export function BarChart({ points, reference, referenceLabel, label, compact = false }) {
  // compact: drawn smaller so its text stays readable in a half-width card
  const W = compact ? 440 : 720, H = compact ? 220 : 250, L = 46, R = 12, T = 18, B = 30;
  const values = points.map((p) => p.value).filter((v) => v !== null);
  const refs = (reference || []).filter((v) => v !== null && v !== undefined);
  const top = niceMax(Math.max(0, ...values, ...refs) * 1.08);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);
  const slot = (W - L - R) / Math.max(points.length, 1);
  const barW = Math.min(44, slot * 0.66);
  const x = (i) => L + slot * i + slot / 2;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const labelEvery = Math.ceil(points.length / 15);
  const showValues = points.length <= 12;
  const empty = values.length === 0;
  const hasCurrent = points.some((p) => p.current && p.value !== null);

  return (
    <div className={`chart-box ${points.length > 14 ? "wide" : ""}`}>
      <svg className="bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t} className="grid">
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end">{Number(t.toFixed(1))}</text>
          </g>
        ))}

        {points.map((p, i) => (
          <g key={p.key} className={`bar ${p.current ? "current" : ""} ${p.value === null ? "missing" : ""}`}>
            <title>{`${p.title}: ${p.value === null ? "no readings" : kwh(p.value)}`}</title>
            {/* invisible full-height hit area so the tooltip is easy to reach */}
            <rect className="hit" x={x(i) - slot / 2} y={T} width={slot} height={H - T - B} />
            {p.value === null ? (
              <rect x={x(i) - barW / 2} y={y(0) - 3} width={barW} height={3} rx="1.5" />
            ) : (
              <rect x={x(i) - barW / 2} y={y(p.value)} width={barW} height={Math.max(y(0) - y(p.value), 1.5)} rx="4" />
            )}
            {showValues && p.value !== null && (
              <text className="val" x={x(i)} y={y(p.value) - 6} textAnchor="middle">{Number(p.value.toFixed(1))}</text>
            )}
            {i % labelEvery === 0 && <text className="xl" x={x(i)} y={H - 10} textAnchor="middle">{p.label}</text>}
          </g>
        ))}

        {!empty && reference && reference.some((v) => v !== null) && (
          <polyline
            className="ref"
            points={reference.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ")}
          />
        )}

        {empty && <text className="chart-empty" x={W / 2} y={H / 2} textAnchor="middle">No readings for this period yet</text>}
      </svg>
      {(referenceLabel || hasCurrent) && !empty && (
        <p className="legend">
          <span><i className="sw" /> kWh used</span>
          {hasCurrent && <span><i className="sw current" /> So far today / this month</span>}
          {referenceLabel && <span><i className="sw ref" /> {referenceLabel}</span>}
        </p>
      )}
    </div>
  );
}

// ---------- small pieces ----------

export function RangeTabs({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} className={value === id ? "on" : ""} onClick={() => onChange(id)}>
          {text}
        </button>
      ))}
    </div>
  );
}

const TIP_ICON = { warning: "!", info: "i", good: "✓" };

export function TipsList({ tips, empty = "Nothing needs your attention right now." }) {
  if (!tips.length) return <p className="tips-empty">{empty}</p>;
  return (
    <ul className="tips">
      {tips.map((t, i) => (
        <li key={i} className={`tip ${t.level}`}>
          <span className="tip-icon" aria-hidden="true">{TIP_ICON[t.level]}</span>
          <p>
            <span className="sr-only">{t.level === "warning" ? "Warning: " : t.level === "good" ? "Good news: " : "Tip: "}</span>
            {t.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function Kpi({ label, value, note, tone, children }) {
  return (
    <article className={`kpi ${tone || ""}`}>
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      {note && <p className="note">{note}</p>}
      {children}
    </article>
  );
}
