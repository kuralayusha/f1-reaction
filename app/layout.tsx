import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F1 Reflex Test | Test, Race, Compete!",
  description:
    "Test your reflexes like F1 drivers! How fast can you react when the lights go out? Race with your friends and claim your spot on the global leaderboard.",
  keywords:
    "F1, Formula 1, reflex test, reaction time, game, race, online racing, reflex measurement",
  authors: [{ name: "F1 Reflex Test" }],
  openGraph: {
    title: "F1 Reflex Test | Test, Race, Compete!",
    description:
      "Test your reflexes like F1 drivers! How fast can you react when the lights go out?",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "F1 Reflex Test",
    description:
      "Test your reflexes like F1 drivers! How fast can you react when the lights go out?",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  themeColor: "#111827", // bg-gray-900 color
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
