'use server';
/**
 * @fileOverview An AI flow to generate interview questions based on a job and candidate's profile.
 *
 * - generateInterviewQuestions - A function that handles the question generation.
 * - InterviewQuestionGeneratorInput - The input type for the flow.
 * - InterviewQuestionGeneratorOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const InterviewQuestionGeneratorInputSchema = z.object({
  jobTitle: z.string().describe("The title of the job the candidate applied for."),
  jobDescription: z.string().describe("The full text of the job description."),
  candidateStrengths: z.array(z.string()).describe("A list of the candidate's key strengths relevant to the job."),
  candidateWeaknesses: z.array(z.string()).describe("A list of the candidate's potential weaknesses or gaps."),
});
export type InterviewQuestionGeneratorInput = z.infer<typeof InterviewQuestionGeneratorInputSchema>;

export const InterviewQuestionGeneratorOutputSchema = z.object({
    technicalQuestions: z.array(z.string()).describe("A list of 3-5 technical questions tailored to the job and candidate's skill set."),
    behavioralQuestions: z.array(z.string()).describe("A list of 2-3 behavioral questions to assess cultural fit and soft skills, based on their profile."),
    situationalQuestions: z.array(z.string()).describe("A list of 2-3 situational or scenario-based questions to probe problem-solving skills, referencing their weaknesses constructively."),
});
export type InterviewQuestionGeneratorOutput = z.infer<typeof InterviewQuestionGeneratorOutputSchema>;

const interviewQuestionPrompt = ai.definePrompt({
  name: 'interviewQuestionPrompt',
  input: {schema: InterviewQuestionGeneratorInputSchema},
  output: {schema: InterviewQuestionGeneratorOutputSchema},
  prompt: `
    You are an expert technical recruiter and hiring manager preparing for an interview.
    Your task is to generate a concise, insightful set of interview questions for a candidate based on their profile relative to a specific job.

    Job Details:
    - Title: {{{jobTitle}}}
    - Description: {{{jobDescription}}}

    Candidate Analysis (based on their CV):
    - Key Strengths:
    {{#each candidateStrengths}}
    - {{{this}}}
    {{/each}}
    - Potential Weaknesses/Gaps:
    {{#each candidateWeaknesses}}
    - {{{this}}}
    {{/each}}

    Please generate the following categories of questions:
    1.  **Technical Questions (3-5 questions):** Create specific technical questions that validate the candidate's listed strengths and probe their knowledge in areas required by the job description.
    2.  **Behavioral Questions (2-3 questions):** Formulate questions to understand how the candidate has behaved in past professional situations, focusing on teamwork, communication, and alignment with potential company values.
    3.  **Situational Questions (2-3 questions):** Create scenario-based questions that constructively explore the candidate's potential weaknesses or gaps. Frame these to understand their problem-solving approach and willingness to learn, not to corner them. For example, if a weakness is "limited experience with cloud platforms," a question could be "Describe a situation where you had to quickly learn a new technology for a project. How did you approach it?"

    Output the response strictly in the JSON format defined by the output schema.
  `,
});

const interviewQuestionGeneratorFlow = ai.defineFlow(
  {
    name: 'interviewQuestionGeneratorFlow',
    inputSchema: InterviewQuestionGeneratorInputSchema,
    outputSchema: InterviewQuestionGeneratorOutputSchema,
  },
  async (input) => {
    const {output} = await interviewQuestionPrompt(input);
    if (!output) {
        return {
            technicalQuestions: ["Error: AI failed to generate technical questions."],
            behavioralQuestions: ["Error: AI failed to generate behavioral questions."],
            situationalQuestions: ["Error: AI failed to generate situational questions."],
        };
    }
    return output;
  }
);

export async function generateInterviewQuestions(input: InterviewQuestionGeneratorInput): Promise<InterviewQuestionGeneratorOutput> {
  try {
    return await interviewQuestionGeneratorFlow(input);
  } catch (error: any) {
    console.error("Error in generateInterviewQuestions flow:", error);
    return {
        technicalQuestions: [`Error generating questions: ${error.message || "Unknown error"}`],
        behavioralQuestions: [],
        situationalQuestions: [],
    };
  }
}
