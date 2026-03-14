import Link from "next/link";
import { LoginForm } from "@/app/(auth)/login/LoginForm";

export default function CustomerLoginPage() {
  return (
    <main className="grid-background flex min-h-screen items-center justify-center px-4">
      <section className="panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Customer sign in
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Access your account</h1>
        <div className="space-y-3">
          <LoginForm nextPath="/my-services" />
          <Link
            className="block text-sm font-semibold text-[var(--accent)]"
            href="/forgot-password"
          >
            Forgot password
          </Link>
          <Link
            className="text-sm font-semibold text-[var(--accent)]"
            href="/register/customer"
          >
            Create customer
          </Link>
        </div>
      </section>
    </main>
  );
}
