import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthCard";
import { UsernameForm } from "@/components/account/UsernameForm";
import { requireMember, safeNext } from "@/lib/member";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a username",
  robots: { index: false, follow: false },
};

export default async function UsernamePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const member = await requireMember("/account/username");
  const current = member.profile?.username ?? null;

  return (
    <AuthCard
      title={current ? "Change your username" : "Choose a username"}
      lead={
        current
          ? "Your handle is shown in the header when you are signed in."
          : "One last step. Your handle is shown in the header when you are signed in, and it is yours alone."
      }
    >
      <UsernameForm current={current} next={safeNext(next)} />
    </AuthCard>
  );
}
