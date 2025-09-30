import MainLayout from "@/components/layouts/MainLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getProfile, Grade, addXP, bumpStreak, addLeaderboard } from "@/lib/vedaStore";
import { useMemo, useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Target, Timer, Brain, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Practice() {
  const profile = getProfile();
  const { t } = useI18n();
  return (
    <MainLayout>
      <h1 className="text-2xl font-extrabold mb-4">{t("practice")}</h1>
      {!profile.grade ? (
        <div className="rounded-2xl border p-5 shadow-soft bg-card">
          <p className="mb-3">{t("selectClassPrompt")}</p>
          <a href="/class" className="rounded-2xl bg-veda-sky text-white px-4 py-2 shadow-soft">{t("goToClassSelection")}</a>
        </div>
      ) : (
        <Tabs defaultValue="quick" className="grid gap-4">
          <TabsList className="rounded-2xl bg-veda-lavender/20">
            <TabsTrigger value="quick" className="rounded-2xl">🎯 Quick Practice</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-2xl">📚 Custom Practice</TabsTrigger>
            <TabsTrigger value="challenge" className="rounded-2xl">🔥 Challenge Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <QuickPractice grade={profile.grade!} />
          </TabsContent>

          <TabsContent value="custom">
            <CustomPractice grade={profile.grade!} />
          </TabsContent>

          <TabsContent value="challenge">
            <ChallengeMode grade={profile.grade!} />
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  );
}

// Question generation grouped by class
export type Question = { id: string; text: string; options: { id: string; label: string; correct?: boolean }[] };
function makeQuestions(grade: Grade, count=8): Question[] {
  let base: [string, string[], number][];
  if (grade === "Nursery" || grade === "KG") {
    base = [
      ["Which is a vowel?", ["A", "B", "D", "K"], 0],
      ["Which is a number?", ["3", "C", "G", "Q"], 0],
      ["Find the shape with 3 sides", ["Triangle", "Circle", "Square", "Star"], 0],
    ];
  } else if (["1","2","3","4","5"].includes(grade)) {
    base = [
      ["2 + 5 = ?", ["6","7","8","9"], 1],
      ["Which is a noun?", ["Run","Happy","Book","Quickly"], 2],
      ["Which is heavier?", ["Feather","Stone","Paper","Leaf"], 1],
    ];
  } else if (["6","7","8"].includes(grade)) {
    base = [
      ["HCF of 12 and 18?", ["3","6","9","12"], 1],
      ["Photosynthesis happens in?", ["Roots","Leaves","Stem","Flower"], 1],
      ["Simple past of 'go'?", ["goes","going","went","gone"], 2],
    ];
  } else if (["9","10"].includes(grade)) {
    base = [
      ["Solve: (a+b)^2?", ["a^2+b^2","a^2+2ab+b^2","2ab","a^2-b^2"], 1],
      ["Ohm's law: V = ?", ["IR","I/R","R/I","I^2R"], 0],
      ["Tenses count?", ["2","3","4","12"], 2],
    ];
  } else {
    base = [
      ["Derivative of x^2?", ["x","2x","x^2","2x^2"], 1],
      ["Unit of impulse?", ["N","N·s","J","kg"], 1],
      ["Principal clause is?", ["Main clause","Subordinate","Phrase","Noun"], 0],
    ];
  }
  const out: Question[] = [];
  for (let i=0;i<count;i++){
    const [t, opts, idx] = base[i % base.length];
    out.push({ id: `${i}` , text: t, options: opts.map((o,j)=>({ id: `${i}-${j}`, label: o, correct: j===idx })) });
  }
  return out;
}

function QuickPractice({ grade }: { grade: Grade }) {
  const [questions] = useState(()=>makeQuestions(grade, 8));
  return <Quiz questions={questions} timed={false} />;
}

function CustomPractice({ grade }: { grade: Grade }) {
  const [subject, setSubject] = useState("Math");
  const [difficulty, setDifficulty] = useState("Easy");
  const [start, setStart] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  return (
    <div className="rounded-2xl border p-5 shadow-soft bg-card grid gap-4">
      {!start ? (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1">
              <span className="text-sm">Subject</span>
              <select value={subject} onChange={e=>setSubject(e.target.value)} className="rounded-2xl border px-3 py-2 bg-background">
                <option>Math</option>
                <option>Science</option>
                <option>English</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Difficulty</span>
              <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="rounded-2xl border px-3 py-2 bg-background">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
          </div>
          <button onClick={()=>{ setQuestions(makeQuestions(grade, 10)); setStart(true); }} className="self-start rounded-2xl bg-veda-coral text-white px-4 py-2 shadow-soft">Start</button>
        </>
      ) : (
        <Quiz questions={questions} timed={false} />
      )}
    </div>
  );
}

function ChallengeMode({ grade }: { grade: Grade }) {
  const [questions] = useState(()=>makeQuestions(grade, 10));
  return <Quiz questions={questions} timed={true} />;
}

function Quiz({ questions, timed }: { questions: Question[]; timed: boolean }) {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [time, setTime] = useState(timed ? 60 : 0);

  useEffect(()=>{
    if (!timed) return;
    const t = setInterval(()=>setTime((s)=>{ if (s<=1) { clearInterval(t); setDone(true); } return s-1; }), 1000);
    return ()=>clearInterval(t);
  },[timed]);

  if (done){
    return <EndScreen score={score} total={questions.length} timed={timed} />;
  }

  const q = questions[i];
  function submit(){
    if (!selected) return;
    const isCorrect = q.options.find(o=>o.id===selected)?.correct;
    if (isCorrect) setScore(s=>s+1);
    if (i === questions.length-1) setDone(true); else { setI(i+1); setSelected(null); }
  }

  return (
    <div className="rounded-2xl border p-5 shadow-soft bg-card">
      {timed && (
        <div className="mb-3 flex items-center gap-2 text-veda-coral"><Timer size={18}/> {time}s</div>
      )}
      <div className="mb-3 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-veda-sky transition-all" style={{ width: `${((i)/questions.length)*100}%` }} />
      </div>
      <div className="mb-2 text-sm text-muted-foreground">Question {i+1} of {questions.length}</div>
      <h3 className="text-lg font-bold flex items-center gap-2"><Target className="text-veda-sky"/> {q.text}</h3>
      <div className="mt-3 grid gap-2">
        {q.options.map(opt=>{
          const isChosen = selected===opt.id;
          const correct = opt.correct && isChosen;
          const wrong = !opt.correct && isChosen;
          return (
            <button key={opt.id} onClick={()=>setSelected(opt.id)} className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-soft transition-all hover:-translate-y-0.5 ${correct?"bg-green-100 border-green-300": wrong?"bg-red-100 border-red-300":"bg-background"}`}>
              <BookOpen className="text-veda-lavender"/> {opt.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={submit} className="rounded-2xl bg-foreground text-background px-4 py-2 shadow-soft">Submit</button>
        <span className="text-sm text-muted-foreground">Score: {score}</span>
      </div>
    </div>
  );
}

function EndScreen({ score, total, timed }: { score: number; total: number; timed: boolean }){
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  useEffect(()=>{ addXP(score*10); bumpStreak(); },[score]);
  return (
    <div className="rounded-2xl border p-6 shadow-soft bg-card grid gap-3 text-center">
      <div className="text-2xl font-extrabold">Score: {score} / {total}</div>
      <p className="text-muted-foreground">{score>total/2 ? "Great job! Keep it up!" : "Nice try! Practice makes progress."}</p>
      {timed && (
        <div className="grid place-items-center gap-2">
          <div className="text-sm text-muted-foreground">Enter leaderboard</div>
          <div className="flex gap-2 justify-center">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="rounded-2xl border px-3 py-2" />
            <button disabled={!name||saved} onClick={()=>{ addLeaderboard(name, Math.round((score/total)*100)); setSaved(true); }} className="rounded-2xl bg-veda-yellow text-veda-primary-ink px-4 py-2 shadow-soft">Save</button>
          </div>
          {saved && <div className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 size={16}/> Saved!</div>}
        </div>
      )}
    </div>
  );
}
