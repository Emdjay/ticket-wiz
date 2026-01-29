"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ExploreResponse, FlightSearchResponse } from "@/lib/flights";
import {
  OUTLIER_DURATION_MULTIPLIER,
  OUTLIER_MAX_STOPS,
  median,
  parseIsoDurationToMinutes,
  scoreOffers,
} from "@/lib/dealScore";
import {
  buildAviasalesLink,
  buildKayakLink,
  buildKiwiAffiliateUrl,
  buildKlookSearchUrl,
  buildSkyscannerLink,
  PARTNER_ENV,
} from "@/lib/partners";
import { LegalLinksModal } from "@/components/LegalLinksModal";

type Tab = "search" | "explore";

type OfferSort = "best" | "cheapest" | "fastest" | "fewest-stops";
type Locale = "en" | "es";
type Copy = (typeof COPY)[keyof typeof COPY];

type PurchasePartner =
  | "skyscanner"
  | "kayak"
  | "kiwi"
  | "google"
  | "airline"
  | "klook"
  | "aviasales";

const KLOOK_SEARCH_URL_TEMPLATE = PARTNER_ENV.KLOOK_SEARCH_URL_TEMPLATE;
const AVIASALES_DEEPLINK_TEMPLATE = PARTNER_ENV.AVIASALES_DEEPLINK_TEMPLATE;
const SHOW_EXPLORE_LINKS =
  (process.env.NEXT_PUBLIC_SHOW_LINKS ?? "").trim().toLowerCase() === "true";

const COPY = {
  en: {
    heroTitle: "Find the best airline deals fast.",
    heroSubtitle: "Start with a direct search, or explore destinations by budget.",
    heroSubtitleNote: "(Prices vary by route, date, and availability.)",
    whyTitle: "Why Ticket Wiz?",
    whyItems: [
      "Compare live-ish fares from Amadeus in seconds.",
      "Explore destinations by budget when you need ideas.",
      "Sort by best value, price, duration, and stops.",
    ],
    galleryTitle: "Get inspired fast",
    gallerySubtitle: "Popular destinations and weekend escapes at a glance.",
    contactLabel: "Contact",
    alertsTitle: "Deal alerts",
    alertsSubtitle: "Get weekly fare drops and destination ideas.",
    alertsCta: "Notify me",
    alertsPlaceholder: "you@email.com",
    alertsSuccess: "You're on the list.",
    alertsError: "Please enter a valid email.",
    alertsSaving: "Saving...",
    trustTitle: "Trusted data partners",
    trustNote: "We surface deals from established travel platforms.",
    proofTitle: "What travelers are saying",
    proofStats: [
      { value: "4.8/5", label: "Average user rating" },
      { value: "25k+", label: "Deals compared monthly" },
      { value: "90s", label: "Average time to first result" },
    ],
    proofQuotes: [
      {
        quote: "Found a weekend deal in minutes and booked on Kiwi.",
        name: "A. Rivera",
      },
      {
        quote: "The Explore tab is perfect when I just want ideas.",
        name: "S. Patel",
      },
    ],
    howItWorksTitle: "How it works",
    howItWorksSteps: [
      {
        title: "Search or explore",
        text: "Pick a route and dates, or explore by budget.",
      },
      {
        title: "Compare smartly",
        text: "We rank results by price, duration, and stops.",
      },
      {
        title: "Book on partners",
        text: "Click through to book with trusted sites.",
      },
    ],
    tabSearch: "Search",
    tabExplore: "Explore",
    searchFlightsTitle: "Search flights",
    searchFlightsNote: "Search direct routes and dates in seconds.",
    exploreTitle: "Explore destinations",
    exploreNote: "Browse destination ideas by budget and nonstop preference.",
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
    findDeals: "Discover cheap flights",
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
    maxResults: "Max results",
    flexibleDates: "Flexible dates",
    flexGridTitle: "Flexible dates grid",
    flexGridNote: "Tap a date pair to compare quickly.",
    duration: "Duration",
    totalDuration: "Total duration",
    stops: "Stops",
    airlines: "Airlines",
    airline: "Airline",
    basedOn: "Based on price, duration, and stops across current results.",
    fetchingFares: "Fetching fares…",
    runSearchToSee: "Run a search to see flight offers here.",
    noResults: "No offers found for this search.",
    tryNonstopOff: "Try turning off Nonstop to expand results.",
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
    trendLow: "Price below avg",
    trendMid: "Price near avg",
    trendHigh: "Price above avg",
    saveSearchTitle: "Save this search",
    saveSearchCta: "Save search",
    saveSearchPlaceholder: "you@email.com",
    saveSearchSuccess: "Saved. You’ll get weekly updates.",
    saveSearchError: "Enter a valid email to save.",
    saveSearchSaving: "Saving...",
    noResultsHelpTitle: "Try one of these:",
    tryDisableNonstop: "Turn off nonstop",
    tryEnableFlexible: "Enable flexible dates",
    tryDifferentDates: "Try different dates",
    tryNearbyOrigin: "Try a nearby origin",
    tryNearbyDestination: "Try a nearby destination",
    sortBestValue: "Best value",
    sortCheapest: "Cheapest",
    sortFastest: "Fastest",
    shareDeal: "Share this deal",
    alertPromptTitle: "Get weekly alerts for this route",
    alertPromptNote: "We’ll send weekly price updates. Unsubscribe anytime.",
    alertPromptCta: "Subscribe",
    searchFailed: "Search failed.",
    exploreFailed: "Explore failed.",
    returnDateError: "Return date must be on/after the departure date.",
    mvpLabel: "MVP",
    mvpSubtitle: "Search + Explore",
  },
  es: {
    heroTitle: "Encuentra las mejores ofertas de vuelos rápido.",
    heroSubtitle: "Empieza con una búsqueda directa o explora destinos por presupuesto.",
    heroSubtitleNote: "(Los precios varían según ruta, fecha y disponibilidad.)",
    whyTitle: "¿Por qué Ticket Wiz?",
    whyItems: [
      "Compara tarifas casi en tiempo real de Amadeus en segundos.",
      "Explora destinos por presupuesto cuando necesitas ideas.",
      "Ordena por mejor valor, precio, duración y escalas.",
    ],
    galleryTitle: "Inspírate rápido",
    gallerySubtitle: "Destinos populares y escapadas de fin de semana de un vistazo.",
    contactLabel: "Contacto",
    alertsTitle: "Alertas de ofertas",
    alertsSubtitle: "Recibe caídas de precios y destinos cada semana.",
    alertsCta: "Avísame",
    alertsPlaceholder: "tu@email.com",
    alertsSuccess: "Listo. Te avisaremos pronto.",
    alertsError: "Ingresa un correo válido.",
    alertsSaving: "Guardando...",
    trustTitle: "Socios de datos confiables",
    trustNote: "Mostramos ofertas de plataformas de viajes reconocidas.",
    proofTitle: "Lo que dicen los viajeros",
    proofStats: [
      { value: "4.8/5", label: "Calificación promedio" },
      { value: "25k+", label: "Ofertas comparadas al mes" },
      { value: "90s", label: "Tiempo promedio al primer resultado" },
    ],
    proofQuotes: [
      {
        quote: "Encontré una oferta de fin de semana en minutos.",
        name: "A. Rivera",
      },
      {
        quote: "La pestaña Explorar es ideal cuando solo quiero ideas.",
        name: "S. Patel",
      },
    ],
    howItWorksTitle: "Cómo funciona",
    howItWorksSteps: [
      {
        title: "Busca o explora",
        text: "Elige ruta y fechas, o explora por presupuesto.",
      },
      {
        title: "Compara mejor",
        text: "Ordenamos por precio, duración y escalas.",
      },
      {
        title: "Reserva en socios",
        text: "Haz clic para reservar en sitios confiables.",
      },
    ],
    tabSearch: "Buscar",
    tabExplore: "Explorar",
    searchFlightsTitle: "Buscar vuelos",
    searchFlightsNote: "Busca rutas y fechas directas en segundos.",
    exploreTitle: "Explorar destinos",
    exploreNote: "Explora destinos por presupuesto y preferencias de escalas.",
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
    findDeals: "Encontrar vuelos baratos",
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
    maxResults: "Máx. resultados",
    flexibleDates: "Fechas flexibles",
    flexGridTitle: "Cuadrícula de fechas flexibles",
    flexGridNote: "Toca una pareja de fechas para comparar.",
    duration: "Duración",
    totalDuration: "Duración total",
    stops: "Escalas",
    airlines: "Aerolíneas",
    airline: "Aerolínea",
    basedOn: "Basado en precio, duración y escalas en los resultados actuales.",
    fetchingFares: "Cargando tarifas…",
    runSearchToSee: "Ejecuta una búsqueda para ver ofertas aquí.",
    noResults: "No se encontraron ofertas para esta búsqueda.",
    tryNonstopOff: "Prueba desactivar Sin escalas para ver más resultados.",
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
    trendLow: "Precio por debajo",
    trendMid: "Precio cerca del promedio",
    trendHigh: "Precio por encima",
    saveSearchTitle: "Guardar esta búsqueda",
    saveSearchCta: "Guardar",
    saveSearchPlaceholder: "tu@email.com",
    saveSearchSuccess: "Guardado. Recibirás actualizaciones semanales.",
    saveSearchError: "Ingresa un correo válido para guardar.",
    saveSearchSaving: "Guardando...",
    noResultsHelpTitle: "Prueba con una de estas opciones:",
    tryDisableNonstop: "Quitar escalas directas",
    tryEnableFlexible: "Activar fechas flexibles",
    tryDifferentDates: "Probar otras fechas",
    tryNearbyOrigin: "Probar origen cercano",
    tryNearbyDestination: "Probar destino cercano",
    sortBestValue: "Mejor valor",
    sortCheapest: "Más barato",
    sortFastest: "Más rápido",
    shareDeal: "Compartir esta oferta",
    alertPromptTitle: "Recibe alertas semanales",
    alertPromptNote: "Enviaremos actualizaciones semanales. Cancela cuando quieras.",
    alertPromptCta: "Suscribirse",
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

function airportSearchQuery(code: string) {
  const airport = AIRPORT_LOOKUP.get(code);
  return airport ? airport.city : code;
}

function AirportPicker(props: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
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
  const { label, value, onChange, exclude, labels } = props;
  const [region, setRegion] = useState(REGION_KEYS[0] ?? "");
  const [showPopular, setShowPopular] = useState(false);
  const regionAirports = AIRPORT_REGIONS[region] ?? [];
  const popularOptions = POPULAR_AIRPORTS.filter((a) => a.code !== exclude);
  const regionOptions = regionAirports.filter((a) => a.code !== exclude);
  return (
    <div className="rounded-xl border border-[#B6C6D6] bg-[#EFF5FB] p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <div className="text-xs font-semibold text-[#000034]">{label}</div>
          <div className="text-[11px] font-semibold text-[#1D4F91]">
            {labels.selected}: {airportLabel(value)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPopular((prev) => !prev)}
          className="inline-flex h-8 items-center rounded-lg border border-[#C2D1DF] bg-white px-2 text-[11px] font-medium text-[#1D4F91] hover:border-[#1D4F91]"
        >
          {showPopular ? labels.hidePopular : labels.showPopular}
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {showPopular ? (
          <label className="text-xs font-medium text-[#000034]">
            {labels.popular}
            <select
              value={popularOptions.some((a) => a.code === value) ? value : ""}
              onChange={(e) => {
                if (e.target.value) onChange(e.target.value);
              }}
              className="mt-2 h-9 w-full rounded-lg border border-[#C2D1DF] bg-[#F7FAFE] px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
            >
              <option value="">{labels.selectPopularAirport}</option>
              {popularOptions.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {formatAirport(airport)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="grid gap-3 items-start sm:grid-cols-2">
          <label className="grid grid-rows-[28px_auto] gap-2 text-xs font-medium text-[#000034]">
            <span className="block">{labels.region}</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#C2D1DF] bg-white px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
            >
              {REGION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <label className="grid grid-rows-[28px_auto] gap-2 text-xs font-medium text-[#000034]">
            <span className="block">{labels.airportsInRegion}</span>
            <select
              value={regionOptions.some((a) => a.code === value) ? value : ""}
              onChange={(e) => {
                if (e.target.value) onChange(e.target.value);
              }}
              className="h-9 w-full rounded-lg border border-[#C2D1DF] bg-white px-2 text-xs text-[#363535] focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
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

function shiftIsoDate(date: string, days: number) {
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "";
  const [year, month, day] = parts;
  const base = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(base.getTime())) return "";
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatShortDate(date: string) {
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "—";
  const [year, month, day] = parts;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(dt);
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

function priceTrend(
  price: number,
  avgPrice: number,
  copy: Copy
): { label: string; tone: string } | null {
  if (!Number.isFinite(price) || !Number.isFinite(avgPrice) || avgPrice <= 0) return null;
  const diffPct = (price - avgPrice) / avgPrice;
  if (diffPct <= -0.08) {
    return {
      label: copy.trendLow,
      tone: "bg-[#E6F3EE] text-[#006A52] ring-1 ring-[#CFE5DC]",
    };
  }
  if (diffPct >= 0.08) {
    return {
      label: copy.trendHigh,
      tone: "bg-[#FBE9DC] text-[#D57800] ring-1 ring-[#F5CFB3]",
    };
  }
  return {
    label: copy.trendMid,
    tone: "bg-[#E8EFF7] text-[#1D4F91] ring-1 ring-[#C9D8EA]",
  };
}

function warningBadge(reason: string | undefined, copy: Copy) {
  if (!reason) return null;
  return {
    label: `${copy.outlierPrefix}${reason}`,
    tone: "bg-[#FBE9DC] text-[#D57800] ring-1 ring-[#F5CFB3]",
  };
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
    return buildKlookSearchUrl(airportSearchQuery(args.destination));
  }
  const originUpper = args.origin.trim().toUpperCase();
  const destinationUpper = args.destination.trim().toUpperCase();
  const departIso = args.departureDate;
  const returnIso = args.returnDate ?? "";
  const adults = Math.max(1, args.adults);

  switch (args.partner) {
    case "skyscanner": {
      return buildSkyscannerLink({
        origin: originUpper,
        destination: destinationUpper,
        departureDate: departIso,
        returnDate: returnIso || undefined,
        adults,
      });
    }
    case "kayak": {
      return buildKayakLink({
        origin: originUpper,
        destination: destinationUpper,
        departureDate: departIso,
        returnDate: returnIso || undefined,
        adults,
      });
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
    case "aviasales": {
      return buildAviasalesLink({
        origin: originUpper,
        destination: destinationUpper,
        departureDate: departIso,
        returnDate: returnIso || undefined,
        adults,
      });
    }
    case "google": {
      const query = returnIso
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
  { value: "aviasales", label: "Aviasales" },
];

const EXPLORE_PURCHASE_PARTNERS: Array<{ value: PurchasePartner; label: string }> = [
  { value: "kiwi", label: "Kiwi" },
  { value: "aviasales", label: "Aviasales" },
  { value: "klook", label: "Klook" },
];

const SEARCH_PARTNERS_VISIBLE = SEARCH_PURCHASE_PARTNERS;

const EXPLORE_PARTNERS_VISIBLE = EXPLORE_PURCHASE_PARTNERS.filter((partner) => {
  if (partner.value === "klook" && !KLOOK_SEARCH_URL_TEMPLATE.trim()) return false;
  return true;
});

const NEARBY_AIRPORTS: Record<string, string[]> = {
  ATL: ["BHM"],
  BOS: ["PVD"],
  DFW: ["DAL"],
  IAH: ["HOU"],
  JFK: ["LGA", "EWR"],
  LAX: ["BUR", "SNA", "LGB"],
  MIA: ["FLL", "PBI"],
  ORD: ["MDW"],
  SFO: ["OAK", "SJC"],
  SEA: ["BFI"],
};

function nearbyAirports(code: string) {
  return NEARBY_AIRPORTS[code.trim().toUpperCase()] ?? [];
}

export function TicketWizApp({ locale = "en" }: { locale?: Locale }) {
  const copy = COPY[locale] ?? COPY.en;
  const isDev = process.env.NODE_ENV === "development";
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
  const [searchMaxResults, setSearchMaxResults] = useState(20);
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [searchSort, setSearchSort] = useState<OfferSort>("best");
  const [purchasePartner, setPurchasePartner] = useState<PurchasePartner>("kiwi");

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FlightSearchResponse | null>(null);
  const [showAlertPrompt, setShowAlertPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("ticketwiz:search-defaults");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        origin?: string;
        destination?: string;
        departureDate?: string;
        returnDate?: string;
        adults?: number;
        currency?: string;
      };
      if (parsed.origin && /^[A-Za-z]{3}$/.test(parsed.origin)) {
        setOrigin(parsed.origin.toUpperCase());
      }
      if (parsed.destination && /^[A-Za-z]{3}$/.test(parsed.destination)) {
        setDestination(parsed.destination.toUpperCase());
      }
      if (parsed.departureDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.departureDate)) {
        setDepartureDate(parsed.departureDate);
      }
      if (parsed.returnDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.returnDate)) {
        setReturnDate(parsed.returnDate);
      }
      if (typeof parsed.adults === "number" && parsed.adults >= 1 && parsed.adults <= 9) {
        setAdults(parsed.adults);
      }
      if (parsed.currency && /^[A-Za-z]{3}$/.test(parsed.currency)) {
        setCurrency(parsed.currency.toUpperCase());
      }
    } catch {
      // Ignore malformed stored values.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      currency,
    };
    try {
      window.localStorage.setItem("ticketwiz:search-defaults", JSON.stringify(payload));
    } catch {
      // Ignore storage failures (privacy mode, quota).
    }
  }, [origin, destination, departureDate, returnDate, adults, currency]);

  useEffect(() => {
    if (searchResults?.offers?.length) {
      if (!promptDismissed) setShowAlertPrompt(true);
    } else {
      setShowAlertPrompt(false);
    }
  }, [searchResults, promptDismissed]);

  useEffect(() => {
    if (copy.proofQuotes.length <= 1) return;
    const interval = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % copy.proofQuotes.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [copy.proofQuotes.length]);

  const [alertsEmail, setAlertsEmail] = useState("");
  const [alertsStatus, setAlertsStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [alertsMessage, setAlertsMessage] = useState<string | null>(null);
  const [saveSearchEmail, setSaveSearchEmail] = useState("");
  const [saveSearchStatus, setSaveSearchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [saveSearchMessage, setSaveSearchMessage] = useState<string | null>(null);

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

  const flexOffsets = [-3, 0, 3];
  const flexDepartDates = flexOffsets.map((offset) => shiftIsoDate(departureDate, offset));
  const flexReturnDates = returnDate.trim()
    ? flexOffsets.map((offset) => shiftIsoDate(returnDate, offset))
    : [];
  const canShowFlexGrid =
    flexibleDates &&
    departureDate.trim().length === 10 &&
    flexDepartDates.every(Boolean) &&
    (returnDate.trim() === "" || flexReturnDates.every(Boolean));

  const offerView = useMemo(() => {
    const offers = searchResults?.offers ?? [];
    const scored = scoreOffers(offers);
    const prices = offers
      .map((offer) => Number(offer.priceTotal))
      .filter((value) => Number.isFinite(value));
    const durations = offers
      .map((offer) => scored.durations.get(offer.id))
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const stops = offers
      .map((offer) => scored.stops.get(offer.id))
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const avgPrice = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : 0;
    const avgDuration = durations.length
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : 0;
    const avgStops = stops.length ? stops.reduce((sum, value) => sum + value, 0) / stops.length : 0;

    const sorted = [...offers].sort((a, b) => {
      if (searchSort === "cheapest") return byNumericPrice(a, b);
      if (searchSort === "fastest") {
        return (scored.durations.get(a.id) ?? 0) - (scored.durations.get(b.id) ?? 0);
      }
      if (searchSort === "fewest-stops") {
        return (scored.stops.get(a.id) ?? 0) - (scored.stops.get(b.id) ?? 0);
      }
      return (scored.scores.get(b.id) ?? 0) - (scored.scores.get(a.id) ?? 0);
    });

    return {
      offers: sorted,
      ...scored,
      avgPrice,
      avgDuration,
      avgStops,
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

  async function submitAlertSignup() {
    const trimmed = alertsEmail.trim();
    if (!trimmed) {
      setAlertsStatus("error");
      setAlertsMessage(copy.alertsError);
      return;
    }
    setAlertsStatus("loading");
    setAlertsMessage(null);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!response.ok) {
        setAlertsStatus("error");
        setAlertsMessage(copy.alertsError);
        return;
      }
      setAlertsStatus("success");
      setAlertsMessage(copy.alertsSuccess);
      setAlertsEmail("");
    } catch {
      setAlertsStatus("error");
      setAlertsMessage(copy.alertsError);
    }
  }

  async function submitSaveSearch() {
    const trimmed = saveSearchEmail.trim();
    if (!trimmed) {
      setSaveSearchStatus("error");
      setSaveSearchMessage(copy.saveSearchError);
      return;
    }
    setSaveSearchStatus("loading");
    setSaveSearchMessage(null);
    try {
      const response = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          origin,
          destination,
          departureDate,
          returnDate: returnDate || undefined,
          adults,
          currency,
          nonStop,
        }),
      });
      if (!response.ok) {
        setSaveSearchStatus("error");
        setSaveSearchMessage(copy.saveSearchError);
        return;
      }
      setSaveSearchStatus("success");
      setSaveSearchMessage(copy.saveSearchSuccess);
      setSaveSearchEmail("");
    } catch {
      setSaveSearchStatus("error");
      setSaveSearchMessage(copy.saveSearchError);
    }
  }

  async function runSearch(options?: {
    depart?: string;
    returnDate?: string;
    ignoreFlex?: boolean;
    origin?: string;
    destination?: string;
  }) {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const baseOrigin = options?.origin ?? origin;
      const baseDestination = options?.destination ?? destination;
      const baseDepart = options?.depart ?? departureDate;
      const baseReturn = options?.returnDate ?? returnDate;
      const useFlex = flexibleDates && !options?.ignoreFlex;
      const flexDepart = useFlex
        ? new Date(new Date(baseDepart).getTime() - 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
        : baseDepart;
      const flexReturn = useFlex
        ? baseReturn.trim()
          ? new Date(new Date(baseReturn).getTime() + 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10)
          : ""
        : baseReturn.trim();
      const params = new URLSearchParams({
        origin: baseOrigin,
        destination: baseDestination,
        departureDate: flexDepart,
        adults: String(adults),
        currency,
        max: String(searchMaxResults),
        nonStop: String(nonStop),
      });
      if (flexReturn) params.set("returnDate", flexReturn);

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

  async function shareDealLink(url: string | null) {
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ticket Wiz deal", url });
        return;
      }
    } catch {
      // Fallback to clipboard.
    }
    try {
      await navigator.clipboard.writeText(url);
      setSearchError("Link copied to clipboard.");
    } catch {
      setSearchError("Could not copy link.");
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
        <header className="fixed top-0 z-20 w-full border-b border-[var(--brand-border)]/80 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <nav
              className="hidden items-center gap-4 text-xs font-semibold text-[var(--brand-primary)] sm:flex"
              aria-label="Primary"
            >
              <a href="#search" className="hover:underline">
                {copy.tabSearch}
              </a>
              <a href="#explore" className="hover:underline">
                {copy.tabExplore}
              </a>
              <a href="#contact" className="hover:underline">
                {copy.contactLabel}
              </a>
            </nav>
            <div className="text-sm font-semibold text-[var(--brand-ink)]">Ticket Wiz</div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#363535]">
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
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-10">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="w-full">
              <div className="inline-flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full bg-white/80 ring-1 ring-[#D9E2EA]">
                <Image
                  src="/ticket-wiz-logo.png"
                  alt="Ticket Wiz logo"
                  width={160}
                  height={160}
                  priority
                  unoptimized={isDev}
                  className="h-full w-full object-contain scale-105"
                />
              </div>
              <div className="mt-2 text-xs font-medium text-white/80">
                Ticket Wiz <span className="text-white/60">•</span> Flight deals finder
              </div>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {copy.heroTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-pretty text-[13px] font-semibold leading-5 text-white/90">
                {copy.heroSubtitle}
                <br />
                {copy.heroSubtitleNote}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="grid gap-3 rounded-2xl bg-white/85 p-4 text-xs text-[#000034] shadow-md ring-1 ring-[#D9E2EA]">
                  <div className="text-sm font-semibold text-[#0F386E]">{copy.whyTitle}</div>
                  <ul className="grid gap-1 text-[12px] text-[#363535]">
                    {copy.whyItems.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[#0F386E]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 rounded-2xl bg-white/85 p-4 text-xs text-[#000034] shadow-md ring-1 ring-[#D9E2EA]">
                  <div className="text-sm font-semibold text-[#0F386E]">{copy.alertsTitle}</div>
                  <div className="text-[12px] text-[#363535]">{copy.alertsSubtitle}</div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="email"
                      placeholder={copy.alertsPlaceholder}
                      aria-label={copy.alertsTitle}
                      value={alertsEmail}
                      onChange={(event) => {
                        setAlertsEmail(event.target.value);
                        if (alertsStatus !== "idle") {
                          setAlertsStatus("idle");
                          setAlertsMessage(null);
                        }
                      }}
                      className="h-9 flex-1 rounded-xl border border-[#C2D1DF] bg-white px-3 text-xs text-[#363535] outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                    <button
                      type="button"
                      onClick={submitAlertSignup}
                      disabled={alertsStatus === "loading"}
                      className="h-9 rounded-xl bg-[#0F386E] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#1D4F91] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {alertsStatus === "loading" ? copy.alertsSaving : copy.alertsCta}
                    </button>
                  </div>
                  {alertsMessage ? (
                    <div
                      className={`text-[11px] ${
                        alertsStatus === "success" ? "text-[#006A52]" : "text-[#B42318]"
                      }`}
                      role="status"
                    >
                      {alertsMessage}
                    </div>
                  ) : null}
                  <div className="text-[10px] text-[#69707a]">
                    We only send a few emails a month. Unsubscribe anytime.
                  </div>
                </div>
                <div className="grid gap-2 rounded-2xl bg-white/85 p-4 text-xs text-[#000034] shadow-md ring-1 ring-[#D9E2EA]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0F386E]">
                    <Image
                      src="/badge.png"
                      alt="Partner badge"
                      width={36}
                      height={36}
                      unoptimized={isDev}
                      className="h-8 w-8 object-contain"
                    />
                    {copy.trustTitle}
                  </div>
                  <div className="text-[12px] text-[#363535]">{copy.trustNote}</div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#1D4F91]">
                    {["Amadeus", "Kiwi", "Aviasales"].map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-[#D9E2EA] bg-white px-3 py-1"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 rounded-2xl bg-white/85 p-4 text-xs text-[#000034] shadow-md ring-1 ring-[#D9E2EA]">
                <div className="text-sm font-semibold text-[#0F386E]">{copy.proofTitle}</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {copy.proofStats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[#D9E2EA] bg-white p-3">
                      <div className="flex items-center gap-1 text-lg font-semibold text-[#000034]">
                        {stat.value === "4.8/5" ? <span className="text-[#F4B400]">★</span> : null}
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-[#69707a]">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(copy.proofQuotes.length <= 1
                    ? copy.proofQuotes
                    : [
                        copy.proofQuotes[quoteIndex % copy.proofQuotes.length],
                        copy.proofQuotes[(quoteIndex + 1) % copy.proofQuotes.length],
                      ]
                  ).map((item) => (
                    <div key={item.quote} className="rounded-xl border border-[#D9E2EA] bg-white p-3">
                      <div className="text-[12px] text-[#363535]">“{item.quote}”</div>
                      <div className="mt-2 text-[11px] font-semibold text-[#1D4F91]">
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 text-right text-xs text-[#363535] lg:mt-[200px]" />
          </div>

          <div className="mt-8 grid gap-4">
            <div className="text-sm font-semibold text-white">{copy.galleryTitle}</div>
            <div className="text-xs font-semibold text-white/80">{copy.gallerySubtitle}</div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { src: "/Miami.jpg", label: "Miami" },
                { src: "/New-York.jpg", label: "New York" },
                { src: "/Los-Angeles.jpg", label: "Los Angeles" },
              ].map((card) => (
                <div
                  key={card.src}
                  className="group relative h-56 overflow-hidden rounded-2xl border border-white/20 shadow-lg"
                >
                  <Image
                    src={card.src}
                    alt={card.label}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    unoptimized={isDev}
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000034]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 text-xs font-semibold text-white">
                    {card.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl bg-white/85 p-5 text-xs text-[#000034] shadow-md ring-1 ring-[#D9E2EA]">
            <div className="text-sm font-semibold text-[#0F386E]">{copy.howItWorksTitle}</div>
            <div className="grid gap-4 sm:grid-cols-3">
              {copy.howItWorksSteps.map((step) => (
                <div key={step.title} className="rounded-xl border border-[#D9E2EA] bg-white p-3">
                  <div className="text-sm font-semibold text-[#000034]">{step.title}</div>
                  <div className="mt-1 text-[12px] text-[#363535]">{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 inline-flex w-full justify-between rounded-xl bg-[#F2F6FA] p-1 shadow-md ring-2 ring-[#B6C6D6] sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("search")}
              className={[
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ring-1 ring-transparent sm:flex-none",
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
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ring-1 ring-transparent sm:flex-none",
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
          <section
            id="search"
            className="-mt-6 grid items-start gap-6 scroll-mt-20 lg:grid-cols-[420px_1fr]"
          >
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
                <fieldset className="grid gap-4 rounded-xl border border-[#D9E2EA] bg-[#F7FAFE] p-4 lg:grid-cols-2">
                  <legend className="px-2 text-[11px] font-semibold text-[#1D4F91]">
                    From / To
                  </legend>
                  <AirportPicker
                    label={copy.origin}
                    value={origin}
                    onChange={setOrigin}
                    exclude={destination}
                    labels={airportLabels}
                  />
                  <AirportPicker
                    label={copy.destination}
                    value={destination}
                    onChange={setDestination}
                    exclude={origin}
                    labels={airportLabels}
                  />
                </fieldset>

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
                    {copy.maxResults}
                    <select
                      value={searchMaxResults}
                      onChange={(e) => setSearchMaxResults(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm text-[#363535] outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    >
                      {[10, 20, 30, 40, 50].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
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
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={flexibleDates}
                      onChange={(e) => setFlexibleDates(e.target.checked)}
                      className="h-4 w-4 accent-[#006A52]"
                    />
                    <span className="text-sm text-[#363535]">{copy.flexibleDates}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] px-4 text-sm font-semibold text-white shadow-md transition hover:from-[var(--brand-primary)] hover:to-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searchLoading ? copy.searching : copy.findDeals}
                </button>

                {searchError ? (
                  <div
                    className="rounded-xl border border-[#F5CFB3] bg-[#FBE9DC] px-3 py-2 text-xs text-[#D57800]"
                    role="status"
                    aria-live="polite"
                  >
                    {searchError}
                  </div>
                ) : null}
              {showAlertPrompt ? (
                <div className="mt-2 grid gap-2 rounded-xl border border-[#D9E2EA] bg-[#F7FAFE] p-3 text-xs text-[#363535]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-[#0F386E]">
                      {copy.alertPromptTitle}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAlertPrompt(false);
                        setPromptDismissed(true);
                      }}
                      className="rounded-full border border-[#D9E2EA] px-2 py-0.5 text-[10px] font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="text-[11px]">{copy.alertPromptNote}</div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="email"
                      placeholder={copy.saveSearchPlaceholder}
                      aria-label={copy.alertPromptTitle}
                      value={saveSearchEmail}
                      onChange={(event) => {
                        setSaveSearchEmail(event.target.value);
                        if (saveSearchStatus !== "idle") {
                          setSaveSearchStatus("idle");
                          setSaveSearchMessage(null);
                        }
                      }}
                      className="h-9 flex-1 rounded-xl border border-[#C2D1DF] bg-white px-3 text-xs text-[#363535] outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                    <button
                      type="button"
                      onClick={submitSaveSearch}
                      disabled={saveSearchStatus === "loading"}
                      className="h-9 rounded-xl bg-[#0F386E] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#1D4F91] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saveSearchStatus === "loading" ? copy.saveSearchSaving : copy.alertPromptCta}
                    </button>
                  </div>
                  {saveSearchMessage ? (
                    <div
                      className={`text-[11px] ${
                        saveSearchStatus === "success" ? "text-[#006A52]" : "text-[#B42318]"
                      }`}
                      role="status"
                    >
                      {saveSearchMessage}
                    </div>
                  ) : null}
                </div>
              ) : null}
                <div className="mt-2 grid gap-2 rounded-xl border border-[#D9E2EA] bg-[#F7FAFE] p-3 text-xs text-[#363535]">
                  <div className="text-xs font-semibold text-[#0F386E]">{copy.saveSearchTitle}</div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="email"
                      placeholder={copy.saveSearchPlaceholder}
                      aria-label={copy.saveSearchTitle}
                      value={saveSearchEmail}
                      onChange={(event) => {
                        setSaveSearchEmail(event.target.value);
                        if (saveSearchStatus !== "idle") {
                          setSaveSearchStatus("idle");
                          setSaveSearchMessage(null);
                        }
                      }}
                      className="h-9 flex-1 rounded-xl border border-[#C2D1DF] bg-white px-3 text-xs text-[#363535] outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
                    />
                    <button
                      type="button"
                      onClick={submitSaveSearch}
                      disabled={saveSearchStatus === "loading"}
                      className="h-9 rounded-xl bg-[#0F386E] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#1D4F91] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saveSearchStatus === "loading" ? copy.saveSearchSaving : copy.saveSearchCta}
                    </button>
                  </div>
                  {saveSearchMessage ? (
                    <div
                      className={`text-[11px] ${
                        saveSearchStatus === "success" ? "text-[#006A52]" : "text-[#B42318]"
                      }`}
                      role="status"
                    >
                      {saveSearchMessage}
                    </div>
                  ) : null}
                </div>
                {canShowFlexGrid ? (
                  <div className="mt-2 grid gap-2 rounded-xl border border-[#D9E2EA] bg-[#F7FAFE] p-3 text-xs text-[#363535]">
                    <div className="text-xs font-semibold text-[#0F386E]">{copy.flexGridTitle}</div>
                    <div className="text-[11px]">{copy.flexGridNote}</div>
                    {returnDate.trim() ? (
                      <div className="mt-1 grid gap-2">
                        {flexReturnDates.map((retDate) => (
                          <div key={retDate} className="grid grid-cols-3 gap-2">
                            {flexDepartDates.map((depDate) => {
                              const isActive = depDate === departureDate && retDate === returnDate;
                              return (
                                <button
                                  key={`${depDate}-${retDate}`}
                                  type="button"
                                  onClick={() => {
                                    setDepartureDate(depDate);
                                    setReturnDate(retDate);
                                    void runSearch({
                                      depart: depDate,
                                      returnDate: retDate,
                                      ignoreFlex: true,
                                    });
                                  }}
                                  className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                                    isActive
                                      ? "border-[#1D4F91] bg-white text-[#1D4F91]"
                                      : "border-[#D9E2EA] bg-white text-[#363535] hover:border-[#1D4F91]"
                                  }`}
                                >
                                  {formatShortDate(depDate)} → {formatShortDate(retDate)}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 grid grid-cols-3 gap-2">
                        {flexDepartDates.map((depDate) => {
                          const isActive = depDate === departureDate;
                          return (
                            <button
                              key={depDate}
                              type="button"
                              onClick={() => {
                                setDepartureDate(depDate);
                                void runSearch({ depart: depDate, returnDate: "", ignoreFlex: true });
                              }}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                                isActive
                                  ? "border-[#1D4F91] bg-white text-[#1D4F91]"
                                  : "border-[#D9E2EA] bg-white text-[#363535] hover:border-[#1D4F91]"
                              }`}
                            >
                              {formatShortDate(depDate)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="rounded-2xl border border-[#B6C6D6] bg-white p-5 shadow-lg ring-2 ring-[#B6C6D6]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{copy.results}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#0F386E]">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { value: "best" as OfferSort, label: copy.sortBestValue },
                      { value: "cheapest" as OfferSort, label: copy.sortCheapest },
                      { value: "fastest" as OfferSort, label: copy.sortFastest },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSearchSort(preset.value)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                          searchSort === preset.value
                            ? "border-[#1D4F91] bg-[#E8EFF7] text-[#1D4F91]"
                            : "border-[#C9D8EA] bg-white text-[#0F386E] hover:border-[#1D4F91]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
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
                    {SEARCH_PARTNERS_VISIBLE.map((partner) => (
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
                        {copy.airline}: {airlineName(bestOffer.validatingAirlineCodes[0] ?? "") || "—"}
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
                    {searchResults ? (
                      <div className="grid gap-3">
                        <span>{copy.noResults}</span>
                        <div className="text-xs font-semibold text-[#1D4F91]">
                          {copy.noResultsHelpTitle}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {nonStop ? (
                            <button
                              type="button"
                              onClick={() => {
                                setNonStop(false);
                                void runSearch({ ignoreFlex: true });
                              }}
                              className="rounded-full border border-[#C9D8EA] bg-white px-3 py-1 font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                            >
                              {copy.tryDisableNonstop}
                            </button>
                          ) : null}
                          {!flexibleDates ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFlexibleDates(true);
                                void runSearch();
                              }}
                              className="rounded-full border border-[#C9D8EA] bg-white px-3 py-1 font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                            >
                              {copy.tryEnableFlexible}
                            </button>
                          ) : null}
                        </div>
                        {departureDate ? (
                          <div className="grid gap-2 text-xs">
                            <div className="font-semibold text-[#0F386E]">
                              {copy.tryDifferentDates}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const earlierDepart = shiftIsoDate(departureDate, -3);
                                const laterDepart = shiftIsoDate(departureDate, 3);
                                const earlierReturn = returnDate
                                  ? shiftIsoDate(returnDate, -3)
                                  : "";
                                const laterReturn = returnDate ? shiftIsoDate(returnDate, 3) : "";
                                return [
                                  { depart: earlierDepart, ret: earlierReturn },
                                  { depart: laterDepart, ret: laterReturn },
                                ].map((pair) => (
                                  <button
                                    key={`${pair.depart}-${pair.ret}`}
                                    type="button"
                                    onClick={() => {
                                      setDepartureDate(pair.depart);
                                      setReturnDate(pair.ret);
                                      void runSearch({
                                        depart: pair.depart,
                                        returnDate: pair.ret,
                                        ignoreFlex: true,
                                      });
                                    }}
                                    className="rounded-full border border-[#C9D8EA] bg-white px-3 py-1 font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                                  >
                                    {formatShortDate(pair.depart)}
                                    {pair.ret ? ` → ${formatShortDate(pair.ret)}` : ""}
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        ) : null}
                        {nearbyAirports(origin).length > 0 ? (
                          <div className="grid gap-2 text-xs">
                            <div className="font-semibold text-[#0F386E]">
                              {copy.tryNearbyOrigin}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {nearbyAirports(origin).map((alt) => (
                                <button
                                  key={alt}
                                  type="button"
                                  onClick={() => {
                                    setOrigin(alt);
                                    void runSearch({ origin: alt, ignoreFlex: true });
                                  }}
                                  className="rounded-full border border-[#C9D8EA] bg-white px-3 py-1 font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {nearbyAirports(destination).length > 0 ? (
                          <div className="grid gap-2 text-xs">
                            <div className="font-semibold text-[#0F386E]">
                              {copy.tryNearbyDestination}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {nearbyAirports(destination).map((alt) => (
                                <button
                                  key={alt}
                                  type="button"
                                  onClick={() => {
                                    setDestination(alt);
                                    void runSearch({ destination: alt, ignoreFlex: true });
                                  }}
                                  className="rounded-full border border-[#C9D8EA] bg-white px-3 py-1 font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      copy.runSearchToSee
                    )}
                  </div>
                ) : null}

                {offerView.offers.map((offer) => {
                  const score = offerView.scores.get(offer.id);
                  const badge = dealBadge(score, copy);
                  const warning = warningBadge(offerView.outliers.get(offer.id), copy);
                  const duration = offerView.durations.get(offer.id);
                  const stops = offerView.stops.get(offer.id);
                  const priceValue = Number(offer.priceTotal);
                  const trend = priceTrend(priceValue, offerView.avgPrice, copy);
                  const isBest = badge?.label === copy.dealBest;
                  const avgPrice = offerView.avgPrice;
                  const avgDuration = offerView.avgDuration;
                  const avgStops = offerView.avgStops;
                  const avgStopsLabel = Number.isFinite(avgStops)
                    ? String(Number(avgStops.toFixed(1)).toString())
                    : "—";
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
                            <span className={`relative inline-flex group`}>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.tone}`}
                              >
                                {badge.label}
                              </span>
                              {isBest && Number.isFinite(avgPrice) && avgPrice > 0 ? (
                                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg bg-[#000034] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                  <span className="block font-semibold text-white">
                                    Why it&apos;s best
                                  </span>
                                  <span className="block text-white/80">
                                    Price: {formatMoney(offer.currency, offer.priceTotal)} vs avg{" "}
                                    {formatMoney(offer.currency, String(avgPrice))}
                                  </span>
                                  <span className="block text-white/80">
                                    Duration: {formatDurationMinutes(duration)} vs avg{" "}
                                    {formatDurationMinutes(avgDuration)}
                                  </span>
                                  <span className="block text-white/80">
                                    Stops: {typeof stops === "number" ? stops : "—"} vs avg{" "}
                                    {avgStopsLabel}
                                  </span>
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                          {trend ? (
                            <span
                              title={
                                locale === "es"
                                  ? "Comparado con el precio promedio de esta búsqueda"
                                  : "Compared to the average price in this search"
                              }
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${trend.tone}`}
                            >
                              {trend.label}
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
                          {airlines.length ? airlines.map(airlineName).join(", ") : "—"}
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
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-white/90 px-2 py-2 shadow-sm ring-1 ring-[#E4ECF3] backdrop-blur-sm sm:static sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:ring-0 sticky bottom-3 z-10">
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
                      {purchaseUrl ? (
                        <button
                          type="button"
                          onClick={() => void shareDealLink(purchaseUrl)}
                          className="inline-flex h-8 items-center rounded-lg border border-[#C9D8EA] bg-white px-3 text-xs font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                        >
                          {copy.shareDeal}
                        </button>
                      ) : null}
                      <span className="text-[10px] font-semibold text-[#69707a]">
                        Prices can change fast.
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section
            id="explore"
            className="-mt-6 grid items-start gap-6 scroll-mt-20 lg:grid-cols-[420px_1fr]"
          >
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
                    <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] text-[#000034]">
                      {copy.maxPrice}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={exploreMaxPrice}
                      onChange={(e) => setExploreMaxPrice(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[#C2D1DF] bg-[#F7FAFE] px-3 pt-3 pb-1 text-sm outline-none focus:border-[#1D4F91] focus:ring-2 focus:ring-[#C9D8EA]"
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
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] px-4 text-sm font-semibold text-white shadow-md transition hover:from-[var(--brand-primary)] hover:to-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exploreLoading ? copy.exploring : copy.findDeals}
                </button>

                {exploreError ? (
                  <div
                    className="rounded-xl border border-[#F5CFB3] bg-[#FBE9DC] px-3 py-2 text-xs text-[#D57800]"
                    role="status"
                    aria-live="polite"
                  >
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
                  const klookUrl = buildKlookSearchUrl(airportSearchQuery(deal.destination));
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
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white/90 px-2 py-2 shadow-sm ring-1 ring-[#E4ECF3] backdrop-blur-sm sm:static sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:ring-0 sticky bottom-3 z-10">
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
                      {purchaseUrl ? (
                        <button
                          type="button"
                          onClick={() => void shareDealLink(purchaseUrl)}
                          className="inline-flex h-8 items-center rounded-lg border border-[#C9D8EA] bg-white px-3 text-xs font-semibold text-[#1D4F91] hover:border-[#1D4F91]"
                        >
                          {copy.shareDeal}
                        </button>
                      ) : null}
                      <span className="text-[10px] font-semibold text-[#69707a]">
                        Prices can change fast.
                      </span>
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
        <div
          className="mt-10 text-center text-xs font-semibold text-white/80 scroll-mt-20"
          id="contact"
        >
          {copy.contactLabel}:{" "}
          <a className="underline" href="mailto:info@ticket-wiz.com">
            info@ticket-wiz.com
          </a>
        </div>
        <div className="mt-6 flex w-full justify-center">
          <div className="grid w-full max-w-md gap-3 rounded-2xl bg-white/10 p-4 text-center text-xs text-white/90 ring-1 ring-white/20">
            <div className="text-sm font-semibold text-white">FAQ</div>
            <div>
              <div className="font-semibold">How do you find deals?</div>
              <div className="text-white/80">
                We compare price, duration, and stops, then rank options by a deal score.
              </div>
            </div>
            <div>
              <div className="font-semibold">Do you sell tickets?</div>
              <div className="text-white/80">
                No. We send you to partner sites to complete booking.
              </div>
            </div>
            <div>
              <div className="font-semibold">Are prices final?</div>
              <div className="text-white/80">
                Prices can change fast. Always confirm the final fare on the booking site.
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center text-xs font-semibold text-white/80">
          Powered by Amadeus
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-white/80">
          {["Amadeus", "Kiwi", "Aviasales"].map((name) => (
            <span
              key={name}
              className="rounded-full border border-white/40 bg-white/10 px-3 py-1"
            >
              {name}
            </span>
          ))}
        </div>
        <LegalLinksModal
          locale={locale}
          className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-white/80"
        />
        <div className="mt-4 text-center text-[11px] text-white/70">
          Affiliate disclosure: We may earn a commission when you book through partner links.
        </div>
        <div className="mt-2 text-center text-[11px] text-white/70">
          © {new Date().getFullYear()} Ticket Wiz. All rights reserved.
        </div>
      </main>
    </div>
  );
}

