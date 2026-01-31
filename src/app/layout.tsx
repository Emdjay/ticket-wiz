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
  metadataBase: new URL("https://ticket-wiz.com"),
  openGraph: {
    title: "Ticket Wiz",
    description: "Find airline deals fast: search + explore by budget.",
    url: "/",
    siteName: "Ticket Wiz",
    locale: "en_US",
    type: "website",
    images: [{ url: "/ticket-wiz-logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Wiz",
    description: "Find airline deals fast: search + explore by budget.",
    images: ["/ticket-wiz-logo.png"],
  },
  other: {
    "impact-site-verification": "eeb2242a-4c18-445b-88bc-5cbe5b37e2b3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://test.api.amadeus.com" />
        <link rel="preconnect" href="https://api.amadeus.com" />
      </head>
      <body className={`${figtree.variable} antialiased`}>
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Ticket Wiz",
                url: "https://ticket-wiz.com",
                logo: "https://ticket-wiz.com/ticket-wiz-logo.png",
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "partnerships",
                email: "info@ticket-wiz.com",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Ticket Wiz",
                url: "https://ticket-wiz.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://ticket-wiz.com/?origin={origin}&destination={destination}",
                  "query-input": "required name=origin,required name=destination",
                },
              },
            ]),
          }}
        />
        {isProd ? (
          <Script
            id="tp-em"
            data-noptimize="1"
            data-cfasync="false"
            data-wpfc-render="false"
            src="https://tp-em.com/NDkzMDQw.js?t=493040"
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
