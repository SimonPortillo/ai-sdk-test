import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Chat from "./chat";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  return <Chat />;
}
