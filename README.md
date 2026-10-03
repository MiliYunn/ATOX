# Sahabat Transport Concierge

A runnable reference implementation of a Malaysia hotel transport help module. It includes a responsive “Getting Here” page, concierge chat patterns, map links, station details, estimate-labelled route cards, a confirmation-gated airport transfer form, and an admin request queue.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:8787`.

## Verify

```bash
npm test
npm run build
```

## Agent tool endpoints

| Tool | Endpoint |
| --- | --- |
| `get_transport_options` | `POST /api/tools/get_transport_options` |
| `get_nearest_transit` | `GET /api/tools/get_nearest_transit?hotel_id=...` |
| `get_route` | `POST /api/tools/get_route` |
| `estimate_ride_fare` | `POST /api/tools/estimate_ride_fare` |
| `get_transit_schedule` | `GET /api/tools/get_transit_schedule?route=...&date=...` |
| `book_transfer` | `POST /api/tools/book_transfer` |

Tool schemas and agent rules live in `server/agent-tools.ts`; the proposed relational schema is in `server/schema.sql`.

## Production integrations

The reference app uses deterministic Malaysia seed data and a small JSON request store so it works without credentials. In production, connect `get_route` to Google Directions or OpenRouteService, replace the request store with the included SQL tables, and put route/station responses behind Redis with an expiry. Hotel-authored shuttle rates and local tips should be retrieved before generic transport data.
