import { AIProvider } from "./AIProvider";
import { QuestionRequest, VedaMCQ } from "./types";

const SEED_QUESTIONS: VedaMCQ[] = [
  // ─── Mathematics — Fractions ───
  {
    question: "What is 1/2 + 1/4?",
    options: ["1/6", "2/6", "3/4", "1/8"],
    correctAnswer: "3/4",
    explanation: "To add fractions, find a common denominator: 1/2 is equal to 2/4. Then 2/4 + 1/4 = 3/4.",
    topic: "Fractions",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "Which of the following is equivalent to 3/5?",
    options: ["6/10", "5/3", "9/15", "Both 6/10 and 9/15"],
    correctAnswer: "Both 6/10 and 9/15",
    explanation: "Multiplying the numerator and denominator of 3/5 by 2 gives 6/10. Multiplying them by 3 gives 9/15.",
    topic: "Fractions",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "Solve: 2/3 × 4/5",
    options: ["6/8", "8/15", "10/15", "6/15"],
    correctAnswer: "8/15",
    explanation: "Multiply the numerators (2 × 4 = 8) and the denominators (3 × 5 = 15) to get 8/15.",
    topic: "Fractions",
    difficulty: "Medium",
    classLevel: "6"
  },
  {
    question: "What is 3/4 divided by 1/2?",
    options: ["3/8", "3/2", "1/2", "2/3"],
    correctAnswer: "3/2",
    explanation: "To divide fractions, multiply the first fraction by the reciprocal of the second: 3/4 × 2/1 = 6/4, which simplifies to 3/2.",
    topic: "Fractions",
    difficulty: "Medium",
    classLevel: "6"
  },
  {
    question: "Solve for x: x + 2/3 = 1 1/6",
    options: ["1/2", "1/3", "2/3", "5/6"],
    correctAnswer: "1/2",
    explanation: "Convert 1 1/6 to 7/6. Subtract 2/3 (which is 4/6) from 7/6: 7/6 - 4/6 = 3/6, which reduces to 1/2.",
    topic: "Fractions",
    difficulty: "Hard",
    classLevel: "6"
  },

  // ─── Mathematics — Algebra ───
  {
    question: "Solve for x: x - 5 = 12",
    options: ["7", "17", "6", "60"],
    correctAnswer: "17",
    explanation: "Add 5 to both sides of the equation to find x: x = 12 + 5 = 17.",
    topic: "Algebra",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "Solve for y: 3y + 4 = 19",
    options: ["5", "6", "15", "7"],
    correctAnswer: "5",
    explanation: "Subtract 4 from both sides: 3y = 15. Then divide by 3: y = 5.",
    topic: "Algebra",
    difficulty: "Medium",
    classLevel: "6"
  },
  {
    question: "If 2x - 7 = 3x - 12, what is x?",
    options: ["5", "19", "-5", "-19"],
    correctAnswer: "5",
    explanation: "Subtract 2x from both sides: -7 = x - 12. Add 12 to both sides: x = 5.",
    topic: "Algebra",
    difficulty: "Hard",
    classLevel: "6"
  },

  // ─── Mathematics — Decimals ───
  {
    question: "What is 0.6 × 0.3?",
    options: ["1.8", "0.18", "0.018", "0.06"],
    correctAnswer: "0.18",
    explanation: "Multiply the numbers as integers: 6 × 3 = 18. Since there are two decimal places in total, move the decimal point two places left: 0.18.",
    topic: "Decimals",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "Express 3/8 as a decimal.",
    options: ["0.375", "0.38", "0.3", "0.125"],
    correctAnswer: "0.375",
    explanation: "Dividing 3 by 8 gives exactly 0.375.",
    topic: "Decimals",
    difficulty: "Medium",
    classLevel: "6"
  },

  // ─── Mathematics — Geometry ───
  {
    question: "What is the area of a rectangle with length 8cm and width 5cm?",
    options: ["13 sq cm", "26 sq cm", "40 sq cm", "80 sq cm"],
    correctAnswer: "40 sq cm",
    explanation: "Area of a rectangle = length × width = 8cm × 5cm = 40 sq cm.",
    topic: "Geometry",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "What is the perimeter of a regular hexagon with side length 5cm?",
    options: ["25 cm", "30 cm", "15 cm", "36 cm"],
    correctAnswer: "30 cm",
    explanation: "A hexagon has 6 sides. Perimeter of a regular hexagon = 6 × side length = 6 × 5 = 30 cm.",
    topic: "Geometry",
    difficulty: "Medium",
    classLevel: "6"
  },

  // ─── English — Grammar ───
  {
    question: "Identify the pronoun in the sentence: 'She walked to the school.'",
    options: ["She", "walked", "school", "to"],
    correctAnswer: "She",
    explanation: "A pronoun replaces a noun. 'She' is a personal pronoun representing the subject.",
    topic: "Grammar",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "Choose the correct verb: 'Neither the teacher nor the students ______ present.'",
    options: ["was", "were", "is", "be"],
    correctAnswer: "were",
    explanation: "With 'neither... nor', the verb agrees with the closer subject. 'students' is plural, so 'were' is correct.",
    topic: "Grammar",
    difficulty: "Medium",
    classLevel: "6"
  },
  {
    question: "Identify the independent clause in this sentence: 'Although it was raining, they played the match.'",
    options: ["Although it was raining", "they played the match", "raining, they played", "Although it was raining, they"],
    correctAnswer: "they played the match",
    explanation: "An independent clause can stand alone as a complete sentence. 'they played the match' has a subject and a verb and forms a complete thought.",
    topic: "Grammar",
    difficulty: "Hard",
    classLevel: "6"
  },

  // ─── English — Vocabulary ───
  {
    question: "What is the antonym of 'Generous'?",
    options: ["Kind", "Selfish", "Happy", "Polite"],
    correctAnswer: "Selfish",
    explanation: "Generous means sharing or giving. Its opposite is Selfish.",
    topic: "Vocabulary",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "What does the word 'Obsolete' mean?",
    options: ["Brand new", "No longer used", "Extremely fast", "Hard to understand"],
    correctAnswer: "No longer used",
    explanation: "Obsolete refers to something that is out of date or no longer in use.",
    topic: "Vocabulary",
    difficulty: "Medium",
    classLevel: "6"
  },

  // ─── Science — General/Mixed ───
  {
    question: "Which organelle is known as the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
    correctAnswer: "Mitochondria",
    explanation: "Mitochondria generate energy (ATP) for the cell, which is why they are called the powerhouse.",
    topic: "Cells",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "What type of force pulls objects down toward the center of the Earth?",
    options: ["Friction", "Magnetism", "Gravity", "Elastic Force"],
    correctAnswer: "Gravity",
    explanation: "Gravity is the attractive force that Earth exerts on all objects, pulling them down.",
    topic: "Forces",
    difficulty: "Easy",
    classLevel: "6"
  },
  {
    question: "Which of the following is a renewable source of energy?",
    options: ["Coal", "Natural Gas", "Solar Energy", "Petroleum"],
    correctAnswer: "Solar Energy",
    explanation: "Solar energy comes from the sun and is constantly replenished, making it renewable.",
    topic: "Energy",
    difficulty: "Medium",
    classLevel: "6"
  },
  {
    question: "What is the process by which green plants make their food?",
    options: ["Respiration", "Photosynthesis", "Transpiration", "Fermentation"],
    correctAnswer: "Photosynthesis",
    explanation: "Photosynthesis is the chemical process where plants use sunlight, carbon dioxide, and water to make glucose and oxygen.",
    topic: "Photosynthesis",
    difficulty: "Medium",
    classLevel: "6"
  },
  {
    question: "What is the chemical formula for carbon dioxide?",
    options: ["O2", "H2O", "CO2", "CO"],
    correctAnswer: "CO2",
    explanation: "CO2 represents one carbon atom bonded to two oxygen atoms, which is Carbon Dioxide.",
    topic: "Chemistry",
    difficulty: "Easy",
    classLevel: "6"
  }
];

export class SeedProvider implements AIProvider {
  name = "seed";

  async generateQuestions(req: QuestionRequest): Promise<VedaMCQ[]> {
    try {
      console.log(`[SeedProvider] Sourcing fallback questions for Subject: ${req.subject}, Difficulty: ${req.difficulty}`);

      // Filter by subject keywords in topic or question
      const subjectKeywords: Record<string, string[]> = {
        Math: ["fraction", "decimal", "algebra", "geometry", "x", "y", "solve"],
        English: ["grammar", "pronoun", "verb", "vocabulary", "antonym", "clause", "obsolete"],
        Science: ["cell", "mitochondria", "force", "gravity", "energy", "photosynthesis", "carbon", "co2"]
      };

      const keywords = subjectKeywords[req.subject] || [];

      // Filter questions matching subject keywords and difficulty
      let filtered = SEED_QUESTIONS.filter((q) => {
        const matchesSubject = keywords.some(
          (k) =>
            q.topic.toLowerCase().includes(k) ||
            q.question.toLowerCase().includes(k)
        );
        const matchesDiff = q.difficulty.toLowerCase() === req.difficulty.toLowerCase();
        return matchesSubject && matchesDiff;
      });

      // Avoid list
      const avoidSet = new Set(req.avoidQuestions || []);
      filtered = filtered.filter((q) => !avoidSet.has(q.question));

      // Fallback 1: Filter just by subject (ignoring difficulty) if not enough
      if (filtered.length < req.count) {
        let fallbackSubject = SEED_QUESTIONS.filter((q) => {
          const matchesSubject = keywords.some(
            (k) =>
              q.topic.toLowerCase().includes(k) ||
              q.question.toLowerCase().includes(k)
          );
          return matchesSubject && !avoidSet.has(q.question);
        });

        if (fallbackSubject.length >= req.count) {
          filtered = fallbackSubject;
        } else {
          // Fallback 2: Grab any seed question from the entire bank that isn't avoided
          filtered = SEED_QUESTIONS.filter((q) => !avoidSet.has(q.question));
        }
      }

      // Randomize selection
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, req.count);

      // Map to ensure properties are clean
      return selected.map((q) => ({
        ...q,
        classLevel: req.classLevel, // override with requested class
        difficulty: req.difficulty, // align difficulty
      }));
    } catch (err) {
      console.error("[SeedProvider] Error Sourcing Questions:", err);
      // Return a basic absolute emergency question
      return [
        {
          question: `Solve for x: x + 5 = 10`,
          options: ["5", "10", "15", "0"],
          correctAnswer: "5",
          explanation: "Subtract 5 from both sides of the equation: x = 10 - 5 = 5.",
          topic: "Algebra",
          difficulty: req.difficulty,
          classLevel: req.classLevel
        }
      ];
    }
  }
}
