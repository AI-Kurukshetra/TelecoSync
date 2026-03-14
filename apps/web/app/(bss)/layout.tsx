import { Shell } from "@/components/layout/Shell";

export default function BssLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Shell title="BSS">{children}</Shell>;
}
