import type { Metadata } from "next";
import { TicketWizApp } from "@/components/TicketWizApp";

export const metadata: Metadata = {
  title: "Ticket Wiz | Find the best flight deals fast",
  description: "Search flights or explore destinations by budget to find the best deals fast.",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "es-ES": "/es",
    },
  },
  openGraph: {
    title: "Ticket Wiz | Find the best flight deals fast",
    description: "Search flights or explore destinations by budget to find the best deals fast.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Wiz | Find the best flight deals fast",
    description: "Search flights or explore destinations by budget to find the best deals fast.",
  },
};

export default function Home() {
  return (
    <TicketWizApp />
  );
}
