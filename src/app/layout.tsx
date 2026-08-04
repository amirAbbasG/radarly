import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PushPrompt } from "@/features/push/push-prompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://radarly.app"),
  title: "Radarly — Discover What's Rising in AI",
  description:
    "An AI agent scans Product Hunt, GitHub, Hacker News and Reddit every day, scores real momentum, and surfaces the AI tools that are actually taking off. Scan what matters in under 10 seconds.",
  generator: "v0.app",
  keywords: [
    "AI tools",
    "trending AI",
    "Product Hunt",
    "AI directory",
    "developer tools",
    "indie hackers",
  ],
  openGraph: {
    title: "Radarly — Discover What's Rising in AI",
    description:
      "The signal, not the noise. Trending AI tools ranked by real momentum, refreshed daily.",
    type: "website",
    siteName: "Radarly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radarly — Discover What's Rising in AI",
    description:
      "The signal, not the noise. Trending AI tools ranked by real momentum, refreshed daily.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <PushPrompt />
        <Toaster />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
