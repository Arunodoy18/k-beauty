import { redirect } from "next/navigation";

import { LandingSections } from "@/components/ui/landing-sections";
import { Component as LuminaHero } from "@/components/ui/lumina-interactive-list";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/home");
  }

  return (
    <main className="landing-stack">
      <LuminaHero />
      <LandingSections />
    </main>
  );
}
