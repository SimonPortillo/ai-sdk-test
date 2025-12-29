import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { createProject } from "@/lib/actions/projects";
import { findRelevantContent } from "@/lib/ai/embeddings";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-5-nano",
    system: `You are a helpful assistant. You can answer general questions as well as questions about projects in your knowledge base.`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      addProject: tool({
        description: `Add a project to your knowledge base.
          If the user provides information about a project unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          description: z
            .string()
            .describe(
              "the description of the project being added to the knowledge base"
            ),
          title: z
            .string()
            .describe(
              "the title of the project being added to the knowledge base"
            ),
        }),
        execute: async ({ description, title }) =>
          createProject({ project_desc: description, project_title: title }),
      }),
      getInformation: tool({
        description: `get project information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
