import cors from 'cors';
import express from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { airportLabel, estimateRideFare, getTransportOptions, hotel, intercity, nearestTransit, schedules } from './transport.ts';

export type TransferRequest = {
  id: string;
  hotelBookingId: string;
  pickupLocation: string;
  flightNumber: string;
  pickupAt: string;
  passengers: number;
  luggage: number;
  vehicleType: string;
  quotedPriceMyr: number;
  status: 'pending';
  confirmedByGuestAt: string;
  createdAt: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const storePath = join(__dirname, 'data', 'transfer-requests.json');
const app = express();
app.use(cors());
app.use(express.json());

function loadTransfers(): TransferRequest[] {
  if (!existsSync(storePath)) return [];
  try { return JSON.parse(readFileSync(storePath, 'utf8')) as TransferRequest[]; } catch { return []; }
}

function saveTransfers(items: TransferRequest[]) {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(items, null, 2));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/hotels/:hotelId/getting-here', (req, res) => {
  if (req.params.hotelId !== hotel.id) return res.status(404).json({ error: 'Hotel not found' });
  res.json({ hotel, nearestStations: nearestTransit(), airport: { name: 'KLIA Terminal 2', distanceKm: 58, driveTime: '55–90 min' } });
});

app.post('/api/tools/get_transport_options', (req, res) => {
  const { origin, destination = hotel.name, passengers = 1, luggage = 1 } = req.body ?? {};
  if (!origin) return res.status(400).json({ error: 'origin is required' });
  res.json({ origin: airportLabel(origin), destination, options: getTransportOptions(origin, destination, passengers, luggage), disclaimer: 'Estimated prices and times may vary with traffic, demand and operator changes.' });
});

app.get('/api/tools/get_nearest_transit', (req, res) => {
  if (req.query.hotel_id && req.query.hotel_id !== hotel.id) return res.status(404).json({ error: 'No station data for this hotel. Ask the hotel for local transport guidance.' });
  res.json({ hotelId: hotel.id, stations: nearestTransit(), cached: true });
});

app.post('/api/tools/get_route', (req, res) => {
  const { origin, destination, mode = 'driving' } = req.body ?? {};
  if (!origin || !destination) return res.status(400).json({ error: 'origin and destination are required' });
  const mapLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${encodeURIComponent(mode)}`;
  res.json({ origin, destination, mode, distanceKm: origin.toLowerCase().includes('klia') ? 58 : 4.2, duration: origin.toLowerCase().includes('klia') ? '55–90 min' : '15–30 min', mapLink, provider: 'Google Maps link; duration is an estimate' });
});

app.post('/api/tools/estimate_ride_fare', (req, res) => {
  const { distanceKm = 10, peak = false } = req.body ?? {};
  res.json({ ...estimateRideFare(Number(distanceKm), Boolean(peak)), disclaimer: 'Estimate only — not a live Grab or taxi quote. Tolls and surcharges may apply.' });
});

app.get('/api/tools/get_transit_schedule', (req, res) => {
  const key = String(req.query.route ?? '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '');
  const schedule = schedules[key as keyof typeof schedules];
  if (!schedule) return res.status(404).json({ error: 'A reliable schedule is not available for this route. Please check with the operator or ask the hotel to contact them.' });
  res.json({ route: key, date: req.query.date, ...schedule, disclaimer: 'Times may vary. Confirm with the official operator before travel.' });
});

app.post('/api/tools/book_transfer', (req, res) => {
  const { hotelBookingId, pickupDetails, confirmed } = req.body ?? {};
  if (!confirmed) return res.status(409).json({ requiresConfirmation: true, error: 'Explicit guest confirmation is required before creating the transfer request.' });
  if (!hotelBookingId || !pickupDetails?.pickupLocation || !pickupDetails?.pickupAt || !pickupDetails?.flightNumber) {
    return res.status(400).json({ error: 'Booking ID, pickup location, flight number and pickup time are required.' });
  }
  const request: TransferRequest = {
    id: `TR-${Date.now().toString(36).toUpperCase()}`,
    hotelBookingId,
    pickupLocation: pickupDetails.pickupLocation,
    flightNumber: pickupDetails.flightNumber,
    pickupAt: pickupDetails.pickupAt,
    passengers: Number(pickupDetails.passengers || 1),
    luggage: Number(pickupDetails.luggage || 1),
    vehicleType: pickupDetails.vehicleType || 'Sedan',
    quotedPriceMyr: Number(pickupDetails.quotedPriceMyr || 120),
    status: 'pending',
    confirmedByGuestAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const items = loadTransfers();
  items.unshift(request);
  saveTransfers(items);
  res.status(201).json({ request, message: 'Transfer request sent to the hotel. This is a request, not a confirmed booking.' });
});

app.get('/api/admin/transfer-requests', (_req, res) => res.json({ requests: loadTransfers() }));
app.get('/api/intercity', (_req, res) => res.json(intercity));

const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*splat}', (_req, res) => res.sendFile(join(distPath, 'index.html')));
}

const port = Number(process.env.PORT || 8787);
if (process.env.NODE_ENV !== 'test') app.listen(port, () => console.log(`Transport concierge API on http://localhost:${port}`));

export { app, loadTransfers };
