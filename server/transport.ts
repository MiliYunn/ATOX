export type TransportOption = {
  id: string;
  mode: string;
  label: string;
  badge: 'Recommended' | 'Cheapest' | 'Fastest' | 'Most comfortable';
  duration: string;
  costMin: number;
  costMax: number;
  icon: 'train' | 'bus' | 'car';
  steps: string[];
  pickupTip?: string;
  officialUrl?: string;
};

export const hotel = {
  id: 'damai-kl-01',
  name: 'Hotel Damai Kuala Lumpur',
  address: 'Jalan Sultan Ismail, Bukit Bintang, Kuala Lumpur',
  lat: 3.1479,
  lng: 101.7104,
};

export const transitStations = [
  { id: 'bukit-bintang', name: 'Bukit Bintang', type: 'MRT', lat: 3.1467, lng: 101.7113, lines: ['Kajang Line'], walkMinutes: 4, distanceM: 320, tip: 'Use Entrance D on Jalan Bukit Bintang; lifts are available.' },
  { id: 'raja-chulan', name: 'Raja Chulan', type: 'Monorail', lat: 3.1508, lng: 101.7101, lines: ['KL Monorail'], walkMinutes: 6, distanceM: 450, tip: 'Useful for KL Sentral via one change at Hang Tuah.' },
  { id: 'conlay', name: 'Conlay', type: 'MRT', lat: 3.1507, lng: 101.7182, lines: ['Putrajaya Line'], walkMinutes: 13, distanceM: 980, tip: 'Change at Tun Razak Exchange for the Kajang Line.' },
];

const klia2Options: TransportOption[] = [
  {
    id: 'klia-ekspres', mode: 'Train + MRT', label: 'KLIA Ekspres', badge: 'Fastest', duration: '55–65 min', costMin: 57, costMax: 62, icon: 'train',
    steps: ['Follow signs to the KLIA Ekspres platform at Gateway@klia2.', 'Take KLIA Ekspres to KL Sentral (about 33 minutes).', 'Take the MRT Kajang Line from Muzium Negara to Bukit Bintang.', 'Use Exit D, then walk about 4 minutes to the hotel.'],
    officialUrl: 'https://www.kliaekspres.com',
  },
  {
    id: 'airport-bus', mode: 'Bus + MRT', label: 'Airport Coach', badge: 'Cheapest', duration: '1 hr 30 min–2 hr', costMin: 16, costMax: 22, icon: 'bus',
    steps: ['Buy a ticket at the Transportation Hub on Level 1.', 'Take an airport coach to KL Sentral.', 'Walk to Muzium Negara MRT and take the Kajang Line to Bukit Bintang.', 'Use Exit D, then walk about 4 minutes to the hotel.'],
    pickupTip: 'Buses leave from the Level 1 Transportation Hub.', officialUrl: 'https://www.klia2.info/buses/',
  },
  {
    id: 'ehailing', mode: 'Door to door', label: 'Grab / taxi', badge: 'Recommended', duration: '55–90 min', costMin: 75, costMax: 120, icon: 'car',
    steps: ['Book only after collecting your luggage.', 'Follow “e-hailing” signs to the designated pickup floor and bay shown in the app.', 'Show the driver the hotel name and Jalan Sultan Ismail address.', 'Ask to stop at the main lobby entrance.'],
    pickupTip: 'At KLIA2, check the app for the current Transportation Hub pickup floor and bay. Airport tolls or surcharges may apply.',
  },
];

const airportNames: Record<string, string> = {
  klia: 'Kuala Lumpur International Airport (KLIA)', klia2: 'KLIA Terminal 2', pen: 'Penang International Airport',
  lgk: 'Langkawi International Airport', bki: 'Kota Kinabalu International Airport', kch: 'Kuching International Airport',
  senai: 'Senai International Airport', szb: 'Sultan Abdul Aziz Shah Airport (Subang)',
};

const regionalAirportRules: Record<string, { duration: string; grab: [number, number]; private: [number, number] }> = {
  pen: { duration: '35–60 min', grab: [28, 50], private: [85, 140] },
  lgk: { duration: '20–35 min', grab: [18, 35], private: [70, 120] },
  bki: { duration: '15–30 min', grab: [12, 25], private: [65, 110] },
  kch: { duration: '20–35 min', grab: [18, 35], private: [70, 120] },
  senai: { duration: '30–55 min', grab: [35, 65], private: [95, 160] },
  szb: { duration: '35–70 min', grab: [35, 65], private: [110, 170] },
};

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }

export function getTransportOptions(origin: string, destination: string, passengers = 1, luggage = 1): TransportOption[] {
  const key = normalize(origin);
  if (key.includes('klia2') || key.includes('terminal2')) return [...klia2Options];
  if (key.includes('klia')) return klia2Options.map((option) => ({ ...option, duration: option.id === 'klia-ekspres' ? '50–60 min' : option.duration, costMin: option.id === 'ehailing' ? 70 : option.costMin, costMax: option.id === 'ehailing' ? 110 : option.costMax }));
  const airportKey = Object.keys(regionalAirportRules).find((code) => key.includes(code) || key.includes(normalize(airportNames[code])));
  if (airportKey) {
    const rule = regionalAirportRules[airportKey];
    return [
      { id: 'ehailing', mode: 'Door to door', label: 'Grab / taxi', badge: 'Recommended', duration: rule.duration, costMin: rule.grab[0], costMax: rule.grab[1], icon: 'car', steps: ['Collect your luggage before booking.', 'Follow signs to the airport e-hailing pickup zone.', `Travel directly to ${destination || 'the hotel'}.`], pickupTip: 'Confirm the plate number and driver in the app before entering.' },
      { id: 'private', mode: 'Meet & greet', label: 'Private transfer', badge: 'Most comfortable', duration: rule.duration, costMin: rule.private[0], costMax: rule.private[1], icon: 'car', steps: ['Share the flight number and arrival time.', 'Meet the driver in the arrivals hall.', 'Travel directly to the hotel with luggage assistance.'] },
    ];
  }
  return [
    { id: 'public', mode: 'Public transit', label: 'MRT / bus', badge: 'Cheapest', duration: '35–55 min', costMin: 3, costMax: 8, icon: 'train', steps: ['Walk to the nearest station.', 'Use the suggested line and interchange.', 'Walk from the destination stop.'] },
    { id: 'ehailing', mode: 'Door to door', label: 'Grab / taxi', badge: 'Recommended', duration: '20–40 min', costMin: 18, costMax: 38, icon: 'car', steps: ['Request pickup at the hotel main entrance.', `Travel directly to ${destination}.`, 'Check the app for the final live fare.'] },
  ];
}

export function estimateRideFare(distanceKm: number, peak = false) {
  const base = 5 + distanceKm * 1.65;
  const multiplier = peak ? 1.45 : 1;
  return { min: Math.max(8, Math.round(base * .9 * multiplier)), max: Math.round(base * 1.45 * multiplier), currency: 'MYR', livePrice: false };
}

export const schedules = {
  'kl-sentral-ipoh': { operator: 'KTM ETS', departures: ['07:10', '09:05', '11:30', '15:00', '18:00'], from: 'KL Sentral', to: 'Ipoh Railway Station', officialUrl: 'https://online.ktmb.com.my' },
  'langkawi-kuala-perlis': { operator: 'Langkawi Ferry Line', departures: ['07:30', '10:00', '13:30', '17:00'], from: 'Kuah Jetty', to: 'Kuala Perlis Jetty', officialUrl: 'https://www.langkawiferryline.com' },
  'mersing-tioman': { operator: 'Bluewater Express', departures: ['Subject to tide and weather'], from: 'Mersing Harbour Centre', to: 'Tioman Island', officialUrl: 'https://bluewater.my' },
};

export const intercity = {
  title: 'Kuala Lumpur → Penang',
  options: [
    { mode: 'ETS train', duration: '4–4.5 hr', cost: 'RM 60–95', note: 'KL Sentral to Butterworth; most comfortable city-centre option.' },
    { mode: 'Express bus', duration: '5–6.5 hr', cost: 'RM 35–55', note: 'From TBS to Sungai Nibong or Penang Sentral.' },
    { mode: 'Flight', duration: '1 hr flight', cost: 'RM 90–300+', note: 'Allow 3–4 hr total including airport transfers.' },
  ],
};

export function nearestTransit() { return transitStations; }

export function airportLabel(input: string) {
  const key = Object.keys(airportNames).find((code) => normalize(input).includes(code));
  return key ? airportNames[key] : input;
}
