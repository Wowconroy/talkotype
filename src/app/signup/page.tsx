import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your Talkotype account with Google or email.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-14 sm:px-6">
      <AuthGate mode="signup" next="/app" />
      <AuthForm mode="signup" />
    </div>
  );
}
