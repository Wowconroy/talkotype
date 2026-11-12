import type { Metadata } from "next";
import { AccountSettings } from "@/components/account-settings";

export const metadata: Metadata = {
  title: "Account Settings",
  description:
    "Manage your Talkotype plan, email, notification preferences, invoices, and account deletion.",
};

export default function AccountPage() {
  return <AccountSettings />;
}
