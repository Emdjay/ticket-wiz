export type FlightSearchParams = {
  origin: string; // IATA
  destination: string; // IATA
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  adults: number;
  currency: string; // ISO currency
  nonStop?: boolean;
  maxResults: number;
};

export type FlightOffer = {
  id: string;
  priceTotal: string;
  currency: string;
  validatingAirlineCodes: string[];
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
      duration: string;
      numberOfStops: number;
    }>;
  }>;
};

export type FlightSearchResponse = {
  provider: "amadeus";
  offers: FlightOffer[];
};

export type ExploreParams = {
  origin: string; // IATA
  currency: string;
  maxPrice?: number;
};

export type ExploreDeal = {
  destination: string; // IATA
  priceTotal: string;
  currency: string;
  departureDate?: string;
  returnDate?: string;
  durationMinutes?: number;
  maxStops?: number;
  links?: { flightOffers?: string };
};

export type ExploreResponse = {
  provider: "amadeus";
  deals: ExploreDeal[];
};

export function prettifyIata(code: string): string {
  return code.trim().toUpperCase();
}

