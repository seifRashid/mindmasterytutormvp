export type UserStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin";
  phone?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  classId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  notes?: string;
  status?: UserStatus;
  rejectionReason?: string;
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

export type AttachmentType = "pdf" | "doc" | "image" | "link" | "presentation" | "other";

export interface LessonAttachment {
  id: string;
  lessonId: string;
  name: string;
  url: string;
  type: AttachmentType;
  orderNumber: number;
}

export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  richContent?: string;         // Markdown lesson notes
  videoUrl?: string;            // Optional YouTube/video embed URL
  duration: number;             // seconds
  orderNumber: number;
  attachments?: LessonAttachment[];
  lessonQuizId?: string;        // Optional inline quiz linked to this lesson
  createdAt: string;
}

export interface Quiz {
  id: string;
  topicId?: string;             // Attached to topic (optional — may be lesson-level)
  lessonId?: string;            // Attached to a specific lesson (optional)
  title: string;
  passingScore: number;         // percentage 0-100
  timeLimitMinutes?: number;    // 0 = no limit
  showFeedback: boolean;        // Show explanation after each question
  createdAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  explanation: string;
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

// ─── MOCK SEED DATA ──────────────────────────────────────────────────────────

export const INITIAL_USERS: User[] = [
  {
    id: "user-admin-1",
    name: "Dr. Sarah Vance",
    email: "admin@mindmastery.edu",
    password: "admin123",
    role: "admin",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-teacher-1",
    name: "Prof. Alex Rivera",
    email: "teacher@mindmastery.edu",
    password: "teacher123",
    role: "teacher",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-student-1",
    name: "David Kim",
    email: "student@mindmastery.edu",
    password: "student123",
    role: "student",
    status: "approved",
    phone: "+1 (555) 234-5678",
    age: 14,
    gender: "male",
    classId: "class-1",
    parentName: "Robert Kim",
    parentPhone: "+1 (555) 987-6543",
    parentEmail: "robert.kim@example.com",
    notes: "Interested in STEM competitions",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-student-2",
    name: "Samantha Wright",
    email: "samantha.w@example.com",
    password: "student123",
    role: "student",
    status: "pending",
    phone: "+1 (555) 345-6789",
    age: 15,
    gender: "female",
    classId: "class-2",
    parentName: "Eleanor Wright",
    parentPhone: "+1 (555) 876-5432",
    parentEmail: "eleanor.w@example.com",
    notes: "Transferred from Lincoln High School",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "user-student-3",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    password: "student123",
    role: "student",
    status: "pending",
    phone: "+1 (555) 456-7890",
    age: 16,
    gender: "male",
    classId: "class-3",
    parentName: "Angela Johnson",
    parentPhone: "+1 (555) 765-4321",
    parentEmail: "angela.j@example.com",
    notes: "Enrolling for Python & Data Structures",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: "user-student-4",
    name: "Jessica Patel",
    email: "jessica.p@example.com",
    password: "student123",
    role: "student",
    status: "rejected",
    rejectionReason: "Incomplete parent contact information provided.",
    phone: "+1 (555) 567-8901",
    age: 14,
    gender: "female",
    classId: "class-1",
    parentName: "Dev Patel",
    parentPhone: "000-0000",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
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
    title: "Introduction to Solving Linear Equations",
    description: "In this lesson, you will learn how to isolate variables using addition, subtraction, and multiplication properties.",
    richContent: `<h2>What is a Linear Equation?</h2>
<p>A <strong>linear equation</strong> is an algebraic equation where each term is either a constant or the product of a constant and a single variable. The variable's highest power is always <strong>1</strong>.</p>
<h3>General Form</h3>
<p><code>ax + b = c</code></p>
<p>Where:</p>
<ul>
  <li><strong>a</strong> = coefficient of the variable</li>
  <li><strong>b</strong> = constant on the left side</li>
  <li><strong>c</strong> = constant on the right side</li>
</ul>
<h2>Steps to Solve a Linear Equation</h2>
<ol>
  <li><strong>Simplify both sides</strong> — combine like terms on each side separately.</li>
  <li><strong>Move variable terms to one side</strong> — use addition or subtraction.</li>
  <li><strong>Move constant terms to the other side</strong> — use addition or subtraction.</li>
  <li><strong>Isolate the variable</strong> — divide or multiply both sides.</li>
</ol>
<h2>Example: Solve for x</h2>
<div class="rte-callout">
  <p><strong>Solve: 3x + 9 = 24</strong></p>
  <p><strong>Step 1</strong>: Subtract 9 from both sides → <code>3x = 15</code></p>
  <p><strong>Step 2</strong>: Divide both sides by 3 → <code>x = 5</code></p>
  <p>✅ <strong>Answer: x = 5</strong></p>
</div>
<h2>Key Properties Used</h2>
<table>
  <thead>
    <tr><th>Property</th><th>Definition</th></tr>
  </thead>
  <tbody>
    <tr><td>Addition Property</td><td>If a = b, then a + c = b + c</td></tr>
    <tr><td>Subtraction Property</td><td>If a = b, then a − c = b − c</td></tr>
    <tr><td>Multiplication Property</td><td>If a = b, then a × c = b × c</td></tr>
    <tr><td>Division Property</td><td>If a = b and c ≠ 0, then a ÷ c = b ÷ c</td></tr>
  </tbody>
</table>
<blockquote>💡 <strong>Remember</strong>: Whatever you do to one side of the equation, you must do the same to the other side to keep it balanced!</blockquote>`,
    videoUrl: "https://www.youtube.com/embed/l3XzepN03KQ",
    duration: 640,
    orderNumber: 1,
    lessonQuizId: "quiz-les-1",
    attachments: [
      {
        id: "att-1",
        lessonId: "les-1",
        name: "Linear Equations Worksheet",
        url: "https://www.mathworksheets4kids.com/linear-equation/one-step/whole-number-1.pdf",
        type: "pdf",
        orderNumber: 1,
      },
      {
        id: "att-2",
        lessonId: "les-1",
        name: "Equation Solving Reference Card",
        url: "https://www.chilimath.com/lessons/introductory-algebra/solving-linear-equations/",
        type: "link",
        orderNumber: 2,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "les-2",
    topicId: "top-1",
    title: "Graphing Linear Inequalities on the Coordinate Plane",
    description: "Learn how to shade regions and plot boundary lines for inequalities.",
    richContent: `<h2>Linear Inequalities</h2>
<p>A <strong>linear inequality</strong> is similar to a linear equation but uses inequality symbols instead of an equals sign.</p>
<h3>Inequality Symbols</h3>
<table>
  <thead><tr><th>Symbol</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>&gt;</td><td>Greater than</td></tr>
    <tr><td>&lt;</td><td>Less than</td></tr>
    <tr><td>≥</td><td>Greater than or equal to</td></tr>
    <tr><td>≤</td><td>Less than or equal to</td></tr>
  </tbody>
</table>
<h2>Graphing Steps</h2>
<ol>
  <li><strong>Replace the inequality with an equals sign</strong> and graph the boundary line.</li>
  <li><strong>Determine line type</strong>:
    <ul>
      <li>Use a <strong>solid line</strong> for ≥ or ≤</li>
      <li>Use a <strong>dashed line</strong> for &gt; or &lt;</li>
    </ul>
  </li>
  <li><strong>Test a point</strong> (usually the origin) to determine which side to shade.</li>
  <li><strong>Shade the correct region</strong>.</li>
</ol>
<div class="rte-callout">
  <p><strong>Example: Graph y ≥ 2x − 3</strong></p>
  <p>Boundary line: <code>y = 2x − 3</code> (solid line since ≥)</p>
  <p>Test (0, 0): <code>0 ≥ 2(0) − 3 → 0 ≥ −3</code> ✅ TRUE</p>
  <p>Shade the region <strong>above</strong> the line.</p>
</div>`,
    videoUrl: "https://www.youtube.com/embed/0X-bMeIN53I",
    duration: 720,
    orderNumber: 2,
    attachments: [
      {
        id: "att-3",
        lessonId: "les-2",
        name: "Graphing Inequalities Practice Sheet",
        url: "https://cdn.kutasoftware.com/Worksheets/Alg1/Graphing%20Linear%20Inequalities.pdf",
        type: "pdf",
        orderNumber: 1,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "les-3",
    topicId: "top-2",
    title: "Animal Cell vs Plant Cell Architecture",
    description: "Visual exploration of cell walls, chloroplasts, and eukaryotic structures.",
    richContent: `<h2>Cell Types: Animal vs Plant</h2>
<p>All living organisms are made of <strong>cells</strong> — the basic unit of life. There are two main types of eukaryotic cells: <strong>animal cells</strong> and <strong>plant cells</strong>.</p>
<h2>Key Differences</h2>
<table>
  <thead><tr><th>Feature</th><th>Animal Cell</th><th>Plant Cell</th></tr></thead>
  <tbody>
    <tr><td>Cell Wall</td><td>❌ Absent</td><td>✅ Present (cellulose)</td></tr>
    <tr><td>Chloroplasts</td><td>❌ Absent</td><td>✅ Present (photosynthesis)</td></tr>
    <tr><td>Vacuole</td><td>Small, temporary</td><td>Large central vacuole</td></tr>
    <tr><td>Centrioles</td><td>✅ Present</td><td>❌ Absent in most</td></tr>
    <tr><td>Shape</td><td>Irregular</td><td>Regular, rectangular</td></tr>
  </tbody>
</table>
<h2>Shared Organelles</h2>
<p>Both animal and plant cells contain:</p>
<ul>
  <li><strong>Nucleus</strong> — controls cell activities, contains DNA</li>
  <li><strong>Mitochondria</strong> — produces ATP (energy)</li>
  <li><strong>Ribosomes</strong> — protein synthesis</li>
  <li><strong>Endoplasmic Reticulum (ER)</strong> — transport network</li>
  <li><strong>Golgi Apparatus</strong> — packages and ships proteins</li>
  <li><strong>Cell Membrane</strong> — controls what enters and exits</li>
</ul>
<div class="rte-callout">
  <p>🔬 <strong>Fun Fact</strong>: A single human body contains about <strong>37 trillion cells!</strong></p>
</div>`,
    videoUrl: "https://www.youtube.com/embed/URUJD5NEXC8",
    duration: 540,
    orderNumber: 1,
    lessonQuizId: "quiz-les-3",
    attachments: [
      {
        id: "att-4",
        lessonId: "les-3",
        name: "Cell Diagram Labeling Activity",
        url: "https://www.biologycorner.com/worksheets/celldiagram.html",
        type: "link",
        orderNumber: 1,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "les-4",
    topicId: "top-3",
    title: "How Binary Search Trees Work",
    description: "Interactive visual tutorial on node insertions, left/right pointers, and depth-first searches.",
    richContent: `<h2>Binary Search Trees (BST)</h2>
<p>A <strong>Binary Search Tree</strong> is a data structure where each node has at most <strong>two children</strong> (left and right), and satisfies the BST property:</p>
<blockquote><strong>Left child &lt; Parent &lt; Right child</strong></blockquote>
<h2>Key Operations</h2>
<h3>1. Insertion</h3>
<ol>
  <li>Start at the root</li>
  <li>If value &lt; current node → go <strong>left</strong></li>
  <li>If value &gt; current node → go <strong>right</strong></li>
  <li>Repeat until an empty spot is found</li>
</ol>
<h3>2. Search Algorithm</h3>
<pre><code>def search(root, key):
    if root is None or root.val == key:
        return root
    if key &lt; root.val:
        return search(root.left, key)
    return search(root.right, key)</code></pre>
<h2>Time Complexity</h2>
<table>
  <thead><tr><th>Operation</th><th>Average</th><th>Worst Case</th></tr></thead>
  <tbody>
    <tr><td>Search</td><td>O(log n)</td><td>O(n)</td></tr>
    <tr><td>Insert</td><td>O(log n)</td><td>O(n)</td></tr>
    <tr><td>Delete</td><td>O(log n)</td><td>O(n)</td></tr>
  </tbody>
</table>`,
    videoUrl: "https://www.youtube.com/embed/f5dU3xoE6ms",
    duration: 880,
    orderNumber: 1,
    lessonQuizId: "quiz-les-4",
    attachments: [
      {
        id: "att-5",
        lessonId: "les-4",
        name: "BST Visualizer Tool",
        url: "https://visualgo.net/en/bst",
        type: "link",
        orderNumber: 1,
      },
      {
        id: "att-6",
        lessonId: "les-4",
        name: "Tree Traversal Cheat Sheet",
        url: "https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/",
        type: "link",
        orderNumber: 2,
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  // Topic-level quizzes
  {
    id: "quiz-1",
    topicId: "top-1",
    title: "Linear Equations Mastery Check",
    passingScore: 70,
    timeLimitMinutes: 10,
    showFeedback: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-2",
    topicId: "top-2",
    title: "Cell Organelles Fundamentals",
    passingScore: 70,
    timeLimitMinutes: 10,
    showFeedback: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-3",
    topicId: "top-3",
    title: "Binary Trees & Complexity Quiz",
    passingScore: 75,
    timeLimitMinutes: 15,
    showFeedback: true,
    createdAt: new Date().toISOString(),
  },
  // Lesson-level inline quizzes
  {
    id: "quiz-les-1",
    lessonId: "les-1",
    title: "Quick Check: Linear Equations",
    passingScore: 60,
    timeLimitMinutes: 5,
    showFeedback: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-les-3",
    lessonId: "les-3",
    title: "Quick Check: Cell Structure",
    passingScore: 60,
    timeLimitMinutes: 5,
    showFeedback: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-les-4",
    lessonId: "les-4",
    title: "Quick Check: BST Concepts",
    passingScore: 60,
    timeLimitMinutes: 5,
    showFeedback: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  // quiz-1 (topic level)
  {
    id: "q-1",
    quizId: "quiz-1",
    type: "multiple_choice",
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
    type: "true_false",
    question: "Dividing both sides of an equation by the same non-zero number keeps the equation balanced.",
    explanation: "This is the Division Property of Equality — dividing both sides by the same value maintains the equality.",
    orderNumber: 2,
    answers: [
      { id: "a-2-1", questionId: "q-2", answer: "True", isCorrect: true },
      { id: "a-2-2", questionId: "q-2", answer: "False", isCorrect: false },
    ],
  },
  // quiz-2 (topic level)
  {
    id: "q-3",
    quizId: "quiz-2",
    type: "multiple_choice",
    question: "Which organelle is known as the powerhouse of the cell?",
    explanation: "Mitochondria convert glucose and oxygen into ATP energy through cellular respiration.",
    orderNumber: 1,
    answers: [
      { id: "a-3-1", questionId: "q-3", answer: "Mitochondria", isCorrect: true },
      { id: "a-3-2", questionId: "q-3", answer: "Ribosome", isCorrect: false },
      { id: "a-3-3", questionId: "q-3", answer: "Golgi Apparatus", isCorrect: false },
      { id: "a-3-4", questionId: "q-3", answer: "Lysosome", isCorrect: false },
    ],
  },
  // quiz-3 (topic level)
  {
    id: "q-4",
    quizId: "quiz-3",
    type: "multiple_choice",
    question: "What is the average time complexity for searching a key in a balanced Binary Search Tree?",
    explanation: "In a balanced BST, half the nodes are eliminated at each step, resulting in O(log n) time complexity.",
    orderNumber: 1,
    answers: [
      { id: "a-4-1", questionId: "q-4", answer: "O(log n)", isCorrect: true },
      { id: "a-4-2", questionId: "q-4", answer: "O(n²)", isCorrect: false },
      { id: "a-4-3", questionId: "q-4", answer: "O(1)", isCorrect: false },
      { id: "a-4-4", questionId: "q-4", answer: "O(n log n)", isCorrect: false },
    ],
  },
  // quiz-les-1 (lesson inline)
  {
    id: "q-les1-1",
    quizId: "quiz-les-1",
    type: "multiple_choice",
    question: "What is the first step in solving 2x + 6 = 14?",
    explanation: "You should first subtract 6 from both sides to isolate the term with x, giving 2x = 8.",
    orderNumber: 1,
    answers: [
      { id: "a-l1-1", questionId: "q-les1-1", answer: "Subtract 6 from both sides", isCorrect: true },
      { id: "a-l1-2", questionId: "q-les1-1", answer: "Divide both sides by 2", isCorrect: false },
      { id: "a-l1-3", questionId: "q-les1-1", answer: "Add 6 to both sides", isCorrect: false },
      { id: "a-l1-4", questionId: "q-les1-1", answer: "Multiply both sides by 2", isCorrect: false },
    ],
  },
  {
    id: "q-les1-2",
    quizId: "quiz-les-1",
    type: "true_false",
    question: "The equation 5x = 25 has the solution x = 5.",
    explanation: "Dividing both sides by 5 gives x = 25 ÷ 5 = 5. So yes, x = 5 is correct.",
    orderNumber: 2,
    answers: [
      { id: "a-l2-1", questionId: "q-les1-2", answer: "True", isCorrect: true },
      { id: "a-l2-2", questionId: "q-les1-2", answer: "False", isCorrect: false },
    ],
  },
  // quiz-les-3 (cell lesson inline)
  {
    id: "q-les3-1",
    quizId: "quiz-les-3",
    type: "true_false",
    question: "Plant cells have a cell wall made of cellulose.",
    explanation: "Correct! The cell wall in plant cells is made of cellulose, providing structural support and rigidity.",
    orderNumber: 1,
    answers: [
      { id: "a-l3-1", questionId: "q-les3-1", answer: "True", isCorrect: true },
      { id: "a-l3-2", questionId: "q-les3-1", answer: "False", isCorrect: false },
    ],
  },
  {
    id: "q-les3-2",
    quizId: "quiz-les-3",
    type: "multiple_choice",
    question: "Which organelle is found in plant cells but NOT in animal cells?",
    explanation: "Chloroplasts are unique to plant cells (and some algae). They contain chlorophyll and are responsible for photosynthesis.",
    orderNumber: 2,
    answers: [
      { id: "a-l3-3", questionId: "q-les3-2", answer: "Chloroplast", isCorrect: true },
      { id: "a-l3-4", questionId: "q-les3-2", answer: "Mitochondria", isCorrect: false },
      { id: "a-l3-5", questionId: "q-les3-2", answer: "Ribosome", isCorrect: false },
      { id: "a-l3-6", questionId: "q-les3-2", answer: "Nucleus", isCorrect: false },
    ],
  },
  // quiz-les-4 (BST lesson inline)
  {
    id: "q-les4-1",
    quizId: "quiz-les-4",
    type: "multiple_choice",
    question: "In a BST, where are values smaller than the root stored?",
    explanation: "By the BST property, all values less than a node are stored in its LEFT subtree.",
    orderNumber: 1,
    answers: [
      { id: "a-l4-1", questionId: "q-les4-1", answer: "Left subtree", isCorrect: true },
      { id: "a-l4-2", questionId: "q-les4-1", answer: "Right subtree", isCorrect: false },
      { id: "a-l4-3", questionId: "q-les4-1", answer: "At the root", isCorrect: false },
      { id: "a-l4-4", questionId: "q-les4-1", answer: "In a separate array", isCorrect: false },
    ],
  },
  {
    id: "q-les4-2",
    quizId: "quiz-les-4",
    type: "true_false",
    question: "In-order traversal of a BST always produces values in sorted (ascending) order.",
    explanation: "True! Because in-order traversal visits Left → Root → Right, and the BST property ensures left values are always smaller.",
    orderNumber: 2,
    answers: [
      { id: "a-l4-5", questionId: "q-les4-2", answer: "True", isCorrect: true },
      { id: "a-l4-6", questionId: "q-les4-2", answer: "False", isCorrect: false },
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
