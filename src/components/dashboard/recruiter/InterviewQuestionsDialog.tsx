"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { InterviewQuestionGeneratorOutput } from "@/ai/flows/interview-question-generator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterviewQuestionsDialogProps {
  questions: InterviewQuestionGeneratorOutput | null;
  candidateName: string;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InterviewQuestionsDialog({
  questions,
  candidateName,
  jobTitle,
  open,
  onOpenChange,
}: InterviewQuestionsDialogProps) {
  const { toast } = useToast();

  if (!questions) return null;

  const allQuestionsText = `Interview Questions for ${candidateName} - ${jobTitle}

## Technical Questions
${questions.technicalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Behavioral Questions
${questions.behavioralQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Situational Questions
${questions.situationalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(allQuestionsText);
    toast({ title: "Copied to Clipboard", description: "Interview questions have been copied." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Interview Questions</DialogTitle>
          <DialogDescription>
            Generated for: <strong>{candidateName}</strong> for the role of <strong>{jobTitle}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <Accordion type="multiple" defaultValue={["technical", "behavioral", "situational"]} className="w-full">
              <AccordionItem value="technical">
                <AccordionTrigger>Technical Questions</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {questions.technicalQuestions.map((q, i) => <li key={`tech-${i}`}>{q}</li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="behavioral">
                <AccordionTrigger>Behavioral Questions</AccordionTrigger>
                <AccordionContent>
                   <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {questions.behavioralQuestions.map((q, i) => <li key={`behav-${i}`}>{q}</li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="situational">
                <AccordionTrigger>Situational / Scenario Questions</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {questions.situationalQuestions.map((q, i) => <li key={`sit-${i}`}>{q}</li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={copyToClipboard}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copy All
          </Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
