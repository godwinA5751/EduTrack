import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export default function CGPATrend({ data = [] }) {
  if (!data.length) return null;

  return (
    <div
      className="w-90 md:w-100 lg:w-120 rounded-2xl p-5
      bg-white/10 dark:bg-black/20 backdrop-blur-md
      border border-white/10 lg:mt-30"
    >
      <h3 className="text-white font-bold text-lg mb-1">GPA Trend</h3>
      <p className="text-white/70 text-sm mb-4">Level GPA vs Cumulative CGPA</p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            horizontal={false}
            vertical={true}
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />

          {[0, 1, 2, 3, 4, 5].map((v) => (
            <ReferenceLine
              key={v}
              y={v}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="3 3"
            />
          ))}

          <XAxis
            dataKey="label"
            padding={{ left: 0, right: 20 }}
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0F3A47",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#fff" }}
          />

          <Line
            type="monotone"
            dataKey="gpa"
            name="Level GPA"
            stroke="var(--level-gpa-color)"
            strokeWidth={3}
            dot={{ fill: "var(--level-gpa-color)", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="cgpa"
            name="Cumulative CGPA"
            stroke="var(--cumulative-cgpa-color)"
            strokeWidth={3}
            dot={{ fill: "var(--cumulative-cgpa-color)", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}