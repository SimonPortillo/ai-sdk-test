import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { createProject } from "@/lib/actions/projects";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-5-nano",
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      addProject: tool({
        description: `add a project to your knowledge base.
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
    },
  });

  return result.toUIMessageStreamResponse();
}
