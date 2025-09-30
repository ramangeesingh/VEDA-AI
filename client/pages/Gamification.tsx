import MainLayout from "@/components/layouts/MainLayout";
import { getProfile, ensureDemoLeaderboard } from "@/lib/vedaStore";
import { Flame, Trophy, Medal, Crown, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { StatCardSVG } from "@/components/veda/DownloadCard";

export default function Gamification(){
  const { t } = useI18n();
  const profile = getProfile();
  const leaderboard = ensureDemoLeaderboard();
  const top = leaderboard[0];
  return (
    <MainLayout>
      <div className="grid gap-6">
        <section className="grid md:grid-cols-3 gap-6 items-stretch">
          <div className="rounded-2xl border bg-card p-5 shadow-soft grid place-items-center h-full">
            <img src="https://cdn.builder.io/api/v1/image/assets%2F39ee7dd62eee466082afcbad8171f571%2Ffddb30a084864fe0a748ec23a3ed4111?format=webp&width=800" alt="Mascot" className="max-w-[260px] md:max-w-[300px] lg:max-w-[340px] max-h-64 md:max-h-72 lg:max-h-80 w-auto object-contain animate-float select-none pointer-events-none"/>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-soft h-full">
            <div className="font-bold mb-2 flex items-center gap-2"><Flame className="text-veda-coral"/> {t("streak")}</div>
            <div className="text-3xl font-extrabold">{profile.streak} 🔥</div>
            <p className="text-sm text-muted-foreground">Keep practicing daily to grow your flame!</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-soft h-full">
            <div className="font-bold mb-2 flex items-center gap-2"><Trophy className="text-veda-yellow"/> {t("badges")}</div>
            <Badges />
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <StatCardSVG title={t("xpPoints")} value={`${profile.xp} XP`} subtitle="Keep it up!" color="#6EC1E4" />
          <StatCardSVG title={t("streak")} value={`${profile.streak} days`} subtitle="Don't break the chain!" color="#FF6F61" />
          {top && <StatCardSVG title={t("leaderboard")} value={`${top.name} — ${top.score}`} subtitle="Top rank this week" color="#FFD93D" />}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="font-bold mb-4 flex items-center gap-2"><Trophy className="text-veda-coral"/> {t("leaderboard")}</div>
          <div className="overflow-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">{t("rank")}</th>
                  <th className="text-left px-3 py-2">{t("name")}</th>
                  <th className="text-left px-3 py-2">{t("class")}</th>
                  <th className="text-right px-3 py-2">{t("score")}</th>
                  <th className="text-right px-3 py-2">{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((e, i)=> (
                  <tr key={i} className={`border-t ${i===0?"bg-veda-yellow/30": i===1?"bg-veda-mint/20": i===2?"bg-veda-lavender/20":"bg-background"}`}>
                    <td className="px-3 py-2 font-bold flex items-center gap-2">{i===0 && <Crown className="text-veda-yellow" size={16}/>} {i+1}</td>
                    <td className="px-3 py-2">{e.name}</td>
                    <td className="px-3 py-2">{e.grade ?? "-"}</td>
                    <td className="px-3 py-2 text-right font-bold">{e.score}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{new Date(e.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

function Badges(){
  const profile = getProfile();
  const ICONS = [
    { key: "Starter", label: "Starter", Icon: Medal, fg: "text-veda-coral", bg: "bg-veda-mint/30" },
    { key: "Streak 3", label: "Streak 3", Icon: Trophy, fg: "text-veda-yellow", bg: "bg-veda-yellow/30" },
    { key: "Math Wiz", label: "Math Wiz", Icon: Star, fg: "text-veda-lavender", bg: "bg-veda-lavender/30" },
    { key: "Top 10", label: "Top 10", Icon: Crown, fg: "text-veda-yellow", bg: "bg-veda-sky/20" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {ICONS.map(b=>{
        const earned = profile.badges.includes(b.key);
        const Icon = b.Icon;
        return (
          <div key={b.key} className={`aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center text-center gap-2 shadow-soft ${earned ? b.bg : "bg-muted"}`}>
            <Icon size={28} className={earned ? b.fg : "text-muted-foreground"} />
            <div className={`text-xs font-semibold ${earned ? "text-foreground" : "text-muted-foreground"}`}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}
