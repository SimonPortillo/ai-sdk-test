"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { generateEmbeddings } from "../ai/embeddings";
import { z } from "zod";

// Define the input schema
const insertProjectSchema = z.object({
  project_title: z.string().min(1, "Project title is required"),
  project_desc: z.string().min(1, "Project description is required"),
});

export type NewProjectParams = z.infer<typeof insertProjectSchema>;

export const createProject = async (input: NewProjectParams) => {
  try {
    const { project_title, project_desc } = insertProjectSchema.parse(input);

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // Insert project and get the created record
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({ project_title, project_desc })
      .select()
      .single();

    if (projectError) {
      throw new Error(projectError.message);
    }

    // Generate embeddings with title context
    const embeddings = await generateEmbeddings(project_title, project_desc);

    // Insert embeddings
    const { error: embeddingsError } = await supabase.from("embeddings").insert(
      embeddings.map((embedding) => ({
        project_id: project.id,
        content: embedding.content,
        embedding: embedding.embedding,
      }))
    );

    if (embeddingsError) {
      throw new Error(embeddingsError.message);
    }

    return "Project successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
