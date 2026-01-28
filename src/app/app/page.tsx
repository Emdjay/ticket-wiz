import type { Metadata } from "next";
import { TicketWizApp } from "@/components/TicketWizApp";

export const metadata: Metadata = {
  title: "Ticket Wiz App | Search & Explore flights",
  description: "Search flights or explore destinations by budget to find the best deals fast.",
  alternates: {
    canonical: "/app",
    languages: {
      "en-US": "/app",
      "es-ES": "/es/app",
    },
  },
  openGraph: {
    title: "Ticket Wiz App | Search & Explore flights",
    description: "Search flights or explore destinations by budget to find the best deals fast.",
    url: "/app",
  },
};

export default function AppPage() {
  return <TicketWizApp />;
}
