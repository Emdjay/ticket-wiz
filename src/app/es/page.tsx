import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import { HtmlLangSetter } from "@/components/HtmlLangSetter";
import { LegalLinksModal } from "@/components/LegalLinksModal";

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
  const isDev = process.env.NODE_ENV === "development";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cómo encuentran ofertas?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Comparamos precio, duración y escalas, y ordenamos por un puntaje de oferta.",
        },
      },
      {
        "@type": "Question",
        name: "¿Venden boletos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Te enviamos a sitios asociados para completar la reserva.",
        },
      },
      {
        "@type": "Question",
        name: "¿Los precios son finales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los precios pueden cambiar rápido. Confirma el precio final en el sitio de reserva.",
        },
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-transparent text-zinc-950">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Ticket-wiz.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized={isDev}
          className="object-cover"
          aria-hidden="true"
        />
      </div>
      <HtmlLangSetter lang="es" />
      <div className="relative z-10 min-h-screen bg-white/80 backdrop-blur-sm">
        <Script
          id="faq-schema-es"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
          <div className="flex w-full justify-end">
            <a
              href="/"
              className="inline-flex items-center rounded-full border border-[#D9E2EA] bg-white px-3 py-1 text-[11px] font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
            >
              EN
            </a>
          </div>
          <div className="inline-flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#D9E2EA]">
            <Image
              src="/ticket-wiz-logo.png"
              alt="Ticket Wiz"
              width={140}
              height={140}
              priority
              unoptimized={isDev}
              className="h-full w-full object-contain scale-110"
            />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1D4F91]">
              Ofertas de vuelos simplificadas
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold text-[#000034] sm:text-5xl">
              Encuentra ofertas de vuelos rápido.
            </h1>
            <p className="mt-4 text-pretty text-base text-[#363535] sm:text-lg">
              Compara precios, duración y escalas para elegir la mejor opción con confianza.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[#0F386E]">
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Puntaje de mejor oferta
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Alertas de outliers
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Selector de aeropuertos rápido
            </span>
            <span className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
              Enlaces de compra listos
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/es/app"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#006A52] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F386E]"
            >
              Ir a la app
            </a>
            <a
              href="https://mail.zoho.com/zm/#mail/compose?to=info@ticket-wiz.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EA] bg-white px-5 text-sm font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
            >
              Contáctanos
            </a>
          </div>
          <div className="text-xs text-[#0F386E]">
            Correo:{" "}
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
            <div className="grid w-full max-w-3xl gap-3 rounded-2xl border border-[#D9E2EA] bg-white/80 p-4 text-center text-xs text-[#363535] shadow-sm">
              <div className="text-sm font-semibold text-[#000034]">FAQ</div>
              <div>
                <div className="font-semibold text-[#000034]">¿Cómo encuentran ofertas?</div>
                <div>
                  Comparamos precio, duración y escalas, y ordenamos por un puntaje de oferta.
                </div>
              </div>
              <div>
                <div className="font-semibold text-[#000034]">¿Venden boletos?</div>
                <div>No. Te enviamos a sitios asociados para completar la reserva.</div>
              </div>
              <div>
                <div className="font-semibold text-[#000034]">¿Los precios son finales?</div>
                <div>
                  Los precios pueden cambiar rápido. Confirma el precio final en el sitio de reserva.
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-[#0F386E]">Powered by Amadeus</div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#1D4F91]">
            {["Amadeus", "Kiwi", "Skyscanner", "Kayak"].map((name) => (
              <span key={name} className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1">
                {name}
              </span>
            ))}
          </div>
          <LegalLinksModal
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-[#0F386E]"
            locale="es"
          />
          <div className="mt-4 text-[11px] text-[#0F386E]">
            Aviso de afiliados: Podemos ganar una comisión cuando reservas con enlaces asociados.
          </div>
          <div className="mt-2 text-[11px] text-[#0F386E]">
            © {new Date().getFullYear()} Ticket Wiz. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
