import MainLayout from "@/components/layouts/MainLayout";
import { useState, useEffect } from "react";
import { getProfile } from "@/lib/vedaStore";
import { generateQuestions } from "@/lib/practiceService";
import { AdaptiveTestEngine } from "@/lib/adaptiveEngine";
import { DiagnosticReport } from "@shared/adaptiveTypes";
import { Brain, TrendingUp, TrendingDown, CheckCircle, XCircle, FileText } from "lucide-react";

export default function AdaptiveTest() {
  const profile = getProfile();
  const [engine] = useState(() => new AdaptiveTestEngine());
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const maxQuestions = 15;

  useEffect(() => {
    if (profile.grade) {
      loadNextQuestion();
    }
  }, [profile.grade]);

  async function loadNextQuestion() {
    if (questionCount >= maxQuestions) {
      completeTest();
      return;
    }

    setLoading(true);
    setSelected(null);
    setShowResult(false);

    const difficulty = engine.getCurrentDifficulty();
    const questions = await generateQuestions(profile.grade!, "Mixed", difficulty, 1);
    
    if (questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
    setLoading(false);
  }

  function handleAnswer() {
    if (!selected || !currentQuestion) return;

    const correctOption = currentQuestion.options.find((opt: any) => opt.correct);
    const userOption = currentQuestion.options.find((opt: any) => opt.id === selected);
    
    engine.recordAnswer(
      currentQuestion.text,
      userOption?.label || "",
      correctOption?.label || "",
      "Mixed",
      currentQuestion.topic || "General"
    );

    setShowResult(true);
    setQuestionCount(prev => prev + 1);
  }

  function completeTest() {
    const diagnosticReport = engine.generateDiagnosticReport();
    setReport(diagnosticReport);
    setTestComplete(true);
  }

  if (!profile.grade) {
    return (
      <MainLayout>
        <div className="rounded-2xl border p-5 shadow-soft bg-card">
          <p className="mb-3">Please select your class first to start the adaptive test.</p>
          <a href="/class" className="rounded-2xl bg-veda-sky text-white px-4 py-2 shadow-soft">Select Class</a>
        </div>
      </MainLayout>
    );
  }

  if (testComplete && report) {
    return (
      <MainLayout>
        <div className="grid gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Diagnostic Report</h1>
            <p className="text-muted-foreground">Your personalized learning assessment</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Score */}
            <div className="rounded-2xl border p-6 shadow-soft bg-card">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="text-veda-sky" size={24} />
                <h2 className="text-xl font-bold">Overall Performance</h2>
              </div>
              <div className="text-4xl font-bold text-veda-sky mb-2">{report.overallScore}%</div>
              <p className="text-muted-foreground">Questions answered correctly</p>
            </div>

            {/* Difficulty Progression */}
            <div className="rounded-2xl border p-6 shadow-soft bg-card">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-veda-coral" size={24} />
                <h2 className="text-xl font-bold">Difficulty Progression</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.difficultyProgression.slice(-8).map((prog, idx) => (
                  <span key={idx} className={`px-2 py-1 rounded text-xs ${prog.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {prog}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="rounded-2xl border p-6 shadow-soft bg-card">
            <h2 className="text-xl font-bold mb-4">Subject Performance</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {report.subjectBreakdown.map((subject, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-muted">
                  <div className="font-semibold">{subject.subject}</div>
                  <div className="text-2xl font-bold text-veda-sky">{subject.percentage}%</div>
                  <div className="text-sm text-muted-foreground">{subject.correct}/{subject.total} correct</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 shadow-soft bg-card">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-600" size={24} />
                <h2 className="text-xl font-bold">Strengths</h2>
              </div>
              {report.strengthAreas.length > 0 ? (
                <ul className="space-y-2">
                  {report.strengthAreas.map((area, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Keep practicing to build your strengths!</p>
              )}
            </div>

            <div className="rounded-2xl border p-6 shadow-soft bg-card">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="text-red-600" size={24} />
                <h2 className="text-xl font-bold">Areas to Improve</h2>
              </div>
              {report.weaknessAreas.length > 0 ? (
                <ul className="space-y-2">
                  {report.weaknessAreas.map((area, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-600" />
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Great job! No major weak areas identified.</p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-2xl border p-6 shadow-soft bg-card">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-veda-lavender" size={24} />
              <h2 className="text-xl font-bold">Recommendations</h2>
            </div>
            <ul className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-veda-lavender mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <button onClick={() => window.location.reload()} className="rounded-2xl bg-veda-sky text-white px-6 py-3 shadow-soft">
              Take Another Test
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Adaptive Assessment</h1>
          <p className="text-muted-foreground">Questions adapt to your performance level</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-sm">Progress: {questionCount}/{maxQuestions}</span>
            <span className="text-sm">Current Level: <span className="font-semibold text-veda-sky">{engine.getCurrentDifficulty()}</span></span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border p-8 shadow-soft bg-card text-center">
            <div className="animate-spin w-8 h-8 border-2 border-veda-sky border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading next question...</p>
          </div>
        ) : currentQuestion ? (
          <div className="rounded-2xl border p-6 shadow-soft bg-card">
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-2">{currentQuestion.text}</h3>
              {currentQuestion.topic && (
                <span className="text-xs bg-veda-lavender/20 text-veda-lavender px-2 py-1 rounded">
                  Topic: {currentQuestion.topic}
                </span>
              )}
            </div>

            <div className="grid gap-3 mb-6">
              {currentQuestion.options.map((option: any) => {
                const isSelected = selected === option.id;
                const isCorrect = option.correct && showResult;
                const isWrong = isSelected && !option.correct && showResult;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => !showResult && setSelected(option.id)}
                    disabled={showResult}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isCorrect ? 'bg-green-100 border-green-300' :
                      isWrong ? 'bg-red-100 border-red-300' :
                      isSelected ? 'bg-veda-sky/10 border-veda-sky' :
                      'bg-background hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs">
                        {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                      </span>
                      {option.label}
                      {showResult && option.correct && <CheckCircle className="text-green-600 ml-auto" size={20} />}
                      {showResult && isWrong && <XCircle className="text-red-600 ml-auto" size={20} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center">
              {!showResult ? (
                <button
                  onClick={handleAnswer}
                  disabled={!selected}
                  className="rounded-2xl bg-veda-sky text-white px-6 py-2 shadow-soft disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={questionCount >= maxQuestions ? completeTest : loadNextQuestion}
                  className="rounded-2xl bg-veda-coral text-white px-6 py-2 shadow-soft"
                >
                  {questionCount >= maxQuestions ? 'View Report' : 'Next Question'}
                </button>
              )}
              
              <span className="text-sm text-muted-foreground">
                Question {questionCount + 1} of {maxQuestions}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border p-8 shadow-soft bg-card text-center">
            <p>Unable to load questions. Please try again.</p>
            <button onClick={loadNextQuestion} className="mt-4 rounded-2xl bg-veda-sky text-white px-4 py-2 shadow-soft">
              Retry
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}