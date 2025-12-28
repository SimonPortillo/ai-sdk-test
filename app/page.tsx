import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Chat from "./chat";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data } = await supabase.from("Project_docs").select("*");

  return <Chat projects={data ?? []} />;
}
