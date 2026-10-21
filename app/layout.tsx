import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { ui } from "@/lib/fonts";
import AuroraBackground from "@/app/components/shell/AuroraBackground";
import { THEME_COOKIE, parseTheme } from "@/lib/theme-preference";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JobTrack",
    template: "%s | JobTrack",
  },
  description: "Track and manage your job applications in one place.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "var(--color-canvas)" },
    { media: "(prefers-color-scheme: dark)", color: "var(--color-ink)" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme chosen in Settings; "system" leaves it to prefers-color-scheme.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${ui.variable} h-full antialiased`}
      data-theme={theme === "system" ? undefined : theme}
    >
      <body className="relative min-h-full text-ink">
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
