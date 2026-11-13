import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Talkotype password.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-14 sm:px-6">
      <ResetPasswordForm />
    </div>
  );
}
