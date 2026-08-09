"use client";

/*
 * Renders the agent's ```chart fenced-JSON spec with recharts.
 * Contract (from the system prompt): { type: bar|line|doughnut|horizontalBar,
 * title, labels[], datasets[{label, data[]}], source }. Invalid specs render
 * as plain code — graceful degradation, never a crash.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = ["#0E5752", "#7B2D3F", "#B8862B", "#2E7D5B", "#2F7D78", "#9FB8B0", "#6B6F75", "#A06A2C"];
const GRID = "#E5E1D8";
const TICK = { fontSize: 10, fill: "#6B6F75" } as const;

export type ChartSpec = {
  type: "bar" | "line" | "doughnut" | "horizontalBar";
  title?: string;
  labels: string[];
  datasets: { label?: string; data: number[] }[];
  source?: string;
};

export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const spec = JSON.parse(raw) as ChartSpec;
    if (!Array.isArray(spec.labels) || !Array.isArray(spec.datasets)) return null;
    return spec;
  } catch {
    return null;
  }
}

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  const data = spec.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    spec.datasets.forEach((ds, d) => {
      row[ds.label ?? `series-${d}`] = ds.data[i];
    });
    return row;
  });
  const seriesKeys = spec.datasets.map((ds, d) => ds.label ?? `series-${d}`);
  const showLegend = seriesKeys.length > 1 || spec.type === "doughnut";

  return (
    <div className="mt-2 rounded-lg border border-ph-gray-200 bg-ph-paper p-3">
      {spec.title && (
        <div className="mb-1 text-[11.5px] font-semibold text-ph-ink">{spec.title}</div>
      )}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "doughnut" ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={seriesKeys[0]}
                nameKey="label"
                innerRadius="55%"
                outerRadius="85%"
                stroke="#fff"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: GRID }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            </PieChart>
          ) : spec.type === "line" ? (
            <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: GRID }} />
              {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />}
              {seriesKeys.map((k, i) => (
                <Line key={k} dataKey={k} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 2 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart
              data={data}
              layout={spec.type === "horizontalBar" ? "vertical" : "horizontal"}
              margin={
                spec.type === "horizontalBar"
                  ? { top: 0, right: 12, left: 24, bottom: 0 }
                  : { top: 4, right: 4, left: -22, bottom: 0 }
              }
            >
              <CartesianGrid stroke={GRID} vertical={spec.type === "horizontalBar"} horizontal={spec.type !== "horizontalBar"} />
              {spec.type === "horizontalBar" ? (
                <>
                  <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" width={100} tick={TICK} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} />
                </>
              )}
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: GRID }} />
              {showLegend && <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />}
              {seriesKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} radius={spec.type === "horizontalBar" ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={14} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {spec.source && <div className="mt-1 text-[9.5px] text-ph-gray-400">{spec.source}</div>}
    </div>
  );
}
