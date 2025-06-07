
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
      "The candidate's CV file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is primarily for non-textual analysis or fallback."
    ),
  cvTextContent: z.string().optional().describe("The extracted text content of the candidate's CV. This should be prioritized for analysis if available."),
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

    Candidate's CV:
    {{#if cvTextContent}}
    CV Text Content (Prioritize this for analysis):
    {{{cvTextContent}}}
    {{else}}
    CV File (Analyze content if possible, typically for image-based CVs or as a fallback if text extraction failed. Direct text analysis from data URIs for PDF/DOCX is limited.):
    {{media url=cvDataUri}}
    {{/if}}

    Based on the CV content (prioritizing text content if available) and the job details, please provide the following:
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
        // This fallback should ideally not be hit if the model respects the output schema,
        // but it's a safeguard.
        return {
            score: 0,
            summary: "AI analysis failed: The model did not return a valid structured output.",
            strengths: [],
            weaknesses: ["Model returned no valid output."],
        };
    }
    return output;
  }
);

export async function analyzeCvAgainstJob(input: AnalyzeCvInput): Promise<AnalyzeCvOutput> {
  try {
    // Attempt to run the main flow
    return await analyzeCvFlow(input);
  } catch (error: any) {
    console.error("Error directly caught in analyzeCvAgainstJob flow wrapper:", error);
    
    let detailedSummary = `Error during AI analysis: ${error.message || "Unknown error"}`;
    let specificWeakness = "AI analysis could not be completed due to an unexpected error.";

    if (error.message) {
      if (error.message.includes("mimeType") && error.message.includes("not supported")) {
        detailedSummary = `AI analysis error: The CV file's MIME type ('${input.cvDataUri.substring(5, input.cvDataUri.indexOf(';'))}') is not directly supported for content analysis by the AI model when text extraction fails. Application submitted without full AI insights. Original error: ${error.message}`;
        specificWeakness = `CV file format (${input.cvDataUri.substring(5, input.cvDataUri.indexOf(';'))}) not directly analyzable by AI if text extraction failed.`;
      } else if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
        detailedSummary = `AI analysis blocked: The content of the CV or job description may have triggered the AI's safety filters. Application submitted without AI insights. Original error: ${error.message}`;
        specificWeakness = "Content may have been blocked by AI safety filters.";
      }
    }
    
    // Check for missing text content, if no more specific error was already identified
    const cvTextContentMissing = !input.cvTextContent || input.cvTextContent.trim() === "";
    const cvDataUriSeemsEmpty = !input.cvDataUri || !input.cvDataUri.startsWith('data:');

    if (cvTextContentMissing && !(error.message && (error.message.includes("mimeType") || error.message.includes("SAFETY")))) {
      if (!cvDataUriSeemsEmpty) {
         // Only cvTextContent is missing, but cvDataUri exists (so media helper might work or fail with MIME type error)
         detailedSummary = `AI analysis might be incomplete: Text content could not be extracted from the CV (or was empty). The AI attempted to analyze the raw file, but analysis quality may be reduced. Application submitted.`;
         specificWeakness = "Text extraction failed or CV content was empty; AI analysis quality likely reduced.";
      } else {
         // Both text content and a valid data URI are missing
         detailedSummary = `AI analysis failed: No CV text content was provided, and no valid CV file data was available for the AI to process. Application submitted without AI insights.`;
         specificWeakness = "No usable CV content (text or file data) provided for AI analysis.";
      }
    }

    return {
      score: 0,
      summary: detailedSummary,
      strengths: [],
      weaknesses: [specificWeakness],
    };
  }
}
