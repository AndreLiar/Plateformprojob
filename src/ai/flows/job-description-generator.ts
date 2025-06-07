
'use server';
/**
 * @fileOverview AI flow to generate job descriptions.
 *
 * - generateJobDescription - A function that handles job description generation.
 * - GenerateJobDescriptionInput - The input type for the flow.
 * - GenerateJobDescriptionOutput - The return type for the flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateJobDescriptionInputSchema = z.object({
  jobTitle: z.string().describe("The title of the job, e.g., 'Salesforce Developer'"),
  platform: z.string().describe("The main platform category, e.g., 'Salesforce', 'SAP'"),
  technologies: z.string().describe("Comma-separated list of specific technologies, e.g., 'Apex, LWC, Visualforce'"),
  modules: z.string().optional().describe("Comma-separated list of platform-specific modules, e.g., 'Sales Cloud, Service Cloud'"),
  experienceLevel: z.string().describe("Required experience level, e.g., 'Senior', 'Mid', 'Entry'"),
  location: z.string().describe("Job location, e.g., 'San Francisco, CA' or 'Remote'"),
  keyResponsibilitiesSummary: z.string().min(1, { message: "Key responsibilities summary is needed for AI generation." }).describe("A brief summary or 3-5 bullet points of key responsibilities."),
  companyCultureSnippet: z.string().optional().describe("A short 1-2 sentence snippet about the company culture or mission."),
  contractType: z.string().optional().describe("The contract type for the job, e.g., 'Full-time', 'Contract'"),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

export const GenerateJobDescriptionOutputSchema = z.object({
  generatedDescription: z.string().describe("The AI-generated job description."),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

const jobDescriptionGeneratorPrompt = ai.definePrompt({
    name: 'jobDescriptionPrompt',
    input: { schema: GenerateJobDescriptionInputSchema },
    output: { schema: GenerateJobDescriptionOutputSchema },
    prompt: `
      You are an expert recruitment copywriter tasked with creating a compelling and detailed job description.
      Please use a professional and engaging tone. Avoid using markdown for headings (like ## or ###). Instead, use bold text for section titles if desired, or simply start new paragraphs for new sections.

      Given the following details:
      - Job Title: {{{jobTitle}}}
      - Platform Focus: {{{platform}}}
      - Key Technologies: {{{technologies}}}
      {{#if modules}}- Relevant Modules/Specializations: {{{modules}}}{{/if}}
      - Experience Level: {{{experienceLevel}}}
      - Location: {{{location}}}
      {{#if contractType}}- Contract Type: {{{contractType}}}{{/if}}
      - Key Responsibilities Summary: {{{keyResponsibilitiesSummary}}}
      {{#if companyCultureSnippet}}- About Our Company: {{{companyCultureSnippet}}}{{/if}}

      Please generate a full job description. Structure it logically, for example:
      
      Start with an engaging introduction to the role and company (if a company snippet is provided, integrate it here or in a brief "About Us" section).

      Role Overview:
      Briefly describe the main purpose of this role.

      Key Responsibilities:
      Elaborate on the "Key Responsibilities Summary" provided. Aim for 5-7 detailed bullet points.
      For example:
      * Design, develop, and maintain high-quality applications on the {{{platform}}} platform.
      * Collaborate with cross-functional teams to define, design, and ship new features.
      * Troubleshoot and resolve software defects and incidents.

      Required Skills & Qualifications:
      List essential skills and qualifications. Base this on the platform ({{{platform}}}), technologies ({{{technologies}}}), modules ({{#if modules}}{{{modules}}}{{else}}N/A{{/if}}), and experience level ({{{experienceLevel}}}).
      For example:
      * Bachelor's degree in Computer Science or related field.
      * Proven experience as a {{{jobTitle}}} or similar role.
      * Strong proficiency in {{{technologies}}}.
      * Experience with {{{platform}}} specific development and customization.
      * Excellent problem-solving and communication skills.

      Preferred Qualifications (Optional):
      If applicable, list any desirable but not essential skills.
      For example:
      * Certifications in {{{platform}}}.
      * Experience with agile development methodologies.

      {{#if companyCultureSnippet}}
      Working at [Our Company/The Team]:
      {{{companyCultureSnippet}}}
      Expand slightly on the company culture or what it's like to work there.
      {{/if}}

      Conclude with a clear call to action, encouraging candidates to apply.
      For example: "If you are passionate about {{{platform}}} and eager to make an impact, we encourage you to apply!"

      The output should be a single string containing the complete job description. Ensure good spacing between paragraphs.
    `,
});

const jobDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'jobDescriptionGeneratorFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await jobDescriptionGeneratorPrompt(input);
    if (!output) {
        return { generatedDescription: "Error: Could not generate job description. The AI model did not return a valid output." };
    }
    return output;
  }
);

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  try {
    return await jobDescriptionGeneratorFlow(input);
  } catch (error: any) {
    console.error("Error in generateJobDescription flow:", error);
    return { generatedDescription: `Error generating description: ${error.message || "Unknown error"}` };
  }
}
