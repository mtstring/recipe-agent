import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return (
    <div className="flex-1 flex flex-col pb-20 max-w-xl w-full mx-auto">
      {children}
      <AppNav />
    </div>
  );
}
