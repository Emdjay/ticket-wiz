"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ExploreResponse, FlightSearchResponse } from "@/lib/flights";
import { median, parseIsoDurationToMinutes, scoreOffers } from "@/lib/dealScore";
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

type SavedAlert = {
  id: string;
  email: string;
  origin: string;
  destination: string;
  createdAt: string;
};

type RecentSearch = {
  origin: string;
  destination: string;
  depart: string;
  returnDate?: string;
};

type WeeklyDeal = {
  origin: string;
  destination: string;
  price: string;
  currency: string;
  score: number;
  durationMinutes: number;
  stops: number;
};

type ManagedAlert = {
  id: number;
  email: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  adults: number;
  currency: string;
  non_stop: boolean;
  paused: boolean;
  frequency: "daily" | "weekly" | "biweekly";
  last_sent_at: string | null;
};

type PurchasePartner =
  | "skyscanner"
  | "kayak"
  | "kiwi"
  | "google"
  | "airline"
  | "klook"
  | "aviasales";

const KLOOK_SEARCH_URL_TEMPLATE = PARTNER_ENV.KLOOK_SEARCH_URL_TEMPLATE;
const SHOW_EXPLORE_LINKS =
  (process.env.NEXT_PUBLIC_SHOW_LINKS ?? "").trim().toLowerCase() === "true";

const COPY = {
  en: {
    heroTitle: "Find the best airline deals fast.",
    heroSubtitle: "Start with a direct search, or explore destinations by budget.",
    heroSubtitleNote: "(Prices vary by route, date, and availability.)",
    weeklyBannerLabel: "Top deal this week",
    weeklyBannerCta: "Load this route",
    weeklyBannerFallback: "Curated weekly deal, updated hourly.",
    trustRow: "Scored for value • Updated weekly • Powered by Amadeus",
    whyTitle: "Why Ticket Wiz?",
    whyItems: [
      "Compare near-real-time fares from Amadeus in seconds.",
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
    searchPrompt: "Enter your route below to begin.",
    locationCta: "Use my location",
    locationFinding: "Finding a nearby airport…",
    locationSuccess: "Origin set to ",
    locationError: "Couldn’t access location.",
    datePlaceholder: "MM/DD/YYYY",
    flexRangeLabel: "Flexible range (days)",
    sampleRoutesTitle: "Try a sample route",
    demoDealsTitle: "Demo results",
    demoDeals: [
      {
        route: "MIA → JFK",
        priceTotal: "168",
        currency: "USD",
        durationMinutes: 185,
        stops: 0,
        score: 0.9,
      },
      {
        route: "LAX → LAS",
        priceTotal: "112",
        currency: "USD",
        durationMinutes: 80,
        stops: 0,
        score: 0.86,
      },
      {
        route: "ORD → SEA",
        priceTotal: "229",
        currency: "USD",
        durationMinutes: 320,
        stops: 1,
        score: 0.63,
      },
    ],
    sampleRoutes: [
      { origin: "MIA", destination: "JFK", label: "Miami → New York" },
      { origin: "LAX", destination: "LAS", label: "Los Angeles → Las Vegas" },
      { origin: "CHI", destination: "MCO", label: "Chicago → Orlando" },
    ],
    exploreTitle: "Explore destinations",
    exploreNote: "Browse destination ideas by budget and nonstop preference.",
    monthlyPicksTitle: "Curated picks by month",
    monthlyPicks: [
      { month: "Jan", routes: ["MIA → BOG", "LAX → SJD"] },
      { month: "Feb", routes: ["JFK → MAD", "ORD → MEX"] },
      { month: "Mar", routes: ["SEA → HNL", "ATL → PUJ"] },
      { month: "Apr", routes: ["BOS → LIS", "DFW → CUN"] },
    ],
    topCheapestTitle: "Top 5 cheapest this week",
    exploreMonthTitle: "Deals by month",
    exploreMonthPresets: {
      any: "Anytime",
      thisMonth: "This month",
      nextMonth: "Next month",
      next3Months: "Next 3 months",
    },
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
    priceSourceDisclaimer: "Prices shown from {partner}; final total set on partner site.",
    priceChangeBanner: "Price may change on partner site.",
    lastUpdatedLabel: "Last updated",
    estTotalLabel: "Est. total + fees",
    whyBestValue: "Why this is best value",
    whyThisOffer: "Why this offer",
    recentSearches: "Recent searches",
    swapRoute: "Swap origin/destination",
    clearAllFilters: "Clear all",
    bestMonthsLabel: "Best months",
    seasonalityValue: "Value month",
    seasonalityShoulder: "Shoulder season",
    seasonalityPeak: "Peak season",
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    destinationsLabel: "destinations",
    sort: "Sort",
    bestDeal: "Best deal",
    cheapest: "Cheapest",
    fastest: "Fastest",
    fewestStops: "Fewest stops",
    sortBestValueTip: "Balances price, duration, and stops.",
    sortCheapestTip: "Lowest total fare.",
    sortFastestTip: "Shortest total travel time.",
    sortFewestStopsTip: "Lowest number of stops.",
    maxStopsLabel: "Max stops",
    maxStopsAny: "Any",
    maxStopsNonstop: "Nonstop",
    maxStopsOne: "Up to 1",
    maxStopsTwo: "Up to 2",
    priceCeiling: "Price ceiling",
    durationCeiling: "Duration ceiling (hrs)",
    airlineFilter: "Airline filter",
    airlineAny: "Any airline",
    avoidRedeye: "Avoid redeye",
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
    dealScoreTooltip:
      "Score based on price (60%), duration (25%), and stops (15%), normalized to this search.",
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
    saveSearchNote: "Get weekly alerts for this route.",
    saveSearchCta: "Save search",
    saveSearchPlaceholder: "you@email.com",
    saveSearchSuccess: "Alert set—check your email!",
    saveSearchError: "Enter a valid email to save.",
    saveSearchSaving: "Saving...",
    alertsManageTitle: "Manage alerts",
    alertsManageNote: "Load alerts by email to edit, pause, or delete.",
    alertsManageEmpty: "No saved alerts yet.",
    alertsManageRemove: "Remove",
    alertsManagePartner: "Booking links open on",
    alertsManageEmailPlaceholder: "you@email.com",
    alertsManageLoad: "Load alerts",
    alertsManagePause: "Pause",
    alertsManagePauseAll: "Pause all",
    alertsManageFrequency: "Frequency",
    alertsManageDaily: "Daily",
    alertsManageWeekly: "Weekly",
    alertsManageBiweekly: "Every 2 weeks",
    noResultsForFilters: "No offers match your filters yet.",
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
    faqTitle: "FAQ",
    faqItems: [
      {
        question: "How do you find deals?",
        answer: "We compare price, duration, and stops, then rank options by a deal score.",
      },
      {
        question: "Do you sell tickets?",
        answer: "No. We send you to partner sites to complete booking.",
      },
      {
        question: "Are prices final?",
        answer: "Prices can change fast. Always confirm the final fare on the booking site.",
      },
    ],
    poweredBy: "Powered by Amadeus",
    affiliateDisclosure:
      "Affiliate disclosure: We may earn a commission when you book through partner links.",
    rightsReserved: "All rights reserved.",
  },
  es: {
    heroTitle: "Encuentra las mejores ofertas de vuelos rápido.",
    heroSubtitle: "Empieza con una búsqueda directa o explora destinos por presupuesto.",
    heroSubtitleNote: "(Los precios varían según ruta, fecha y disponibilidad.)",
    weeklyBannerLabel: "Mejor oferta de la semana",
    weeklyBannerCta: "Cargar esta ruta",
    weeklyBannerFallback: "Oferta curada semanalmente, actualizada cada hora.",
    trustRow: "Puntaje por valor • Actualizado semanalmente • Powered by Amadeus",
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
    searchPrompt: "Ingresa tu ruta para comenzar.",
    locationCta: "Usar mi ubicación",
    locationFinding: "Buscando un aeropuerto cercano…",
    locationSuccess: "Origen establecido: ",
    locationError: "No pudimos acceder a tu ubicación.",
    datePlaceholder: "DD/MM/AAAA",
    flexRangeLabel: "Rango flexible (días)",
    sampleRoutesTitle: "Prueba una ruta sugerida",
    demoDealsTitle: "Resultados demo",
    demoDeals: [
      {
        route: "MIA → JFK",
        priceTotal: "168",
        currency: "USD",
        durationMinutes: 185,
        stops: 0,
        score: 0.9,
      },
      {
        route: "LAX → LAS",
        priceTotal: "112",
        currency: "USD",
        durationMinutes: 80,
        stops: 0,
        score: 0.86,
      },
      {
        route: "ORD → SEA",
        priceTotal: "229",
        currency: "USD",
        durationMinutes: 320,
        stops: 1,
        score: 0.63,
      },
    ],
    sampleRoutes: [
      { origin: "MIA", destination: "JFK", label: "Miami → Nueva York" },
      { origin: "LAX", destination: "LAS", label: "Los Ángeles → Las Vegas" },
      { origin: "CHI", destination: "MCO", label: "Chicago → Orlando" },
    ],
    exploreTitle: "Explorar destinos",
    exploreNote: "Explora destinos por presupuesto y preferencias de escalas.",
    monthlyPicksTitle: "Picks curados por mes",
    monthlyPicks: [
      { month: "Ene", routes: ["MIA → BOG", "LAX → SJD"] },
      { month: "Feb", routes: ["JFK → MAD", "ORD → MEX"] },
      { month: "Mar", routes: ["SEA → HNL", "ATL → PUJ"] },
      { month: "Abr", routes: ["BOS → LIS", "DFW → CUN"] },
    ],
    topCheapestTitle: "Top 5 más baratos de la semana",
    exploreMonthTitle: "Ofertas por mes",
    exploreMonthPresets: {
      any: "Cualquier mes",
      thisMonth: "Este mes",
      nextMonth: "Próximo mes",
      next3Months: "Próximos 3 meses",
    },
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
    priceSourceDisclaimer:
      "Precios mostrados desde {partner}; el total final se confirma en el sitio del socio.",
    priceChangeBanner: "El precio puede cambiar en el sitio del socio.",
    lastUpdatedLabel: "Última actualización",
    estTotalLabel: "Total estimado + tarifas",
    whyBestValue: "Por qué es la mejor opción",
    whyThisOffer: "Por qué esta oferta",
    recentSearches: "Búsquedas recientes",
    swapRoute: "Cambiar origen/destino",
    clearAllFilters: "Limpiar todo",
    bestMonthsLabel: "Mejores meses",
    seasonalityValue: "Mes con mejor precio",
    seasonalityShoulder: "Temporada media",
    seasonalityPeak: "Temporada alta",
    monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    destinationsLabel: "destinos",
    sort: "Ordenar",
    bestDeal: "Mejor oferta",
    cheapest: "Más barato",
    fastest: "Más rápido",
    fewestStops: "Menos escalas",
    sortBestValueTip: "Equilibra precio, duración y escalas.",
    sortCheapestTip: "Tarifa total más baja.",
    sortFastestTip: "Menor tiempo de viaje.",
    sortFewestStopsTip: "Menor número de escalas.",
    maxStopsLabel: "Máx. escalas",
    maxStopsAny: "Cualquiera",
    maxStopsNonstop: "Sin escalas",
    maxStopsOne: "Hasta 1",
    maxStopsTwo: "Hasta 2",
    priceCeiling: "Tope de precio",
    durationCeiling: "Tope de duración (hrs)",
    airlineFilter: "Filtro de aerolínea",
    airlineAny: "Cualquier aerolínea",
    avoidRedeye: "Evitar vuelos nocturnos",
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
    dealScoreTooltip:
      "Puntaje según precio (60%), duración (25%) y escalas (15%), normalizado a esta búsqueda.",
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
    saveSearchNote: "Recibe alertas semanales de esta ruta.",
    saveSearchCta: "Guardar",
    saveSearchPlaceholder: "tu@email.com",
    saveSearchSuccess: "Alerta activada—revisa tu correo.",
    saveSearchError: "Ingresa un correo válido para guardar.",
    saveSearchSaving: "Guardando...",
    alertsManageTitle: "Administrar alertas",
    alertsManageNote: "Carga alertas por email para editar o pausar.",
    alertsManageEmpty: "Aún no hay alertas guardadas.",
    alertsManageRemove: "Eliminar",
    alertsManagePartner: "Los enlaces de compra abren en",
    alertsManageEmailPlaceholder: "tu@email.com",
    alertsManageLoad: "Cargar alertas",
    alertsManagePause: "Pausar",
    alertsManagePauseAll: "Pausar todas",
    alertsManageFrequency: "Frecuencia",
    alertsManageDaily: "Diario",
    alertsManageWeekly: "Semanal",
    alertsManageBiweekly: "Cada 2 semanas",
    noResultsForFilters: "No hay ofertas que coincidan con tus filtros.",
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
    faqTitle: "Preguntas frecuentes",
    faqItems: [
      {
        question: "¿Cómo encuentran ofertas?",
        answer: "Comparamos precio, duración y escalas, y ordenamos por un puntaje de oferta.",
      },
      {
        question: "¿Venden boletos?",
        answer: "No. Te enviamos a sitios asociados para completar la reserva.",
      },
      {
        question: "¿Los precios son finales?",
        answer:
          "Los precios pueden cambiar rápido. Confirma el precio final en el sitio de reserva.",
      },
    ],
    poweredBy: "Con tecnología de Amadeus",
    affiliateDisclosure:
      "Aviso de afiliados: Podemos ganar una comisión cuando reservas con enlaces asociados.",
    rightsReserved: "Todos los derechos reservados.",
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

type AirportCoords = { lat: number; lon: number };

const AIRPORT_COORDS: Record<string, AirportCoords> = {
  ATL: { lat: 33.6407, lon: -84.4277 },
  BOS: { lat: 42.3656, lon: -71.0096 },
  CLT: { lat: 35.2144, lon: -80.9473 },
  DCA: { lat: 38.8512, lon: -77.0402 },
  DEN: { lat: 39.8561, lon: -104.6737 },
  DFW: { lat: 32.8998, lon: -97.0403 },
  EWR: { lat: 40.6895, lon: -74.1745 },
  IAD: { lat: 38.9531, lon: -77.4565 },
  IAH: { lat: 29.9902, lon: -95.3368 },
  JFK: { lat: 40.6413, lon: -73.7781 },
  LAS: { lat: 36.084, lon: -115.1537 },
  LAX: { lat: 33.9416, lon: -118.4085 },
  LGA: { lat: 40.7769, lon: -73.874 },
  MCO: { lat: 28.4312, lon: -81.3081 },
  MIA: { lat: 25.7959, lon: -80.2871 },
  MSP: { lat: 44.8848, lon: -93.2223 },
  ORD: { lat: 41.9742, lon: -87.9073 },
  PHL: { lat: 39.8744, lon: -75.2424 },
  PHX: { lat: 33.4342, lon: -112.0116 },
  SAN: { lat: 32.7338, lon: -117.1933 },
  SEA: { lat: 47.4502, lon: -122.3088 },
  SFO: { lat: 37.6213, lon: -122.379 },
};

const haversineKm = (a: AirportCoords, b: AirportCoords) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * (sinLon * sinLon);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const nearestAirportCode = (lat: number, lon: number) => {
  const coordsList = Object.entries(AIRPORT_COORDS);
  if (coordsList.length === 0) return null;
  const target = { lat, lon };
  let best = coordsList[0];
  let bestDistance = haversineKm(target, best[1]);
  for (const entry of coordsList.slice(1)) {
    const distance = haversineKm(target, entry[1]);
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best[0];
};

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
    <div className="rounded-xl border border-[var(--brand-border)] bg-[color:rgba(0,123,255,0.08)] p-4 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <div className="text-xs font-semibold text-[var(--brand-ink)]">{label}</div>
          <div className="text-[11px] font-semibold text-[var(--brand-primary)]">
            {labels.selected}: {airportLabel(value)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPopular((prev) => !prev)}
          className="inline-flex h-8 items-center rounded-lg border border-[var(--brand-border)] bg-white px-2 text-[11px] font-medium text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
        >
          {showPopular ? labels.hidePopular : labels.showPopular}
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {showPopular ? (
          <label className="text-xs font-medium text-[var(--brand-ink)]">
            {labels.popular}
            <select
              value={popularOptions.some((a) => a.code === value) ? value : ""}
              onChange={(e) => {
                if (e.target.value) onChange(e.target.value);
              }}
              className="mt-2 h-9 w-full rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
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
          <label className="grid grid-rows-[28px_auto] gap-2 text-xs font-medium text-[var(--brand-ink)]">
            <span className="block">{labels.region}</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--brand-border)] bg-white px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
            >
              {REGION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <label className="grid grid-rows-[28px_auto] gap-2 text-xs font-medium text-[var(--brand-ink)]">
            <span className="block">{labels.airportsInRegion}</span>
            <select
              value={regionOptions.some((a) => a.code === value) ? value : ""}
              onChange={(e) => {
                if (e.target.value) onChange(e.target.value);
              }}
              className="h-9 w-full rounded-lg border border-[var(--brand-border)] bg-white px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
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
      tone: "bg-[color:rgba(40,167,69,0.12)] text-[var(--brand-success)] ring-1 ring-[color:rgba(40,167,69,0.3)]",
    };
  }
  if (pct >= 70) {
    return {
      label: copy.dealGood,
      tone: "bg-[color:rgba(0,123,255,0.12)] text-[var(--brand-primary)] ring-1 ring-[color:rgba(0,123,255,0.3)]",
    };
  }
  if (pct >= 55) {
    return {
      label: copy.dealFair,
      tone: "bg-[color:rgba(253,126,20,0.18)] text-[var(--brand-ink)] ring-1 ring-[color:rgba(253,126,20,0.4)]",
    };
  }
  return {
    label: copy.dealPricey,
    tone: "bg-[color:rgba(220,53,69,0.12)] text-[var(--brand-danger)] ring-1 ring-[color:rgba(220,53,69,0.3)]",
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
      tone: "bg-[color:rgba(40,167,69,0.12)] text-[var(--brand-success)] ring-1 ring-[color:rgba(40,167,69,0.3)]",
    };
  }
  if (diffPct >= 0.08) {
    return {
      label: copy.trendHigh,
      tone: "bg-[color:rgba(220,53,69,0.12)] text-[var(--brand-danger)] ring-1 ring-[color:rgba(220,53,69,0.3)]",
    };
  }
  return {
    label: copy.trendMid,
    tone: "bg-[color:rgba(0,123,255,0.12)] text-[var(--brand-primary)] ring-1 ring-[color:rgba(0,123,255,0.3)]",
  };
}

function warningBadge(reason: string | undefined, copy: Copy) {
  if (!reason) return null;
  return {
    label: `${copy.outlierPrefix}${reason}`,
    tone: "bg-[color:rgba(253,126,20,0.16)] text-[var(--brand-accent)] ring-1 ring-[color:rgba(253,126,20,0.3)]",
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

const ESTIMATED_FEE_RATE = 0.08;

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
  const [searchMaxStops, setSearchMaxStops] = useState<"any" | "0" | "1" | "2">("any");
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [flexRangeDays, setFlexRangeDays] = useState(3);
  const [searchSort, setSearchSort] = useState<OfferSort>("best");
  const [purchasePartner, setPurchasePartner] = useState<PurchasePartner>("kiwi");
  const [priceCeiling, setPriceCeiling] = useState<number | "">("");
  const [durationCeilingHours, setDurationCeilingHours] = useState<number | "">("");
  const [airlineFilter, setAirlineFilter] = useState<string>("any");
  const [avoidRedeye, setAvoidRedeye] = useState(false);
  const purchasePartnerLabel =
    SEARCH_PARTNERS_VISIBLE.find((partner) => partner.value === purchasePartner)?.label ??
    "Kiwi";
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "locating" | "success" | "error"
  >("idle");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FlightSearchResponse | null>(null);
  const [searchUpdatedAt, setSearchUpdatedAt] = useState<number | null>(null);
  const [showAlertPrompt, setShowAlertPrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const searchCacheRef = useRef(new Map<string, FlightSearchResponse>());
  const exploreCacheRef = useRef(new Map<string, ExploreResponse>());
  const homeOriginResolvedRef = useRef(false);

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
  const [savedAlerts, setSavedAlerts] = useState<SavedAlert[]>([]);
  const [weeklyDeal, setWeeklyDeal] = useState<WeeklyDeal | null>(null);
  const [weeklyDealStatus, setWeeklyDealStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [alertsManageEmail, setAlertsManageEmail] = useState("");
  const [alertsManageStatus, setAlertsManageStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [alertsManageMessage, setAlertsManageMessage] = useState<string | null>(null);
  const [alertsManageList, setAlertsManageList] = useState<ManagedAlert[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [visibleOfferCount, setVisibleOfferCount] = useState(6);
  const [visibleExploreCount, setVisibleExploreCount] = useState(6);
  const offerSentinelRef = useRef<HTMLDivElement | null>(null);
  const exploreSentinelRef = useRef<HTMLDivElement | null>(null);

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
        nonStop?: boolean;
        flexibleDates?: boolean;
        searchMaxResults?: number;
        searchMaxStops?: "any" | "0" | "1" | "2";
        searchSort?: OfferSort;
        purchasePartner?: PurchasePartner;
        flexRangeDays?: number;
        priceCeiling?: number;
        durationCeilingHours?: number;
        airlineFilter?: string;
        avoidRedeye?: boolean;
      };
      if (parsed.origin && /^[A-Za-z]{3}$/.test(parsed.origin)) {
        setOrigin(parsed.origin.toUpperCase());
        homeOriginResolvedRef.current = true;
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
      if (typeof parsed.nonStop === "boolean") {
        setNonStop(parsed.nonStop);
      }
      if (typeof parsed.flexibleDates === "boolean") {
        setFlexibleDates(parsed.flexibleDates);
      }
      if (typeof parsed.searchMaxResults === "number") {
        setSearchMaxResults(parsed.searchMaxResults);
      }
      if (parsed.searchMaxStops) {
        setSearchMaxStops(parsed.searchMaxStops);
      }
      if (parsed.searchSort) {
        setSearchSort(parsed.searchSort);
      }
      if (parsed.purchasePartner) {
        setPurchasePartner(parsed.purchasePartner);
      }
      if (typeof parsed.flexRangeDays === "number") {
        setFlexRangeDays(parsed.flexRangeDays);
      }
      if (typeof parsed.priceCeiling === "number") {
        setPriceCeiling(parsed.priceCeiling);
      }
      if (typeof parsed.durationCeilingHours === "number") {
        setDurationCeilingHours(parsed.durationCeilingHours);
      }
      if (parsed.airlineFilter) {
        setAirlineFilter(parsed.airlineFilter);
      }
      if (typeof parsed.avoidRedeye === "boolean") {
        setAvoidRedeye(parsed.avoidRedeye);
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
      nonStop,
      flexibleDates,
      searchMaxResults,
      searchMaxStops,
      searchSort,
      purchasePartner,
      flexRangeDays,
      priceCeiling: typeof priceCeiling === "number" ? priceCeiling : undefined,
      durationCeilingHours:
        typeof durationCeilingHours === "number" ? durationCeilingHours : undefined,
      airlineFilter,
      avoidRedeye,
    };
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem("ticketwiz:search-defaults", JSON.stringify(payload));
      } catch {
        // Ignore storage failures (privacy mode, quota).
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [
    origin,
    destination,
    departureDate,
    returnDate,
    adults,
    currency,
    nonStop,
    flexibleDates,
    searchMaxResults,
    searchMaxStops,
    searchSort,
    purchasePartner,
    flexRangeDays,
    priceCeiling,
    durationCeilingHours,
    airlineFilter,
    avoidRedeye,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("ticketwiz:recent-searches");
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentSearch[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 6));
      }
    } catch {
      // Ignore malformed recent searches.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "ticketwiz:recent-searches",
        JSON.stringify(recentSearches.slice(0, 6))
      );
    } catch {
      // Ignore storage errors.
    }
  }, [recentSearches]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("ticketwiz:alerts");
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedAlert[];
      if (Array.isArray(parsed)) {
        setSavedAlerts(
          parsed.filter(
            (alert) =>
              alert &&
              typeof alert.id === "string" &&
              typeof alert.email === "string" &&
              typeof alert.origin === "string" &&
              typeof alert.destination === "string"
          )
        );
      }
    } catch {
      // Ignore malformed storage.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("ticketwiz:alerts", JSON.stringify(savedAlerts));
    } catch {
      // Ignore storage failures.
    }
  }, [savedAlerts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const originParam = params.get("origin");
    const destinationParam = params.get("destination");
    const departParam = params.get("depart");
    const returnParam = params.get("return");
    const adultsParam = params.get("adults");
    const currencyParam = params.get("currency");
    const nonStopParam = params.get("nonStop");
    const autoParam = params.get("auto");
    let shouldRun = false;

    if (originParam && /^[A-Za-z]{3}$/.test(originParam)) {
      setOrigin(originParam.toUpperCase());
      shouldRun = true;
    }
    if (destinationParam && /^[A-Za-z]{3}$/.test(destinationParam)) {
      setDestination(destinationParam.toUpperCase());
      shouldRun = true;
    }
    if (departParam && /^\d{4}-\d{2}-\d{2}$/.test(departParam)) {
      setDepartureDate(departParam);
      shouldRun = true;
    }
    if (returnParam && /^\d{4}-\d{2}-\d{2}$/.test(returnParam)) {
      setReturnDate(returnParam);
    }
    if (adultsParam && Number(adultsParam) > 0) {
      setAdults(Number(adultsParam));
    }
    if (currencyParam && /^[A-Za-z]{3}$/.test(currencyParam)) {
      setCurrency(currencyParam.toUpperCase());
    }
    if (nonStopParam === "1") {
      setNonStop(true);
    }
    if (autoParam === "1" && shouldRun) {
      setTimeout(() => {
        void runSearch({ ignoreFlex: true });
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (homeOriginResolvedRef.current) return;
    const savedOrigins = savedAlerts
      .map((alert) => alert.origin)
      .filter((code) => /^[A-Za-z]{3}$/.test(code));
    if (savedOrigins.length > 0) {
      const counts = new Map<string, number>();
      savedOrigins.forEach((code) => {
        const key = code.toUpperCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) {
        setOrigin(top[0]);
        setExploreOrigin(top[0]);
        homeOriginResolvedRef.current = true;
        return;
      }
    }
    if (typeof navigator === "undefined") return;
    const permissions = (navigator as Navigator & { permissions?: Permissions }).permissions;
    permissions
      ?.query?.({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state !== "granted" || homeOriginResolvedRef.current) return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const nearest = nearestAirportCode(
              position.coords.latitude,
              position.coords.longitude
            );
            if (!nearest || homeOriginResolvedRef.current) return;
            setOrigin(nearest);
            setExploreOrigin(nearest);
            homeOriginResolvedRef.current = true;
          },
          () => {
            // Ignore geo failures.
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      })
      .catch(() => {
        // Ignore permission errors.
      });
  }, [savedAlerts]);

  useEffect(() => {
    let active = true;
    setWeeklyDealStatus("loading");
    fetch("/api/deals/weekly")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json?.deal) {
          setWeeklyDeal(json.deal as WeeklyDeal);
          setWeeklyDealStatus("idle");
        } else {
          setWeeklyDealStatus("error");
        }
      })
      .catch(() => {
        if (!active) return;
        setWeeklyDealStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (searchResults?.offers?.length) {
      if (!promptDismissed) setShowAlertPrompt(true);
    } else {
      setShowAlertPrompt(false);
    }
  }, [searchResults, promptDismissed]);

  const showTestimonials = false;

  useEffect(() => {
    if (!showTestimonials || copy.proofQuotes.length <= 1) return;
    const interval = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % copy.proofQuotes.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [copy.proofQuotes.length, showTestimonials]);

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
  const [exploreMonthPreset, setExploreMonthPreset] = useState<
    "any" | "thisMonth" | "nextMonth" | "next3Months"
  >("any");

  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [exploreResults, setExploreResults] = useState<ExploreResponse | null>(null);

  const getMonthStartIso = (offset: number) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + offset;
    return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  };

  const applyExploreMonthPreset = (
    preset: "any" | "thisMonth" | "nextMonth" | "next3Months"
  ) => {
    setExploreMonthPreset(preset);
    if (preset === "any") return;
    const offset = preset === "thisMonth" ? 0 : preset === "nextMonth" ? 1 : 3;
    setExploreDepartureDate(getMonthStartIso(offset));
    setExploreReturnDate("");
  };

  const flexOffsets = Array.from({ length: flexRangeDays * 2 + 1 }, (_, i) => i - flexRangeDays);
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

  const availableAirlines = useMemo(() => {
    const codes = new Set<string>(Object.keys(AIRLINE_NAMES));
    offerView.offers.forEach((offer) => {
      offer.validatingAirlineCodes.forEach((code) => codes.add(code));
    });
    return Array.from(codes).sort();
  }, [offerView.offers]);

  const isRedeyeOffer = (offer: (typeof offerView.offers)[number]) => {
    for (const itinerary of offer.itineraries) {
      for (const segment of itinerary.segments) {
        const at = segment.departure?.at ?? "";
        const match = /T(\d{2}):/.exec(at);
        if (!match) continue;
        const hour = Number(match[1]);
        if (hour >= 22 || hour < 6) return true;
      }
    }
    return false;
  };

  const filteredOffers = useMemo(() => {
    if (searchMaxStops === "any") return offerView.offers;
    const maxStops = Number(searchMaxStops);
    return offerView.offers.filter((offer) => {
      const stopCount = offerView.stops.get(offer.id);
      return typeof stopCount === "number" ? stopCount <= maxStops : true;
    });
  }, [offerView, searchMaxStops]);

  const searchFilteredOffers = useMemo(() => {
    return filteredOffers.filter((offer) => {
      if (typeof priceCeiling === "number") {
        const price = Number(offer.priceTotal);
        if (Number.isFinite(price) && price > priceCeiling) return false;
      }
      if (typeof durationCeilingHours === "number") {
        const durationMinutes = offerView.durations.get(offer.id) ?? 0;
        if (durationMinutes > durationCeilingHours * 60) return false;
      }
      if (airlineFilter !== "any") {
        const codes = offer.validatingAirlineCodes;
        if (!codes.includes(airlineFilter)) return false;
      }
      if (avoidRedeye && isRedeyeOffer(offer)) return false;
      return true;
    });
  }, [
    filteredOffers,
    priceCeiling,
    durationCeilingHours,
    airlineFilter,
    avoidRedeye,
    offerView.durations,
  ]);

  useEffect(() => {
    const total = searchFilteredOffers.length;
    setVisibleOfferCount(total > 0 ? Math.min(6, total) : 6);
  }, [searchResults, searchFilteredOffers.length]);

  useEffect(() => {
    if (!offerSentinelRef.current) return;
    if (visibleOfferCount >= searchFilteredOffers.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleOfferCount((prev) =>
          Math.min(prev + 6, searchFilteredOffers.length)
        );
      },
      { rootMargin: "200px" }
    );
    observer.observe(offerSentinelRef.current);
    return () => observer.disconnect();
  }, [visibleOfferCount, searchFilteredOffers.length]);

  const bestOffer = useMemo(() => {
    if (searchFilteredOffers.length === 0) return null;
    return searchFilteredOffers.reduce((best, offer) => {
      const bestScore = offerView.scores.get(best.id) ?? 0;
      const offerScore = offerView.scores.get(offer.id) ?? 0;
      return offerScore > bestScore ? offer : best;
    }, searchFilteredOffers[0]);
  }, [searchFilteredOffers, offerView]);

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
      if (typeof deal.maxStops === "number" && deal.maxStops > 1) {
        outlierReasons.push("extra stops");
      }
      if (
        typeof deal.durationMinutes === "number" &&
        medianDuration > 0 &&
        deal.durationMinutes > medianDuration
      ) {
        outlierReasons.push("long duration");
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

  useEffect(() => {
    const total = exploreView.deals.length;
    setVisibleExploreCount(total > 0 ? Math.min(6, total) : 6);
  }, [exploreResults, exploreView.deals.length]);

  useEffect(() => {
    if (!exploreSentinelRef.current) return;
    if (visibleExploreCount >= exploreView.deals.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleExploreCount((prev) =>
          Math.min(prev + 6, exploreView.deals.length)
        );
      },
      { rootMargin: "200px" }
    );
    observer.observe(exploreSentinelRef.current);
    return () => observer.disconnect();
  }, [visibleExploreCount, exploreView.deals.length]);

  const topCheapestDeals = useMemo(() => {
    return [...exploreView.deals]
      .filter((deal) => deal.priceTotal)
      .sort((a, b) => Number(a.priceTotal) - Number(b.priceTotal))
      .slice(0, 5);
  }, [exploreView.deals]);

  const destinationInsights = useMemo(() => {
    const byDestination = new Map<
      string,
      {
        prices: number[];
        monthMin: number[];
      }
    >();
    exploreView.deals.forEach((deal) => {
      if (!deal.departureDate) return;
      const price = Number(deal.priceTotal);
      if (!Number.isFinite(price)) return;
      const monthIndex = new Date(deal.departureDate).getMonth();
      if (!Number.isFinite(monthIndex)) return;
      const entry =
        byDestination.get(deal.destination) ?? {
          prices: [] as number[],
          monthMin: Array.from({ length: 12 }, () => Number.POSITIVE_INFINITY) as number[],
        };
      entry.prices.push(price);
      entry.monthMin[monthIndex] = Math.min(entry.monthMin[monthIndex], price);
      byDestination.set(deal.destination, entry);
    });

    const insights = new Map<
      string,
      {
        median: number;
        monthMin: number[];
        sparklinePoints: string;
        bestMonths: string;
      }
    >();
    byDestination.forEach((entry, destination) => {
      const sorted = [...entry.prices].sort((a, b) => a - b);
      const median =
        sorted.length === 0
          ? Number.NaN
          : sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
      const usableMonths = entry.monthMin.map((value) =>
        Number.isFinite(value) ? value : Number.NaN
      );
      const finiteValues = usableMonths.filter((value) => Number.isFinite(value)) as number[];
      const min = finiteValues.length ? Math.min(...finiteValues) : 0;
      const max = finiteValues.length ? Math.max(...finiteValues) : 0;
      const range = max - min || 1;
      const points = usableMonths
        .map((value, idx) => {
          if (!Number.isFinite(value)) return null;
          const x = (idx / 11) * 72;
          const y = 18 - ((value - min) / range) * 18;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .filter(Boolean)
        .join(" ");
      const bestMonths = usableMonths
        .map((value, idx) => ({ idx, value }))
        .filter((item) => Number.isFinite(item.value))
        .sort((a, b) => (a.value as number) - (b.value as number))
        .slice(0, 2)
        .map((item) => copy.monthsShort[item.idx])
        .join(", ");

      insights.set(destination, {
        median,
        monthMin: usableMonths,
        sparklinePoints: points,
        bestMonths,
      });
    });

    return insights;
  }, [exploreView.deals, copy.monthsShort]);

  const getSeasonalityLabel = (destination: string, price: number) => {
    const insight = destinationInsights.get(destination);
    if (!insight || !Number.isFinite(insight.median)) return null;
    const ratio = price / insight.median;
    if (ratio <= 0.9) return copy.seasonalityValue;
    if (ratio >= 1.1) return copy.seasonalityPeak;
    return copy.seasonalityShoulder;
  };

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
      const id = `${trimmed.toLowerCase()}-${origin}-${destination}`;
      setSavedAlerts((prev) => {
        if (prev.some((alert) => alert.id === id)) return prev;
        const next: SavedAlert = {
          id,
          email: trimmed,
          origin,
          destination,
          createdAt: new Date().toISOString(),
        };
        return [next, ...prev].slice(0, 10);
      });
      setSaveSearchEmail("");
    } catch {
      setSaveSearchStatus("error");
      setSaveSearchMessage(copy.saveSearchError);
    }
  }

  async function loadManagedAlerts() {
    const email = alertsManageEmail.trim();
    if (!email) {
      setAlertsManageStatus("error");
      setAlertsManageMessage(copy.saveSearchError);
      return;
    }
    setAlertsManageStatus("loading");
    setAlertsManageMessage(null);
    try {
      const response = await fetch(`/api/searches?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        setAlertsManageStatus("error");
        setAlertsManageMessage(copy.alertsManageEmpty);
        return;
      }
      const data = await response.json();
      setAlertsManageList(data.searches ?? []);
      setAlertsManageStatus("idle");
    } catch {
      setAlertsManageStatus("error");
      setAlertsManageMessage(copy.alertsManageEmpty);
    }
  }

  async function updateManagedAlert(
    alertId: number,
    updates: { paused?: boolean; frequency?: "daily" | "weekly" | "biweekly" }
  ) {
    const email = alertsManageEmail.trim();
    if (!email) return;
    try {
      await fetch("/api/searches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, id: alertId, ...updates }),
      });
      setAlertsManageList((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, ...updates } : alert
        )
      );
    } catch {
      // Ignore update errors.
    }
  }

  async function deleteManagedAlert(alertId: number) {
    const email = alertsManageEmail.trim();
    if (!email) return;
    try {
      await fetch("/api/searches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, id: alertId }),
      });
      setAlertsManageList((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch {
      // Ignore delete errors.
    }
  }

  async function pauseAllManagedAlerts() {
    if (alertsManageList.length === 0) return;
    const email = alertsManageEmail.trim();
    if (!email) return;
    const ids = alertsManageList.filter((alert) => !alert.paused).map((alert) => alert.id);
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) =>
          fetch("/api/searches", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, id, paused: true }),
          })
        )
      );
      setAlertsManageList((prev) => prev.map((alert) => ({ ...alert, paused: true })));
    } catch {
      // Ignore pause-all errors.
    }
  }

  function setCacheWithLimit<T>(map: Map<string, T>, key: string, value: T) {
    map.set(key, value);
    if (map.size <= 12) return;
    const firstKey = map.keys().next().value;
    if (typeof firstKey === "string") map.delete(firstKey);
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
    setSearchUpdatedAt(null);
    try {
      const baseOrigin = options?.origin ?? origin;
      const baseDestination = options?.destination ?? destination;
      const baseDepart = options?.depart ?? departureDate;
      const baseReturn = options?.returnDate ?? returnDate;
      const recent: RecentSearch = {
        origin: baseOrigin,
        destination: baseDestination,
        depart: baseDepart,
        returnDate: baseReturn || undefined,
      };
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
      const cacheKey = `search:${params.toString()}`;
      const cached = searchCacheRef.current.get(cacheKey);
      if (cached) {
        setSearchResults(cached);
        setSearchUpdatedAt(Date.now());
        addRecentSearch(recent);
        setSearchLoading(false);
        return;
      }

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || copy.searchFailed);
      const payload = json as FlightSearchResponse;
      setSearchResults(payload);
      setSearchUpdatedAt(Date.now());
      addRecentSearch(recent);
      setCacheWithLimit(searchCacheRef.current, cacheKey, payload);
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

  const removeSavedAlert = (id: string) => {
    setSavedAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const formatUpdatedAt = (timestamp: number) =>
    new Date(timestamp).toLocaleString(locale === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const addCacheBuster = (url: string | null) => {
    if (!url) return null;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}twts=${Date.now()}`;
  };

  const ensureSearchDates = () => {
    if (departureDate && /^\d{4}-\d{2}-\d{2}$/.test(departureDate)) return;
    const d = new Date();
    d.setDate(d.getDate() + 21);
    setDepartureDate(d.toISOString().slice(0, 10));
  };

  const addRecentSearch = (next: RecentSearch) => {
    const normalized: RecentSearch = {
      origin: next.origin.toUpperCase(),
      destination: next.destination.toUpperCase(),
      depart: next.depart,
      returnDate: next.returnDate,
    };
    const key = `${normalized.origin}-${normalized.destination}-${normalized.depart}-${
      normalized.returnDate ?? ""
    }`;
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) =>
          `${item.origin}-${item.destination}-${item.depart}-${item.returnDate ?? ""}` !== key
      );
      return [normalized, ...filtered].slice(0, 6);
    });
  };

  const clearSearchFilters = () => {
    setNonStop(false);
    setFlexibleDates(false);
    setFlexRangeDays(3);
    setSearchMaxResults(20);
    setSearchMaxStops("any");
    setSearchSort("best");
    setPriceCeiling("");
    setDurationCeilingHours("");
    setAirlineFilter("any");
    setAvoidRedeye(false);
  };

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  function requestLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage(copy.locationError);
      return;
    }
    setLocationStatus("locating");
    setLocationMessage(copy.locationFinding);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = nearestAirportCode(
          position.coords.latitude,
          position.coords.longitude
        );
        if (!nearest) {
          setLocationStatus("error");
          setLocationMessage(copy.locationError);
          return;
        }
        setOrigin(nearest);
        setExploreOrigin(nearest);
        setLocationStatus("success");
        setLocationMessage(`${copy.locationSuccess}${airportLabel(nearest)}`);
      },
      () => {
        setLocationStatus("error");
        setLocationMessage(copy.locationError);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
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
      const cacheKey = `explore:${params.toString()}`;
      const cached = exploreCacheRef.current.get(cacheKey);
      if (cached) {
        setExploreResults(cached);
        setExploreLoading(false);
        return;
      }

      const res = await fetch(`/api/flights/explore?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || copy.exploreFailed);
      const payload = json as ExploreResponse;
      setExploreResults(payload);
      setCacheWithLimit(exploreCacheRef.current, cacheKey, payload);
    } catch (e) {
      setExploreError(e instanceof Error ? e.message : copy.exploreFailed);
    } finally {
      setExploreLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-transparent text-zinc-950">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Ticket-wiz3.jpg"
          alt="Ticket Wiz background"
          fill
          priority
          sizes="100vw"
          unoptimized={isDev}
          className="object-cover tw-fade-in"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#001F3F]/25 via-[#007BFF]/10 to-transparent" />
      <div className="relative z-20 bg-transparent">
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--brand-muted)]">
              <div className="inline-flex items-center gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]"
                >
                  EN
                </Link>
                <Link
                  href="/es"
                  className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)]"
                >
                  ES
                </Link>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-10">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="w-full">
              <div className="inline-flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full bg-white/80 ring-1 ring-[var(--brand-border)]">
                <Image
                  src="/ticket-wiz-logo.png"
                  alt="Ticket Wiz logo"
                  width={160}
                  height={160}
                  priority
                  unoptimized={isDev}
                  className="h-full w-full object-contain scale-105 tw-fade-in"
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
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/40 bg-white/90 px-4 py-2 text-xs text-[var(--brand-ink)] shadow-sm">
                <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
                  {copy.weeklyBannerLabel}
                </span>
                {weeklyDeal ? (
                  <>
                    <span className="font-semibold text-[var(--brand-ink)]">
                      {weeklyDeal.origin} → {weeklyDeal.destination}
                    </span>
                    <span className="text-[var(--brand-muted)]">
                      {formatMoney(weeklyDeal.currency, weeklyDeal.price)}
                    </span>
                    <span className="text-[var(--brand-muted)]">
                      {formatDurationMinutes(weeklyDeal.durationMinutes)} · {copy.stops}:{" "}
                      {weeklyDeal.stops}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("search");
                        setOrigin(weeklyDeal.origin);
                        setDestination(weeklyDeal.destination);
                        ensureSearchDates();
                        if (typeof window !== "undefined") {
                          window.requestAnimationFrame(() => {
                            document.getElementById("search")?.scrollIntoView({
                              behavior: "smooth",
                            });
                          });
                        }
                        void runSearch({
                          origin: weeklyDeal.origin,
                          destination: weeklyDeal.destination,
                          ignoreFlex: true,
                        });
                      }}
                      className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                    >
                      {copy.weeklyBannerCta}
                    </button>
                  </>
                ) : (
                  <span className="text-[var(--brand-muted)]" role="status" aria-live="polite">
                    {weeklyDealStatus === "loading"
                      ? copy.fetchingFares
                      : copy.weeklyBannerFallback}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11px] font-semibold text-white/80">
                {copy.trustRow}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="grid gap-3 rounded-2xl bg-white/85 p-4 text-xs text-[var(--brand-ink)] shadow-md ring-1 ring-[var(--brand-border)]">
                  <div className="flex min-h-[32px] items-center text-sm font-semibold text-[var(--brand-primary)]">
                    {copy.whyTitle}
                  </div>
                  <ul className="grid gap-2 text-[12px] leading-5 text-[var(--brand-ink)]">
                    {copy.whyItems.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 rounded-2xl bg-white/85 p-4 text-xs text-[var(--brand-ink)] shadow-md ring-1 ring-[var(--brand-border)]">
                  <div className="flex min-h-[32px] items-center text-sm font-semibold text-[var(--brand-primary)]">
                    {copy.alertsTitle}
                  </div>
                  <div className="text-[12px] text-[var(--brand-ink)]">
                    {copy.alertsSubtitle}
                  </div>
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
                      className="h-9 flex-1 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                    <button
                      type="button"
                      onClick={submitAlertSignup}
                      disabled={alertsStatus === "loading"}
                      className="h-9 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {alertsStatus === "loading" ? copy.alertsSaving : copy.alertsCta}
                    </button>
                  </div>
                  {alertsMessage ? (
                    <div
                      className={`text-[11px] ${
                        alertsStatus === "success"
                          ? "text-[var(--brand-success)]"
                          : "text-[var(--brand-danger)]"
                      }`}
                      role="status"
                    >
                      {alertsMessage}
                    </div>
                  ) : null}
                  <div className="text-[10px] text-[var(--brand-muted)]">
                    We only send a few emails a month. Unsubscribe anytime.
                  </div>
                </div>
                <div className="grid gap-2 rounded-2xl bg-white/85 p-4 text-xs text-[var(--brand-ink)] shadow-md ring-1 ring-[var(--brand-border)]">
                  <div className="flex min-h-[32px] items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
                    <Image
                      src="/badge.png"
                      alt="Partner badge"
                      width={36}
                      height={36}
                      unoptimized={isDev}
                      className="h-8 w-8 object-contain tw-fade-in"
                    />
                    {copy.trustTitle}
                  </div>
                  <div className="text-[12px] text-[var(--brand-ink)]">{copy.trustNote}</div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                    {["Amadeus", "Kiwi", "Aviasales"].map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {showTestimonials ? (
                <div className="mt-4 grid gap-3 rounded-2xl bg-white/85 p-4 text-xs text-[var(--brand-ink)] shadow-md ring-1 ring-[var(--brand-border)]">
                  <div className="text-sm font-semibold text-[var(--brand-primary)]">
                    {copy.proofTitle}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {copy.proofStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-[var(--brand-border)] bg-white p-3"
                      >
                        <div className="flex items-center gap-1 text-lg font-semibold text-[var(--brand-ink)]">
                          {stat.value === "4.8/5" ? (
                            <span className="text-[var(--brand-accent)]">★</span>
                          ) : null}
                          {stat.value}
                        </div>
                        <div className="text-[11px] text-[var(--brand-muted)]">{stat.label}</div>
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
                      <div
                        key={item.quote}
                        className="rounded-xl border border-[var(--brand-border)] bg-white p-3"
                      >
                        <div className="text-[12px] text-[var(--brand-ink)]">
                          “{item.quote}”
                        </div>
                        <div className="mt-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 text-right text-xs text-[var(--brand-muted)] lg:mt-[200px]" />
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001F3F]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 text-xs font-semibold text-white">
                    {card.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl bg-white/85 p-5 text-xs text-[var(--brand-ink)] shadow-md ring-1 ring-[var(--brand-border)]">
            <div className="text-sm font-semibold text-[var(--brand-primary)]">
              {copy.howItWorksTitle}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {copy.howItWorksSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-[var(--brand-border)] bg-white p-3"
                >
                  <div className="text-sm font-semibold text-[var(--brand-ink)]">{step.title}</div>
                  <div className="mt-1 text-[12px] text-[var(--brand-ink)]">{step.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 inline-flex w-full justify-between rounded-xl bg-[#E9F2FF] p-1 shadow-md ring-2 ring-[var(--brand-border)] sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("search")}
              className={[
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ring-1 ring-transparent sm:flex-none",
                tab === "search"
                  ? "bg-[var(--brand-primary)] text-white shadow ring-[var(--brand-primary)]"
                  : "bg-white text-[var(--brand-primary)] ring-[var(--brand-border)] hover:bg-[#E7F0FF]",
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
                  ? "bg-[var(--brand-primary)] text-white shadow ring-[var(--brand-primary)]"
                  : "bg-white text-[var(--brand-primary)] ring-[var(--brand-border)] hover:bg-[#E7F0FF]",
              ].join(" ")}
            >
              {copy.tabExplore}
            </button>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-6 pb-16">
        {tab === "search" ? (
          <section
            id="search"
            className="-mt-6 grid items-start gap-6 scroll-mt-20 lg:grid-cols-[420px_1fr]"
          >
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-lg ring-2 ring-[var(--brand-border)]">
              <h2 className="text-sm font-semibold">{copy.searchFlightsTitle}</h2>
              <p className="mt-1 text-xs text-[var(--brand-muted)]">{copy.searchFlightsNote}</p>
              <div className="mt-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                {copy.searchPrompt}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationStatus === "locating"}
                  className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] shadow-sm transition hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {locationStatus === "locating" ? copy.locationFinding : copy.locationCta}
                </button>
                {locationMessage ? (
                  <span className="text-[var(--brand-muted)]">{locationMessage}</span>
                ) : null}
              </div>
              {recentSearches.length > 0 ? (
                <div className="mt-3 grid gap-2 text-[11px]">
                  <div className="font-semibold text-[var(--brand-primary)]">
                    {copy.recentSearches}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={`${search.origin}-${search.destination}-${search.depart}-${search.returnDate ?? ""}`}
                        type="button"
                        onClick={() => {
                          setOrigin(search.origin);
                          setDestination(search.destination);
                          setDepartureDate(search.depart);
                          setReturnDate(search.returnDate ?? "");
                          void runSearch({
                            origin: search.origin,
                            destination: search.destination,
                            depart: search.depart,
                            returnDate: search.returnDate ?? "",
                            ignoreFlex: true,
                          });
                        }}
                        className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                      >
                        {search.origin} → {search.destination} · {formatShortDate(search.depart)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <form
                className="mt-4 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void runSearch();
                }}
              >
                <div className="flex items-center justify-end text-[11px]">
                  <button
                    type="button"
                    onClick={swapRoute}
                    className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                  >
                    {copy.swapRoute}
                  </button>
                </div>
                <fieldset className="grid gap-4 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 lg:grid-cols-2">
                  <legend className="px-2 text-[11px] font-semibold text-[var(--brand-primary)]">
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
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.depart}
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      placeholder={copy.datePlaceholder}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.returnOptional}
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      placeholder={copy.datePlaceholder}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.adults}
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.maxResults}
                    <select
                      value={searchMaxResults}
                      onChange={(e) => setSearchMaxResults(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    >
                      {[10, 20, 30, 40, 50].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.currency}
                    <input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                      placeholder="USD"
                    />
                  </label>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={nonStop}
                      onChange={(e) => setNonStop(e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-success)]"
                    />
                    <span className="text-sm text-[var(--brand-ink)]">{copy.nonstop}</span>
                  </label>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={flexibleDates}
                      onChange={(e) => setFlexibleDates(e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-success)]"
                    />
                    <span className="text-sm text-[var(--brand-ink)]">{copy.flexibleDates}</span>
                  </label>
                  {flexibleDates ? (
                    <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)] sm:col-span-2">
                      {copy.flexRangeLabel}: ±{flexRangeDays}
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={1}
                        value={flexRangeDays}
                        onChange={(e) => setFlexRangeDays(Number(e.target.value))}
                        className="h-2 w-full accent-[var(--brand-primary)]"
                      />
                    </label>
                  ) : null}
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.priceCeiling}
                    <input
                      type="number"
                      min={0}
                      value={priceCeiling}
                      onChange={(e) =>
                        setPriceCeiling(e.target.value ? Number(e.target.value) : "")
                      }
                      placeholder="USD"
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.durationCeiling}
                    <input
                      type="number"
                      min={1}
                      value={durationCeilingHours}
                      onChange={(e) =>
                        setDurationCeilingHours(e.target.value ? Number(e.target.value) : "")
                      }
                      placeholder="hrs"
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)] sm:col-span-2">
                    {copy.airlineFilter}
                    <select
                      value={airlineFilter}
                      onChange={(e) => setAirlineFilter(e.target.value)}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    >
                      <option value="any">{copy.airlineAny}</option>
                      {availableAirlines.map((code) => (
                        <option key={code} value={code}>
                          {airlineName(code)} ({code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={avoidRedeye}
                      onChange={(e) => setAvoidRedeye(e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-success)]"
                    />
                    <span className="text-sm text-[var(--brand-ink)]">{copy.avoidRedeye}</span>
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
                    className="rounded-xl border border-[color:rgba(253,126,20,0.35)] bg-[color:rgba(253,126,20,0.12)] px-3 py-2 text-xs text-[var(--brand-accent)]"
                    role="status"
                    aria-live="polite"
                  >
                    {searchError}
                  </div>
                ) : null}
              {showAlertPrompt ? (
                <>
                  <div className="mt-2 grid gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 text-xs text-[var(--brand-ink)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-[var(--brand-primary)]">
                      {copy.alertPromptTitle}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAlertPrompt(false);
                        setPromptDismissed(true);
                      }}
                      className="rounded-full border border-[var(--brand-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
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
                      className="h-9 flex-1 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                    <button
                      type="button"
                      onClick={submitSaveSearch}
                      disabled={saveSearchStatus === "loading"}
                      className="h-9 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saveSearchStatus === "loading" ? copy.saveSearchSaving : copy.alertPromptCta}
                    </button>
                  </div>
                  {saveSearchMessage ? (
                    <div
                      className={`text-[11px] ${
                        saveSearchStatus === "success"
                          ? "text-[var(--brand-success)]"
                          : "text-[var(--brand-danger)]"
                      }`}
                      role="status"
                    >
                      {saveSearchMessage}
                    </div>
                  ) : null}
                  </div>
                <div className="mt-2 grid gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 text-xs text-[var(--brand-ink)]">
                  <div className="text-xs font-semibold text-[var(--brand-primary)]">
                    {copy.alertsManageTitle}
                  </div>
                  <div className="text-[11px] text-[var(--brand-muted)]">
                    {copy.alertsManageNote}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="email"
                      placeholder={copy.alertsManageEmailPlaceholder}
                      aria-label={copy.alertsManageTitle}
                      value={alertsManageEmail}
                      onChange={(event) => {
                        setAlertsManageEmail(event.target.value);
                        if (alertsManageStatus !== "idle") {
                          setAlertsManageStatus("idle");
                          setAlertsManageMessage(null);
                        }
                      }}
                      className="h-9 flex-1 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                    <button
                      type="button"
                      onClick={loadManagedAlerts}
                      disabled={alertsManageStatus === "loading"}
                      className="h-9 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-[11px] font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {alertsManageStatus === "loading"
                        ? copy.searching
                        : copy.alertsManageLoad}
                    </button>
                    <button
                      type="button"
                      onClick={pauseAllManagedAlerts}
                      disabled={alertsManageList.length === 0}
                      className="h-9 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-[11px] font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {copy.alertsManagePauseAll}
                    </button>
                  </div>
                  {alertsManageMessage ? (
                    <div className="text-[11px] text-[var(--brand-danger)]" role="status">
                      {alertsManageMessage}
                    </div>
                  ) : null}
                  {alertsManageList.length === 0 ? (
                    <div className="text-[11px] text-[var(--brand-muted)]">
                      {copy.alertsManageEmpty}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {alertsManageList.map((alert) => (
                        <div
                          key={alert.id}
                          className="grid gap-2 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] font-semibold text-[var(--brand-primary)]">
                              {alert.origin} → {alert.destination}
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteManagedAlert(alert.id)}
                              className="rounded-full border border-[var(--brand-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                            >
                              {copy.alertsManageRemove}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--brand-muted)]">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={alert.paused}
                                onChange={(event) =>
                                  updateManagedAlert(alert.id, {
                                    paused: event.target.checked,
                                  })
                                }
                                className="h-3.5 w-3.5 accent-[var(--brand-success)]"
                              />
                              <span>{copy.alertsManagePause}</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <span>{copy.alertsManageFrequency}</span>
                              <select
                                value={alert.frequency}
                                onChange={(event) =>
                                  updateManagedAlert(alert.id, {
                                    frequency: event.target
                                      .value as ManagedAlert["frequency"],
                                  })
                                }
                                className="h-6 rounded-md border border-[var(--brand-border)] bg-white px-2 text-[10px] text-[var(--brand-ink)]"
                              >
                                <option value="daily">{copy.alertsManageDaily}</option>
                                <option value="weekly">{copy.alertsManageWeekly}</option>
                                <option value="biweekly">{copy.alertsManageBiweekly}</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] text-[var(--brand-muted)]">
                    {copy.alertsManagePartner} {purchasePartnerLabel}.
                  </div>
                  </div>
                </>
              ) : null}
                <div className="mt-2 grid gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 text-xs text-[var(--brand-ink)]">
                  <div className="text-xs font-semibold text-[var(--brand-primary)]">
                    {copy.saveSearchTitle}
                  </div>
                  <div className="text-[11px] text-[var(--brand-muted)]">
                    {copy.saveSearchNote}
                  </div>
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
                      className="h-9 flex-1 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                    <button
                      type="button"
                      onClick={submitSaveSearch}
                      disabled={saveSearchStatus === "loading"}
                      className="h-9 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saveSearchStatus === "loading" ? copy.saveSearchSaving : copy.saveSearchCta}
                    </button>
                  </div>
                  {saveSearchMessage ? (
                    <div
                      className={`text-[11px] ${
                        saveSearchStatus === "success"
                          ? "text-[var(--brand-success)]"
                          : "text-[var(--brand-danger)]"
                      }`}
                      role="status"
                    >
                      {saveSearchMessage}
                    </div>
                  ) : null}
                </div>
                {canShowFlexGrid ? (
                  <div className="mt-2 grid gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 text-xs text-[var(--brand-ink)]">
                    <div className="text-xs font-semibold text-[var(--brand-primary)]">
                      {copy.flexGridTitle}
                    </div>
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
                                      ? "border-[var(--brand-primary)] bg-white text-[var(--brand-primary)]"
                                      : "border-[var(--brand-border)] bg-white text-[var(--brand-ink)] hover:border-[var(--brand-primary)]"
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
                                  ? "border-[var(--brand-primary)] bg-white text-[var(--brand-primary)]"
                                  : "border-[var(--brand-border)] bg-white text-[var(--brand-ink)] hover:border-[var(--brand-primary)]"
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

            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-lg ring-2 ring-[var(--brand-border)]">
              <div className="sticky top-3 z-10 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/95 px-2 py-2 backdrop-blur-sm">
                <h2 className="text-sm font-semibold">{copy.results}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--brand-primary)]">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      {
                        value: "best" as OfferSort,
                        label: copy.sortBestValue,
                        tip: copy.sortBestValueTip,
                      },
                      {
                        value: "cheapest" as OfferSort,
                        label: copy.sortCheapest,
                        tip: copy.sortCheapestTip,
                      },
                      {
                        value: "fastest" as OfferSort,
                        label: copy.sortFastest,
                        tip: copy.sortFastestTip,
                      },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSearchSort(preset.value)}
                        title={preset.tip}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                          searchSort === preset.value
                            ? "border-[var(--brand-primary)] bg-[color:rgba(0,123,255,0.12)] text-[var(--brand-primary)]"
                            : "border-[var(--brand-border)] bg-white text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    {searchResults ? `${searchFilteredOffers.length} ${copy.offers}` : "—"}
                  </div>
                  <label className="flex items-center gap-2">
                    {copy.buyVia}
                    <select
                      value={purchasePartner}
                      onChange={(e) => setPurchasePartner(e.target.value as PurchasePartner)}
                      className="h-8 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
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
                      title={copy.sortFewestStopsTip}
                      className="h-8 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    >
                      <option value="best">{copy.bestDeal}</option>
                      <option value="cheapest">{copy.cheapest}</option>
                      <option value="fastest">{copy.fastest}</option>
                      <option value="fewest-stops">{copy.fewestStops}</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    {copy.maxStopsLabel}
                    <select
                      value={searchMaxStops}
                      onChange={(e) =>
                        setSearchMaxStops(e.target.value as "any" | "0" | "1" | "2")
                      }
                      className="h-8 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    >
                      <option value="any">{copy.maxStopsAny}</option>
                      <option value="0">{copy.maxStopsNonstop}</option>
                      <option value="1">{copy.maxStopsOne}</option>
                      <option value="2">{copy.maxStopsTwo}</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={clearSearchFilters}
                    className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                  >
                    {copy.clearAllFilters}
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--brand-muted)]">
                <span>
                  {copy.priceSourceDisclaimer.replace("{partner}", purchasePartnerLabel)}
                </span>
                {searchUpdatedAt ? (
                  <span className="font-semibold text-[var(--brand-primary)]">
                    {copy.lastUpdatedLabel}: {formatUpdatedAt(searchUpdatedAt)}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 rounded-lg border border-[var(--brand-border)] bg-[color:rgba(0,123,255,0.08)] px-3 py-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                {copy.priceChangeBanner}
              </div>

              <div className="mt-4 grid gap-3">
                {searchLoading ? (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--brand-border)]">
                    <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-[var(--brand-primary)] to-[#0069D9]" />
                  </div>
                ) : null}
                {bestOffer ? (
                  <div className="rounded-xl border border-[var(--brand-border)] bg-[color:rgba(0,123,255,0.08)] p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                        {copy.bestValueRightNow}
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)] ring-1 ring-[var(--brand-border)]">
                        {copy.score} {Math.round((offerView.scores.get(bestOffer.id) ?? 0) * 100)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--brand-ink)]">
                      <div>
                        {copy.price}: {formatMoney(bestOffer.currency, bestOffer.priceTotal)}
                      </div>
                      <div className="text-xs font-semibold text-[var(--brand-primary)]">
                        {copy.duration}: {formatDurationMinutes(offerView.durations.get(bestOffer.id))}
                      </div>
                      <div className="text-xs font-semibold text-[var(--brand-primary)]">
                        {copy.stops}: {offerView.stops.get(bestOffer.id) ?? "—"}
                      </div>
                      <div className="text-xs font-semibold text-[var(--brand-primary)]">
                        {copy.airline}: {airlineName(bestOffer.validatingAirlineCodes[0] ?? "") || "—"}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-[var(--brand-primary)]">
                      {copy.basedOn}
                    </div>
                  </div>
                ) : null}
                {searchLoading ? (
                  <div className="rounded-xl border border-[var(--brand-border)] p-4 text-sm text-[var(--brand-muted)]">
                    {copy.fetchingFares}
                  </div>
                ) : null}

                {!searchLoading && offerView.offers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--brand-border)] p-6 text-sm text-[var(--brand-muted)]">
                    {searchResults ? (
                      <div className="grid gap-3">
                        <span>{copy.noResults}</span>
                        <div className="text-xs font-semibold text-[var(--brand-primary)]">
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
                              className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
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
                              className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                            >
                              {copy.tryEnableFlexible}
                            </button>
                          ) : null}
                        </div>
                        {departureDate ? (
                          <div className="grid gap-2 text-xs">
                            <div className="font-semibold text-[var(--brand-primary)]">
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
                                    className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
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
                            <div className="font-semibold text-[var(--brand-primary)]">
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
                                  className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {nearbyAirports(destination).length > 0 ? (
                          <div className="grid gap-2 text-xs">
                            <div className="font-semibold text-[var(--brand-primary)]">
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
                                  className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <span>{copy.runSearchToSee}</span>
                        <div className="text-xs font-semibold text-[var(--brand-primary)]">
                          {copy.sampleRoutesTitle}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {copy.sampleRoutes.map((route) => (
                            <button
                              key={`${route.origin}-${route.destination}`}
                              type="button"
                              onClick={() => {
                                setOrigin(route.origin);
                                setDestination(route.destination);
                                void runSearch({
                                  origin: route.origin,
                                  destination: route.destination,
                                  ignoreFlex: true,
                                });
                              }}
                              className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                            >
                              {route.label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 grid gap-2">
                          <div className="text-xs font-semibold text-[var(--brand-primary)]">
                            {copy.demoDealsTitle}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {copy.demoDeals.map((deal) => {
                              const badge = dealBadge(deal.score, copy);
                              return (
                                <div
                                  key={deal.route}
                                  className="rounded-xl border border-[var(--brand-border)] bg-white p-3 text-xs text-[var(--brand-ink)] shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-[11px] font-semibold text-[var(--brand-primary)]">
                                      {deal.route}
                                    </div>
                                    {badge ? (
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.tone}`}
                                      >
                                        {badge.label}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--brand-muted)]">
                                    <span>
                                      {formatMoney(deal.currency, deal.priceTotal)}
                                    </span>
                                    <span>
                                      {formatDurationMinutes(deal.durationMinutes)}
                                    </span>
                                    <span>
                                      {copy.stops}: {deal.stops}
                                    </span>
                                    <span title={copy.dealScoreTooltip}>
                                      {copy.dealScore}: {Math.round(deal.score * 100)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
                {!searchLoading &&
                offerView.offers.length > 0 &&
                searchFilteredOffers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--brand-border)] p-4 text-sm text-[var(--brand-muted)]">
                    {copy.noResultsForFilters}
                  </div>
                ) : null}

                {searchFilteredOffers.slice(0, visibleOfferCount).map((offer) => {
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
                  const estTotal = Number.isFinite(priceValue)
                    ? Math.round(priceValue * (1 + ESTIMATED_FEE_RATE)).toString()
                    : null;
                  const airlines = offer.validatingAirlineCodes;
                  const primaryAirline = airlines[0] ?? "";
                  const airlineLabel = primaryAirline
                    ? airlines.length > 1
                      ? `${airlineName(primaryAirline)} +${airlines.length - 1}`
                      : airlineName(primaryAirline)
                    : "—";
                  const purchaseUrlRaw = buildPurchaseUrl({
                    partner: purchasePartner,
                    origin,
                    destination,
                    departureDate,
                    returnDate: returnDate || undefined,
                    adults,
                    airlineCode: offer.validatingAirlineCodes[0],
                  });
                  const purchaseUrl = addCacheBuster(purchaseUrlRaw);
                  return (
                  <div
                    key={offer.id}
                    className="rounded-xl border border-[var(--brand-border)] border-t-2 border-t-[var(--brand-accent)] bg-white p-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-lg font-semibold text-[var(--brand-ink)]">
                          {formatMoney(offer.currency, offer.priceTotal)}
                        </div>
                        {estTotal ? (
                          <div className="mt-1 text-[11px] text-[var(--brand-muted)]">
                            {copy.estTotalLabel}: {formatMoney(offer.currency, estTotal)}
                          </div>
                        ) : null}
                        <div className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs text-[var(--brand-primary)]">
                          {searchSort === "best" && typeof score === "number" ? (
                            <span title={copy.dealScoreTooltip}>
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
                                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg bg-[#001F3F] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
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
                              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg bg-[#001F3F] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                {warning.label.replace(copy.outlierPrefix, "")}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-full bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)] ring-1 ring-[var(--brand-border)]">
                        {airlineLabel}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                          {copy.totalDuration}
                        </div>
                        <div className="text-xs font-semibold text-[var(--brand-ink)]">
                          {formatDurationMinutes(duration)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                          {copy.stops}
                        </div>
                        <div className="text-xs font-semibold text-[var(--brand-ink)]">
                          {typeof stops === "number" ? stops : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                          {copy.airlines}
                        </div>
                        <div className="text-xs font-semibold text-[var(--brand-ink)]">
                          {airlines.length ? airlines.map(airlineName).join(", ") : "—"}
                        </div>
                      </div>
                    </div>
                    {Number.isFinite(avgPrice) && avgPrice > 0 ? (
                      <div className="mt-2 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2 text-[10px] text-[var(--brand-muted)]">
                        <div className="font-semibold text-[var(--brand-primary)]">
                          {isBest ? copy.whyBestValue : copy.whyThisOffer}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3">
                          <span>
                            Price: {formatMoney(offer.currency, offer.priceTotal)} vs avg{" "}
                            {formatMoney(offer.currency, String(avgPrice))}
                          </span>
                          <span>
                            Duration: {formatDurationMinutes(duration)} vs avg{" "}
                            {Number.isFinite(avgDuration) ? formatDurationMinutes(avgDuration) : "—"}
                          </span>
                          <span>
                            Stops: {typeof stops === "number" ? stops : "—"} vs avg {avgStopsLabel}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 rounded-lg border border-[var(--brand-border)] bg-[color:rgba(0,123,255,0.08)] px-3 py-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                      {copy.bookOnPartnerSites}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {offer.itineraries.map((it, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[var(--brand-border)] bg-[color:rgba(0,123,255,0.08)] p-3 text-xs text-[var(--brand-ink)]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-[var(--brand-ink)]">
                              <span className="rounded-md bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 ring-1 ring-[var(--brand-border)]">
                                {it.segments[0]?.departure.iataCode}
                              </span>{" "}
                              <span className="text-[var(--brand-primary)]">→</span>{" "}
                              <span className="rounded-md bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 ring-1 ring-[var(--brand-border)]">
                                {it.segments[it.segments.length - 1]?.arrival.iataCode}
                              </span>
                            </div>
                            <div className="text-[var(--brand-primary)]">
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
                                    <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-[var(--brand-primary)]">
                                      <span className="rounded-full bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 ring-1 ring-[var(--brand-border)]">
                                        {copy.flightLabel} {seg.carrierCode}
                                        {seg.number}
                                      </span>
                                      <span className="rounded-full bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 ring-1 ring-[var(--brand-border)]">
                                        {formatIsoDuration(seg.duration)}
                                      </span>
                                      <span className="rounded-full bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 ring-1 ring-[var(--brand-border)]">
                                        {copy.stops}: {seg.numberOfStops}
                                      </span>
                                    </div>
                                  </div>
                                  {next && typeof layoverMinutes === "number" ? (
                                    <div className="mt-2 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-primary)]">
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
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-white/90 px-2 py-2 shadow-sm ring-1 ring-[var(--brand-border)] backdrop-blur-sm sm:static sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:ring-0 sticky bottom-3 z-10">
                      {purchaseUrl ? (
                        <a
                          href={purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--brand-primary)] to-[#0069D9] px-3 text-xs font-semibold text-white shadow-sm hover:from-[#0069D9] hover:to-[var(--brand-primary)]"
                        >
                          {copy.buy}
                        </a>
                      ) : (
                        <span className="inline-flex h-8 items-center rounded-lg border border-[var(--brand-border)] px-3 text-xs text-[var(--brand-primary)]">
                          {copy.buyUnavailable}
                        </span>
                      )}
                      {purchaseUrlRaw ? (
                        <button
                          type="button"
                          onClick={() => void shareDealLink(purchaseUrlRaw)}
                          className="inline-flex h-8 items-center rounded-lg border border-[var(--brand-border)] bg-white px-3 text-xs font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                        >
                          {copy.shareDeal}
                        </button>
                      ) : null}
                      <span className="text-[10px] font-semibold text-[var(--brand-muted)]">
                        Prices can change fast.
                      </span>
                    </div>
                  </div>
                  );
                })}
                {searchFilteredOffers.length > visibleOfferCount ? (
                  <div ref={offerSentinelRef} className="h-6" />
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <section
            id="explore"
            className="-mt-6 grid items-start gap-6 scroll-mt-20 lg:grid-cols-[420px_1fr]"
          >
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-lg ring-2 ring-[var(--brand-border)]">
              <h2 className="text-sm font-semibold">{copy.exploreTitle}</h2>
              <p className="mt-1 text-xs text-[var(--brand-muted)]">{copy.exploreNote}</p>

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
                  <label className="relative text-xs font-medium text-[var(--brand-ink)]">
                    <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] text-[var(--brand-ink)]">
                      {copy.maxPrice}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={exploreMaxPrice}
                      onChange={(e) => setExploreMaxPrice(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 pt-3 pb-1 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-[var(--brand-primary)]">
                    {copy.exploreMonthTitle}
                  </span>
                  {(
                    [
                      { key: "any", label: copy.exploreMonthPresets.any },
                      { key: "thisMonth", label: copy.exploreMonthPresets.thisMonth },
                      { key: "nextMonth", label: copy.exploreMonthPresets.nextMonth },
                      { key: "next3Months", label: copy.exploreMonthPresets.next3Months },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyExploreMonthPreset(preset.key)}
                      className={`rounded-full border px-3 py-1 font-semibold transition ${
                        exploreMonthPreset === preset.key
                          ? "border-[var(--brand-primary)] bg-[color:rgba(0,123,255,0.12)] text-[var(--brand-primary)]"
                          : "border-[var(--brand-border)] bg-white text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.depart}
                    <input
                      type="date"
                      value={exploreDepartureDate}
                      onChange={(e) => {
                        setExploreDepartureDate(e.target.value);
                        setExploreMonthPreset("any");
                      }}
                      placeholder={copy.datePlaceholder}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.returnOptional}
                    <input
                      type="date"
                      value={exploreReturnDate}
                      onChange={(e) => {
                        setExploreReturnDate(e.target.value);
                        setExploreMonthPreset("any");
                      }}
                      placeholder={copy.datePlaceholder}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.adults}
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={exploreAdults}
                      onChange={(e) => setExploreAdults(Number(e.target.value))}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[var(--brand-ink)]">
                    {copy.currency}
                    <input
                      value={exploreCurrency}
                      onChange={(e) => setExploreCurrency(e.target.value.toUpperCase())}
                      className="h-10 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
                      placeholder="USD"
                    />
                  </label>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={exploreNonStop}
                      onChange={(e) => setExploreNonStop(e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-success)]"
                    />
                    <span className="text-sm text-[var(--brand-ink)]">{copy.nonstop}</span>
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
                    className="rounded-xl border border-[color:rgba(253,126,20,0.35)] bg-[color:rgba(253,126,20,0.12)] px-3 py-2 text-xs text-[var(--brand-accent)]"
                    role="status"
                    aria-live="polite"
                  >
                    {exploreError}
                  </div>
                ) : null}
              </form>
            </div>

            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-lg ring-2 ring-[var(--brand-border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{copy.dealsTitle}</h2>
                <div className="text-xs text-[var(--brand-primary)]">
                  {exploreResults ? `${exploreResults.deals.length} ${copy.destinationsLabel}` : "—"}
                </div>
              </div>
              <div className="mt-3 grid gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3 text-xs text-[var(--brand-ink)]">
                <div className="text-[11px] font-semibold text-[var(--brand-primary)]">
                  {copy.monthlyPicksTitle}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {copy.monthlyPicks.map((pick) => (
                    <div
                      key={pick.month}
                      className="min-w-[140px] rounded-lg border border-[var(--brand-border)] bg-white p-2 text-[11px]"
                    >
                      <div className="font-semibold text-[var(--brand-primary)]">{pick.month}</div>
                      <div className="mt-1 grid gap-1 text-[10px] text-[var(--brand-muted)]">
                        {pick.routes.map((route) => (
                          <span key={route}>{route}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-2 rounded-xl border border-[var(--brand-border)] bg-white p-3 text-xs text-[var(--brand-ink)]">
                <div className="text-[11px] font-semibold text-[var(--brand-primary)]">
                  {copy.topCheapestTitle}
                </div>
                {topCheapestDeals.length === 0 ? (
                  <div className="text-[11px] text-[var(--brand-muted)]">{copy.runExploreToSee}</div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {topCheapestDeals.map((deal) => (
                      <div
                        key={`${deal.destination}-${deal.priceTotal}-${deal.departureDate ?? ""}-top`}
                        className="min-w-[160px] rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2"
                      >
                        <div className="text-[11px] font-semibold text-[var(--brand-primary)]">
                          {airportLabel(deal.destination)}
                        </div>
                        <div className="mt-1 text-[12px] font-semibold text-[var(--brand-ink)]">
                          {formatMoney(deal.currency, deal.priceTotal)}
                        </div>
                        <div className="mt-1 text-[10px] text-[var(--brand-muted)]">
                          {deal.departureDate ?? copy.depart}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--brand-primary)]">
                <label className="flex items-center gap-2">
                  {copy.buyVia}
                  <select
                    value={explorePurchasePartner}
                    onChange={(e) => setExplorePurchasePartner(e.target.value as PurchasePartner)}
                    className="h-8 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 text-xs text-[var(--brand-ink)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:rgba(0,123,255,0.2)]"
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
                {exploreLoading ? (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--brand-border)]">
                    <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-[var(--brand-primary)] to-[#0069D9]" />
                  </div>
                ) : null}
                {!exploreLoading && exploreView.deals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--brand-border)] p-6 text-sm text-[var(--brand-muted)]">
                    {copy.runExploreToSee}
                  </div>
                ) : null}

                {exploreView.deals.slice(0, visibleExploreCount).map((deal, idx) => {
                  const key = `${deal.destination}-${deal.priceTotal}-${deal.departureDate ?? ""}`;
                  const warning = warningBadge(exploreView.outliers.get(key), copy);
                  const dealPrice = Number(deal.priceTotal);
                  const insight = destinationInsights.get(deal.destination);
                  const seasonalityLabel =
                    Number.isFinite(dealPrice) && insight
                      ? getSeasonalityLabel(deal.destination, dealPrice)
                      : null;
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
                    className="rounded-xl border border-[var(--brand-border)] border-t-2 border-t-[var(--brand-success)] bg-white p-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--brand-ink)]">
                        {airportLabel(deal.destination)}
                      </div>
                      <div className="text-sm font-semibold text-[var(--brand-ink)]">
                        {formatMoney(deal.currency, deal.priceTotal)}
                      </div>
                    </div>
                    {insight?.sparklinePoints ? (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--brand-muted)]">
                        <svg
                          width="72"
                          height="18"
                          viewBox="0 0 72 18"
                          role="img"
                          aria-label={`${copy.bestMonthsLabel}: ${insight.bestMonths || "—"}`}
                        >
                          <polyline
                            fill="none"
                            stroke="var(--brand-primary)"
                            strokeWidth="1.5"
                            points={insight.sparklinePoints}
                          />
                        </svg>
                        <span>
                          {copy.bestMonthsLabel}: {insight.bestMonths || "—"}
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                      {Number.isFinite(exploreMaxPrice) ? (
                        <span className="rounded-full bg-[color:rgba(253,126,20,0.18)] px-2 py-0.5 text-[var(--brand-ink)] ring-1 ring-[color:rgba(253,126,20,0.4)]">
                          {copy.budgetCap}: {formatMoney(exploreCurrency, String(exploreMaxPrice))}
                        </span>
                      ) : null}
                      {exploreNonStop ? (
                        <span className="rounded-full bg-[color:rgba(40,167,69,0.12)] px-2 py-0.5 text-[var(--brand-success)] ring-1 ring-[color:rgba(40,167,69,0.3)]">
                          {copy.nonstopOnly}
                        </span>
                      ) : null}
                      {seasonalityLabel ? (
                        <span className="rounded-full bg-[color:rgba(0,123,255,0.12)] px-2 py-0.5 text-[var(--brand-primary)] ring-1 ring-[var(--brand-border)]">
                          {seasonalityLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                          {copy.duration}
                        </div>
                        <div className="text-xs font-semibold text-[var(--brand-ink)]">
                          {formatDurationMinutes(deal.durationMinutes)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                          {copy.maxStops}
                        </div>
                        <div className="text-xs font-semibold text-[var(--brand-ink)]">
                          {typeof deal.maxStops === "number" ? deal.maxStops : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[var(--brand-surface)] px-2 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                          {copy.tripLength}
                        </div>
                        <div className="text-xs font-semibold text-[var(--brand-ink)]">
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
                          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg bg-[#001F3F] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                            {warning.label.replace(copy.outlierPrefix, "")}
                          </span>
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-2 text-xs text-[var(--brand-muted)]">
                      {deal.departureDate ? `${copy.departLabel}: ${deal.departureDate}` : null}
                      {deal.returnDate ? ` • ${copy.returnLabel}: ${deal.returnDate}` : null}
                      {typeof tripDays === "number"
                        ? ` • ${copy.tripLength}: ${tripDays} ${copy.daysLabel}`
                        : null}
                    </div>
                    <div className="mt-3 rounded-lg border border-[var(--brand-border)] bg-[color:rgba(0,123,255,0.08)] px-3 py-2 text-[11px] font-semibold text-[var(--brand-primary)]">
                      {copy.bookOnPartnerSites}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white/90 px-2 py-2 shadow-sm ring-1 ring-[var(--brand-border)] backdrop-blur-sm sm:static sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:ring-0 sticky bottom-3 z-10">
                      {purchaseUrl ? (
                        <a
                          href={purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--brand-primary)] to-[#0069D9] px-3 text-xs font-semibold text-white shadow-sm hover:from-[#0069D9] hover:to-[var(--brand-primary)]"
                        >
                          {copy.buy}
                        </a>
                      ) : (
                        <span className="inline-flex h-8 items-center rounded-lg border border-[var(--brand-border)] px-3 text-xs text-[var(--brand-primary)]">
                          {copy.buyUnavailable}
                        </span>
                      )}
                      {purchaseUrl ? (
                        <button
                          type="button"
                          onClick={() => void shareDealLink(purchaseUrl)}
                          className="inline-flex h-8 items-center rounded-lg border border-[var(--brand-border)] bg-white px-3 text-xs font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
                        >
                          {copy.shareDeal}
                        </button>
                      ) : null}
                      <span className="text-[10px] font-semibold text-[var(--brand-muted)]">
                        Prices can change fast.
                      </span>
                      {explorePurchasePartner === "klook" && klookUrl ? (
                        <a
                          href={klookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-medium text-[var(--brand-primary)] hover:underline"
                        >
                          {copy.klookCta}
                        </a>
                      ) : null}
                      {deal.links?.flightOffers ? (
                        <a
                          href={deal.links.flightOffers}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-medium text-[var(--brand-primary)] hover:underline"
                        >
                          {copy.viewAmadeusOffer}
                        </a>
                      ) : null}
                    </div>
                    {SHOW_EXPLORE_LINKS && purchaseUrl ? (
                      <div className="mt-2 max-w-full rounded-lg border border-dashed border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-1 text-[10px] text-[var(--brand-primary)] break-all">
                        {purchaseUrl}
                      </div>
                    ) : null}
                  </div>
                );
                })}
                {exploreView.deals.length > visibleExploreCount ? (
                  <div ref={exploreSentinelRef} className="h-6" />
                ) : null}
              </div>
            </div>
          </section>
        )}
        <div
          className="mt-10 text-center text-xs font-semibold text-white/80 scroll-mt-20"
          id="contact"
        >
          {copy.contactLabel}:{" "}
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
          <div className="grid w-full max-w-md gap-3 rounded-2xl bg-white/10 p-4 text-center text-xs text-white/90 ring-1 ring-white/20">
            <div className="text-sm font-semibold text-white">{copy.faqTitle}</div>
            {copy.faqItems.map((item) => (
              <div key={item.question}>
                <div className="font-semibold">{item.question}</div>
                <div className="text-white/80">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center text-xs font-semibold text-white/80">
          {copy.poweredBy}
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
          {copy.affiliateDisclosure}
        </div>
        <div className="mt-2 text-center text-[11px] text-white/70">
          © {new Date().getFullYear()} Ticket Wiz. {copy.rightsReserved}
        </div>
        </main>
      </div>
    </div>
  );
}

