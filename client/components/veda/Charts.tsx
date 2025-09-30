import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis,
  BarChart,
  Bar,
} from "recharts";

export function DailyProgressRing({ value }: { value: number }) {
  const data = [{ name: "progress", value, fill: "#6EC1E4" }];
  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={90 - (value / 100) * 360}
        >
          <RadialBar dataKey="value" cornerRadius={20} background />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyPerformance() {
  const data = [
    { d: "Mon", score: 45 },
    { d: "Tue", score: 52 },
    { d: "Wed", score: 60 },
    { d: "Thu", score: 58 },
    { d: "Fri", score: 70 },
    { d: "Sat", score: 76 },
    { d: "Sun", score: 80 },
  ];
  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis dataKey="d" tick={{ fontSize: 12 }} />
          <YAxis hide domain={[0, 100]} />
          <RTooltip cursor={{ stroke: "#B57EDC" }} />
          <Line type="monotone" dataKey="score" stroke="#FF6F61" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FundamentalsRadar() {
  const data = [
    { metric: "Listening", value: 72 },
    { metric: "Grasping", value: 68 },
    { metric: "Retention", value: 61 },
    { metric: "Application", value: 55 },
  ];
  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius={70}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
          <Radar dataKey="value" stroke="#6EC1E4" fill="#6EC1E4" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniBarTrend() {
  const data = Array.from({ length: 10 }, (_, i) => ({ x: i + 1, y: Math.round(40 + Math.random() * 60) }));
  return (
    <div className="w-full h-16">
      <ResponsiveContainer>
        <BarChart data={data}>
          <Bar dataKey="y" fill="#FFD93D" radius={[8, 8, 8, 8]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
