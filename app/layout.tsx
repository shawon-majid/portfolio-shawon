import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shawon.majid — $ ask me anything",
  description:
    "Shawon Majid — software engineer. AI-augmented backends, agentic workflows, serverless on AWS + GCP. Ask me anything.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Geist:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
