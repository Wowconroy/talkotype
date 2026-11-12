import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your Talkotype account with Google or email.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-14 sm:px-6">
      <AuthForm mode="signup" />
    </div>
  );
}
