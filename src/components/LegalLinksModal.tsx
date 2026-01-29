"use client";

import { useState } from "react";

type Locale = "en" | "es";

const CONTENT: Record<
  Locale,
  {
    labels: { about: string; privacy: string; terms: string; close: string };
    sections: {
      about: { title: string; body: string[] };
      privacy: { title: string; body: string[] };
      terms: { title: string; body: string[] };
    };
  }
> = {
  en: {
    labels: { about: "About", privacy: "Privacy", terms: "Terms", close: "Close" },
    sections: {
      about: {
        title: "About Ticket Wiz",
        body: [
          "Ticket Wiz helps travelers compare flight options quickly using price, duration, and stops to highlight strong value and flag outliers.",
          "You always book on partner sites—Ticket Wiz does not add fees to your fare.",
          "We build for clarity: fewer steps, transparent scoring, and direct booking links.",
        ],
      },
      privacy: {
        title: "Privacy",
        body: [
          "Ticket Wiz is a search and discovery tool. We do not sell tickets or process payments. Bookings happen on partner sites.",
          "We collect limited usage data (pages visited, clicks) to improve the product. If you join deal alerts, we store your email to send updates. We do not sell personal data.",
          "Questions? info@ticket-wiz.com",
        ],
      },
      terms: {
        title: "Terms",
        body: [
          "Ticket Wiz provides flight search and deal‑ranking tools. We do not sell tickets or process payments. Bookings are completed on partner websites.",
          "Prices and availability can change quickly. Always review final pricing, rules, and fees on the booking site before purchase.",
          "By using Ticket Wiz, you agree to use the service responsibly and accept that results may vary by market and availability.",
        ],
      },
    },
  },
  es: {
    labels: { about: "Sobre", privacy: "Privacidad", terms: "Términos", close: "Cerrar" },
    sections: {
      about: {
        title: "Sobre Ticket Wiz",
        body: [
          "Ticket Wiz ayuda a comparar opciones de vuelos usando precio, duración y escalas para resaltar el mejor valor.",
          "Siempre reservas en sitios asociados; Ticket Wiz no agrega cargos extra.",
          "Construimos claridad: menos pasos, puntajes transparentes y enlaces directos.",
        ],
      },
      privacy: {
        title: "Privacidad",
        body: [
          "Ticket Wiz es una herramienta de búsqueda. No vendemos boletos ni procesamos pagos. Las reservas se completan en sitios asociados.",
          "Recopilamos datos de uso limitados para mejorar el producto. Si te suscribes a alertas, guardamos tu correo para enviarlas. No vendemos datos personales.",
          "Contacto: info@ticket-wiz.com",
        ],
      },
      terms: {
        title: "Términos",
        body: [
          "Ticket Wiz ofrece búsqueda y ranking de ofertas. No vende boletos ni procesa pagos.",
          "Los precios y la disponibilidad pueden cambiar. Revisa el precio final, reglas y cargos antes de comprar.",
          "Al usar Ticket Wiz, aceptas que los resultados pueden variar según mercado y disponibilidad.",
        ],
      },
    },
  },
};

type LegalLinksModalProps = {
  locale?: Locale;
  className?: string;
};

export function LegalLinksModal({ locale = "en", className }: LegalLinksModalProps) {
  const content = CONTENT[locale] ?? CONTENT.en;
  const [openModal, setOpenModal] = useState<keyof typeof content.sections | null>(null);

  return (
    <>
      <div className={className}>
        <button className="hover:underline" type="button" onClick={() => setOpenModal("about")}>
          {content.labels.about}
        </button>
        <button className="hover:underline" type="button" onClick={() => setOpenModal("privacy")}>
          {content.labels.privacy}
        </button>
        <button className="hover:underline" type="button" onClick={() => setOpenModal("terms")}>
          {content.labels.terms}
        </button>
      </div>

      {openModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000034]/60 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-left text-[#000034] shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="text-lg font-semibold">{content.sections[openModal].title}</div>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-[#D9E2EA] px-3 py-1 text-[11px] font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
              >
                {content.labels.close}
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[#363535]">
              {content.sections[openModal].body.map((line) => (
                <p key={line}>
                  {line.includes("info@ticket-wiz.com") ? (
                    <>
                      {locale === "es" ? "Contacto: " : "Questions? "}
                      <a className="text-[#1D4F91] underline" href="mailto:info@ticket-wiz.com">
                        info@ticket-wiz.com
                      </a>
                    </>
                  ) : (
                    line
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
