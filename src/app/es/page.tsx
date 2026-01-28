import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ticket Wiz | Ofertas de vuelos rápido",
  description: "Busca vuelos o explora destinos por presupuesto para encontrar buenas ofertas.",
  alternates: {
    canonical: "/es",
    languages: {
      "en-US": "/",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "Ticket Wiz | Ofertas de vuelos rápido",
    description: "Busca vuelos o explora destinos por presupuesto para encontrar buenas ofertas.",
    url: "/es",
  },
};

export default function SpanishHomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="inline-flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#D9E2EA]">
          <img
            src="/ticket-wiz-logo.png"
            alt="Ticket Wiz"
            className="h-full w-full object-contain scale-105"
          />
        </div>
        <h1 className="mt-6 text-balance text-3xl font-semibold text-[#000034] sm:text-4xl">
          Encuentra ofertas de vuelos rápido.
        </h1>
        <p className="mt-3 text-base text-[#363535]">
          Compara precios, duración y escalas para elegir la mejor opción con confianza.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#006A52] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F386E]"
          >
            Ir a la app
          </a>
          <a
            href="/es/landing"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EA] bg-white px-5 text-sm font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
          >
            Ver más
          </a>
        </div>
      </div>
    </div>
  );
}
