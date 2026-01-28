import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticket Wiz",
  description: "Find airline deals fast: search + explore by budget.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} antialiased`}>
        <Script
          id="tp-em"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          src="https://tp-em.com/NDkzMDQw.js?t=493040"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
