import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { loadAccountBootstrap } from "@/lib/account-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account Settings",
  description:
    "Manage your Talkotype plan, email, notification preferences, invoices, and account deletion.",
};

export const instant = false;

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user ?? null;
  if (!user) {
    redirect("/login?next=/account");
  }

  const payload = await loadAccountBootstrap(user.id, user);
  return <AccountSettings initial={payload} />;
}
