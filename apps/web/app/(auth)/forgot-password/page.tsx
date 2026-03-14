import Link from "next/link";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="grid-background flex min-h-screen items-center justify-center px-4">
      <section className="panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Password recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Send a recovery link through Supabase Auth and complete the password reset from the secure link in the email.
        </p>
        <ForgotPasswordForm />
        <Link className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]" href="/login">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
