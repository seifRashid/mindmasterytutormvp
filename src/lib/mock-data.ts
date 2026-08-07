export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin";
  image?: string;
  createdAt: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  classId: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  description: string;
  orderNumber: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // seconds
  orderNumber: number;
  createdAt: string;
}

export interface Quiz {
  id: string;
  topicId: string;
  title: string;
  passingScore: number; // percentage
  createdAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  question: string;
  explanation: string; // revealed after 3 failed attempts
  orderNumber: number;
  answers: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  failedAttempts: number;
  createdAt: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  watchedDuration: number;
  updatedAt: string;
}

// MOCK SEED DATA
export const INITIAL_USERS: User[] = [
  {
    id: "user-admin-1",
    name: "Dr. Sarah Vance",
    email: "admin@mindmastery.edu",
    password: "admin123",
    role: "admin",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-teacher-1",
    name: "Prof. Alex Rivera",
    email: "teacher@mindmastery.edu",
    password: "teacher123",
    role: "teacher",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-student-1",
    name: "David Kim",
    email: "student@mindmastery.edu",
    password: "student123",
    role: "student",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CLASSES: ClassLevel[] = [
  { id: "class-1", name: "Grade 8", slug: "grade-8", createdAt: new Date().toISOString() },
  { id: "class-2", name: "Grade 9", slug: "grade-9", createdAt: new Date().toISOString() },
  { id: "class-3", name: "Advanced Computer Science", slug: "advanced-cs", createdAt: new Date().toISOString() },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: "sub-1",
    classId: "class-1",
    title: "Mathematics & Algebra",
    slug: "math-algebra",
    description: "Master algebraic expressions, equations, and problem solving.",
    icon: "Calculator",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sub-2",
    classId: "class-1",
    title: "General Biology",
    slug: "general-biology",
    description: "Explore living organisms, cell structures, and ecosystem dynamics.",
    icon: "Dna",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sub-3",
    classId: "class-3",
    title: "Python & Data Structures",
    slug: "python-data-structures",
    description: "Learn Python fundamentals, algorithms, arrays, and binary search trees.",
    icon: "Code",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_TOPICS: Topic[] = [
  {
    id: "top-1",
    subjectId: "sub-1",
    title: "Linear Equations & Inequalities",
    slug: "linear-equations",
    description: "Solving single-variable and multi-variable linear equations.",
    orderNumber: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "top-2",
    subjectId: "sub-2",
    title: "Cell Structure & Organelles",
    slug: "cell-structure",
    description: "Deep dive into membrane transport, mitochondria, and nucleus function.",
    orderNumber: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "top-3",
    subjectId: "sub-3",
    title: "Binary Search & Tree Traversal",
    slug: "binary-search-trees",
    description: "Understanding O(log n) efficiency, tree nodes, and recursive algorithms.",
    orderNumber: 1,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "les-1",
    topicId: "top-1",
    title: "Introduction to Solving Step Linear Equations",
    description: "In this lesson, you will learn how to isolate variables using addition, subtraction, and multiplication properties.",
    videoUrl: "https://www.youtube.com/embed/l3XzepN03KQ",
    duration: 640,
    orderNumber: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "les-2",
    topicId: "top-1",
    title: "Graphing Linear Inequalities on the Coordinate Plane",
    description: "Learn how to shade regions and plot boundary lines for inequalities.",
    videoUrl: "https://www.youtube.com/embed/0X-bMeIN53I",
    duration: 720,
    orderNumber: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "les-3",
    topicId: "top-2",
    title: "Animal Cell vs Plant Cell Architecture",
    description: "Visual exploration of cell walls, chloroplasts, and eukaryotic structures.",
    videoUrl: "https://www.youtube.com/embed/URUJD5NEXC8",
    duration: 540,
    orderNumber: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "les-4",
    topicId: "top-3",
    title: "How Binary Search Trees Work in Computer Science",
    description: "Interactive visual tutorial on node insertions, left/right pointers, and depth-first searches.",
    videoUrl: "https://www.youtube.com/embed/f5dU3xoE6ms",
    duration: 880,
    orderNumber: 1,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: "quiz-1",
    topicId: "top-1",
    title: "Linear Equations Mastery Check",
    passingScore: 70,
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-2",
    topicId: "top-2",
    title: "Cell Organelles Fundamentals",
    passingScore: 70,
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-3",
    topicId: "top-3",
    title: "Binary Trees & Complexity Quiz",
    passingScore: 75,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q-1",
    quizId: "quiz-1",
    question: "What is the value of x in the equation 3x + 9 = 24?",
    explanation: "Subtract 9 from both sides to get 3x = 15. Then divide both sides by 3 to find x = 5.",
    orderNumber: 1,
    answers: [
      { id: "a-1-1", questionId: "q-1", answer: "x = 5", isCorrect: true },
      { id: "a-1-2", questionId: "q-1", answer: "x = 3", isCorrect: false },
      { id: "a-1-3", questionId: "q-1", answer: "x = 8", isCorrect: false },
      { id: "a-1-4", questionId: "q-1", answer: "x = 15", isCorrect: false },
    ],
  },
  {
    id: "q-2",
    quizId: "quiz-1",
    question: "Which operation reverses multiplication when solving for an unknown variable?",
    explanation: "Division is the inverse operation of multiplication. Dividing both sides by the coefficient isolates the variable.",
    orderNumber: 2,
    answers: [
      { id: "a-2-1", questionId: "q-2", answer: "Division", isCorrect: true },
      { id: "a-2-2", questionId: "q-2", answer: "Addition", isCorrect: false },
      { id: "a-2-3", questionId: "q-2", answer: "Subtraction", isCorrect: false },
      { id: "a-2-4", questionId: "q-2", answer: "Exponentiation", isCorrect: false },
    ],
  },
  {
    id: "q-3",
    quizId: "quiz-2",
    question: "Which organelle is known as the powerhouse of the cell?",
    explanation: "Mitochondria convert glucose and oxygen into ATP (adenosine triphosphate) energy through cellular respiration.",
    orderNumber: 1,
    answers: [
      { id: "a-3-1", questionId: "q-3", answer: "Mitochondria", isCorrect: true },
      { id: "a-3-2", questionId: "q-3", answer: "Ribosome", isCorrect: false },
      { id: "a-3-3", questionId: "q-3", answer: "Golgi Apparatus", isCorrect: false },
      { id: "a-3-4", questionId: "q-3", answer: "Lysosome", isCorrect: false },
    ],
  },
  {
    id: "q-4",
    quizId: "quiz-3",
    question: "What is the average time complexity for searching a key in a balanced Binary Search Tree?",
    explanation: "In a balanced Binary Search Tree, half of the remaining nodes are eliminated at each step, resulting in O(log n) logarithmic time complexity.",
    orderNumber: 1,
    answers: [
      { id: "a-4-1", questionId: "q-4", answer: "O(log n)", isCorrect: true },
      { id: "a-4-2", questionId: "q-4", answer: "O(n^2)", isCorrect: false },
      { id: "a-4-3", questionId: "q-4", answer: "O(1)", isCorrect: false },
      { id: "a-4-4", questionId: "q-4", answer: "O(n log n)", isCorrect: false },
    ],
  },
];

export const INITIAL_PROGRESS: LessonProgress[] = [
  {
    id: "prog-1",
    userId: "user-student-1",
    lessonId: "les-1",
    completed: true,
    watchedDuration: 640,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ATTEMPTS: QuizAttempt[] = [
  {
    id: "att-1",
    userId: "user-student-1",
    quizId: "quiz-1",
    score: 100,
    failedAttempts: 0,
    createdAt: new Date().toISOString(),
  },
];
