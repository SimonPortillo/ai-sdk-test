"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

type ProjectDoc = {
  id: string;
  description: string;
  title: string;
};

type ChatProps = {
  projects: ProjectDoc[] | null;
};

export default function Chat({ projects }: ChatProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  console.log("Projects:", projects);
  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="mb-4">
          <strong>{message.role === "user" ? "User: " : "AI: "}</strong>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className="prose dark:prose-invert max-w-none font-mono"
                  >
                    {message.role === "user" ? (
                      <div className="whitespace-pre-wrap">{part.text}</div>
                    ) : (
                      <ReactMarkdown>{part.text}</ReactMarkdown>
                    )}
                  </div>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-xl p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
