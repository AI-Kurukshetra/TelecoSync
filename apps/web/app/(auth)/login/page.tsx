import Link from "next/link";
import { LoginForm } from "@/app/(auth)/login/LoginForm";

type LoginPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath =
    typeof searchParams?.next === "string" && searchParams.next.startsWith("/")
      ? searchParams.next
      : undefined;

  return (
    <main className="grid-background flex min-h-screen items-center justify-center px-4">
      <section className="panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Sign in
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Access your workspace</h1>
        <div className="space-y-3">
          <LoginForm nextPath={nextPath} />
          <Link
            className="block text-sm font-semibold text-[var(--accent)]"
            href="/forgot-password"
          >
            Forgot password
          </Link>
          <Link
            className="text-sm font-semibold text-[var(--accent)]"
            href="/register"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
