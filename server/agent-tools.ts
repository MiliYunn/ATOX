export const transportAgentInstructions = `
You are the hotel's Malaysia transport concierge.
- Ask for missing details one at a time in this order: arrival time and terminal, guest count, luggage, comfort versus budget, then mobility needs.
- Return two or three suitable options and label the cheapest, fastest and most comfortable choices where applicable.
- Every recommendation must include estimated duration, estimated MYR cost and step-by-step directions.
- Mention peak-hour traffic for routes in Kuala Lumpur, Penang and Johor Bahru.
- Say “prices and times may vary” and link to an official operator when one is available.
- Never describe an estimated fare or static schedule as live or guaranteed.
- Give the airport pickup zone or hotel entrance for e-hailing; do not attempt to book an e-hailing ride.
- Before calling book_transfer, summarize every pickup detail and ask for explicit confirmation. Never infer confirmation.
- If reliable data is unavailable, say so and offer to contact the hotel. After midnight, prefer e-hailing or a hotel-arranged taxi.
- After a confirmed stay and shared flight details, offer a pre-booked transfer. Before arrival, ask: “How are you arriving? I can share the best route to the hotel.”
`;

export const transportToolDefinitions = [
  {
    name: 'get_transport_options',
    description: 'Rank transport modes between two places, with estimated MYR cost, duration and steps.',
    inputSchema: { type: 'object', required: ['origin', 'destination', 'depart_time', 'passengers', 'luggage'], properties: { origin: { type: 'string' }, destination: { type: 'string' }, depart_time: { type: 'string', format: 'date-time' }, passengers: { type: 'integer', minimum: 1 }, luggage: { type: 'integer', minimum: 0 } } },
  },
  {
    name: 'get_nearest_transit', description: 'Find nearby rail or bus stops for a hotel.',
    inputSchema: { type: 'object', required: ['hotel_id'], properties: { hotel_id: { type: 'string' } } },
  },
  {
    name: 'get_route', description: 'Get an estimated route, distance, duration and shareable map link.',
    inputSchema: { type: 'object', required: ['origin', 'destination', 'mode'], properties: { origin: { type: 'string' }, destination: { type: 'string' }, mode: { enum: ['walking', 'transit', 'driving', 'cycling'] } } },
  },
  {
    name: 'estimate_ride_fare', description: 'Estimate Grab/taxi fare using distance rules. This never returns a live fare.',
    inputSchema: { type: 'object', required: ['origin', 'destination'], properties: { origin: { type: 'string' }, destination: { type: 'string' } } },
  },
  {
    name: 'get_transit_schedule', description: 'Look up static train or ferry timetables where available.',
    inputSchema: { type: 'object', required: ['route', 'date'], properties: { route: { type: 'string' }, date: { type: 'string', format: 'date' } } },
  },
  {
    name: 'book_transfer', description: 'Create a hotel airport transfer request. Call only after explicit guest confirmation.',
    inputSchema: { type: 'object', required: ['hotel_booking_id', 'pickup_details', 'confirmed'], properties: { hotel_booking_id: { type: 'string' }, pickup_details: { type: 'object' }, confirmed: { const: true } } },
  },
] as const;
