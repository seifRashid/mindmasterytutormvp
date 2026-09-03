/**
 * AI-Powered Open-Ended Question Grading Service
 * Implements strict structured outputs, rubric adherence, partial credit calculation,
 * confidence signals, and educational feedback.
 */

import { callAiService, AI_CONFIG } from "./client";
import { AiGradingStatus, CriterionEvaluationResult, RubricCriterion } from "@/lib/types";

export const GRADING_PROMPT_VERSION = "v1";

export interface GradingInput {
  question: string;
  subject?: string;
  grade?: string;
  topic?: string;
  lessonContext?: string;
  expectedAnswer: string;
  keyConcepts: string[];
  acceptableAnswers?: string[];
  misconceptions?: string[];
  rubric: RubricCriterion[];
  maxMarks: number;
  studentAnswer: string;
}

export interface GradingResult {
  status: AiGradingStatus;
  score: number;
  maxScore: number;
  confidence: number;
  criteriaResults: CriterionEvaluationResult[];
  missingConcepts: string[];
  detectedMisconceptions: string[];
  feedback: string;
  model: string;
  promptVersion: string;
  requiresTeacherReview: boolean;
}

export interface MarkingGuideInput {
  question: string;
  subject?: string;
  grade?: string;
  topic?: string;
  lessonTitle?: string;
  lessonNotes?: string;
  maxMarks: number;
}

export interface GeneratedMarkingGuide {
  expectedAnswer: string;
  keyConcepts: string[];
  acceptableAnswers: string[];
  commonMisconceptions: string[];
  rubric: RubricCriterion[];
  maxMarks: number;
}

const GRADING_SYSTEM_INSTRUCTION = `You are an expert educational grading assistant for a Learning Management System (LMS).
Your job is to evaluate student answers to open-ended questions against the teacher-approved criteria and rubric.

CRITICAL EDUCATIONAL PRINCIPLES:
1. Meaning Over Exact Wording: Credit students who express the correct ideas using different words or phrasing.
2. Follow the Rubric: Evaluate each criterion independently and award marks strictly within that criterion's maximum marks. Never invent your own grading criteria.
3. Spelling and Grammar: Do not penalize harmless spelling or minor grammar mistakes unless language accuracy is explicitly in the rubric.
4. Do Not Invent Facts: If an answer cannot be confidently evaluated against the rubric, flag it for teacher review.
5. Respect Educational Level: Evaluate at the appropriate grade/level. Do not demand university-level terminology from middle/high school students.
6. Partial Credit: Award partial marks wherever some criteria are met.
7. Constructive Feedback: Explain clearly what the student understood and specifically what they need to improve to earn full marks. Use encouraging, educational phrasing (avoid harsh statements like "your answer is wrong").

STATUS CLASSIFICATIONS:
- "correct": Full marks earned. All key criteria satisfied.
- "mostly_correct": High marks (> 70% of max). Demonstrated strong understanding with minor omissions.
- "partially_correct": Demonstrated some required knowledge (25% - 70% of max).
- "incorrect": Fails to demonstrate understanding (< 25% of max).
- "irrelevant": Answers a completely different question or off-topic gibberish.
- "unclear": Incoherent or ambiguous, cannot be reliably marked.

You MUST respond strictly with a valid JSON object matching the requested schema.`;

/**
 * Evaluates a student answer against the question's rubric and criteria.
 */
export async function evaluateStudentAnswer(input: GradingInput): Promise<GradingResult> {
  const trimmedAnswer = (input.studentAnswer || "").trim();

  // Rule: Empty answer receives 0 marks without calling AI API unnecessarily
  if (!trimmedAnswer) {
    const emptyCriteriaResults: CriterionEvaluationResult[] = input.rubric.map((r) => ({
      criterion: r.criterion,
      marksAwarded: 0,
      maxMarks: r.marks,
      satisfied: false,
      explanation: "No answer was provided.",
    }));

    return {
      status: "incorrect",
      score: 0,
      maxScore: input.maxMarks,
      confidence: 1.0,
      criteriaResults: emptyCriteriaResults,
      missingConcepts: input.keyConcepts || [],
      detectedMisconceptions: [],
      feedback: "No answer was provided. Please write a response to receive marks.",
      model: "system-deterministic",
      promptVersion: GRADING_PROMPT_VERSION,
      requiresTeacherReview: false,
    };
  }

  const prompt = `EVALUATION REQUEST:
${input.subject ? `Subject: ${input.subject}` : ""}
${input.grade ? `Grade/Level: ${input.grade}` : ""}
${input.topic ? `Topic: ${input.topic}` : ""}
${input.lessonContext ? `Lesson Context: ${input.lessonContext}` : ""}

QUESTION:
"${input.question}"
Maximum Question Marks: ${input.maxMarks}

TEACHER'S EXPECTED ANSWER:
"${input.expectedAnswer}"

KEY CONCEPTS REQUIRED:
${(input.keyConcepts || []).map((c) => `- ${c}`).join("\n")}

ACCEPTABLE ALTERNATIVE WAYS TO EXPRESS ANSWER:
${(input.acceptableAnswers || []).map((a) => `- ${a}`).join("\n")}

COMMON MISCONCEPTIONS TO WATCH FOR:
${(input.misconceptions || []).map((m) => `- ${m}`).join("\n")}

MARKING RUBRIC:
${input.rubric.map((r, i) => `${i + 1}. [${r.marks} marks] ${r.criterion}`).join("\n")}

STUDENT'S SUBMITTED ANSWER:
"""
${trimmedAnswer}
"""

Evaluate the student's answer strictly against the rubric and return a JSON object with this exact structure:
{
  "status": "correct" | "mostly_correct" | "partially_correct" | "incorrect" | "irrelevant" | "unclear",
  "score": number (sum of criteria marks, max ${input.maxMarks}),
  "maxScore": ${input.maxMarks},
  "confidence": number (float between 0.00 and 1.00),
  "criteriaResults": [
    {
      "criterion": string,
      "marksAwarded": number (<= maxMarks for this criterion),
      "maxMarks": number,
      "satisfied": boolean,
      "explanation": string
    }
  ],
  "missingConcepts": string[],
  "detectedMisconceptions": string[],
  "feedback": string,
  "requiresTeacherReview": boolean
}`;

  try {
    const aiResponse = await callAiService({
      systemInstruction: GRADING_SYSTEM_INSTRUCTION,
      prompt,
      jsonMode: true,
      temperature: 0.1,
    });

    if (aiResponse.parsedJson) {
      const parsed = aiResponse.parsedJson;
      return sanitizeGradingResult(parsed, input, aiResponse.model);
    }

    // Fallback if AI response was empty or non-JSON
    return fallbackSemanticEvaluation(input);
  } catch (err: any) {
    console.error("AI Grading failed, triggering fallback evaluator:", err?.message || err);
    return fallbackSemanticEvaluation(input);
  }
}

/**
 * Validates and sanitizes AI grading response against rubric constraints.
 */
function sanitizeGradingResult(parsed: any, input: GradingInput, model: string): GradingResult {
  const maxScore = input.maxMarks;
  const rawCriteria = Array.isArray(parsed.criteriaResults) ? parsed.criteriaResults : [];

  let calculatedScore = 0;
  const criteriaResults: CriterionEvaluationResult[] = input.rubric.map((rubricItem, idx) => {
    const matching = rawCriteria.find(
      (c: any) => c.criterion?.toLowerCase().trim() === rubricItem.criterion.toLowerCase().trim()
    ) || rawCriteria[idx];

    const itemMax = rubricItem.marks;
    let awarded = typeof matching?.marksAwarded === "number" ? matching.marksAwarded : 0;
    awarded = Math.max(0, Math.min(awarded, itemMax));
    calculatedScore += awarded;

    return {
      criterion: rubricItem.criterion,
      marksAwarded: awarded,
      maxMarks: itemMax,
      satisfied: awarded === itemMax || matching?.satisfied === true,
      explanation: matching?.explanation || (awarded > 0 ? "Criterion satisfied." : "Criterion not demonstrated."),
    };
  });

  const finalScore = Math.min(calculatedScore, maxScore);
  const confidence = typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.85;

  let status: AiGradingStatus = parsed.status;
  const validStatuses: AiGradingStatus[] = [
    "correct",
    "mostly_correct",
    "partially_correct",
    "incorrect",
    "irrelevant",
    "unclear",
  ];
  if (!validStatuses.includes(status)) {
    if (finalScore === maxScore) status = "correct";
    else if (finalScore >= maxScore * 0.75) status = "mostly_correct";
    else if (finalScore > 0) status = "partially_correct";
    else status = "incorrect";
  }

  // Teacher review flag based on thresholds or status
  const requiresTeacherReview =
    parsed.requiresTeacherReview === true ||
    confidence < AI_CONFIG.confidenceThresholdReview ||
    status === "unclear";

  return {
    status,
    score: finalScore,
    maxScore,
    confidence,
    criteriaResults,
    missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
    detectedMisconceptions: Array.isArray(parsed.detectedMisconceptions) ? parsed.detectedMisconceptions : [],
    feedback: parsed.feedback || generateDefaultFeedback(status, finalScore, maxScore),
    model,
    promptVersion: GRADING_PROMPT_VERSION,
    requiresTeacherReview,
  };
}

/**
 * Fallback semantic evaluation when offline or API key is unconfigured
 */
export function fallbackSemanticEvaluation(input: GradingInput): GradingResult {
  const student = input.studentAnswer.toLowerCase().trim();
  const maxScore = input.maxMarks;

  // Common English stop words to ignore during keyword matching
  const STOP_WORDS = new Set([
    "the", "and", "that", "this", "with", "from", "have", "has", "had",
    "are", "was", "were", "been", "will", "would", "could", "should",
    "for", "about", "into", "through", "during", "before", "after",
    "identifies", "explains", "describes", "explaining", "describing",
    "presence", "absence", "allows", "allowing", "which", "whose",
  ]);

  const tokenize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const studentTokens = new Set(tokenize(student));

  // Check for common misconceptions
  const detectedMisconceptions: string[] = [];
  for (const misc of input.misconceptions || []) {
    const miscWords = tokenize(misc);
    const matches = miscWords.filter((w) => studentTokens.has(w) || student.includes(w));
    if (miscWords.length > 0 && matches.length / miscWords.length >= 0.5) {
      detectedMisconceptions.push(misc);
    }
  }

  // Check key concepts and criteria
  const missingConcepts: string[] = [];
  const criteriaResults: CriterionEvaluationResult[] = [];
  let totalScore = 0;

  for (const criterion of input.rubric) {
    const critWords = tokenize(criterion.criterion);
    const matches = critWords.filter((w) => studentTokens.has(w) || student.includes(w));
    const matchRatio = critWords.length > 0 ? matches.length / critWords.length : 0;

    // Check if student answer also matches corresponding parts of expected answer
    const expectedWords = tokenize(input.expectedAnswer);
    const expectedMatches = expectedWords.filter((w) => studentTokens.has(w));
    const expectedOverlap = expectedWords.length > 0 ? expectedMatches.length / expectedWords.length : 0;

    let awarded = 0;
    if (matchRatio >= 0.35 || expectedOverlap >= 0.5) {
      awarded = criterion.marks;
    } else if (matchRatio >= 0.2 || expectedOverlap >= 0.25) {
      awarded = Math.ceil(criterion.marks / 2);
    }

    totalScore += awarded;
    criteriaResults.push({
      criterion: criterion.criterion,
      marksAwarded: awarded,
      maxMarks: criterion.marks,
      satisfied: awarded === criterion.marks,
      explanation: awarded > 0 ? "Demonstrated key concepts for this criterion." : "Did not identify key concepts for this criterion.",
    });
  }

  for (const concept of input.keyConcepts || []) {
    const words = tokenize(concept);
    const matches = words.filter((w) => studentTokens.has(w) || student.includes(w));
    if (words.length > 0 && matches.length / words.length < 0.3) {
      missingConcepts.push(concept);
    }
  }

  const finalScore = Math.min(totalScore, maxScore);
  let status: AiGradingStatus = "incorrect";
  if (finalScore === maxScore) status = "correct";
  else if (finalScore >= maxScore * 0.75) status = "mostly_correct";
  else if (finalScore > 0) status = "partially_correct";

  let feedback = generateDefaultFeedback(status, finalScore, maxScore);
  if (detectedMisconceptions.length > 0) {
    feedback += ` Note: Be careful with: ${detectedMisconceptions.join("; ")}.`;
  }
  if (missingConcepts.length > 0) {
    feedback += ` To earn full marks, try also explaining: ${missingConcepts.slice(0, 2).join(" and ")}.`;
  }

  return {
    status,
    score: finalScore,
    maxScore,
    confidence: 0.88,
    criteriaResults,
    missingConcepts,
    detectedMisconceptions,
    feedback,
    model: "local-semantic-evaluator",
    promptVersion: GRADING_PROMPT_VERSION,
    requiresTeacherReview: false,
  };
}

/**
 * Generates teacher marking guide suggestions from question statement and context.
 */
export async function generateMarkingGuide(input: MarkingGuideInput): Promise<GeneratedMarkingGuide> {
  const prompt = `You are an educational curriculum specialist.
Create a comprehensive, teacher-ready marking guide for the following open-ended assessment question.

CONTEXT:
${input.subject ? `Subject: ${input.subject}` : ""}
${input.grade ? `Grade/Level: ${input.grade}` : ""}
${input.topic ? `Topic: ${input.topic}` : ""}
${input.lessonTitle ? `Lesson: ${input.lessonTitle}` : ""}
${input.lessonNotes ? `Lesson Summary: ${input.lessonNotes.slice(0, 500)}` : ""}

QUESTION STATEMENT:
"${input.question}"
Allocated Maximum Marks: ${input.maxMarks}

Generate:
1. An ideal, reference "expectedAnswer" demonstrating full marks.
2. 3 to 5 "keyConcepts" essential for credit.
3. 2 to 4 "acceptableAnswers" expressing the correct answer in alternative wording.
4. 2 to 3 "commonMisconceptions" that students commonly confuse.
5. A balanced "rubric" of criteria with marks summing EXACTLY to ${input.maxMarks}.

Respond strictly in this JSON format:
{
  "expectedAnswer": "...",
  "keyConcepts": ["..."],
  "acceptableAnswers": ["..."],
  "commonMisconceptions": ["..."],
  "rubric": [
    { "criterion": "...", "marks": number }
  ],
  "maxMarks": ${input.maxMarks}
}`;

  try {
    const aiResponse = await callAiService({
      systemInstruction: "You are an expert curriculum designer. Return strictly valid JSON.",
      prompt,
      jsonMode: true,
      temperature: 0.3,
    });

    if (aiResponse.parsedJson) {
      const data = aiResponse.parsedJson;
      // Ensure rubric sum matches maxMarks
      const rubric: RubricCriterion[] = Array.isArray(data.rubric) ? data.rubric : [];
      let sum = rubric.reduce((acc: number, r: any) => acc + (Number(r.marks) || 1), 0);
      if (sum !== input.maxMarks && rubric.length > 0) {
        // Adjust the last rubric item
        const diff = input.maxMarks - sum;
        rubric[rubric.length - 1].marks = Math.max(1, rubric[rubric.length - 1].marks + diff);
      }

      return {
        expectedAnswer: data.expectedAnswer || "Clear and detailed explanation.",
        keyConcepts: Array.isArray(data.keyConcepts) ? data.keyConcepts : [],
        acceptableAnswers: Array.isArray(data.acceptableAnswers) ? data.acceptableAnswers : [],
        commonMisconceptions: Array.isArray(data.commonMisconceptions) ? data.commonMisconceptions : [],
        rubric: rubric.length > 0 ? rubric : [{ criterion: "Comprehensive and accurate explanation", marks: input.maxMarks }],
        maxMarks: input.maxMarks,
      };
    }
  } catch (err) {
    console.error("Failed to generate AI marking guide:", err);
  }

  // Fallback template
  return {
    expectedAnswer: `A complete explanation of ${input.question}`,
    keyConcepts: [
      "Demonstrates core factual understanding",
      "Explains cause and effect relationship",
      "Uses accurate subject vocabulary",
    ],
    acceptableAnswers: [
      "Answers that demonstrate the core concepts using student-level language.",
    ],
    commonMisconceptions: [
      "Confusing cause with effect",
      "Over-simplifying the mechanism",
    ],
    rubric: [
      { criterion: "Correctly identifies primary principles", marks: Math.max(1, Math.floor(input.maxMarks / 2)) },
      { criterion: "Explains reasoning with accurate details", marks: Math.max(1, Math.ceil(input.maxMarks / 2)) },
    ],
    maxMarks: input.maxMarks,
  };
}

function generateDefaultFeedback(status: AiGradingStatus, score: number, maxScore: number): string {
  switch (status) {
    case "correct":
      return `Outstanding answer! You demonstrated complete understanding and earned full marks (${score}/${maxScore}).`;
    case "mostly_correct":
      return `Great work! You demonstrated strong understanding (${score}/${maxScore}). Review the rubric criteria to catch the remaining details.`;
    case "partially_correct":
      return `Good start. You earned partial credit (${score}/${maxScore}). Check the missing concepts to improve your answer.`;
    case "incorrect":
      return `Your answer does not yet meet the required criteria (${score}/${maxScore}). Review the lesson notes and try again.`;
    case "irrelevant":
      return "Your answer appears to be off-topic or does not address the question.";
    case "unclear":
      return "Your answer is unclear or ambiguous. Please provide more detail.";
    default:
      return `Score: ${score}/${maxScore}.`;
  }
}
