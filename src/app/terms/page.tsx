import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Ticket Wiz",
  description: "Terms of service for Ticket Wiz.",
  alternates: {
    canonical: "/terms",
    languages: {
      "en-US": "/terms",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "Terms of Service | Ticket Wiz",
    description: "Terms of service for Ticket Wiz.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#000034]">Terms of Service</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4F91]">
          Last updated: Jan 2026
        </p>
        <p className="mt-4 text-base text-[#363535]">
          Ticket Wiz provides flight search and deal‑ranking tools. We do not sell tickets or process
          payments. Bookings are completed on partner websites.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          Prices and availability can change quickly. Always review final pricing, rules, and fees on
          the booking site before purchase.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          By using Ticket Wiz, you agree to use the service responsibly and accept that results may
          vary by market and availability.
        </p>
      </div>
    </div>
  );
}
