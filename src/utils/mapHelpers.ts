/**
 * Shared map utilities – city fallback coordinates & pin offset logic.
 * Used by ParentDashboard, SearchSitters, and BabysittingJobs.
 */

/* ── City → Coordinates (accurate GPS) ───────────────────────────────── */
export const CITY_COORDS: Record<string, [number, number]> = {
  "chennai":    [13.0827, 80.2707],
  "hyderabad":  [17.3850, 78.4867],
  "mumbai":     [19.0760, 72.8777],
  "delhi":      [28.6139, 77.2090],
  "new delhi":  [28.6139, 77.2090],
  "bangalore":  [12.9716, 77.5946],
  "bengaluru":  [12.9716, 77.5946],
  "kolkata":    [22.5726, 88.3639],
  "pune":       [18.5204, 73.8567],
  "jaipur":     [26.9124, 75.7873],
  "singapore":  [1.3521, 103.8198],
  "india":      [28.6139, 77.2090],
  "gurugram":   [28.4595, 77.0266],
  "gurgaon":    [28.4595, 77.0266],
  "noida":      [28.5355, 77.3910],
  "thane":      [19.2183, 72.9781],
  "lucknow":    [26.8467, 80.9462],
  "ahmedabad":  [23.0225, 72.5714],
  "chandigarh": [30.7333, 76.7794],
  "kochi":      [9.9312, 76.2673],
  "surat":      [21.1702, 72.8311],
  "dwarka":     [28.5921, 77.0460],
};

/**
 * Resolve approximate coordinates for a city string.
 * Handles partial/compound values like "Chennai / India".
 */
export function getCityCoords(city: string | null): [number, number] | null {
  if (!city) return null;
  const lower = city.toLowerCase().trim();
  if (CITY_COORDS[lower]) return CITY_COORDS[lower];
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  return null;
}

/**
 * Deterministic offset so same-city pins don't stack on top of each other.
 * Spreads pins in a spiral pattern around the city center.
 */
export function pinOffset(index: number): [number, number] {
  if (index === 0) return [0, 0];
  const angle = index * 2.399963; // golden angle in radians
  const radius = 0.008 * Math.sqrt(index); // ~800m per step
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
  ];
}

/**
 * Resolve coordinates for a babysitter profile.
 * Uses DB coords if available, else falls back to city lookup + offset.
 */
export function resolveCoords(
  locationLat: number | null,
  locationLng: number | null,
  city: string | null,
  index: number
): { lat: number; lng: number } | null {
  if (locationLat != null && locationLng != null) {
    return { lat: locationLat, lng: locationLng };
  }
  const fallback = getCityCoords(city);
  if (!fallback) return null;
  const [dLat, dLng] = pinOffset(index);
  return { lat: fallback[0] + dLat, lng: fallback[1] + dLng };
}

/**
 * CartoDB Dark Matter tiles (sleek dark mode to match UI)
 */
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
