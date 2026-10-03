CREATE TABLE transit_stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  lines_json TEXT NOT NULL,
  hotel_id TEXT,
  walking_minutes INTEGER,
  local_tip TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transport_routes_cache (
  cache_key TEXT PRIMARY KEY,
  origin_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  mode TEXT NOT NULL,
  response_json TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);

CREATE TABLE transfer_vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_types_json TEXT NOT NULL,
  base_rates_json TEXT NOT NULL,
  service_areas_json TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE airport_transfer_requests (
  id TEXT PRIMARY KEY,
  hotel_booking_id TEXT NOT NULL,
  vendor_id TEXT,
  pickup_location TEXT NOT NULL,
  flight_number TEXT,
  pickup_at DATETIME NOT NULL,
  passengers INTEGER NOT NULL,
  luggage INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL,
  quoted_price_myr REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_by_guest_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES transfer_vendors(id)
);
