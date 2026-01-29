import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Ticket Wiz",
  description: "Privacy policy for Ticket Wiz.",
  alternates: {
    canonical: "/privacy",
    languages: {
      "en-US": "/privacy",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "Privacy Policy | Ticket Wiz",
    description: "Privacy policy for Ticket Wiz.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#000034]">Privacy Policy</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4F91]">
          Last updated: Jan 2026
        </p>
        <p className="mt-4 text-base text-[#363535]">
          Ticket Wiz is a search and discovery tool. We do not sell tickets or process payments.
          Bookings happen on partner sites.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          We collect limited usage data (e.g., pages visited, clicks) to improve the product. If you
          join deal alerts, we store your email to send updates. We do not sell personal data.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          Questions? Contact us at{" "}
          <a className="text-[#1D4F91] underline" href="mailto:info@ticket-wiz.com">
            info@ticket-wiz.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
