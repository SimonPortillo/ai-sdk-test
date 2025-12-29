import { embed, embedMany } from "ai";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const embeddingModel = "openai/text-embedding-ada-002";

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  title: string,
  description: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(description);
  // Prepend title to each chunk for better context
  const chunksWithTitle = chunks.map((chunk) => `${title}: ${chunk}`);

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunksWithTitle,
  });
  return embeddings.map((e, i) => ({
    content: chunksWithTitle[i],
    embedding: e,
  }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Use Supabase's vector similarity search
  const { data: similarGuides, error } = await supabase.rpc(
    "match_embeddings",
    {
      query_embedding: userQueryEmbedded,
      match_threshold: 0.5,
      match_count: 4,
    }
  );

  if (error) {
    console.error("Error finding relevant content:", error);
    return [];
  }

  // Fetch full project details for the matched embeddings
  if (!similarGuides || similarGuides.length === 0) {
    return [];
  }

  const projectIds = [...new Set(similarGuides.map((g: any) => g.project_id))];
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id, project_title, project_desc")
    .in("id", projectIds);

  if (projectError) {
    console.error("Error fetching projects:", projectError);
    return similarGuides;
  }

  // Combine embeddings with project info
  return similarGuides.map((guide: any) => {
    const project = projects?.find((p) => p.id === guide.project_id);
    return {
      ...guide,
      project_title: project?.project_title,
      project_desc: project?.project_desc,
    };
  });
};
