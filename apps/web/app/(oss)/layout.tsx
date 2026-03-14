import { Shell } from "@/components/layout/Shell";

export default function OssLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Shell title="OSS">{children}</Shell>;
}
