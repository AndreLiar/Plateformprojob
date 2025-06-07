
'use server';
/**
 * @fileOverview An AI flow to analyze a candidate's CV against a job description.
 *
 * - analyzeCvAgainstJob - A function that handles the CV analysis.
 * - AnalyzeCvInput - The input type for the flow.
 * - AnalyzeCvOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCvInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      "The candidate's CV content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobTitle: z.string().describe("The title of the job the candidate applied for."),
  jobDescription: z.string().describe("The full text of the job description."),
  jobTechnologies: z.string().describe("Comma-separated list of key technologies/skills required for the job."),
  jobExperienceLevel: z.string().describe("The experience level required for the job (e.g., 'Senior', 'Mid', 'Entry')."),
});
export type AnalyzeCvInput = z.infer<typeof AnalyzeCvInputSchema>;

const AnalyzeCvOutputSchema = z.object({
  score: z.number().int().min(0).max(100).describe("A numerical score from 0 to 100 indicating the CV's relevance to the job. 100 is a perfect match."),
  summary: z.string().describe("A concise summary (2-3 sentences) explaining the score and the candidate's overall fit for the role."),
  strengths: z.array(z.string()).describe("A list of 3-5 key strengths of the candidate relevant to this specific job, based on their CV."),
  weaknesses: z.array(z.string()).describe("A list of 2-3 potential weaknesses or gaps in the candidate's profile concerning this specific job. Be constructive."),
});
export type AnalyzeCvOutput = z.infer<typeof AnalyzeCvOutputSchema>;

const cvAnalysisPrompt = ai.definePrompt({
  name: 'cvAnalysisPrompt',
  input: {schema: AnalyzeCvInputSchema},
  output: {schema: AnalyzeCvOutputSchema},
  prompt: `
    You are an expert Technical Recruiter and Talent Sourcer. Your task is to analyze the provided Curriculum Vitae (CV) against the details of a specific job opening.
    Your goal is to provide a relevance score, a concise summary of the candidate's fit, and list key strengths and weaknesses in relation to this specific role.

    Job Details:
    - Title: {{{jobTitle}}}
    - Required Experience Level: {{{jobExperienceLevel}}}
    - Key Technologies/Skills: {{{jobTechnologies}}}
    - Full Job Description:
    {{{jobDescription}}}

    Candidate's CV (provided as media data):
    {{media url=cvDataUri}}

    Based on the CV content and the job details, please provide the following:
    1.  **Relevance Score**: An integer score from 0 to 100, where 100 is a perfect match. Consider all aspects: experience, skills, technologies, and overall fit for the "{{{jobTitle}}}" role at the "{{{jobExperienceLevel}}}" level.
    2.  **Summary**: A brief (2-3 sentences) explanation of why the candidate is or isn't a good fit, justifying the score.
    3.  **Strengths**: A list of 3-5 bullet points highlighting the candidate's key strengths relevant to THIS job. Focus on skills, experiences, and technologies mentioned in the job description.
    4.  **Weaknesses/Gaps**: A list of 2-3 bullet points highlighting potential weaknesses or gaps in the candidate's profile concerning THIS job. Be constructive. If the candidate is a strong fit, this section might note areas that are less emphasized or missing.

    Output the response strictly in the JSON format defined by the output schema.
    Ensure the score is an integer. Strengths and weaknesses should be arrays of strings.
  `,
   config: {
    safetySettings: [ // Adjusted safety settings for document analysis
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const analyzeCvFlow = ai.defineFlow(
  {
    name: 'analyzeCvFlow',
    inputSchema: AnalyzeCvInputSchema,
    outputSchema: AnalyzeCvOutputSchema,
  },
  async (input) => {
    const {output} = await cvAnalysisPrompt(input);
    if (!output) {
        // Fallback in case the model returns nothing, though schema validation should catch issues
        return {
            score: 0,
            summary: "AI analysis failed to produce a valid output.",
            strengths: [],
            weaknesses: [],
        };
    }
    return output;
  }
);

export async function analyzeCvAgainstJob(input: AnalyzeCvInput): Promise<AnalyzeCvOutput> {
  try {
    return await analyzeCvFlow(input);
  } catch (error: any) {
    console.error("Error in analyzeCvAgainstJob flow:", error);
    let summaryMessage = `Error during AI analysis: ${error.message || "Unknown error"}`;
    // Check if the error message indicates an unsupported MIME type for the media helper
    if (error.message && (error.message.includes("mimeType") && error.message.includes("not supported"))) {
        summaryMessage = `AI analysis failed: The uploaded CV file type (e.g., DOCX, PDF) is not directly supported for content analysis by the current AI model configuration. The application has been submitted without AI insights. Original error: ${error.message}`;
    }
    return {
      score: 0,
      summary: summaryMessage,
      strengths: [],
      weaknesses: ["AI analysis could not be completed due to an error."],
    };
  }
}
