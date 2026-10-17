import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthCard";
import { NewPasswordForm } from "@/components/account/NewPasswordForm";
import { requireMember } from "@/lib/member";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Password",
  robots: { index: false, follow: false },
};

export default async function PasswordPage() {
  const member = await requireMember("/account/password");
  const next = member.profile?.username ? "/account" : "/account/username";

  return (
    <AuthCard
      title={member.hasPassword ? "Choose a new password" : "Set a password"}
      lead={
        member.hasPassword
          ? "Pick something new for your account. You stay signed in on this device."
          : "Add a password so you can also sign in without Google."
      }
    >
      <NewPasswordForm next={next} />
    </AuthCard>
  );
}
