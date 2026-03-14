import { redirect } from "next/navigation";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

type ShellProps = {
  title: string;
  children: React.ReactNode;
};

export async function Shell({ title, children }: ShellProps) {
  const session = await getCurrentSessionContext();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="grid-background min-h-screen">
      <div className="mx-auto flex max-w-[96rem] gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:px-6 lg:py-6">
        <Sidebar />
        <main className="min-w-0 flex-1 space-y-4 lg:space-y-5">
          <div className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.56)] px-4 py-2 backdrop-blur">
            <BreadcrumbNav items={["TelecoSync", title]} />
          </div>
          <Header />
          <div className="panel min-h-[calc(100vh-9rem)] p-5 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
