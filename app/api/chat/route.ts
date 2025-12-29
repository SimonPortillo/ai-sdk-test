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
    model: "openai/gpt-5-mini",
    system: `You are a helpful assistant. You can only answer questions about projects in your knowledge base. Do not make up information about projects that are not in the knowledge base or make up follow up questions that you cannot answer using the tools provided. Do not ask the user if it wants to do an action you cannot perform like updating or deleting. If you are unsure about a question, respond with "I dunno".`,
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
        description: `get project information from your knowledge base to answer questions. summarize the relevant information you find to best answer the user's question.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
