import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ticket Wiz | Ofertas de vuelos, simplificado",
  description: "Encuentra ofertas con puntuación de valor y alertas de outliers.",
  alternates: {
    canonical: "/es/landing",
    languages: {
      "en-US": "/landing",
      "es-ES": "/es/landing",
    },
  },
  openGraph: {
    title: "Ticket Wiz | Ofertas de vuelos, simplificado",
    description: "Encuentra ofertas con puntuación de valor y alertas de outliers.",
    url: "/es/landing",
  },
};

export default function SpanishLandingPage() {
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
              alt="Ticket Wiz"
              className="h-full w-full object-contain scale-110"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1D4F91]">
              Ofertas de vuelos, simplificado
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold text-[#000034] sm:text-5xl">
              Ticket Wiz ayuda a encontrar ofertas confiables en segundos.
            </h1>
            <p className="mt-4 text-pretty text-base text-[#363535] sm:text-lg">
              Busca tarifas directas, explora destinos por presupuesto y ordena por una puntuación
              de valor basada en precio, duración y escalas.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[#0F386E]">
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Puntuación de valor
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Alertas de outliers
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Selector de aeropuertos rápido
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Enlaces de compra afiliados
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#006A52] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F386E]"
            >
              Abrir la app
            </a>
            <a
              href="mailto:hello@ticketwiz.app"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EA] bg-white px-5 text-sm font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
            >
              Contáctanos
            </a>
          </div>
          <div className="text-xs text-[#0F386E]">
            Para alianzas y afiliaciones, escríbenos cuando quieras.
          </div>
        </div>
      </div>
    </div>
  );
}
