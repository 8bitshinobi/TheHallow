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
  title: "The Hallow Archive",
  description: "Connected worldbuilding and campaign content for The Hallow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Forced dark theme (Scott's choice: dark gray background, always —
      // not conditional on the visitor's OS preference). Every "dark:"
      // Tailwind class in the app already has a light-mode counterpart
      // ("text-black dark:text-white", etc.), so making "dark" a permanent
      // class here (paired with the @custom-variant in globals.css) flips
      // the whole app without touching each component individually.
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
