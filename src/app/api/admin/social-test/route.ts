import { NextResponse } from "next/server";
import { postToFacebook, formatWeeklyDealPost } from "@/lib/social";
import { getWeeklyDeal } from "@/lib/weeklyDeal";

/**
 * POST /api/admin/social-test
 * Test posting to social media (Facebook)
 * Requires ADMIN_TOKEN for authentication
 */
export async function POST(request: Request) {
  // Verify admin token
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if Facebook is configured
    if (!process.env.FACEBOOK_PAGE_ID || !process.env.FACEBOOK_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Facebook credentials not configured" },
        { status: 400 }
      );
    }

    // Get the weekly deal
    const dealResult = await getWeeklyDeal();

    if (!dealResult) {
      return NextResponse.json(
        { error: "No weekly deal found" },
        { status: 404 }
      );
    }

    const { deal } = dealResult;

    // Extract deal info for the post
    const outboundItinerary = deal.itineraries[0];
    const firstSegment = outboundItinerary.segments[0];
    const lastSegment = outboundItinerary.segments[outboundItinerary.segments.length - 1];

    const origin = firstSegment.departure.iataCode;
    const destination = lastSegment.arrival.iataCode;
    const price = parseFloat(deal.price.total);
    const currency = deal.price.currency;
    const airline = deal.validatingAirlineCodes?.[0];
    const duration = outboundItinerary.duration?.replace("PT", "").toLowerCase();
    const stops = outboundItinerary.segments.length - 1;
    const departureDate = firstSegment.departure.at?.split("T")[0];

    // Format the post
    const message = formatWeeklyDealPost({
      origin,
      destination,
      price,
      currency,
      airline,
      duration,
      stops,
      departureDate,
      bookingUrl: "https://ticket-wiz.com",
    });

    // Post to Facebook
    const result = await postToFacebook(message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        postId: result.postId,
        message: "Posted to Facebook successfully",
        preview: message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          preview: message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Social test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/social-test
 * Preview what the social post would look like (without posting)
 */
export async function GET(request: Request) {
  // Verify admin token
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the weekly deal
    const dealResult = await getWeeklyDeal();

    if (!dealResult) {
      return NextResponse.json(
        { error: "No weekly deal found" },
        { status: 404 }
      );
    }

    const { deal } = dealResult;

    // Extract deal info
    const outboundItinerary = deal.itineraries[0];
    const firstSegment = outboundItinerary.segments[0];
    const lastSegment = outboundItinerary.segments[outboundItinerary.segments.length - 1];

    const origin = firstSegment.departure.iataCode;
    const destination = lastSegment.arrival.iataCode;
    const price = parseFloat(deal.price.total);
    const currency = deal.price.currency;
    const airline = deal.validatingAirlineCodes?.[0];
    const duration = outboundItinerary.duration?.replace("PT", "").toLowerCase();
    const stops = outboundItinerary.segments.length - 1;
    const departureDate = firstSegment.departure.at?.split("T")[0];

    // Format the post
    const message = formatWeeklyDealPost({
      origin,
      destination,
      price,
      currency,
      airline,
      duration,
      stops,
      departureDate,
      bookingUrl: "https://ticket-wiz.com",
    });

    return NextResponse.json({
      preview: message,
      deal: {
        origin,
        destination,
        price,
        currency,
        airline,
        duration,
        stops,
        departureDate,
      },
      facebookConfigured: !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_ACCESS_TOKEN),
    });
  } catch (error) {
    console.error("Social preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
