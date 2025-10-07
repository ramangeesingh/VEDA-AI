import { AdaptiveTestState, DiagnosticReport } from "@shared/adaptiveTypes";

export class AdaptiveTestEngine {
  private state: AdaptiveTestState;

  constructor() {
    this.state = {
      currentDifficulty: "Very Easy",
      questionHistory: [],
      score: 0,
      totalQuestions: 0
    };
  }

  getNextDifficulty(isCorrect: boolean): "Very Easy" | "Easy" | "Moderate" | "Hard" {
    const current = this.state.currentDifficulty;
    
    if (isCorrect) {
      // Move up difficulty
      switch (current) {
        case "Very Easy": return "Easy";
        case "Easy": return "Moderate";
        case "Moderate": return "Hard";
        case "Hard": return "Hard"; // Stay at hardest
      }
    } else {
      // Move down difficulty
      switch (current) {
        case "Hard": return "Moderate";
        case "Moderate": return "Easy";
        case "Easy": return "Very Easy";
        case "Very Easy": return "Very Easy"; // Stay at easiest
      }
    }
    return current;
  }

  recordAnswer(question: string, userAnswer: string, correctAnswer: string, subject: string, topic: string) {
    const isCorrect = userAnswer === correctAnswer;
    
    this.state.questionHistory.push({
      question,
      userAnswer,
      correctAnswer,
      isCorrect,
      difficulty: this.state.currentDifficulty,
      subject,
      topic
    });

    if (isCorrect) this.state.score++;
    this.state.totalQuestions++;
    
    this.state.currentDifficulty = this.getNextDifficulty(isCorrect);
  }

  generateDiagnosticReport(): DiagnosticReport {
    const history = this.state.questionHistory;
    const subjects = [...new Set(history.map(h => h.subject))];
    
    // Subject breakdown
    const subjectBreakdown = subjects.map(subject => {
      const subjectQuestions = history.filter(h => h.subject === subject);
      const correct = subjectQuestions.filter(h => h.isCorrect).length;
      const total = subjectQuestions.length;
      return {
        subject,
        correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0
      };
    });

    // Identify strengths and weaknesses
    const strengthAreas = subjectBreakdown
      .filter(s => s.percentage >= 70)
      .map(s => s.subject);
    
    const weaknessAreas = subjectBreakdown
      .filter(s => s.percentage < 50)
      .map(s => s.subject);

    // Generate recommendations
    const recommendations = [];
    if (weaknessAreas.length > 0) {
      recommendations.push(`Focus more practice on: ${weaknessAreas.join(', ')}`);
    }
    if (strengthAreas.length > 0) {
      recommendations.push(`Continue building on your strengths in: ${strengthAreas.join(', ')}`);
    }

    // Difficulty progression
    const difficultyProgression = history.map(h => 
      `${h.difficulty}: ${h.isCorrect ? '✓' : '✗'}`
    );

    return {
      overallScore: Math.round((this.state.score / this.state.totalQuestions) * 100),
      strengthAreas,
      weaknessAreas,
      recommendations,
      difficultyProgression,
      subjectBreakdown
    };
  }

  getCurrentDifficulty() {
    return this.state.currentDifficulty;
  }

  getState() {
    return { ...this.state };
  }
}