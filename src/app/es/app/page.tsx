import type { Metadata } from "next";
import { TicketWizApp } from "@/components/TicketWizApp";
import { HtmlLangSetter } from "@/components/HtmlLangSetter";

export const metadata: Metadata = {
  title: "Ticket Wiz App | Buscar y explorar vuelos",
  description: "Busca vuelos o explora destinos por presupuesto para encontrar buenas ofertas.",
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
