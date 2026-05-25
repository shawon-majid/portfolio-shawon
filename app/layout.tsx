import type { Metadata } from "next";
import "./globals.css";

const DESCRIPTION =
  "Shawon Majid — software engineer. AI-augmented backends, agentic workflows, serverless on AWS + GCP. Ask me anything.";

export const metadata: Metadata = {
  metadataBase: new URL("https://shawonmajid.com"),
  title: {
    default: "Shawon Majid — Software Engineer",
    template: "%s · Shawon Majid",
  },
  description: DESCRIPTION,
  keywords: [
    "Shawon Majid",
    "Software Engineer",
    "AI Engineer",
    "LangGraph",
    "AWS",
    "GCP",
    "serverless",
    "agentic workflows",
    "backend engineer",
  ],
  authors: [{ name: "Shawon Majid", url: "https://shawonmajid.com" }],
  creator: "Shawon Majid",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://shawonmajid.com",
    siteName: "Shawon Majid",
    title: "Shawon Majid — Software Engineer",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shawon Majid — Software Engineer",
    description: DESCRIPTION,
  },
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
