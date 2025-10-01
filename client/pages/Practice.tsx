import MainLayout from "@/components/layouts/MainLayout";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  setGrade,
  Grade,
  getProfile,
  addXP,
  bumpStreak,
} from "@/lib/vedaStore";
import { Timer, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  RadarChart as RRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RRadar,
  ResponsiveContainer,
} from "recharts";

// Types
export type QuestionType = "mcq" | "fill" | "scenario";
export type MCQOption = { id: string; label: string; correct?: boolean };
export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  options?: MCQOption[]; // for mcq
  answer?: string; // for fill
  keywords?: string[]; // for scenario short-text evaluation
  subject: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

type Setup = {
  grade: Grade | null;
  subject:
    | "Mathematics"
    | "Science"
    | "English"
    | "Social Studies"
    | "General Knowledge"
    | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  timed: boolean;
};

export default function Practice() {
  const { t } = useI18n();
  const profile = getProfile();

  const [setup, setSetup] = useState<Setup>({
    grade: (profile.grade ?? null) as Grade | null,
    subject: null,
    difficulty: null,
    timed: false,
  });
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  function onStart() {
    if (!setup.grade || !setup.subject || !setup.difficulty) return;
    setGrade(setup.grade);
    const qs = generateQuiz({
      grade: setup.grade,
      subject: setup.subject,
      difficulty: setup.difficulty,
      count: 10,
    });
    setQuestions(qs);
    setStarted(true);
  }

  return (
    <MainLayout>
      <h1 className="text-2xl font-extrabold mb-4">{t("practice")}</h1>

      {/* Setup Form */}
      <div className="rounded-2xl border p-5 shadow-soft bg-card grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Class */}
          <label className="grid gap-2">
            <span className="text-sm font-semibold">
              Select Standard (Class)
            </span>
            <Select
              value={setup.grade ?? undefined}
              onValueChange={(v) =>
                setSetup((s) => ({ ...s, grade: v as Grade }))
              }
            >
              <SelectTrigger className="rounded-2xl bg-veda-lavender/20 shadow-soft hover:shadow-soft-lg focus:ring-veda-sky">
                <SelectValue placeholder="Choose Class" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {label(g)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {/* Subject */}
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Select Subject</span>
            <Select
              value={setup.subject ?? undefined}
              onValueChange={(v) =>
                setSetup((s) => ({ ...s, subject: v as Setup["subject"] }))
              }
            >
              <SelectTrigger className="rounded-2xl bg-veda-sky/20 shadow-soft hover:shadow-soft-lg focus:ring-veda-lavender">
                <SelectValue placeholder="Choose Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {/* Difficulty */}
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Select Difficulty</span>
            <Select
              value={setup.difficulty ?? undefined}
              onValueChange={(v) =>
                setSetup((s) => ({
                  ...s,
                  difficulty: v as Setup["difficulty"],
                }))
              }
            >
              <SelectTrigger className="rounded-2xl bg-veda-yellow/20 shadow-soft hover:shadow-soft-lg focus:ring-veda-sky">
                <SelectValue placeholder="Choose Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {/* Timer toggle */}
          <div className="flex items-center gap-3 md:justify-center">
            <div className="grid gap-1">
              <span className="text-sm font-semibold">Timer</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={setup.timed}
                  onCheckedChange={(v) => setSetup((s) => ({ ...s, timed: v }))}
                />
                <span>{setup.timed ? "On" : "Off"}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={onStart}
            disabled={!setup.grade || !setup.subject || !setup.difficulty}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-white shadow-soft transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-soft-lg bg-gradient-to-r from-veda-sky to-veda-lavender"
          >
            Start Quiz 🚀
          </button>
        </div>
      </div>

      {/* Quiz */}
      <div className="mt-6">
        {started ? (
          <Quiz questions={questions} timed={setup.timed} />
        ) : (
          <div className="text-sm text-muted-foreground">
            Select your class, subject and difficulty to begin.
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const GRADES: Grade[] = [
  "Nursery",
  "KG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];
const SUBJECTS: Setup["subject"][] = [
  "Mathematics",
  "Science",
  "English",
  "Social Studies",
  "General Knowledge",
];
const DIFFICULTY: Setup["difficulty"][] = ["Easy", "Medium", "Hard"];

function label(g: Grade) {
  return g === "Nursery" || g === "KG" ? g : `Class ${g}`;
}

// Quiz generator
function generateQuiz({
  grade,
  subject,
  difficulty,
  count,
}: {
  grade: Grade;
  subject: NonNullable<Setup["subject"]>;
  difficulty: NonNullable<Setup["difficulty"]>;
  count: number;
}): Question[] {
  const out: Question[] = [];
  const pool = buildQuestionPool(grade, subject, difficulty);
  for (let i = 0; i < count; i++) {
    out.push({ ...pool[i % pool.length], id: `${i}` });
  }
  return out;
}

function buildQuestionPool(
  grade: Grade,
  subject: NonNullable<Setup["subject"]>,
  difficulty: NonNullable<Setup["difficulty"]>,
): Omit<Question, "id">[] {
  const lvl = difficulty;
  const s = subject;
  const mcq = (
    text: string,
    opts: [string, boolean][],
  ): Omit<Question, "id"> => ({
    type: "mcq",
    text,
    options: opts.map((o, i) => ({ id: `${i}`, label: o[0], correct: o[1] })),
    subject: s,
    difficulty: lvl,
  });
  const fill = (text: string, answer: string): Omit<Question, "id"> => ({
    type: "fill",
    text,
    answer,
    subject: s,
    difficulty: lvl,
  });
  const scenario = (
    text: string,
    keywords: string[],
  ): Omit<Question, "id"> => ({
    type: "scenario",
    text,
    keywords,
    subject: s,
    difficulty: lvl,
  });

  const pool: Omit<Question, "id">[] = [];

  if (s === "Mathematics") {
    if (["Nursery", "KG", "1", "2"].includes(grade)) {
      pool.push(
        mcq("Which is a vowel?", [
          ["A", true],
          ["B", false],
          ["D", false],
          ["K", false],
        ]),
        fill("2 + 3 = __", "5"),
        scenario("You have 2 pencils and get 3 more. How many in total?", [
          "5",
        ]),
      );
    } else if (["3", "4", "5"].includes(grade)) {
      pool.push(
        mcq("2 + 5 = ?", [
          ["6", false],
          ["7", true],
          ["8", false],
          ["9", false],
        ]),
        fill("12 - 4 = __", "8"),
        scenario("A box has 4 rows with 3 apples each. Total apples?", ["12"]),
      );
    } else if (["6", "7", "8"].includes(grade)) {
      pool.push(
        mcq("HCF of 12 and 18?", [
          ["3", false],
          ["6", true],
          ["9", false],
          ["12", false],
        ]),
        fill("Area of 5x3 rectangle = __", "15"),
        scenario("Speed 30 km/h for 2 hours. Distance?", [
          "60",
          "60km",
          "60 km",
        ]),
      );
    } else {
      pool.push(
        mcq("Derivative of x^2?", [
          ["x", false],
          ["2x", true],
          ["x^2", false],
          ["2x^2", false],
        ]),
        fill("∫ 2x dx = __ + C", "x^2"),
        scenario("Function f increasing where f' is __?", [
          "positive",
          ">0",
          "greater than 0",
        ]),
      );
    }
  }

  if (s === "Science") {
    if (["6", "7", "8"].includes(grade)) {
      pool.push(
        mcq("Photosynthesis happens in?", [
          ["Roots", false],
          ["Leaves", true],
          ["Stem", false],
          ["Flower", false],
        ]),
        fill("Gas released in photosynthesis: __", "oxygen"),
        scenario("Plant kept in dark. Predict: rate of photosynthesis is __.", [
          "low",
          "decrease",
          "reduced",
        ]),
      );
    } else {
      pool.push(
        mcq("Ohm's law: V = ?", [
          ["IR", true],
          ["I/R", false],
          ["R/I", false],
          ["I^2R", false],
        ]),
        fill("H2O is commonly called __", "water"),
        scenario("A ball is thrown up. At highest point, velocity is __.", [
          "0",
          "zero",
        ]),
      );
    }
  }

  if (s === "English") {
    pool.push(
      mcq("Simple past of 'go'?", [
        ["goes", false],
        ["going", false],
        ["went", true],
        ["gone", false],
      ]),
      fill("Fill the blank: She __ to school.", "goes"),
      scenario("Write a synonym for 'happy'", [
        "glad",
        "joyful",
        "pleased",
        "cheerful",
      ]),
    );
  }

  if (s === "Social Studies") {
    pool.push(
      mcq("India is a __.", [
        ["democracy", true],
        ["monarchy", false],
        ["dictatorship", false],
        ["theocracy", false],
      ]),
      fill("The capital of India is __.", "new delhi"),
      scenario("Name one Fundamental Right in India", [
        "equality",
        "freedom",
        "religion",
        "education",
        "constitutional remedies",
      ]),
    );
  }

  if (s === "General Knowledge") {
    pool.push(
      mcq("Which planet is known as the Red Planet?", [
        ["Mars", true],
        ["Jupiter", false],
        ["Venus", false],
        ["Mercury", false],
      ]),
      fill("Largest ocean on Earth: __ Ocean", "pacific"),
      scenario("Who wrote 'Gitanjali'?", [
        "tagore",
        "rabindranath",
        "rabindranath tagore",
      ]),
    );
  }

  // Adjust difficulty (e.g., duplicate harder items / add variants)
  if (lvl === "Medium") pool.push(...pool);
  if (lvl === "Hard") pool.push(...pool, ...pool);

  return pool;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function Quiz({ questions, timed }: { questions: Question[]; timed: boolean }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correct, setCorrect] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timed ? 60 : 0);
  const qStartRef = useRef<number>(Date.now());
  const [durations, setDurations] = useState<Record<string, number>>({});

  const totalCorrect = useMemo(
    () => Object.values(correct).filter(Boolean).length,
    [correct],
  );
  useEffect(() => {
    if (done) {
      addXP(totalCorrect * 10);
      bumpStreak();
    }
  }, [done, totalCorrect]);

  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed]);

  function recordDuration(qid: string) {
    const now = Date.now();
    const delta = Math.max(0, now - qStartRef.current);
    setDurations((d) => ({ ...d, [qid]: (d[qid] || 0) + delta }));
    qStartRef.current = now;
  }

  function gradeOne(q: Question, a: string): boolean {
    if (q.type === "mcq") {
      const opt = q.options?.find((o) => o.id === a);
      return !!opt?.correct;
    }
    if (q.type === "fill") {
      return normalize(a) === normalize(q.answer || "");
    }
    const kw = (q.keywords || []).map(normalize);
    const ans = normalize(a);
    return kw.some((k) => ans.includes(k));
  }

  function answerCurrent(a: string) {
    const q = questions[i];
    setAnswers((m) => ({ ...m, [q.id]: a }));
  }

  function next() {
    const q = questions[i];
    if (!answers[q.id]) return;
    recordDuration(q.id);
    setCorrect((m) => ({ ...m, [q.id]: gradeOne(q, answers[q.id]) }));
    if (i < questions.length - 1) {
      setI((v) => v + 1);
    }
  }

  function prev() {
    if (i === 0) return;
    recordDuration(questions[i].id);
    setI((v) => v - 1);
  }

  function finish() {
    // grade any unanswered displayed question
    const q = questions[i];
    if (answers[q.id] && correct[q.id] === undefined) {
      setCorrect((m) => ({ ...m, [q.id]: gradeOne(q, answers[q.id]) }));
      recordDuration(q.id);
    }
    setDone(true);
  }

  const answeredCount = Object.keys(answers).length;
  const percent = Math.round(
    (Math.max(i, answeredCount) / questions.length) * 100,
  );

  if (done) {
    return (
      <Feedback
        questions={questions}
        correct={correct}
        durations={durations}
        totalCorrect={totalCorrect}
        timed={timed}
        timeLeft={timeLeft}
      />
    );
  }

  const q = questions[i];
  const a = answers[q.id] || "";

  return (
    <div className="rounded-2xl border p-5 shadow-soft bg-card grid gap-4">
      {/* Timer */}
      {timed && (
        <div className="flex items-center gap-2 text-veda-coral text-sm">
          <Timer size={16} /> {timeLeft}s
        </div>
      )}
      {/* Progress */}
      <div className="grid gap-2">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-veda-sky transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {i + 1} / {questions.length}
        </div>
      </div>

      {/* Question */}
      <div className="grid gap-2">
        <h3 className="text-lg font-bold">{q.text}</h3>
        {q.type === "mcq" && (
          <div className="grid gap-2">
            {q.options!.map((opt) => (
              <button
                key={opt.id}
                onClick={() => answerCurrent(opt.id)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-soft transition-all hover:-translate-y-0.5 ${a === opt.id ? "ring-2 ring-veda-lavender bg-veda-lavender/10" : "bg-background"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {q.type === "fill" && (
          <input
            value={a}
            onChange={(e) => answerCurrent(e.target.value)}
            placeholder="Type your answer"
            className="rounded-2xl border px-3 py-2 bg-background shadow-soft"
          />
        )}
        {q.type === "scenario" && (
          <textarea
            value={a}
            onChange={(e) => answerCurrent(e.target.value)}
            placeholder="Describe your answer briefly"
            className="rounded-2xl border px-3 py-2 bg-background shadow-soft min-h-24"
          />
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={prev}
          disabled={i === 0}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 border shadow-soft disabled:opacity-60"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        {i < questions.length - 1 ? (
          <button
            onClick={next}
            disabled={!answers[q.id]}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-foreground text-background shadow-soft disabled:opacity-60"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={!answers[q.id]}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-veda-coral text-white shadow-soft disabled:opacity-60"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}

function Feedback({
  questions,
  correct,
  durations,
  totalCorrect,
  timed,
  timeLeft,
}: {
  questions: Question[];
  correct: Record<string, boolean>;
  durations: Record<string, number>;
  totalCorrect: number;
  timed: boolean;
  timeLeft: number;
}) {
  const total = questions.length;
  const accuracy = Math.round((totalCorrect / total) * 100);
  const totalTime = Object.values(durations).reduce((a, b) => a + b, 0);
  const seconds = Math.round(totalTime / 1000);

  // Category scores for radar
  const typeTotals = { mcq: 0, fill: 0, scenario: 0 } as Record<
    QuestionType,
    number
  >;
  const typeCorrect = { mcq: 0, fill: 0, scenario: 0 } as Record<
    QuestionType,
    number
  >;
  questions.forEach((q) => {
    typeTotals[q.type] += 1;
    if (correct[q.id]) typeCorrect[q.type] += 1;
  });
  const toPct = (n: number, d: number) =>
    d === 0 ? 0 : Math.round((n / d) * 100);
  const listening = Math.max(
    40,
    Math.min(
      100,
      Math.round(60 + accuracy * 0.3 - Math.max(0, seconds / total - 10)),
    ),
  );
  const grasping = toPct(typeCorrect.mcq, typeTotals.mcq);
  const retention = toPct(typeCorrect.fill, typeTotals.fill);
  const application = toPct(typeCorrect.scenario, typeTotals.scenario);

  const radarData = [
    { metric: "Listening", value: listening },
    { metric: "Grasping", value: grasping },
    { metric: "Retention", value: retention },
    { metric: "Application", value: application },
  ];

  // Friendly feedback text
  const strengths: string[] = [];
  const improvements: string[] = [];
  if (listening >= 70) strengths.push("Listening 🎧");
  else improvements.push("Listening 🧏");
  if (grasping >= 70) strengths.push("Grasping 🧩");
  else improvements.push("Grasping 🧩");
  if (retention >= 70) strengths.push("Retention 🧠");
  else improvements.push("Retention 🧠");
  if (application >= 70) strengths.push("Application ✍️");
  else improvements.push("Application ✍️");

  return (
    <div className="rounded-2xl border p-6 shadow-soft bg-card grid gap-4">
      <div className="text-xl font-extrabold">Your Results</div>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="grid gap-2 text-sm">
          <div>
            Accuracy: <span className="font-semibold">{accuracy}%</span>
          </div>
          <div>
            Time taken:{" "}
            <span className="font-semibold">
              {timed ? `${60 - timeLeft}s` : `${seconds}s`}
            </span>
          </div>
          <div className="text-muted-foreground">
            {strengths.length > 0 && (
              <div>You’re strong in {strengths.join(", ")}.</div>
            )}
            {improvements.length > 0 && (
              <div>Practice more for {improvements.join(", ")}.</div>
            )}
          </div>
        </div>
        <div className="w-full h-56">
          <ResponsiveContainer>
            <RRadarChart data={radarData} outerRadius={80}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <RRadar
                dataKey="value"
                stroke="#6EC1E4"
                fill="#6EC1E4"
                fillOpacity={0.4}
              />
            </RRadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
