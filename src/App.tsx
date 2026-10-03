import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bus, CarFront, Check, ChevronDown, CircleHelp, Clock3, ExternalLink, LocateFixed, Map as MapIcon, MapPin, Menu, MessageCircle, Minus, Navigation, Plane, Plus, Send, ShieldCheck, Sparkles, TrainFront, Users, X } from 'lucide-react';

type Option = { id: string; mode: string; label: string; badge: string; duration: string; costMin: number; costMax: number; icon: 'train' | 'bus' | 'car'; steps: string[]; pickupTip?: string; officialUrl?: string };
type Station = { id: string; name: string; type: string; lines: string[]; walkMinutes: number; distanceM: number; tip: string };
type Transfer = { id: string; hotelBookingId: string; pickupLocation: string; flightNumber: string; pickupAt: string; passengers: number; luggage: number; vehicleType: string; quotedPriceMyr: number; status: string; createdAt: string };

const fallbackOptions: Option[] = [
  { id: 'klia-ekspres', mode: 'Train + MRT', label: 'KLIA Ekspres', badge: 'Fastest', duration: '55–65 min', costMin: 57, costMax: 62, icon: 'train', steps: ['Follow signs to KLIA Ekspres at Gateway@klia2.', 'Ride to KL Sentral (about 33 minutes).', 'Take MRT from Muzium Negara to Bukit Bintang.', 'Use Exit D and walk 4 minutes to the hotel.'], officialUrl: 'https://www.kliaekspres.com' },
  { id: 'airport-bus', mode: 'Bus + MRT', label: 'Airport Coach', badge: 'Cheapest', duration: '1 hr 30 min–2 hr', costMin: 16, costMax: 22, icon: 'bus', steps: ['Buy a ticket at the Level 1 Transportation Hub.', 'Take an airport coach to KL Sentral.', 'Continue by MRT to Bukit Bintang.', 'Use Exit D and walk 4 minutes.'] },
  { id: 'ehailing', mode: 'Door to door', label: 'Grab / taxi', badge: 'Recommended', duration: '55–90 min', costMin: 75, costMax: 120, icon: 'car', steps: ['Book after collecting your luggage.', 'Follow signs to the e-hailing pickup bay shown in the app.', 'Ride to Hotel Damai’s main lobby.'], pickupTip: 'Check the app for the current pickup floor and bay. Tolls may apply.' },
];
const fallbackStations: Station[] = [
  { id: 'bukit-bintang', name: 'Bukit Bintang', type: 'MRT', lines: ['Kajang Line'], walkMinutes: 4, distanceM: 320, tip: 'Use Entrance D; lifts are available.' },
  { id: 'raja-chulan', name: 'Raja Chulan', type: 'Monorail', lines: ['KL Monorail'], walkMinutes: 6, distanceM: 450, tip: 'Useful for KL Sentral via Hang Tuah.' },
];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!response.ok) throw new Error((await response.json()).error || 'Something went wrong');
  return response.json();
}

const iconFor = (name: Option['icon'], size = 20) => name === 'train' ? <TrainFront size={size} /> : name === 'bus' ? <Bus size={size} /> : <CarFront size={size} />;

function MapPreview({ active = 'hotel' }: { active?: string }) {
  return <div className="map" aria-label="Map showing Hotel Damai and nearby transit">
    <div className="map-road road-a"/><div className="map-road road-b"/><div className="map-road road-c"/>
    <span className="road-label label-a">Jalan Sultan Ismail</span><span className="road-label label-b">Jalan Bukit Bintang</span>
    <div className="map-park">BUKIT<br/>NANAS</div>
    <div className={`pin hotel-pin ${active === 'hotel' ? 'active' : ''}`}><MapPin size={18}/><span>Hotel Damai</span></div>
    <div className={`pin station-pin ${active === 'station' ? 'active' : ''}`}><TrainFront size={16}/><span>Bukit Bintang MRT</span></div>
    <div className="route-line"><i/><i/><i/><i/></div>
    <button className="locate" aria-label="Center map"><LocateFixed size={18}/></button>
    <div className="map-scale">200 m</div>
  </div>;
}

function TransportCard({ option, selected, onSelect }: { option: Option; selected: boolean; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return <article className={`option-card ${selected ? 'selected' : ''}`}>
    <button className="option-main" onClick={onSelect}>
      <span className="mode-icon">{iconFor(option.icon)}</span>
      <span className="option-copy"><span className="option-title">{option.label}</span><span>{option.mode}</span></span>
      <span className={`tag ${option.badge.toLowerCase().replace(' ', '-')}`}>{option.badge}</span>
      <span className="metric"><Clock3 size={15}/>{option.duration}</span>
      <span className="price">RM {option.costMin}–{option.costMax}<small>estimated</small></span>
      <span className="radio">{selected && <span/>}</span>
    </button>
    <button className="details-toggle" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide steps' : 'View steps'} <ChevronDown size={15} className={expanded ? 'up' : ''}/></button>
    {expanded && <div className="steps">
      {option.steps.map((step, i) => <div className="step" key={step}><span>{i + 1}</span><p>{step}</p></div>)}
      {option.pickupTip && <div className="tip"><Sparkles size={15}/><span><b>Local tip:</b> {option.pickupTip}</span></div>}
      <div className="card-actions"><a target="_blank" href={`https://www.google.com/maps/dir/?api=1&origin=KLIA2&destination=Hotel+Damai+Kuala+Lumpur&travelmode=${option.icon === 'car' ? 'driving' : 'transit'}`}><MapIcon size={15}/> Show on map</a>{option.officialUrl && <a target="_blank" href={option.officialUrl}>Official site <ExternalLink size={14}/></a>}</div>
    </div>}
  </article>;
}

function TransferModal({ onClose, onCreated }: { onClose: () => void; onCreated: (item: Transfer) => void }) {
  const [step, setStep] = useState(1); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ hotelBookingId: 'HD-28419', pickupLocation: 'KLIA Terminal 2, Arrivals', flightNumber: '', pickupAt: '', passengers: 2, luggage: 2, vehicleType: 'Sedan', quotedPriceMyr: 120 });
  const update = (key: string, value: string | number) => setForm({ ...form, [key]: value });
  const submit = async () => { setLoading(true); setError(''); try { const data = await api<{request: Transfer}>('/api/tools/book_transfer', { method: 'POST', body: JSON.stringify({ hotelBookingId: form.hotelBookingId, pickupDetails: form, confirmed: true }) }); onCreated(data.request); setStep(3); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true">
    <button className="modal-close" onClick={onClose}><X size={20}/></button>
    {step < 3 && <><div className="modal-kicker"><Plane size={16}/> AIRPORT TRANSFER</div><h2>{step === 1 ? 'Tell us about your arrival' : 'Confirm your request'}</h2><div className="progress"><span className="done"/><span className={step === 2 ? 'done' : ''}/></div></>}
    {step === 1 && <div className="form-grid">
      <label>Booking reference<input value={form.hotelBookingId} onChange={e => update('hotelBookingId', e.target.value)}/></label>
      <label>Flight number<input placeholder="e.g. AK 5123" value={form.flightNumber} onChange={e => update('flightNumber', e.target.value.toUpperCase())}/></label>
      <label className="wide">Pickup date & time<input type="datetime-local" value={form.pickupAt} onChange={e => update('pickupAt', e.target.value)}/></label>
      <label>Guests<div className="counter"><button onClick={() => update('passengers', Math.max(1, form.passengers - 1))}><Minus size={15}/></button><span>{form.passengers}</span><button onClick={() => update('passengers', form.passengers + 1)}><Plus size={15}/></button></div></label>
      <label>Luggage<div className="counter"><button onClick={() => update('luggage', Math.max(0, form.luggage - 1))}><Minus size={15}/></button><span>{form.luggage}</span><button onClick={() => update('luggage', form.luggage + 1)}><Plus size={15}/></button></div></label>
      <button className="primary wide" disabled={!form.flightNumber || !form.pickupAt} onClick={() => setStep(2)}>Review request <ArrowRight size={17}/></button>
    </div>}
    {step === 2 && <div className="review">
      <div className="vehicle-row"><span className="mode-icon"><CarFront/></span><div><b>Private sedan</b><span>Up to 3 guests · {form.luggage} bags</span></div><strong>RM {form.quotedPriceMyr}</strong></div>
      <dl><div><dt>Pickup</dt><dd>{form.pickupLocation}</dd></div><div><dt>Flight</dt><dd>{form.flightNumber}</dd></div><div><dt>Arrival</dt><dd>{new Date(form.pickupAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div><div><dt>Booking</dt><dd>{form.hotelBookingId}</dd></div></dl>
      <div className="notice"><ShieldCheck size={18}/><span>This sends a request to the hotel. The transfer is confirmed only when the hotel replies.</span></div>
      {error && <p className="error">{error}</p>}<div className="split-actions"><button className="secondary" onClick={() => setStep(1)}>Back</button><button className="primary" disabled={loading} onClick={submit}>{loading ? 'Sending…' : 'Yes, send request'} <Check size={17}/></button></div>
    </div>}
    {step === 3 && <div className="success"><div className="success-icon"><Check/></div><h2>Request sent</h2><p>The hotel team will confirm your driver and final rate. You’ll receive an update using the contact details on your stay.</p><button className="primary" onClick={onClose}>Done</button></div>}
  </div></div>;
}

function AdminPanel({ requests, onClose }: { requests: Transfer[]; onClose: () => void }) {
  return <div className="admin-panel"><div className="admin-head"><div><span className="eyebrow">HOTEL OPERATIONS</span><h2>Transfer requests</h2></div><button onClick={onClose}><X/></button></div><div className="admin-stats"><div><strong>{requests.length}</strong><span>Pending</span></div><div><strong>2</strong><span>Drivers available</span></div><div><strong>18 min</strong><span>Avg. response</span></div></div>{requests.length === 0 ? <div className="empty"><CarFront/><h3>No transfer requests yet</h3><p>Confirmed guest requests will appear here.</p></div> : <div className="request-list">{requests.map(r => <article key={r.id}><div className="request-top"><b>{r.id}</b><span>Pending</span></div><h3>{r.pickupLocation} → Hotel Damai</h3><p><Plane size={15}/>{r.flightNumber} · {new Date(r.pickupAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</p><p><Users size={15}/>{r.passengers} guests · {r.luggage} bags · {r.vehicleType}</p><div className="request-bottom"><span>Booking {r.hotelBookingId}</span><strong>RM {r.quotedPriceMyr}</strong></div></article>)}</div>}</div>;
}

function ChatPanel({ options, onBook }: { options: Option[]; onBook: () => void }) {
  type Message = { role: 'agent'|'user'; text: string; kind?: 'options'|'station' };
  const [messages, setMessages] = useState<Message[]>([{ role: 'agent', text: 'Hi Amelia! How are you arriving? I can share the best route to the hotel.' }]);
  const [input, setInput] = useState(''); const [thinking, setThinking] = useState(false); const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);
  const send = (preset?: string) => { const value = (preset || input).trim(); if (!value) return; setMessages(m => [...m, { role: 'user', text: value }]); setInput(''); setThinking(true); setTimeout(() => { const lower = value.toLowerCase(); let reply: Message = { role: 'agent', text: 'I don’t have reliable data for that route yet. I can ask the hotel team for the best local option.' }; if (lower.includes('klia')) reply = { role: 'agent', text: 'Here are the best options from KLIA2. I’d take the KLIA Ekspres during peak traffic, or Grab if you have several bags.', kind: 'options' }; else if (lower.includes('mrt') || lower.includes('station')) reply = { role: 'agent', text: 'Bukit Bintang MRT is closest: a 4-minute (320 m) walk. It’s on the Kajang Line. Use Entrance D; lifts are available.', kind: 'station' }; else if (lower.includes('transfer') || lower.includes('driver')) { reply = { role: 'agent', text: 'I can arrange a private airport transfer. I’ll need your flight arrival time and terminal first. When you’re ready, use the request button below.' }; setTimeout(onBook, 500); } setMessages(m => [...m, reply]); setThinking(false); }, 650); };
  return <section className="chat-panel"><div className="chat-head"><div className="avatar"><Sparkles size={17}/></div><div><b>Damai Concierge</b><span><i/> Online</span></div><button aria-label="Help"><CircleHelp size={19}/></button></div><div className="chat-body">{messages.map((m, i) => <div key={i} className={`message-wrap ${m.role}`}><div className="bubble">{m.text}</div>{m.kind === 'options' && <div className="mini-options">{options.slice(0, 2).map(o => <div key={o.id}><span>{iconFor(o.icon, 16)}</span><div><b>{o.label}</b><small>{o.duration} · RM {o.costMin}–{o.costMax}</small></div></div>)}</div>}{m.kind === 'station' && <div className="station-result"><span><TrainFront size={18}/></span><div><b>Bukit Bintang MRT</b><small>Kajang Line · 4 min walk</small></div></div>}</div>)}{thinking && <div className="typing"><i/><i/><i/></div>}<div ref={endRef}/></div><div className="quick-replies"><button onClick={() => send('How do I get from KLIA2?')}>From KLIA2</button><button onClick={() => send("What's the nearest MRT?")}>Nearest MRT</button><button onClick={() => send('Book a transfer')}>Book transfer</button></div><form className="chat-input" onSubmit={e => { e.preventDefault(); send(); }}><input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about getting around…"/><button aria-label="Send"><Send size={18}/></button></form></section>;
}

export default function App() {
  const [options, setOptions] = useState<Option[]>(fallbackOptions); const [stations, setStations] = useState<Station[]>(fallbackStations); const [selected, setSelected] = useState('klia-ekspres'); const [modal, setModal] = useState(false); const [admin, setAdmin] = useState(false); const [requests, setRequests] = useState<Transfer[]>([]); const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => { api<{ options: Option[] }>('/api/tools/get_transport_options', { method: 'POST', body: JSON.stringify({ origin: 'KLIA2', destination: 'Hotel Damai Kuala Lumpur', passengers: 2, luggage: 2 }) }).then(d => setOptions(d.options)).catch(() => {}); api<{stations: Station[]}>('/api/tools/get_nearest_transit?hotel_id=damai-kl-01').then(d => setStations(d.stations)).catch(() => {}); }, []);
  const openAdmin = async () => { try { const d = await api<{requests: Transfer[]}>('/api/admin/transfer-requests'); setRequests(d.requests); } catch {} setAdmin(true); };
  const selectedOption = useMemo(() => options.find(o => o.id === selected), [options, selected]);
  return <div className="app-shell">
    <header><a className="brand" href="#"><span>HD</span><div>HOTEL DAMAI<small>KUALA LUMPUR</small></div></a><nav className={mobileMenu ? 'open' : ''}><a href="#stay">Your stay</a><a className="active" href="#getting-here">Getting here</a><a href="#explore">Explore</a><button className="admin-link" onClick={openAdmin}>Hotel admin</button></nav><div className="guest"><span>AM</span><div><b>Amelia</b><small>Booking HD-28419</small></div></div><button className="menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu/></button></header>
    <main>
      <section className="hero" id="getting-here"><div><span className="eyebrow"><Navigation size={14}/> YOUR JOURNEY</span><h1>Getting here,<br/><em>made simple.</em></h1><p>Compare trusted ways to reach Hotel Damai, with local tips for a smoother arrival.</p></div><div className="journey-chip"><span><Plane size={18}/></span><div><small>ARRIVING FROM</small><b>KLIA Terminal 2</b></div><ArrowRight/><div><small>DESTINATION</small><b>Hotel Damai</b></div></div></section>
      <section className="overview-grid">
        <div className="getting-card"><div className="section-title"><div><span className="eyebrow">AT A GLANCE</span><h2>Your route to Hotel Damai</h2></div><span className="live-pill"><i/> Traffic-aware estimates</span></div><div className="facts"><div><span><Plane/></span><small>AIRPORT DISTANCE</small><b>58 km</b><em>from KLIA2</em></div><div><span><Clock3/></span><small>TYPICAL DRIVE</small><b>55–90 min</b><em>allow more at peak hours</em></div><div><span><TrainFront/></span><small>NEAREST TRANSIT</small><b>{stations[0]?.name}</b><em>{stations[0]?.walkMinutes} min walk · {stations[0]?.lines[0]}</em></div></div><button className="primary transfer-cta" onClick={() => setModal(true)}><CarFront size={18}/> Book airport transfer <ArrowRight size={17}/></button></div>
        <MapPreview active={selectedOption?.icon === 'train' ? 'station' : 'hotel'}/>
      </section>
      <section className="content-grid"><div className="routes"><div className="section-title routes-title"><div><span className="eyebrow">FROM KLIA TERMINAL 2</span><h2>Choose how you travel</h2><p>For 2 guests with 2 pieces of luggage</p></div><button className="passenger-pill"><Users size={16}/> 2 guests · 2 bags <ChevronDown size={14}/></button></div><div className="recommendation"><Sparkles size={17}/><span><b>Our pick:</b> KLIA Ekspres is the most reliable during weekday peak hours (7–10am, 5–8pm).</span></div><div className="options-list">{options.map(option => <TransportCard key={option.id} option={option} selected={selected === option.id} onSelect={() => setSelected(option.id)}/>)}</div><p className="disclaimer"><CircleHelp size={14}/> Prices and times are estimates and may vary with traffic, demand and operator changes. Check the official operator before travel.</p></div><ChatPanel options={options} onBook={() => setModal(true)}/></section>
      <section className="nearby"><div className="nearby-head"><div><span className="eyebrow">AROUND THE NEIGHBOURHOOD</span><h2>Transit on your doorstep</h2></div><p>Tap in with a Touch ’n Go card. For KL Sentral, change at Muzium Negara; for Masjid Jamek, use the Kajang Line then change at Pasar Seni.</p></div><div className="station-grid">{stations.map((s, i) => <article key={s.id}><span className={`station-badge s${i}`}><TrainFront/></span><div><small>{s.type.toUpperCase()}</small><h3>{s.name}</h3><p>{s.lines.join(' · ')}</p></div><strong>{s.walkMinutes} min<small>{s.distanceM} m walk</small></strong><p className="station-tip">{s.tip}</p></article>)}</div></section>
    </main>
    <footer><div className="brand inverse"><span>HD</span><div>HOTEL DAMAI<small>KUALA LUMPUR</small></div></div><p>Need help after midnight? E-hailing and hotel-arranged taxis are the safest options. Ask reception anytime.</p><span>24-hour front desk · +60 3 2148 8888</span></footer>
    {modal && <TransferModal onClose={() => setModal(false)} onCreated={item => setRequests(r => [item, ...r])}/>} {admin && <><div className="drawer-backdrop" onClick={() => setAdmin(false)}/><AdminPanel requests={requests} onClose={() => setAdmin(false)}/></>}
  </div>;
}
