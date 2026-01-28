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
        <p className="mt-4 text-base text-[#363535]">
          Ticket Wiz provides flight search and deal‑ranking tools. We do not sell tickets or process
          payments. Bookings are completed on partner websites.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          Prices and availability can change quickly. Always review final pricing and rules before
          booking.
        </p>
      </div>
    </div>
  );
}
