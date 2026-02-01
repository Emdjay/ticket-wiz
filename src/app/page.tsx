import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { LegalLinksModal } from "@/components/LegalLinksModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export const metadata: Metadata = {
  title: "Ticket Wiz | Flight deals, simplified",
  description: "Find high-confidence flight deals fast with best-deal scoring and outlier warnings.",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "Ticket Wiz | Flight deals, simplified",
    description: "Find high-confidence flight deals fast with best-deal scoring and outlier warnings.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Wiz | Flight deals, simplified",
    description: "Find high-confidence flight deals fast with best-deal scoring and outlier warnings.",
  },
};

export default function Home() {
  const isDev = process.env.NODE_ENV === "development";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do you find deals?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We compare price, duration, and stops, then rank options by a deal score.",
        },
      },
      {
        "@type": "Question",
        name: "Do you sell tickets?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. We send you to partner sites to complete booking.",
        },
      },
      {
        "@type": "Question",
        name: "Are prices final?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prices can change fast. Always confirm the final fare on the booking site.",
        },
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-transparent text-zinc-950">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Ticket-wiz.jpg"
          alt="Ticket Wiz background"
          fill
          priority
          sizes="100vw"
          unoptimized={isDev}
          className="object-cover tw-fade-in"
        />
      </div>
      <div className="absolute inset-0 z-[5]">
        <AnimatedBackground />
      </div>
      <div className="relative z-10 min-h-screen bg-white/60 backdrop-blur-[2px]">
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
          <div className="flex w-full justify-end">
            <Link
              href="/es"
              className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]"
            >
              ES
            </Link>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-white/90 px-4 py-1 text-[11px] font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]"
          >
            Top deal this week
            <span className="text-[var(--brand-ink)]">→</span>
            See it in the app
          </Link>
          <div className="inline-flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--brand-border)]">
            <Image
              src="/ticket-wiz-logo.png"
              alt="Ticket Wiz logo"
              width={140}
              height={140}
              priority
              unoptimized={isDev}
              className="h-full w-full object-contain scale-110 tw-fade-in"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
              Flight deals, simplified
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold text-[var(--brand-ink)] sm:text-5xl">
              Ticket Wiz helps travelers find high‑confidence flight deals fast.
            </h1>
            <p className="mt-4 text-pretty text-base text-[var(--brand-muted)] sm:text-lg">
              Search direct fares, explore destinations by budget, and rank offers by a deal score that
              considers price, duration, and stops.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--brand-primary)]">
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Best‑deal scoring
            </span>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Outlier warnings
            </span>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              No‑typing airport picker
            </span>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Affiliate‑ready buy links
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-[var(--brand-border)] bg-white/80 px-5 py-2 text-[11px] font-semibold text-[var(--brand-muted)] shadow-sm">
            <span>Early access community</span>
            <span className="text-[var(--brand-border)]">•</span>
            <span>Built on Amadeus</span>
            <span className="text-[var(--brand-border)]">•</span>
            <span>New deal drops weekly</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0069D9]"
            >
              Launch the app
            </Link>
          </div>
          <div className="text-xs text-[var(--brand-muted)]">
            Questions?{" "}
            <a
              className="font-semibold text-[var(--brand-primary)] hover:underline"
              href="https://mail.zoho.com/zm/#mail/compose?to=info@ticket-wiz.com"
              target="_blank"
              rel="noreferrer"
            >
              Contact us
            </a>
            .
          </div>
          <div className="text-xs text-[var(--brand-muted)]">
            For partnerships and affiliate opportunities, reach out any time:{" "}
            <a
              className="underline"
              href="https://mail.zoho.com/zm/#mail/compose?to=info@ticket-wiz.com"
              target="_blank"
              rel="noreferrer"
            >
              info@ticket-wiz.com
            </a>
          </div>
          <div className="mt-6 flex w-full justify-center">
            <div className="grid w-full max-w-3xl gap-3 rounded-2xl border border-[var(--brand-border)] bg-white/80 p-4 text-center text-xs text-[var(--brand-muted)] shadow-sm">
              <div className="text-sm font-semibold text-[var(--brand-ink)]">FAQ</div>
              <div>
                <div className="font-semibold text-[var(--brand-ink)]">How do you find deals?</div>
                <div>
                  We compare price, duration, and stops, then rank options by a deal score.
                </div>
              </div>
              <div>
                <div className="font-semibold text-[var(--brand-ink)]">Do you sell tickets?</div>
                <div>No. We send you to partner sites to complete booking.</div>
              </div>
              <div>
                <div className="font-semibold text-[var(--brand-ink)]">Are prices final?</div>
                <div>Prices can change fast. Always confirm the final fare on the booking site.</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-[var(--brand-primary)]">Powered by Amadeus</div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[var(--brand-primary)]">
            {["Amadeus", "Kiwi", "Skyscanner", "Kayak"].map((name) => (
              <span
                key={name}
                className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1"
              >
                {name}
              </span>
            ))}
          </div>
          <LegalLinksModal
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-[var(--brand-primary)]"
            locale="en"
          />
          <div className="mt-4 text-[11px] text-[var(--brand-muted)]">
            Affiliate disclosure: We may earn a commission when you book through partner links.
          </div>
          <div className="mt-2 text-[11px] text-[var(--brand-muted)]">
            © {new Date().getFullYear()} Ticket Wiz. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
