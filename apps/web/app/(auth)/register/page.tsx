import Link from "next/link";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="grid-background flex min-h-screen items-center justify-center px-4">
      <section className="panel w-full max-w-md p-8">
        <h1 className="text-3xl font-semibold">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Use one signup flow for all roles. Select `admin`, `inventory manager`, or `customer`, then the form adjusts to the account type you are creating.
        </p>
        <RegisterForm />
        <div className="mt-4">
          <Link className="block text-sm font-semibold text-[var(--accent)]" href="/login">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
