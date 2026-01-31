import type { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
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
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]"
            >
              EN
            </Link>
          </div>
          <Link
            href="/es/app"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-white/90 px-4 py-1 text-[11px] font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]"
          >
            Mejor oferta de la semana
            <span className="text-[var(--brand-ink)]">→</span>
            Ver en la app
          </Link>
          <div className="inline-flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--brand-border)]">
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
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
              Ofertas de vuelos simplificadas
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold text-[var(--brand-ink)] sm:text-5xl">
              Encuentra ofertas de vuelos rápido.
            </h1>
            <p className="mt-4 text-pretty text-base text-[var(--brand-muted)] sm:text-lg">
              Compara precios, duración y escalas para elegir la mejor opción con confianza.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--brand-primary)]">
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Puntaje de mejor oferta
            </span>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Alertas de outliers
            </span>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Selector de aeropuertos rápido
            </span>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1">
              Enlaces de compra listos
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-[var(--brand-border)] bg-white/80 px-5 py-2 text-[11px] font-semibold text-[var(--brand-muted)] shadow-sm">
            <span>Comunidad early access</span>
            <span className="text-[var(--brand-border)]">•</span>
            <span>Powered by Amadeus</span>
            <span className="text-[var(--brand-border)]">•</span>
            <span>Nuevas ofertas cada semana</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/es/app"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0069D9]"
            >
              Ir a la app
            </Link>
          </div>
          <div className="text-xs text-[var(--brand-muted)]">
            ¿Preguntas?{" "}
            <a
              className="font-semibold text-[var(--brand-primary)] hover:underline"
              href="https://mail.zoho.com/zm/#mail/compose?to=info@ticket-wiz.com"
              target="_blank"
              rel="noreferrer"
            >
              Contáctanos
            </a>
            .
          </div>
          <div className="text-xs text-[var(--brand-muted)]">
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
            <div className="grid w-full max-w-3xl gap-3 rounded-2xl border border-[var(--brand-border)] bg-white/80 p-4 text-center text-xs text-[var(--brand-muted)] shadow-sm">
              <div className="text-sm font-semibold text-[var(--brand-ink)]">FAQ</div>
              <div>
                <div className="font-semibold text-[var(--brand-ink)]">¿Cómo encuentran ofertas?</div>
                <div>
                  Comparamos precio, duración y escalas, y ordenamos por un puntaje de oferta.
                </div>
              </div>
              <div>
                <div className="font-semibold text-[var(--brand-ink)]">¿Venden boletos?</div>
                <div>No. Te enviamos a sitios asociados para completar la reserva.</div>
              </div>
              <div>
                <div className="font-semibold text-[var(--brand-ink)]">¿Los precios son finales?</div>
                <div>
                  Los precios pueden cambiar rápido. Confirma el precio final en el sitio de reserva.
                </div>
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
            locale="es"
          />
          <div className="mt-4 text-[11px] text-[var(--brand-muted)]">
            Aviso de afiliados: Podemos ganar una comisión cuando reservas con enlaces asociados.
          </div>
          <div className="mt-2 text-[11px] text-[var(--brand-muted)]">
            © {new Date().getFullYear()} Ticket Wiz. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
