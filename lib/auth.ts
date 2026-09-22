import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Server-only helper (not a Server Action): redirects to /login if no session, else returns a Supabase client for the logged-in user. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}
