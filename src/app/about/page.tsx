import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Ticket Wiz",
  description: "Learn how Ticket Wiz helps travelers find high-confidence flight deals.",
  alternates: {
    canonical: "/about",
    languages: {
      "en-US": "/about",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "About Ticket Wiz",
    description: "Learn how Ticket Wiz helps travelers find high-confidence flight deals.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#000034]">About Ticket Wiz</h1>
        <p className="mt-4 text-base text-[#363535]">
          Ticket Wiz helps travelers compare flight options quickly using price, duration, and stops.
          We highlight strong value and flag outliers so you can book with confidence.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          You always book on partner sites—Ticket Wiz does not add fees to your fare.
        </p>
        <p className="mt-4 text-base text-[#363535]">
          We build for clarity: fewer steps, transparent scoring, and links that take you directly to
          booking partners.
        </p>
      </div>
    </div>
  );
}
