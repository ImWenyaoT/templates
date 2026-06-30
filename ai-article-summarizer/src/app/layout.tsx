import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { createPageMetadata } from "./seo";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-article-summarizer.example.com",
  ),
  applicationName: "AI Article Summarizer",
  creator: "AI Article Summarizer",
  keywords: ["AI 摘要", "文章摘要", "阅读效率", "Next.js"],
  ...createPageMetadata(),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f5",
};

/**
 * Provides the global document shell for the App Router application.
 *
 * Keep provider setup here so route pages stay focused on
 * product flows.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="min-h-screen bg-stone-100 font-sans text-stone-950 antialiased"
      >
        <div className="min-h-screen">
          <header className="border-b border-stone-200 bg-white/95">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <Link
                className="text-base font-semibold tracking-normal text-stone-950"
                href="/"
              >
                AI Article Summarizer
              </Link>
              <nav aria-label="主导航" className="flex items-center gap-2">
                <Link
                  className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
                  href="/"
                >
                  首页
                </Link>
                <Link
                  className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
                  href="/history"
                >
                  历史记录
                </Link>
                <Link
                  className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
                  href="/markdown"
                >
                  Markdown
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
