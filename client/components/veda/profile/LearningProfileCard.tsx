import { StudentProfile } from "@shared/coreTypes";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Brain, Zap, BookOpen, TrendingUp, Target } from "lucide-react";

interface LearningProfileCardProps {
  profile: StudentProfile;
  compact?: boolean;
}

const DIMENSION_META = [
  { key: "retention",    label: "Retention",    icon: Brain,      color: "text-veda-sky",      bg: "bg-veda-sky/10 border-veda-sky/25" },
  { key: "application",  label: "Application",  icon: Zap,        color: "text-veda-coral",    bg: "bg-veda-coral/10 border-veda-coral/25" },
  { key: "grasping",     label: "Grasping",     icon: BookOpen,   color: "text-veda-mint",     bg: "bg-veda-mint/10 border-veda-mint/25" },
  { key: "speed",        label: "Speed",        icon: TrendingUp, color: "text-veda-lavender", bg: "bg-veda-lavender/10 border-veda-lavender/25" },
  { key: "accuracy",     label: "Accuracy",     icon: Target,     color: "text-veda-yellow",   bg: "bg-veda-yellow/10 border-veda-yellow/25" },
] as const;

function scoreLabel(pct: number): { label: string; cls: string } {
  if (pct >= 80) return { label: "Excellent", cls: "text-veda-mint" };
  if (pct >= 60) return { label: "Good",      cls: "text-veda-sky" };
  if (pct >= 40) return { label: "Fair",      cls: "text-veda-yellow" };
  return              { label: "Needs work",  cls: "text-veda-coral" };
}

export default function LearningProfileCard({ profile, compact = false }: LearningProfileCardProps) {
  const radarData = DIMENSION_META.map((d) => ({
    metric: d.label,
    value:  (profile[d.key as keyof StudentProfile] ?? 0) as number,
  }));

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Brain size={16} className="text-veda-lavender" />
          Learning Profile
        </h2>
        {profile.xp > 0 && (
          <span className="text-xs font-semibold rounded-full bg-veda-yellow/20 border border-veda-yellow/40 px-2.5 py-0.5 text-veda-yellow flex items-center gap-1">
            <Zap size={11} />{profile.xp.toLocaleString()} XP
          </span>
        )}
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-2.5">
        {DIMENSION_META.map((d, index) => {
          const val = (profile[d.key as keyof StudentProfile] ?? 0) as number;
          const { label, cls } = scoreLabel(val);
          const Icon = d.icon;
          const isFullWidth = index === DIMENSION_META.length - 1 && DIMENSION_META.length % 2 !== 0;
          return (
            <div key={d.key} className={`rounded-2xl border p-3 ${d.bg} flex flex-col gap-1 ${isFullWidth ? "col-span-2" : ""}`}>
              <div className="flex items-center gap-1.5">
                <Icon size={12} className={d.color} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {d.label}
                </span>
              </div>
              <div className="flex items-end justify-between gap-1">
                <span className="text-xl font-extrabold">{val}%</span>
                <span className={`text-[10px] font-semibold ${cls}`}>{label}</span>
              </div>
              {/* Mini bar */}
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${d.color.replace("text-", "bg-")}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar */}
      {!compact && (
        <div className="w-full h-44">
          <ResponsiveContainer>
            <RadarChart data={radarData} outerRadius={65}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="#B57EDC" fill="#B57EDC" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
