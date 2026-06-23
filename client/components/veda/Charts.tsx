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
  Cell,
} from "recharts";
import { Assessment, MasteryScore, StudentProfile } from "@shared/coreTypes";
import type { DayActivity } from "@/hooks/useAssessmentActivity";

// ─── Daily Progress Ring ──────────────────────────────────────────────────────
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

// ─── Weekly Performance: Assessment scores over time ──────────────────────────
export function WeeklyPerformance({ assessments }: { assessments: Assessment[] }) {
  // Sort assessments chronologically (oldest to newest)
  const completed = assessments
    .filter((a) => a.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
    .slice(-7); // show last 7 attempts

  if (completed.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center border border-dashed rounded-xl p-4 bg-muted/10">
        <span className="text-2xl mb-1 text-veda-coral">📈</span>
        <p className="text-[11px] text-muted-foreground text-center">No assessments completed yet.<br />Take your first test to start tracking scores!</p>
      </div>
    );
  }

  const data = completed.map((a) => {
    const date = new Date(a.completedAt!);
    return {
      d: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: a.overallScore,
    };
  });

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -16, right: 8, top: 12, bottom: 8 }}>
          <XAxis dataKey="d" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <RTooltip
            contentStyle={{ borderRadius: "12px", fontSize: "11px", backgroundColor: "hsl(var(--card))" }}
            formatter={(v: any) => [`${v}%`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#FF6F61"
            strokeWidth={3}
            dot={{ stroke: '#FF6F61', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Fundamentals: Cognitive Radar ────────────────────────────────────────────
export function FundamentalsRadar({ profile }: { profile: StudentProfile | null }) {
  if (!profile) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center border border-dashed rounded-xl p-4 bg-muted/10">
        <span className="text-2xl mb-1 text-veda-mint">🧠</span>
        <p className="text-[11px] text-muted-foreground text-center">No profile details available.<br />Complete an assessment to calculate skill levels.</p>
      </div>
    );
  }

  const data = [
    { metric: "Retention", value: profile.retention },
    { metric: "Application", value: profile.application },
    { metric: "Grasping", value: profile.grasping },
    { metric: "Speed", value: profile.speed },
    { metric: "Accuracy", value: profile.accuracy ?? 0 },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius={55}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
          <Radar dataKey="value" stroke="#6EC1E4" fill="#6EC1E4" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Topic Mastery: Topic vs Mastery % ────────────────────────────────────────
const COLORS = ["#6EC1E4", "#90EE90", "#FFD93D", "#B57EDC", "#FF6F61", "#7EC8E3"];

export function TopicMasteryChart({ masteryScores }: { masteryScores: MasteryScore[] }) {
  const topics = masteryScores.filter((m) => m.topic !== "");

  if (topics.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center border border-dashed rounded-xl p-4 bg-muted/10">
        <span className="text-2xl mb-1 text-veda-sky">🎯</span>
        <p className="text-[11px] text-muted-foreground text-center">No topic mastery scores logged yet.<br />Assessment performance builds this chart.</p>
      </div>
    );
  }

  const data = topics.slice(0, 6).map((t) => ({
    topic: t.topic,
    mastery: t.masteryPct,
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -16, right: 8, top: 12, bottom: 8 }}>
          <XAxis dataKey="topic" tick={{ fontSize: 9 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <RTooltip
            contentStyle={{ borderRadius: "12px", fontSize: "11px", backgroundColor: "hsl(var(--card))" }}
            formatter={(v: any) => [`${v}%`, "Mastery"]}
          />
          <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Response Speed: Avg response time per assessment ───────────────────────
export function ResponseSpeedChart({ assessments }: { assessments: Assessment[] }) {
  const completed = assessments
    .filter((a) => a.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
    .slice(-7);

  if (completed.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center border border-dashed rounded-xl p-4 bg-muted/10">
        <span className="text-2xl mb-1 text-veda-lavender">⏱️</span>
        <p className="text-[11px] text-muted-foreground text-center">No speed data available.<br />Complete assessments to track response velocities.</p>
      </div>
    );
  }

  const data = completed.map((a) => {
    const date = new Date(a.completedAt!);
    return {
      d: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      speed: a.avgResponseTimeMs ? Math.round(a.avgResponseTimeMs / 1000) : 0, // convert to seconds
    };
  });

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -20, right: 8, top: 12, bottom: 8 }}>
          <XAxis dataKey="d" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <RTooltip
            contentStyle={{ borderRadius: "12px", fontSize: "11px", backgroundColor: "hsl(var(--card))" }}
            formatter={(v: any) => [`${v}s`, "Avg Speed"]}
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke="#B57EDC"
            strokeWidth={3}
            dot={{ stroke: '#B57EDC', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Daily Practice: Questions attempted per day ──────────────────────────────

const DAY_PALETTE = [
  "#6EC1E4", "#90EE90", "#FFD93D", "#B57EDC", "#FF6F61", "#7EC8E3", "#A8D8B9",
];

export function DailyPracticeChart({ data }: { data: DayActivity[] }) {
  const hasActivity = data.some((d) => d.questions > 0);

  if (!hasActivity) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center border border-dashed rounded-xl p-4 bg-muted/10">
        <span className="text-2xl mb-1 text-veda-sky">📅</span>
        <p className="text-[11px] text-muted-foreground text-center">
          No practice activity in the last 7 days.
          <br />
          Answer questions to track daily progress!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -16, right: 8, top: 12, bottom: 8 }}>
          <XAxis dataKey="day" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <RTooltip
            contentStyle={{
              borderRadius: "12px",
              fontSize: "11px",
              backgroundColor: "hsl(var(--card))",
            }}
            formatter={(v: any) => [`${v} question${v !== 1 ? "s" : ""}`, "Attempted"]}
          />
          <Bar dataKey="questions" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={DAY_PALETTE[i % DAY_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
