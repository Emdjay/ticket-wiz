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
        <p className="mt-4 text-base text-[#363535]">
          Ticket Wiz does not process payments or store booking details. When you click “Buy,” you are
          sent to a partner site to complete your booking.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          We may collect basic usage data to improve the product, but we do not sell personal data.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          Questions? Contact us at{" "}
          <a className="text-[#1D4F91] underline" href="mailto:hello@ticketwiz.app">
            hello@ticketwiz.app
          </a>
          .
        </p>
      </div>
    </div>
  );
}
