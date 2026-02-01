/**
 * Social media posting utilities for Facebook and Instagram
 */

const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v21.0";

interface FacebookPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

interface WeeklyDealPost {
  origin: string;
  destination: string;
  price: number;
  currency: string;
  airline?: string;
  duration?: string;
  stops?: number;
  departureDate?: string;
  bookingUrl: string;
}

/**
 * Post to Facebook Page
 */
export async function postToFacebook(
  message: string,
  link?: string
): Promise<FacebookPostResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    console.error("Missing Facebook credentials");
    return {
      success: false,
      error: "Missing FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN",
    };
  }

  try {
    const url = `${FACEBOOK_GRAPH_API}/${pageId}/feed`;

    const body: Record<string, string> = {
      message,
      access_token: accessToken,
    };

    if (link) {
      body.link = link;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Facebook API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to post to Facebook",
      };
    }

    console.log("Facebook post created:", data.id);
    return {
      success: true,
      postId: data.id,
    };
  } catch (error) {
    console.error("Facebook posting error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format a weekly deal for social media posting
 */
export function formatWeeklyDealPost(deal: WeeklyDealPost): string {
  const { origin, destination, price, currency, airline, duration, stops, departureDate } = deal;

  const currencySymbol = currency === "USD" ? "$" : currency;
  const stopsText = stops === 0 ? "Direct flight" : stops === 1 ? "1 stop" : `${stops} stops`;

  let post = `✈️ Weekly Deal: ${origin} → ${destination} from ${currencySymbol}${price}\n\n`;

  if (airline) {
    post += `🛫 ${airline}\n`;
  }

  if (duration) {
    post += `⏱️ ${duration}\n`;
  }

  if (stops !== undefined) {
    post += `📍 ${stopsText}\n`;
  }

  if (departureDate) {
    post += `📅 ${departureDate}\n`;
  }

  post += `\n🔗 Book now at ticket-wiz.com\n\n`;
  post += `#FlightDeals #TravelDeals #CheapFlights #Travel #${destination.replace(/\s+/g, "")}`;

  return post;
}

/**
 * Post weekly deal to all configured social platforms
 */
export async function postWeeklyDealToSocial(
  deal: WeeklyDealPost
): Promise<{ facebook?: FacebookPostResult }> {
  const results: { facebook?: FacebookPostResult } = {};

  const message = formatWeeklyDealPost(deal);

  // Post to Facebook if configured
  if (process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN) {
    results.facebook = await postToFacebook(message, deal.bookingUrl);
  }

  // Instagram posting would go here (requires additional setup)
  // Instagram via Graph API requires a linked Facebook Page and different endpoints

  return results;
}
