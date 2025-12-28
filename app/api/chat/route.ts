import { streamText, UIMessage, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4.1-nano",
    system:
      "you are an assistant that only answers questions about the project docs provided. if you don't know the answer, just say you don't know.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
