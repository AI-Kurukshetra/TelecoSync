import { Shell } from "@/components/layout/Shell";

export default function AnalyticsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Shell title="Analytics">{children}</Shell>;
}
