const KLOOK_SEARCH_URL_TEMPLATE = process.env.NEXT_PUBLIC_KLOOK_SEARCH_URL_TEMPLATE ?? "";
const KIWI_DEEPLINK_TEMPLATE = process.env.NEXT_PUBLIC_KIWI_DEEPLINK_TEMPLATE ?? "";
const KIWI_DIRECT_LINKS = (process.env.NEXT_PUBLIC_KIWI_DIRECT_LINKS ?? "false") === "true";

const KIWI_LOCATION_SLUGS: Record<string, string> = {
  ATL: "atlanta-georgia-united-states",
  BOS: "boston-massachusetts-united-states",
  CLT: "charlotte-north-carolina-united-states",
  DEN: "denver-colorado-united-states",
  DFW: "dallas-texas-united-states",
  EWR: "newark-new-jersey-united-states",
  IAH: "houston-texas-united-states",
  JFK: "new-york-city-new-york-united-states",
  LAS: "las-vegas-nevada-united-states",
  LAX: "los-angeles-california-united-states",
  LGA: "new-york-city-new-york-united-states",
  MCO: "orlando-florida-united-states",
  MIA: "miami-florida-united-states",
  ORD: "chicago-illinois-united-states",
  PHX: "phoenix-arizona-united-states",
  SEA: "seattle-washington-united-states",
  SFO: "san-francisco-california-united-states",
};

function formatDateParam(date: string | undefined) {
  if (!date) return null;
  return date.replaceAll("-", "");
}

export function buildKlookSearchUrl(query: string) {
  if (!KLOOK_SEARCH_URL_TEMPLATE.trim()) return null;
  const trimmed = KLOOK_SEARCH_URL_TEMPLATE.trim();
  if (trimmed.includes("{query}")) {
    return trimmed.replaceAll("{query}", encodeURIComponent(query));
  }
  const joiner = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${joiner}query=${encodeURIComponent(query)}`;
}

export function buildKiwiAffiliateUrl(args: {
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

export function buildKiwiDeepLink(args: {
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

export function buildSkyscannerLink(args: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
}) {
  const origin = args.origin.trim().toUpperCase().toLowerCase();
  const destination = args.destination.trim().toUpperCase().toLowerCase();
  const depart = formatDateParam(args.departureDate);
  if (!depart) return null;
  const ret = formatDateParam(args.returnDate);
  const adults = Math.max(1, args.adults);
  return ret
    ? `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${depart}/${ret}/?adults=${adults}`
    : `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${depart}/?adults=${adults}`;
}

export function buildKayakLink(args: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
}) {
  const origin = args.origin.trim().toUpperCase().toLowerCase();
  const destination = args.destination.trim().toUpperCase().toLowerCase();
  const depart = formatDateParam(args.departureDate);
  if (!depart) return null;
  const ret = formatDateParam(args.returnDate);
  const adults = Math.max(1, args.adults);
  return ret
    ? `https://www.kayak.com/flights/${origin}-${destination}/${depart}/${ret}?adults=${adults}`
    : `https://www.kayak.com/flights/${origin}-${destination}/${depart}?adults=${adults}`;
}

export const PARTNER_ENV = {
  KLOOK_SEARCH_URL_TEMPLATE,
  KIWI_DEEPLINK_TEMPLATE,
  KIWI_DIRECT_LINKS,
};
