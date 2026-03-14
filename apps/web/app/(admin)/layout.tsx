import { Shell } from "@/components/layout/Shell";

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Shell title="Admin">{children}</Shell>;
}
