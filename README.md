## Ticket Wiz

Browser app for finding flight deals:

- **Search**: route + dates → flight offers
- **Explore**: origin + budget → cheap destination ideas

Powered (currently) by **Amadeus Self‑Service APIs**.

## Getting Started

1) Create a local env file:

```bash
cp .env.example .env.local
```

Then fill in your Amadeus credentials in `.env.local`.

2) Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints (local)

- `GET /api/flights/search?origin=MIA&destination=JFK&departureDate=2026-03-01&adults=1&currency=USD&nonStop=false&max=20`
- `GET /api/flights/explore?origin=MIA&currency=USD&maxPrice=250&nonStop=false`

## Notes

- **Secrets**: Never expose `AMADEUS_CLIENT_SECRET` to the browser; keep it server-side via the API routes.
- **Explore prices**: The explore endpoint returns cached “inspiration” prices; use Search for live-ish offers.

