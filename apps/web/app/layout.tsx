import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/app/providers";

export const metadata: Metadata = {
  title: "TelecoSync | Next-Gen Digital BSS/OSS Platform",
  description:
    "TelecoSync is a next-gen digital BSS/OSS platform for telecom network infrastructure operators, built to modernise customer, billing, assurance, network, and integration operations for mid-to-large carriers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div aria-hidden className="app-background-media">
          <img
            alt=""
            className="app-background-clip"
            src="/media/landing-clip.svg"
          />
          <div className="app-background-wash" />
        </div>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
