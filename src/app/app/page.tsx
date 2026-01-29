import type { Metadata } from "next";
import { TicketWizApp } from "@/components/TicketWizApp";

export const metadata: Metadata = {
  title: "Ticket Wiz App | Search & Explore flights",
  description: "Search flights or explore destinations by budget to find the best deals fast.",
  keywords: [
    "flight deals",
    "cheap flights",
    "flight search",
    "travel deals",
    "budget travel",
    "Ticket Wiz",
  ],
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
    images: [{ url: "/ticket-wiz-logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Wiz App | Search & Explore flights",
    description: "Search flights or explore destinations by budget to find the best deals fast.",
    images: ["/ticket-wiz-logo.png"],
  },
};

export default function AppPage() {
  return <TicketWizApp />;
}
