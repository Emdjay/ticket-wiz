import type { Metadata } from "next";
import { TicketWizApp } from "@/components/TicketWizApp";
import { HtmlLangSetter } from "@/components/HtmlLangSetter";

export const metadata: Metadata = {
  title: "Ticket Wiz App | Buscar y explorar vuelos",
  description: "Busca vuelos o explora destinos por presupuesto para encontrar buenas ofertas.",
  keywords: [
    "ofertas de vuelos",
    "vuelos baratos",
    "buscar vuelos",
    "ofertas de viaje",
    "viajes con presupuesto",
    "Ticket Wiz",
  ],
  alternates: {
    canonical: "/es/app",
    languages: {
      "en-US": "/app",
      "es-ES": "/es/app",
    },
  },
  openGraph: {
    title: "Ticket Wiz App | Buscar y explorar vuelos",
    description: "Busca vuelos o explora destinos por presupuesto para encontrar buenas ofertas.",
    url: "/es/app",
    images: [{ url: "/ticket-wiz-logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Wiz App | Buscar y explorar vuelos",
    description: "Busca vuelos o explora destinos por presupuesto para encontrar buenas ofertas.",
    images: ["/ticket-wiz-logo.png"],
  },
};

export default function SpanishAppPage() {
  return (
    <>
      <HtmlLangSetter lang="es" />
      <TicketWizApp locale="es" />
    </>
  );
}
