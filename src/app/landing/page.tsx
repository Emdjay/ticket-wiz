export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-zinc-50 text-zinc-950"
      style={{
        backgroundImage: "url(/Ticket-wiz.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
          <div className="inline-flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#D9E2EA]">
            <img
              src="/ticket-wiz-logo.png"
              alt="Ticket Wiz logo"
              className="h-full w-full object-contain scale-110"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1D4F91]">
              Flight deals, simplified
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold text-[#000034] sm:text-5xl">
              Ticket Wiz helps travelers find high‑confidence flight deals fast.
            </h1>
            <p className="mt-4 text-pretty text-base text-[#363535] sm:text-lg">
              Search direct fares, explore destinations by budget, and rank offers by a deal score that
              considers price, duration, and stops.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[#0F386E]">
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Best‑deal scoring
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Outlier warnings
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              No‑typing airport picker
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Affiliate‑ready buy links
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#006A52] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F386E]"
            >
              Launch the app
            </a>
            <a
              href="mailto:hello@ticketwiz.app"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EA] bg-white px-5 text-sm font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
            >
              Contact us
            </a>
          </div>
          <div className="text-xs text-[#0F386E]">
            For partnerships and affiliate opportunities, reach out any time.
          </div>
        </div>
      </div>
    </div>
  );
}
