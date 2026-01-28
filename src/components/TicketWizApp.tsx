"use client";

import { useMemo, useState } from "react";
import type { ExploreResponse, FlightSearchResponse } from "@/lib/flights";

type Tab = "search" | "explore";

type OfferSort = "best" | "cheapest" | "fastest" | "fewest-stops";
type Locale = "en" | "es";
type Copy = (typeof COPY)[keyof typeof COPY];

type PurchasePartner = "skyscanner" | "kayak" | "kiwi" | "google" | "airline" | "klook";

const OUTLIER_MAX_STOPS = 2;
const OUTLIER_DURATION_MULTIPLIER = 1.6;
const KIWI_DEEPLINK_TEMPLATE = process.env.NEXT_PUBLIC_KIWI_DEEPLINK_TEMPLATE ?? "";
const KLOOK_SEARCH_URL_TEMPLATE = process.env.NEXT_PUBLIC_KLOOK_SEARCH_URL_TEMPLATE ?? "";
const SHOW_EXPLORE_LINKS =
  (process.env.NEXT_PUBLIC_SHOW_LINKS ?? "").trim().toLowerCase() === "true";
const KIWI_DIRECT_LINKS =
  (process.env.NEXT_PUBLIC_KIWI_DIRECT_LINKS ?? "").trim().toLowerCase() === "true";

const KIWI_LOCATION_SLUGS: Record<string, string> = {
  MIA: "miami-florida-united-states",
  ATL: "atlanta-georgia-united-states",
  ORD: "chicago-illinois-united-states",
  LAX: "los-angeles-california-united-states",
  DFW: "dallas-fort-worth-texas-united-states",
  DEN: "denver-colorado-united-states",
  LAS: "las-vegas-nevada-united-states",
  MCO: "orlando-florida-united-states",
  SEA: "seattle-washington-united-states",
  SFO: "san-francisco-california-united-states",
  IAH: "houston-texas-united-states",
  BOS: "boston-massachusetts-united-states",
  JFK: "new-york-city-new-york-united-states",
  EWR: "newark-new-jersey-united-states",
  LGA: "new-york-city-new-york-united-states",
  CLT: "charlotte-north-carolina-united-states",
  PHX: "phoenix-arizona-united-states",
};

const COPY = {
  en: {
    heroTitle: "Find the best airline deals fast.",
    heroSubtitle: "Start with a direct search, or explore destinations by budget.",
    heroSubtitleNote: "(Prices depend on your configured flight data provider.)",
    contactLabel: "Contact",
    tabSearch: "Search",
    tabExplore: "Explore",
    searchFlightsTitle: "Search flights",
    searchFlightsNote: "Uses Amadeus Flight Offers Search (live-ish pricing).",
    exploreTitle: "Explore destinations",
    exploreNote:
      "Uses Amadeus flight inspiration when available; otherwise falls back to sampling popular destinations via live offers.",
    origin: "Origin",
    destination: "Destination",
    selected: "Selected",
    popular: "Popular",
    showPopular: "Show popular airports",
    hidePopular: "Hide popular airports",
    region: "Region",
    airportsInRegion: "Airports in region",
    selectPopularAirport: "Select popular airport",
    selectAirport: "Select airport",
    depart: "Depart",
    returnOptional: "Return (optional)",
    adults: "Adults",
    currency: "Currency",
    nonstop: "Nonstop",
    searching: "Searching…",
    exploring: "Exploring…",
    findDeals: "Find deals",
    results: "Results",
    offers: "offers",
    destinationsLabel: "destinations",
    sort: "Sort",
    bestDeal: "Best deal",
    cheapest: "Cheapest",
    fastest: "Fastest",
    fewestStops: "Fewest stops",
    bestValueRightNow: "Best value right now",
    score: "Score",
    price: "Price",
    maxPrice: "Max price",
    duration: "Duration",
    totalDuration: "Total duration",
    stops: "Stops",
    airlines: "Airlines",
    airline: "Airline",
    basedOn: "Based on price, duration, and stops across current results.",
    fetchingFares: "Fetching fares…",
    runSearchToSee: "Run a search to see flight offers here.",
    runExploreToSee: "Run an explore search to see destinations here.",
    dealsTitle: "Deals",
    dealScore: "Deal score",
    bookOnPartnerSites: "You book on partner sites. We don’t add fees.",
    budgetCap: "Budget cap",
    nonstopOnly: "Nonstop only",
    maxStops: "Max stops",
    tripLength: "Trip length",
    departLabel: "Depart",
    returnLabel: "Return",
    daysLabel: "days",
    viewAmadeusOffer: "View Amadeus offer →",
    durationLabel: "Duration",
    flightLabel: "Flight",
    layoverLabel: "Layover",
    buyVia: "Buy via",
    buy: "Buy",
    buyUnavailable: "Buy unavailable",
    klookCta: "See activities on Klook",
    outlierPrefix: "Outlier: ",
    dealBest: "Best deal",
    dealGood: "Good deal",
    dealFair: "Fair deal",
    dealPricey: "Pricey",
    searchFailed: "Search failed.",
    exploreFailed: "Explore failed.",
    returnDateError: "Return date must be on/after the departure date.",
    mvpLabel: "MVP",
    mvpSubtitle: "Search + Explore",
  },
  es: {
    heroTitle: "Encuentra las mejores ofertas de vuelos rápido.",
    heroSubtitle: "Empieza con una búsqueda directa o explora destinos por presupuesto.",
    heroSubtitleNote: "(Los precios dependen de tu proveedor de datos de vuelos.)",
    contactLabel: "Contacto",
    tabSearch: "Buscar",
    tabExplore: "Explorar",
    searchFlightsTitle: "Buscar vuelos",
    searchFlightsNote: "Usa Amadeus Flight Offers Search (precios casi en tiempo real).",
    exploreTitle: "Explorar destinos",
    exploreNote:
      "Usa inspiración de vuelos de Amadeus cuando esté disponible; si no, toma destinos populares con ofertas en vivo.",
    origin: "Origen",
    destination: "Destino",
    selected: "Seleccionado",
    popular: "Populares",
    showPopular: "Mostrar aeropuertos populares",
    hidePopular: "Ocultar aeropuertos populares",
    region: "Región",
    airportsInRegion: "Aeropuertos en la región",
    selectPopularAirport: "Selecciona un aeropuerto popular",
    selectAirport: "Selecciona un aeropuerto",
    depart: "Salida",
    returnOptional: "Regreso (opcional)",
    adults: "Adultos",
    currency: "Moneda",
    nonstop: "Sin escalas",
    searching: "Buscando…",
    exploring: "Explorando…",
    findDeals: "Encontrar ofertas",
    results: "Resultados",
    offers: "ofertas",
    destinationsLabel: "destinos",
    sort: "Ordenar",
    bestDeal: "Mejor oferta",
    cheapest: "Más barato",
    fastest: "Más rápido",
    fewestStops: "Menos escalas",
    bestValueRightNow: "Mejor valor ahora",
    score: "Puntaje",
    price: "Precio",
    maxPrice: "Precio máximo",
    duration: "Duración",
    totalDuration: "Duración total",
    stops: "Escalas",
    airlines: "Aerolíneas",
    airline: "Aerolínea",
    basedOn: "Basado en precio, duración y escalas en los resultados actuales.",
    fetchingFares: "Cargando tarifas…",
    runSearchToSee: "Ejecuta una búsqueda para ver ofertas aquí.",
    runExploreToSee: "Ejecuta una exploración para ver destinos aquí.",
    dealsTitle: "Ofertas",
    dealScore: "Puntaje de oferta",
    bookOnPartnerSites: "Reservas en sitios asociados. No añadimos cargos.",
    budgetCap: "Tope de presupuesto",
    nonstopOnly: "Solo sin escalas",
    maxStops: "Máx. escalas",
    tripLength: "Duración del viaje",
    departLabel: "Salida",
    returnLabel: "Regreso",
    daysLabel: "días",
    viewAmadeusOffer: "Ver oferta de Amadeus →",
    durationLabel: "Duración",
    flightLabel: "Vuelo",
    layoverLabel: "Escala",
    buyVia: "Compra vía",
    buy: "Comprar",
    buyUnavailable: "Compra no disponible",
    klookCta: "Ver actividades en Klook",
    outlierPrefix: "Atípico: ",
    dealBest: "Mejor oferta",
    dealGood: "Buena oferta",
    dealFair: "Oferta regular",
    dealPricey: "Caro",
    searchFailed: "Búsqueda fallida.",
    exploreFailed: "Exploración fallida.",
    returnDateError: "La fecha de regreso debe ser igual o posterior a la de salida.",
    mvpLabel: "MVP",
    mvpSubtitle: "Buscar + Explorar",
  },
} as const;

type Airport = {
  code: string;
  city: string;
  name: string;
};

const AIRLINE_NAMES: Record<string, string> = {
  AA: "American",
  AS: "Alaska",
  B6: "JetBlue",
  DL: "Delta",
  F9: "Frontier",
  NK: "Spirit",
  UA: "United",
  WN: "Southwest",
};

function airlineName(code: string) {
  return AIRLINE_NAMES[code] ?? code;
}

const POPULAR_AIRPORTS: Airport[] = [
  { code: "JFK", city: "New York", name: "John F. Kennedy" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles Intl" },
  { code: "ORD", city: "Chicago", name: "O'Hare" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth" },
  { code: "DEN", city: "Denver", name: "Denver Intl" },
  { code: "SFO", city: "San Francisco", name: "San Francisco Intl" },
  { code: "SEA", city: "Seattle", name: "Sea-Tac" },
  { code: "MIA", city: "Miami", name: "Miami Intl" },
  { code: "BOS", city: "Boston", name: "Logan Intl" },
];

const AIRPORT_REGIONS: Record<string, Airport[]> = {
  "US - Northeast": [
    { code: "JFK", city: "New York", name: "John F. Kennedy" },
    { code: "LGA", city: "New York", name: "LaGuardia" },
    { code: "EWR", city: "Newark", name: "Newark Liberty" },
    { code: "BOS", city: "Boston", name: "Logan Intl" },
    { code: "PHL", city: "Philadelphia", name: "Philadelphia Intl" },
    { code: "DCA", city: "Washington", name: "Reagan National" },
    { code: "IAD", city: "Washington", name: "Dulles Intl" },
  ],
  "US - South": [
    { code: "MIA", city: "Miami", name: "Miami Intl" },
    { code: "MCO", city: "Orlando", name: "Orlando Intl" },
    { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson" },
    { code: "CLT", city: "Charlotte", name: "Charlotte Douglas" },
    { code: "IAH", city: "Houston", name: "George Bush Intercontinental" },
    { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth" },
  ],
  "US - Midwest": [
    { code: "ORD", city: "Chicago", name: "O'Hare" },
    { code: "MDW", city: "Chicago", name: "Midway" },
    { code: "MSP", city: "Minneapolis", name: "Minneapolis–St. Paul" },
    { code: "DTW", city: "Detroit", name: "Detroit Metro" },
    { code: "STL", city: "St. Louis", name: "Lambert" },
  ],
  "US - West": [
    { code: "LAX", city: "Los Angeles", name: "Los Angeles Intl" },
    { code: "SFO", city: "San Francisco", name: "San Francisco Intl" },
    { code: "SEA", city: "Seattle", name: "Sea-Tac" },
    { code: "SAN", city: "San Diego", name: "San Diego Intl" },
    { code: "LAS", city: "Las Vegas", name: "Harry Reid Intl" },
    { code: "DEN", city: "Denver", name: "Denver Intl" },
    { code: "PHX", city: "Phoenix", name: "Sky Harbor" },
  ],
};

const REGION_KEYS = Object.keys(AIRPORT_REGIONS);

function formatAirport(airport: Airport) {
  return `${airport.code} · ${airport.city}`;
}

const AIRPORT_LOOKUP = new Map(
  [...POPULAR_AIRPORTS, ...Object.values(AIRPORT_REGIONS).flat()].map((airport) => [
    airport.code,
    airport,
  ])
);

function airportLabel(code: string) {
  const airport = AIRPORT_LOOKUP.get(code);
  return airport ? formatAirport(airport) : code;
}

function AirportPicker(props: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
  stackSelected?: boolean;
  labels: {
    selected: string;
    popular: string;
    showPopular: string;
    hidePopular: string;
    region: string;
    airportsInRegion: string;
    selectPopularAirport: string;
    selectAirport: string;
  };
}) {
  const { label, value, onChange, exclude, stackSelected, labels } = props;
  const [region, setRegion] = useState(REGION_KEYS[0] ?? "");
  const [showPopular, setShowPopular] = useState(false);
  const regionAirports = AIRPORT_REGIONS[region] ?? [];
  const popularOptions = POPULAR_AIRPORTS.filter((a) => a.code !== exclude);
  const regionOptions = regionAirports.filter((a) => a.code !== exclude);
  return (
    <div className="rounded-xl border border-[#B6C6D6] border-l-4 border-l-[#1D4F91] bg-[#EFF5FB] p-3 shadow-md">
      {stackSelected ? (
        <div className="grid gap-1">
          <div className="text-xs font-semibold text-[#000034]">{label}</div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E9F0F9] px-2 py-0.5 text-[11px] font-semibold text-[#0F386E] ring-1 ring-[#C9D8EA]">
            <span>{labels.selected}</span>
            <span className="rounded-full bg-[#0F386E] px-2 py-0.5 text-white">{value}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-[#000034]">{label}</div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E9F0F9] px-2 py-0.5 text-[11px] font-semibold text-[#0F386E] ring-1 ring-[#C9D8EA]">
            <span>{labels.selected}</span>
            <span className="rounded-full bg-[#0F386E] px-2 py-0.5 text-white">{value}</span>
          </div>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        <label className="text-xs font-medium text-[#000034]">
          {labels.popular}
          <button
            type="button"
            onClick={() => setShowPopular((prev) => !prev)}
            className="mt-1 inline-flex h-8 items-center rounded-lg border border-[#C2D1DF] bg-[#E9F0F9] px-2 text-[11px] font-medium text-[#1D4F91] hover:border-[#1D4F91]"
          >
            {showPopular ? labels.hidePopular : labels.showPopular}
          </button>
        </label>
        {showPopular ? (
          <select
            value={popularOptions.some((a) => a.code === value) ? value : ""}
            onChange={(e) => {
              if (e.target.value) onChange(e.target.value);
            }}
            className="h-9 w-full rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
          >
            <option value="">{labels.selectPopularAirport}</option>
            {popularOptions.map((airport) => (
              <option key={airport.code} value={airport.code}>
                {formatAirport(airport)}
              </option>
            ))}
          </select>
        ) : null}
        <label className="text-xs font-medium text-[#000034]">
          {labels.region}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
          >
            {REGION_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-[#000034]">
          {labels.airportsInRegion}
          <select
            value={regionOptions.some((a) => a.code === value) ? value : ""}
            onChange={(e) => {
              if (e.target.value) onChange(e.target.value);
            }}
            className="mt-1 h-9 w-full rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
          >
            <option value="">{labels.selectAirport}</option>
            {regionOptions.map((airport) => (
              <option key={airport.code} value={airport.code}>
                {formatAirport(airport)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function formatMoney(currency: string, amount: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function byNumericPrice(a: { priceTotal: string }, b: { priceTotal: string }) {
  return Number(a.priceTotal) - Number(b.priceTotal);
}

function parseIsoDurationToMinutes(raw: string) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(raw);
  if (!match) return 0;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  return hours * 60 + minutes;
}

function formatDurationMinutes(totalMinutes?: number) {
  if (typeof totalMinutes !== "number" || !Number.isFinite(totalMinutes)) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.max(0, totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

function formatIsoDuration(raw?: string) {
  if (!raw) return "—";
  return formatDurationMinutes(parseIsoDurationToMinutes(raw));
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${day} · ${time}`;
}

function minutesBetween(start?: string, end?: string) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  return diff >= 0 ? diff : null;
}

function tripLengthDays(start?: string, end?: string) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return diffDays >= 0 ? diffDays : null;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function dealBadge(score: number | undefined, copy: Copy) {
  if (typeof score !== "number") return null;
  const pct = Math.round(score * 100);
  if (pct >= 85) {
    return {
      label: copy.dealBest,
      tone: "bg-[#E6F3EE] text-[#006A52] ring-1 ring-[#CFE5DC]",
    };
  }
  if (pct >= 70) {
    return {
      label: copy.dealGood,
      tone: "bg-[#E8EFF7] text-[#1D4F91] ring-1 ring-[#C9D8EA]",
    };
  }
  if (pct >= 55) {
    return {
      label: copy.dealFair,
      tone: "bg-[#FFF4C2] text-[#000034] ring-1 ring-[#FFE28A]",
    };
  }
  return {
    label: copy.dealPricey,
    tone: "bg-[#FBE9DC] text-[#D57800] ring-1 ring-[#F5CFB3]",
  };
}

function warningBadge(reason: string | undefined, copy: Copy) {
  if (!reason) return null;
  return {
    label: `${copy.outlierPrefix}${reason}`,
    tone: "bg-[#FBE9DC] text-[#D57800] ring-1 ring-[#F5CFB3]",
  };
}

function formatDateParam(date: string | undefined) {
  if (!date) return null;
  return date.replaceAll("-", "");
}

function buildPurchaseUrl(args: {
  partner: PurchasePartner;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  airlineCode?: string;
}) {
  if (args.partner === "klook") {
    return buildKlookSearchUrl(args.destination);
  }
  const originUpper = args.origin.trim().toUpperCase();
  const destinationUpper = args.destination.trim().toUpperCase();
  const origin = originUpper.toLowerCase();
  const destination = destinationUpper.toLowerCase();
  const departIso = args.departureDate;
  const returnIso = args.returnDate ?? "";
  const depart = formatDateParam(departIso);
  if (!depart) return null;
  const ret = formatDateParam(returnIso);
  const adults = Math.max(1, args.adults);

  switch (args.partner) {
    case "skyscanner": {
      return ret
        ? `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${depart}/${ret}/?adults=${adults}`
        : `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${depart}/?adults=${adults}`;
    }
    case "kayak": {
      return ret
        ? `https://www.kayak.com/flights/${origin}-${destination}/${depart}/${ret}?adults=${adults}`
        : `https://www.kayak.com/flights/${origin}-${destination}/${depart}?adults=${adults}`;
    }
    case "kiwi": {
      return buildKiwiAffiliateUrl({
        origin: originUpper,
        destination: destinationUpper,
        depart: departIso,
        returnDate: returnIso || undefined,
        adults,
      });
    }
    case "google": {
      const query = ret
        ? `Flights from ${args.origin} to ${args.destination} on ${args.departureDate} returning ${args.returnDate}`
        : `Flights from ${args.origin} to ${args.destination} on ${args.departureDate}`;
      return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
    }
    case "airline": {
      if (!args.airlineCode) return null;
      const query = `${args.airlineCode} official booking ${args.origin} to ${args.destination}`;
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    default:
      return null;
  }
}

const SEARCH_PURCHASE_PARTNERS: Array<{ value: PurchasePartner; label: string }> = [
  { value: "kiwi", label: "Kiwi" },
];

const EXPLORE_PURCHASE_PARTNERS: Array<{ value: PurchasePartner; label: string }> = [
  { value: "kiwi", label: "Kiwi" },
];

const EXPLORE_PARTNERS_VISIBLE = KLOOK_SEARCH_URL_TEMPLATE.trim()
  ? EXPLORE_PURCHASE_PARTNERS
  : EXPLORE_PURCHASE_PARTNERS.filter((partner) => partner.value !== "klook");

function buildKlookSearchUrl(query: string) {
  if (!KLOOK_SEARCH_URL_TEMPLATE.trim()) return null;
  const trimmed = KLOOK_SEARCH_URL_TEMPLATE.trim();
  if (trimmed.includes("{query}")) {
    return trimmed.replaceAll("{query}", encodeURIComponent(query));
  }
  const joiner = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${joiner}query=${encodeURIComponent(query)}`;
}

function buildKiwiAffiliateUrl(args: {
  origin: string;
  destination: string;
  depart: string;
  returnDate?: string;
  adults: number;
}) {
  const deepLink = buildKiwiDeepLink(args);
  if (KIWI_DIRECT_LINKS) return deepLink;
  if (!KIWI_DEEPLINK_TEMPLATE.trim()) return deepLink;
  const trimmed = KIWI_DEEPLINK_TEMPLATE.trim();

  if (trimmed.includes("{url}")) {
    return trimmed.replaceAll("{url}", encodeURIComponent(deepLink));
  }

  const replaced = trimmed
    .replaceAll("{origin}", args.origin)
    .replaceAll("{destination}", args.destination)
    .replaceAll("{depart}", args.depart)
    .replaceAll("{return}", args.returnDate ?? "")
    .replaceAll("{adults}", String(args.adults));

  if (replaced !== trimmed) return replaced;

  const joiner = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${joiner}u=${encodeURIComponent(deepLink)}`;
}

function buildKiwiDeepLink(args: {
  origin: string;
  destination: string;
  depart: string;
  returnDate?: string;
  adults: number;
}) {
  const originSlug = (KIWI_LOCATION_SLUGS[args.origin] ?? args.origin).toLowerCase();
  const destinationSlug = (KIWI_LOCATION_SLUGS[args.destination] ?? args.destination).toLowerCase();
  const returnSegment = args.returnDate ?? "no-return";
  return `https://www.kiwi.com/en/search/results/${originSlug}/${destinationSlug}/${args.depart}/${returnSegment}?adults=${Math.max(1, args.adults)}`;
}

export function TicketWizApp({ locale = "en" }: { locale?: Locale }) {
  const copy = COPY[locale] ?? COPY.en;
  const airportLabels = {
    selected: copy.selected,
    popular: copy.popular,
    showPopular: copy.showPopular,
    hidePopular: copy.hidePopular,
    region: copy.region,
    airportsInRegion: copy.airportsInRegion,
    selectPopularAirport: copy.selectPopularAirport,
    selectAirport: copy.selectAirport,
  };
  const [tab, setTab] = useState<Tab>("search");

  // Search
  const [origin, setOrigin] = useState("MIA");
  const [destination, setDestination] = useState("JFK");
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [returnDate, setReturnDate] = useState<string>("");
  const [adults, setAdults] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [nonStop, setNonStop] = useState(false);
  const [searchSort, setSearchSort] = useState<OfferSort>("best");
  const [purchasePartner, setPurchasePartner] = useState<PurchasePartner>("kiwi");

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FlightSearchResponse | null>(null);

  // Explore
  const [exploreOrigin, setExploreOrigin] = useState("MIA");
  const [exploreMaxPrice, setExploreMaxPrice] = useState<number>(250);
  const [exploreCurrency, setExploreCurrency] = useState("USD");
  const [exploreDepartureDate, setExploreDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [exploreReturnDate, setExploreReturnDate] = useState<string>("");
  const [exploreAdults, setExploreAdults] = useState(1);
  const [exploreNonStop, setExploreNonStop] = useState(false);
  const [explorePurchasePartner, setExplorePurchasePartner] = useState<PurchasePartner>("kiwi");

  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [exploreResults, setExploreResults] = useState<ExploreResponse | null>(null);

  const offerView = useMemo(() => {
    const offers = searchResults?.offers ?? [];
    if (offers.length === 0) {
      return {
        offers: [] as typeof offers,
        scores: new Map<string, number>(),
        durations: new Map<string, number>(),
        stops: new Map<string, number>(),
        maxStops: new Map<string, number>(),
        outliers: new Map<string, string>(),
      };
    }

    const prices: number[] = [];
    const durations: number[] = [];
    const stops: number[] = [];
    const maxStops: number[] = [];

    for (const offer of offers) {
      const price = Number(offer.priceTotal);
      prices.push(Number.isFinite(price) ? price : 0);

      const durationMinutes = offer.itineraries.reduce((sum, it) => {
        return sum + parseIsoDurationToMinutes(it.duration);
      }, 0);
      durations.push(durationMinutes);

      const itineraryStops = offer.itineraries.map((it) => Math.max(0, it.segments.length - 1));
      const totalStops = itineraryStops.reduce((sum, count) => sum + count, 0);
      stops.push(totalStops);
      maxStops.push(itineraryStops.length ? Math.max(...itineraryStops) : 0);
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const minStops = Math.min(...stops);
    const maxStopsCount = Math.max(...stops);
    const medianDuration = median(durations);

    const scores = new Map<string, number>();
    const durationById = new Map<string, number>();
    const stopsById = new Map<string, number>();
    const maxStopsById = new Map<string, number>();
    const outliersById = new Map<string, string>();

    offers.forEach((offer, index) => {
      const price = prices[index];
      const duration = durations[index];
      const stopCount = stops[index];
      const maxStopCount = maxStops[index];

      durationById.set(offer.id, duration);
      stopsById.set(offer.id, stopCount);
      maxStopsById.set(offer.id, maxStopCount);

      const priceNorm = maxPrice === minPrice ? 0.5 : (price - minPrice) / (maxPrice - minPrice);
      const durationNorm =
        maxDuration === minDuration ? 0.5 : (duration - minDuration) / (maxDuration - minDuration);
      const stopsNorm =
        maxStopsCount === minStops ? 0.5 : (stopCount - minStops) / (maxStopsCount - minStops);

      // Price-first: prioritize savings, but still respect time and stops.
      let score = 0.7 * (1 - priceNorm) + 0.2 * (1 - durationNorm) + 0.1 * (1 - stopsNorm);
      const outlierReasons: string[] = [];
      if (maxStopCount >= OUTLIER_MAX_STOPS) outlierReasons.push("2+ stops");
      if (medianDuration > 0 && duration > medianDuration * OUTLIER_DURATION_MULTIPLIER) {
        outlierReasons.push("very long duration");
      }
      if (outlierReasons.length > 0) score -= 0.12;
      score = clamp01(score);
      scores.set(offer.id, score);
      if (outlierReasons.length > 0) {
        outliersById.set(offer.id, outlierReasons.join(" · "));
      }
    });

    const sorted = [...offers].sort((a, b) => {
      if (searchSort === "cheapest") return byNumericPrice(a, b);
      if (searchSort === "fastest") {
        return (durationById.get(a.id) ?? 0) - (durationById.get(b.id) ?? 0);
      }
      if (searchSort === "fewest-stops") {
        return (stopsById.get(a.id) ?? 0) - (stopsById.get(b.id) ?? 0);
      }
      return (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
    });

    return {
      offers: sorted,
      scores,
      durations: durationById,
      stops: stopsById,
      maxStops: maxStopsById,
      outliers: outliersById,
    };
  }, [searchResults, searchSort]);

  const bestOffer = useMemo(() => {
    if (offerView.offers.length === 0) return null;
    return offerView.offers.reduce((best, offer) => {
      const bestScore = offerView.scores.get(best.id) ?? 0;
      const offerScore = offerView.scores.get(offer.id) ?? 0;
      return offerScore > bestScore ? offer : best;
    }, offerView.offers[0]);
  }, [offerView]);

  const exploreView = useMemo(() => {
    const deals = exploreResults?.deals ?? [];
    if (deals.length === 0) {
      return { deals: [] as typeof deals, outliers: new Map<string, string>() };
    }
    const dealKey = (deal: (typeof deals)[number]) =>
      `${deal.destination}-${deal.priceTotal}-${deal.departureDate ?? ""}`;
    const durations = deals
      .map((d) => d.durationMinutes)
      .filter((d): d is number => typeof d === "number" && Number.isFinite(d));
    const medianDuration = median(durations);

    const outliers = new Map<string, string>();
    deals.forEach((deal) => {
      const outlierReasons: string[] = [];
      if (typeof deal.maxStops === "number" && deal.maxStops >= OUTLIER_MAX_STOPS) {
        outlierReasons.push("2+ stops");
      }
      if (
        typeof deal.durationMinutes === "number" &&
        medianDuration > 0 &&
        deal.durationMinutes > medianDuration * OUTLIER_DURATION_MULTIPLIER
      ) {
        outlierReasons.push("very long duration");
      }
      if (outlierReasons.length > 0) {
        outliers.set(dealKey(deal), outlierReasons.join(" · "));
      }
    });
    const sorted = [...deals].sort((a, b) => {
      const aOutlier = outliers.get(dealKey(a));
      const bOutlier = outliers.get(dealKey(b));

      if (aOutlier !== bOutlier) return aOutlier ? 1 : -1;
      return byNumericPrice(a, b);
    });

    return { deals: sorted, outliers };
  }, [exploreResults]);

  async function runSearch() {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const params = new URLSearchParams({
        origin,
        destination,
        departureDate,
        adults: String(adults),
        currency,
        max: "20",
        nonStop: String(nonStop),
      });
      if (returnDate.trim()) params.set("returnDate", returnDate.trim());

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || copy.searchFailed);
      setSearchResults(json as FlightSearchResponse);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : copy.searchFailed);
    } finally {
      setSearchLoading(false);
    }
  }

  async function runExplore() {
    setExploreError(null);
    setExploreResults(null);

    const trimmedReturn = exploreReturnDate.trim();
    if (trimmedReturn && trimmedReturn < exploreDepartureDate) {
      setExploreError(copy.returnDateError);
      return;
    }

    setExploreLoading(true);
    try {
      const params = new URLSearchParams({
        origin: exploreOrigin,
        currency: exploreCurrency,
        departureDate: exploreDepartureDate,
        adults: String(exploreAdults),
        nonStop: String(exploreNonStop),
      });
      if (Number.isFinite(exploreMaxPrice)) params.set("maxPrice", String(exploreMaxPrice));
      if (trimmedReturn) params.set("returnDate", trimmedReturn);

      const res = await fetch(`/api/flights/explore?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || copy.exploreFailed);
      setExploreResults(json as ExploreResponse);
    } catch (e) {
      setExploreError(e instanceof Error ? e.message : copy.exploreFailed);
    } finally {
      setExploreLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-950"
      style={{
        backgroundImage: "url(/Ticket-wiz3.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0F386E]/25 via-[#1D4F91]/10 to-transparent" />
      <div className="relative bg-transparent">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full bg-white/80 ring-1 ring-[#D9E2EA]">
                <img
                  src="/ticket-wiz-logo.png"
                  alt="Ticket Wiz logo"
                  className="h-full w-full object-contain scale-105"
                />
              </div>
              <div className="mt-2 text-xs font-medium text-[#000034]">
                Ticket Wiz <span className="text-[#0F386E]">•</span> Flight deals finder
              </div>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-[#000034] sm:text-4xl">
                {copy.heroTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-pretty text-[13px] leading-5 text-[#363535]">
                {copy.heroSubtitle}
                <br />
                {copy.heroSubtitleNote}
              </p>
              <div className="mt-2 text-xs font-semibold text-[#0F386E]">
                {copy.contactLabel}:{" "}
                <a className="underline" href="mailto:info@ticket-wiz.com">
                  info@ticket-wiz.com
                </a>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 text-right text-xs text-[#363535] mt-[200px]">
              <div className="inline-flex items-center gap-2">
                <a
                  href="/"
                  className="inline-flex items-center rounded-full border border-[#D9E2EA] bg-white px-3 py-1 text-[11px] font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
                >
                  EN
                </a>
                <a
                  href="/es"
                  className="inline-flex items-center rounded-full border border-[#D9E2EA] bg-white px-3 py-1 text-[11px] font-semibold text-[#1D4F91] shadow-sm transition hover:border-[#1D4F91]"
                >
                  ES
                </a>
              </div>
              <div className="font-medium text-[#000034]">{copy.mvpLabel}</div>
              <div>{copy.mvpSubtitle}</div>
            </div>
          </div>

          <div className="mt-8 inline-flex rounded-xl bg-[#F2F6FA] p-1 shadow-md ring-2 ring-[#B6C6D6]">
            <button
              type="button"
              onClick={() => setTab("search")}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition ring-1 ring-transparent",
                tab === "search"
                  ? "bg-[#0F386E] text-white shadow ring-[#0F386E]"
                  : "bg-white text-[#1D4F91] ring-[#C2D1DF] hover:bg-[#E9F0F9]",
              ].join(" ")}
            >
              {copy.tabSearch}
            </button>
            <button
              type="button"
              onClick={() => setTab("explore")}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition ring-1 ring-transparent",
                tab === "explore"
                  ? "bg-[#0F386E] text-white shadow ring-[#0F386E]"
                  : "bg-white text-[#1D4F91] ring-[#C2D1DF] hover:bg-[#E9F0F9]",
              ].join(" ")}
            >
              {copy.tabExplore}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        {tab === "search" ? (
          <section className="-mt-6 grid items-start gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-2xl border border-[#B6C6D6] bg-white p-5 shadow-lg ring-2 ring-[#B6C6D6]">
              <h2 className="text-sm font-semibold">{copy.searchFlightsTitle}</h2>
              <p className="mt-1 text-xs text-[#363535]">{copy.searchFlightsNote}</p>

              <form
                className="mt-4 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runSearch();
                }}
              >
                <div className="grid gap-3 lg:grid-cols-2">
                  <AirportPicker
                    label={copy.origin}
                    value={origin}
                    onChange={setOrigin}
                    exclude={destination}
                    stackSelected
                    labels={airportLabels}
                  />
                  <AirportPicker
                    label={copy.destination}
                    value={destination}
                    onChange={setDestination}
                    exclude={origin}
                    labels={airportLabels}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.depart}
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.returnOptional}
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.adults}
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.currency}
                    <input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                      placeholder="USD"
                    />
                  </label>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={nonStop}
                      onChange={(e) => setNonStop(e.target.checked)}
                      className="h-4 w-4 accent-[#006A52]"
                    />
                    <span className="text-sm text-[#363535]">{copy.nonstop}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#006A52] to-[#0F386E] px-4 text-sm font-semibold text-white shadow-md transition hover:from-[#0F386E] hover:to-[#1D4F91] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searchLoading ? copy.searching : copy.findDeals}
                </button>

                {searchError ? (
                  <div className="rounded-xl border border-[#F5CFB3] bg-[#FBE9DC] px-3 py-2 text-xs text-[#D57800]">
                    {searchError}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="rounded-2xl border border-[#B6C6D6] bg-white p-5 shadow-lg ring-2 ring-[#B6C6D6]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{copy.results}</h2>
                <div className="flex items-center gap-3 text-xs text-[#0F386E]">
                  <div>
                    {searchResults ? `${searchResults.offers.length} ${copy.offers}` : "—"}
                  </div>
                  <label className="flex items-center gap-2">
                    {copy.buyVia}
                    <select
                      value={purchasePartner}
                      onChange={(e) => setPurchasePartner(e.target.value as PurchasePartner)}
                      className="h-8 rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    >
                      {SEARCH_PURCHASE_PARTNERS.map((partner) => (
                        <option key={partner.value} value={partner.value}>
                          {partner.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    {copy.sort}
                    <select
                      value={searchSort}
                      onChange={(e) => setSearchSort(e.target.value as OfferSort)}
                      className="h-8 rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    >
                      <option value="best">{copy.bestDeal}</option>
                      <option value="cheapest">{copy.cheapest}</option>
                      <option value="fastest">{copy.fastest}</option>
                      <option value="fewest-stops">{copy.fewestStops}</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {bestOffer ? (
                  <div className="rounded-xl border border-[#C9D8EA] bg-[#E9F0F9] p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4F91]">
                        {copy.bestValueRightNow}
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0F386E] ring-1 ring-[#C9D8EA]">
                        {copy.score} {Math.round((offerView.scores.get(bestOffer.id) ?? 0) * 100)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-[#000034]">
                      <div>
                        {copy.price}: {formatMoney(bestOffer.currency, bestOffer.priceTotal)}
                      </div>
                      <div className="text-xs font-semibold text-[#1D4F91]">
                        {copy.duration}: {formatDurationMinutes(offerView.durations.get(bestOffer.id))}
                      </div>
                      <div className="text-xs font-semibold text-[#1D4F91]">
                        {copy.stops}: {offerView.stops.get(bestOffer.id) ?? "—"}
                      </div>
                      <div className="text-xs font-semibold text-[#1D4F91]">
                        {copy.airline}: {bestOffer.validatingAirlineCodes[0] ?? "—"}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-[#1D4F91]">
                      {copy.basedOn}
                    </div>
                  </div>
                ) : null}
                {searchLoading ? (
                  <div className="rounded-xl border border-[#D9E2EA] p-4 text-sm text-[#363535]">
                    {copy.fetchingFares}
                  </div>
                ) : null}

                {!searchLoading && offerView.offers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D9E2EA] p-6 text-sm text-[#363535]">
                    {copy.runSearchToSee}
                  </div>
                ) : null}

                {offerView.offers.map((offer) => {
                  const score = offerView.scores.get(offer.id);
                  const badge = dealBadge(score, copy);
                  const warning = warningBadge(offerView.outliers.get(offer.id), copy);
                  const duration = offerView.durations.get(offer.id);
                  const stops = offerView.stops.get(offer.id);
                  const airlines = offer.validatingAirlineCodes;
                  const primaryAirline = airlines[0] ?? "";
                  const airlineLabel = primaryAirline
                    ? airlines.length > 1
                      ? `${airlineName(primaryAirline)} +${airlines.length - 1}`
                      : airlineName(primaryAirline)
                    : "—";
                  const purchaseUrl = buildPurchaseUrl({
                    partner: purchasePartner,
                    origin,
                    destination,
                    departureDate,
                    returnDate: returnDate || undefined,
                    adults,
                    airlineCode: offer.validatingAirlineCodes[0],
                  });
                  return (
                  <div
                    key={offer.id}
                    className="rounded-xl border border-[#B6C6D6] border-t-2 border-t-[#FFCC30] bg-[#FDFEFF] p-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-lg font-semibold text-[#000034]">
                          {formatMoney(offer.currency, offer.priceTotal)}
                        </div>
                        <div className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs text-[#0F386E]">
                          {searchSort === "best" && typeof score === "number" ? (
                            <span>
                              {copy.dealScore}: {Math.round(score * 100)}
                            </span>
                          ) : null}
                          {badge ? (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.tone}`}>
                              {badge.label}
                            </span>
                          ) : null}
                          {warning ? (
                            <span className="relative inline-flex group">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${warning.tone}`}
                              >
                                {warning.label}
                              </span>
                              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg bg-[#000034] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                {warning.label.replace(copy.outlierPrefix, "")}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-full bg-[#E9F0F9] px-2 py-0.5 text-[11px] font-semibold text-[#1D4F91] ring-1 ring-[#C9D8EA]">
                        {airlineLabel}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-[#F7FAFE] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1D4F91]">
                          {copy.totalDuration}
                        </div>
                        <div className="text-xs font-semibold text-[#000034]">
                          {formatDurationMinutes(duration)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#F7FAFE] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1D4F91]">
                          {copy.stops}
                        </div>
                        <div className="text-xs font-semibold text-[#000034]">
                          {typeof stops === "number" ? stops : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#F7FAFE] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1D4F91]">
                          {copy.airlines}
                        </div>
                        <div className="text-xs font-semibold text-[#000034]">
                          {airlines.length ? airlines.join(", ") : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-[#C9D8EA] bg-[#E9F0F9] px-3 py-2 text-[11px] font-semibold text-[#1D4F91]">
                      {copy.bookOnPartnerSites}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {offer.itineraries.map((it, idx) => (
                        <div key={idx} className="rounded-lg border border-[#C2D1DF] bg-[#E8F0FA] p-3 text-xs text-[#363535]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-[#000034]">
                              <span className="rounded-md bg-[#DDEBFA] px-2 py-0.5 ring-1 ring-[#B6C6D6]">
                                {it.segments[0]?.departure.iataCode}
                              </span>{" "}
                              <span className="text-[#1D4F91]">→</span>{" "}
                              <span className="rounded-md bg-[#DDEBFA] px-2 py-0.5 ring-1 ring-[#B6C6D6]">
                                {it.segments[it.segments.length - 1]?.arrival.iataCode}
                              </span>
                            </div>
                            <div className="text-[#0F386E]">
                              {copy.durationLabel}: {formatIsoDuration(it.duration)}
                            </div>
                          </div>
                          <div className="mt-2 grid gap-1">
                            {it.segments.map((seg, sidx) => {
                              const next = it.segments[sidx + 1];
                              const layoverMinutes = next
                                ? minutesBetween(seg.arrival.at, next.departure.at)
                                : null;
                              return (
                                <div key={`${seg.departure.at}-${seg.arrival.at}`}>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <span className="font-medium">
                                        {seg.departure.iataCode} {formatDateTime(seg.departure.at)}
                                      </span>{" "}
                                      →{" "}
                                      <span className="font-medium">
                                        {seg.arrival.iataCode} {formatDateTime(seg.arrival.at)}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[#1D4F91]">
                                      <span className="rounded-full bg-[#E9F0F9] px-2 py-0.5 ring-1 ring-[#C9D8EA]">
                                        {copy.flightLabel} {seg.carrierCode}
                                        {seg.number}
                                      </span>
                                      <span className="rounded-full bg-[#E9F0F9] px-2 py-0.5 ring-1 ring-[#C9D8EA]">
                                        {formatIsoDuration(seg.duration)}
                                      </span>
                                      <span className="rounded-full bg-[#E9F0F9] px-2 py-0.5 ring-1 ring-[#C9D8EA]">
                                        {copy.stops}: {seg.numberOfStops}
                                      </span>
                                    </div>
                                  </div>
                                  {next && typeof layoverMinutes === "number" ? (
                                    <div className="mt-2 rounded-lg border border-[#C9D8EA] bg-[#F7FAFE] px-2 py-1 text-[11px] font-semibold text-[#1D4F91]">
                                      {copy.layoverLabel} {formatDurationMinutes(layoverMinutes)} ·{" "}
                                      {seg.arrival.iataCode}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {purchaseUrl ? (
                        <a
                          href={purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#1D4F91] to-[#0F386E] px-3 text-xs font-semibold text-white shadow-sm hover:from-[#0F386E] hover:to-[#1D4F91]"
                        >
                          {copy.buy}
                        </a>
                      ) : (
                        <span className="inline-flex h-8 items-center rounded-lg border border-[#D9E2EA] px-3 text-xs text-[#0F386E]">
                          {copy.buyUnavailable}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="-mt-6 grid items-start gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-2xl border border-[#B6C6D6] bg-white p-5 shadow-lg ring-2 ring-[#B6C6D6]">
              <h2 className="text-sm font-semibold">{copy.exploreTitle}</h2>
              <p className="mt-1 text-xs text-[#363535]">{copy.exploreNote}</p>

              <form
                className="mt-4 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runExplore();
                }}
              >
                <div className="grid gap-3 lg:grid-cols-2">
                  <AirportPicker
                    label={copy.origin}
                    value={exploreOrigin}
                    onChange={setExploreOrigin}
                    labels={airportLabels}
                  />
                  <label className="relative text-xs font-medium text-[#000034]">
                    <span className="pointer-events-none absolute left-3 top-2 text-[10px] text-[#000034]">
                      {copy.maxPrice}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={exploreMaxPrice}
                      onChange={(e) => setExploreMaxPrice(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 pt-4 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.depart}
                    <input
                      type="date"
                      value={exploreDepartureDate}
                      onChange={(e) => setExploreDepartureDate(e.target.value)}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.returnOptional}
                    <input
                      type="date"
                      value={exploreReturnDate}
                      onChange={(e) => setExploreReturnDate(e.target.value)}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.adults}
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={exploreAdults}
                      onChange={(e) => setExploreAdults(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[#000034]">
                    {copy.currency}
                    <input
                      value={exploreCurrency}
                      onChange={(e) => setExploreCurrency(e.target.value.toUpperCase())}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                      placeholder="USD"
                    />
                  </label>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={exploreNonStop}
                      onChange={(e) => setExploreNonStop(e.target.checked)}
                      className="h-4 w-4 accent-[#006A52]"
                    />
                    <span className="text-sm text-[#363535]">{copy.nonstop}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={exploreLoading}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#006A52] to-[#0F386E] px-4 text-sm font-semibold text-white shadow-md transition hover:from-[#0F386E] hover:to-[#1D4F91] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exploreLoading ? copy.exploring : copy.findDeals}
                </button>

                {exploreError ? (
                  <div className="rounded-xl border border-[#F5CFB3] bg-[#FBE9DC] px-3 py-2 text-xs text-[#D57800]">
                    {exploreError}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="rounded-2xl border border-[#B6C6D6] bg-white p-5 shadow-lg ring-2 ring-[#B6C6D6]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{copy.dealsTitle}</h2>
                <div className="text-xs text-[#0F386E]">
                  {exploreResults ? `${exploreResults.deals.length} ${copy.destinationsLabel}` : "—"}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#0F386E]">
                <label className="flex items-center gap-2">
                  {copy.buyVia}
                  <select
                    value={explorePurchasePartner}
                    onChange={(e) => setExplorePurchasePartner(e.target.value as PurchasePartner)}
                    className="h-8 rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                  >
                    {EXPLORE_PARTNERS_VISIBLE.map((partner) => (
                      <option key={partner.value} value={partner.value}>
                        {partner.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-3">
                {!exploreLoading && exploreView.deals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D9E2EA] p-6 text-sm text-[#363535]">
                    {copy.runExploreToSee}
                  </div>
                ) : null}

                {exploreView.deals.map((deal, idx) => {
                  const key = `${deal.destination}-${deal.priceTotal}-${deal.departureDate ?? ""}`;
                  const warning = warningBadge(exploreView.outliers.get(key), copy);
                  const purchaseUrl = deal.departureDate
                    ? buildPurchaseUrl({
                        partner: explorePurchasePartner,
                        origin: exploreOrigin,
                        destination: deal.destination,
                        departureDate: deal.departureDate,
                        returnDate: deal.returnDate,
                        adults: exploreAdults,
                      })
                    : null;
                  const klookUrl = buildKlookSearchUrl(deal.destination);
                  const tripDays = tripLengthDays(deal.departureDate, deal.returnDate);
                  return (
                  <div
                    key={`${key}-${idx}`}
                    className="rounded-xl border border-[#B6C6D6] border-t-2 border-t-[#006A52] bg-white p-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[#000034]">
                        {airportLabel(deal.destination)}
                      </div>
                      <div className="text-sm font-semibold text-[#000034]">
                        {formatMoney(deal.currency, deal.priceTotal)}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                      {Number.isFinite(exploreMaxPrice) ? (
                        <span className="rounded-full bg-[#FFF4C2] px-2 py-0.5 text-[#000034] ring-1 ring-[#FFE28A]">
                          {copy.budgetCap}: {formatMoney(exploreCurrency, String(exploreMaxPrice))}
                        </span>
                      ) : null}
                      {exploreNonStop ? (
                        <span className="rounded-full bg-[#E6F3EE] px-2 py-0.5 text-[#006A52] ring-1 ring-[#CFE5DC]">
                          {copy.nonstopOnly}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-[#F7FAFE] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1D4F91]">
                          {copy.duration}
                        </div>
                        <div className="text-xs font-semibold text-[#000034]">
                          {formatDurationMinutes(deal.durationMinutes)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#F7FAFE] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1D4F91]">
                          {copy.maxStops}
                        </div>
                        <div className="text-xs font-semibold text-[#000034]">
                          {typeof deal.maxStops === "number" ? deal.maxStops : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#F7FAFE] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#1D4F91]">
                          {copy.tripLength}
                        </div>
                        <div className="text-xs font-semibold text-[#000034]">
                          {(() => {
                            const days = tripLengthDays(deal.departureDate, deal.returnDate);
                            return typeof days === "number" ? `${days} ${copy.daysLabel}` : "—";
                          })()}
                        </div>
                      </div>
                    </div>
                    {warning ? (
                      <div className="mt-2">
                        <span className="relative inline-flex group">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${warning.tone}`}
                          >
                            {warning.label}
                          </span>
                          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg bg-[#000034] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                            {warning.label.replace(copy.outlierPrefix, "")}
                          </span>
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-2 text-xs text-[#363535]">
                      {deal.departureDate ? `${copy.departLabel}: ${deal.departureDate}` : null}
                      {deal.returnDate ? ` • ${copy.returnLabel}: ${deal.returnDate}` : null}
                      {typeof tripDays === "number"
                        ? ` • ${copy.tripLength}: ${tripDays} ${copy.daysLabel}`
                        : null}
                    </div>
                    <div className="mt-3 rounded-lg border border-[#C9D8EA] bg-[#E9F0F9] px-3 py-2 text-[11px] font-semibold text-[#1D4F91]">
                      {copy.bookOnPartnerSites}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {purchaseUrl ? (
                        <a
                          href={purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#1D4F91] to-[#0F386E] px-3 text-xs font-semibold text-white shadow-sm hover:from-[#0F386E] hover:to-[#1D4F91]"
                        >
                          {copy.buy}
                        </a>
                      ) : (
                        <span className="inline-flex h-8 items-center rounded-lg border border-[#D9E2EA] px-3 text-xs text-[#0F386E]">
                          {copy.buyUnavailable}
                        </span>
                      )}
                      {explorePurchasePartner === "klook" && klookUrl ? (
                        <a
                          href={klookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-medium text-[#1D4F91] hover:underline"
                        >
                          {copy.klookCta}
                        </a>
                      ) : null}
                      {deal.links?.flightOffers ? (
                        <a
                          href={deal.links.flightOffers}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-medium text-[#1D4F91] hover:underline"
                        >
                          {copy.viewAmadeusOffer}
                        </a>
                      ) : null}
                    </div>
                    {SHOW_EXPLORE_LINKS && purchaseUrl ? (
                      <div className="mt-2 max-w-full rounded-lg border border-dashed border-[#C9D8EA] bg-[#F7FAFE] px-2 py-1 text-[10px] text-[#1D4F91] break-all">
                        {purchaseUrl}
                      </div>
                    ) : null}
                  </div>
                );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

