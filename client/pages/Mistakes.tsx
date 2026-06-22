import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import MistakeCard from "@/components/veda/mistakes/MistakeCard";
import { getMistakes, getMistakeStats } from "@/lib/mistakeService";
import { getOrCreateStudentProfile } from "@/lib/masteryService";
import { MistakeEntry, Subject } from "@shared/coreTypes";
import { BookOpen, AlertCircle, CheckCircle2, Filter } from "lucide-react";
import { Link } from "react-router-dom";

const SUBJECTS: (Subject | "All")[] = ["All", "Math", "Science", "English", "Mixed"];
const FILTERS = ["All", "Unmastered", "Mastered"] as const;
type FilterType = typeof FILTERS[number];

export default function Mistakes() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [mistakes, setMistakes]   = useState<MistakeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grade, setGrade]         = useState("6");
  const [stats, setStats]         = useState({ total: 0, mastered: 0, byTopic: [] as { topic: string; count: number }[] });
  const [subjectFilter, setSubjectFilter] = useState<Subject | "All">("All");
  const [statusFilter,  setStatusFilter]  = useState<FilterType>("All");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [all, statsData, profile] = await Promise.all([
        getMistakes(user.id),
        getMistakeStats(user.id),
        getOrCreateStudentProfile(user),
      ]);
      setMistakes(all);
      setStats(statsData);
      if (profile?.grade) setGrade(profile.grade);
      setIsLoading(false);
    })();
  }, [user]);

  function handleMastered(id: string) {
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, mastered: true } : m))
    );
    setStats((s) => ({ ...s, mastered: s.mastered + 1 }));
  }

  const filtered = mistakes.filter((m) => {
    const subjectOk = subjectFilter === "All" || m.subject === subjectFilter;
    const statusOk =
      statusFilter === "All"
        ? true
        : statusFilter === "Mastered"
        ? m.mastered
        : !m.mastered;
    return subjectOk && statusOk;
  });

  const unmastered = mistakes.filter((m) => !m.mastered).length;

  if (authLoading) return null;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <BookOpen className="text-veda-coral" size={24} />
              Mistake Journal
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review, retry, and master every question you got wrong
            </p>
          </div>
          <Link
            to="/assessment"
            className="rounded-2xl bg-veda-sky text-white px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-soft-lg transition-all"
          >
            New Assessment
          </Link>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-card p-4 text-center shadow-soft">
            <div className="text-2xl font-extrabold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Mistakes</div>
          </div>
          <div className="rounded-2xl border bg-veda-coral/10 border-veda-coral/30 p-4 text-center shadow-soft">
            <div className="text-2xl font-extrabold text-veda-coral">{unmastered}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <AlertCircle size={10} className="inline mr-0.5" />Pending
            </div>
          </div>
          <div className="rounded-2xl border bg-veda-mint/10 border-veda-mint/30 p-4 text-center shadow-soft">
            <div className="text-2xl font-extrabold text-veda-mint">{stats.mastered}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <CheckCircle2 size={10} className="inline mr-0.5" />Mastered
            </div>
          </div>
        </div>

        {/* ── Hot Topics ── */}
        {stats.byTopic.length > 0 && (
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <AlertCircle size={11} /> Most frequent mistake areas
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.byTopic.map((t) => (
                <span
                  key={t.topic}
                  className="rounded-full bg-veda-coral/10 border border-veda-coral/30 px-3 py-1 text-xs font-semibold text-veda-coral"
                >
                  {t.topic} ({t.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          {/* Subject */}
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s as any)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                subjectFilter === s
                  ? "bg-veda-sky/20 border-veda-sky/50 text-veda-sky"
                  : "bg-card hover:bg-muted",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
          <span className="text-muted-foreground text-xs">|</span>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                statusFilter === f
                  ? "bg-veda-lavender/20 border-veda-lavender/50 text-veda-lavender"
                  : "bg-card hover:bg-muted",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-veda-sky border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading your mistakes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center shadow-soft">
            {mistakes.length === 0 ? (
              <>
                <p className="text-3xl mb-3">🎉</p>
                <p className="font-bold text-lg mb-1">No mistakes yet!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Take an assessment to start tracking your learning.
                </p>
                <Link
                  to="/assessment"
                  className="inline-block rounded-2xl bg-veda-sky text-white px-5 py-2.5 font-semibold shadow-soft hover:shadow-soft-lg transition-all text-sm"
                >
                  Start Assessment →
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No mistakes match your filter.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {mistakes.length} mistakes
            </p>
            {filtered.map((m) => (
              <MistakeCard
                key={m.id}
                mistake={m}
                grade={grade}
                onMastered={handleMastered}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
