import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Ticket Wiz",
  description: "Encuentra ofertas de vuelos rápido: busca y explora por presupuesto.",
};

export default function EsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === "production";

  return (
    <>
      <Script
        id="schema-org-es"
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
                contactType: "alianzas",
                email: "info@ticket-wiz.com",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Ticket Wiz",
              url: "https://ticket-wiz.com",
            },
          ]),
        }}
      />
      {isProd ? (
        <Script
          id="tp-em-es"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          src="https://tp-em.com/NDkzMDQw.js?t=493040"
          strategy="beforeInteractive"
        />
      ) : null}
      {children}
    </>
  );
}
