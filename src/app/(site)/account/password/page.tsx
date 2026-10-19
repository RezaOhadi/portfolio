import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/account/AuthCard";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { signInPath } from "@/lib/member";
import { passwordContext } from "./context";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Password",
  robots: { index: false, follow: false },
};

export default async function PasswordPage() {
  const ctx = await passwordContext();
  if (!ctx) redirect(signInPath("/account/password"));
  const { member, facts, first, needsCurrent, codeSource } = ctx;
  const next = member.profile?.username ? "/account" : "/account/username";

  const title = first ? "Set a password" : facts.recovery ? "Choose a new password" : "Change your password";
  const lead = first
    ? "Add a password so you can also sign in without Google. We will first email you a code, to be sure it is you."
    : facts.recovery
      ? "You came here from your reset link. Pick something new; you stay signed in on this device."
      : codeSource
        ? "Enter your current password, then the new one. You signed in a while ago, so we will also email you a code."
        : "Enter your current password, then the new one. You stay signed in on this device.";

  return (
    <AuthCard title={title} lead={lead}>
      <ChangePasswordForm
        needsCurrent={needsCurrent}
        needsCode={codeSource !== null}
        first={first}
        email={member.email ?? "your email"}
        next={next}
      />
    </AuthCard>
  );
}
