"use client";

/*
 * Recharts wrappers for the Financial section. One consistent chart component
 * per shape (the vendor mixed Chart.js and hand-rolled CSS bars for the same
 * data). Colors come from the PruittHealth chart tokens.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TEAL = "#0E5752";
const BURGUNDY = "#7B2D3F";
const AMBER = "#B8862B";
const GREEN = "#2E7D5B";
const GRID = "#E5E1D8";
const TICK = { fontSize: 10, fill: "#6B6F75" } as const;

/** Revenue bars + operating-margin line, dual axis. Explicit margin min/max
 *  per scope so a 30bps slip stays visible. */
export function TrendCombo({
  labels,
  rev,
  margin,
  min,
  max,
}: {
  labels: string[];
  rev: number[];
  margin: number[];
  min: number;
  max: number;
}) {
  const data = labels.map((m, i) => ({ m, rev: rev[i], margin: margin[i] }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="m" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis yAxisId="rev" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="margin"
            orientation="right"
            domain={[min, max]}
            tick={TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number, name: string) =>
              name === "Revenue ($M)" ? [`$${v}M`, name] : [`${v}%`, name]
            }
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          <Bar yAxisId="rev" dataKey="rev" name="Revenue ($M)" fill={TEAL} fillOpacity={0.55} radius={[5, 5, 0, 0]} />
          <Line
            yAxisId="margin"
            dataKey="margin"
            name="Operating margin (%)"
            stroke={BURGUNDY}
            strokeWidth={2}
            dot={{ r: 3, fill: BURGUNDY }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal category bars (citation frequency, service-line margins…). */
export function CategoryBars({
  data,
  unit = "",
}: {
  data: { label: string; count: number; tone: string }[];
  unit?: string;
}) {
  return (
    <div style={{ height: Math.max(180, data.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 30, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ ...TICK, fontSize: 10.5 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number) => [`${v}${unit}`, ""]}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }}
          />
          <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={16}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.tone} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SERIES_COLORS = [BURGUNDY, GREEN, AMBER, TEAL];

/** Multi-series monthly line chart (citation trend by category). */
export function TrendLines({
  labels,
  series,
}: {
  labels: string[];
  series: { name: string; values: number[] }[];
}) {
  const data = labels.map((m, i) => {
    const row: Record<string, string | number> = { m };
    for (const s of series) row[s.name] = s.values[i];
    return row;
  });
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="m" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          {series.map((s, i) => (
            <Line
              key={s.name}
              dataKey={s.name}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
