import Link from "next/link";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="grid-background flex min-h-screen items-center justify-center px-4">
      <section className="panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Recovery session
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Open this page from the Supabase recovery link, then set a new password for the current operator account.
        </p>
        <ResetPasswordForm />
        <Link className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]" href="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
