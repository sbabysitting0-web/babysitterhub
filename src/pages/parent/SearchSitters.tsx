import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Search, Star, SlidersHorizontal, X, MapPin, Clock,
  DollarSign, Shield, ArrowLeft, Users, ChevronRight, Crosshair,
  CheckCircle2, Baby, ArrowRight
} from "lucide-react";

import { resolveCoords, TILE_URL, TILE_ATTR } from "@/utils/mapHelpers";
import MapLoadingSpinner from "@/components/MapLoadingSpinner";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";
const PINK   = "#E91E8C";


interface Sitter {
  id: string; user_id: string; name: string; photo_url: string | null;
  bio: string | null; city: string | null; hourly_rate: number | null;
  years_experience: number | null; rating_avg: number | null; rating_count: number | null;
  skills: string[] | null; languages: string[] | null; is_verified: boolean | null;
  max_kids: number | null;
  location_lat: number | null; location_lng: number | null;
  updated_at: string;
}

/* ── Haversine distance (km) ─────────────────────────────────────────── */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const fieldCls = "h-9 w-full rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all";
const fieldStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" };

const SearchSitters = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();

  const mapRef  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const mapInitialized = useRef(false);

  const [sitters, setSitters]       = useState<Sitter[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [search, setSearch]         = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]       = useState({ city: searchParams.get("city") || "", maxRate: "", minExperience: "", language: "" });

  /* visible in map viewport */
  const [visibleSitters, setVisibleSitters] = useState<Sitter[]>([]);

  /* home location */
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [homeCity, setHomeCity]     = useState<string | null>(null);

  /* ── Load user home location ──────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const loadHome = async () => {
      const { data: pp } = await supabase.from("parent_profiles")
        .select("city, location_lat, location_lng").eq("user_id", user.id).maybeSingle();
      if (pp?.location_lat && pp?.location_lng) {
        setHomeCoords([pp.location_lat, pp.location_lng]);
        setHomeCity(pp.city ?? null);
        return;
      }
      const { data: bp } = await supabase.from("babysitter_profiles")
        .select("city, location_lat, location_lng").eq("user_id", user.id).maybeSingle();
      if (bp?.location_lat && bp?.location_lng) {
        setHomeCoords([bp.location_lat, bp.location_lng]);
        setHomeCity(bp.city ?? null);
        return;
      }
      const city = pp?.city || bp?.city;
      if (city) {
        setHomeCity(city);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
          const results = await res.json();
          if (results?.[0]) setHomeCoords([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
        } catch { /* silently fail */ }
      }
    };
    loadHome();
  }, [user]);

  /* ── Fetch sitters ─────────────────────────────────────────────── */
  const fetchSitters = async (activeFilters = filters) => {
    setLoading(true);
    let query = supabase.from("babysitter_profiles").select("*");
    if (activeFilters.city) query = query.ilike("city", `%${activeFilters.city}%`);
    if (activeFilters.maxRate) query = query.lte("hourly_rate", parseFloat(activeFilters.maxRate));
    if (activeFilters.minExperience) query = query.gte("years_experience", parseInt(activeFilters.minExperience));
    const { data, error } = await query.order("rating_avg", { ascending: false });
    if (!error && data) {
      // Resolve coordinates: use DB lat/lng first, then city fallback with spiral offset
      const enriched = (data as Sitter[]).map((s, idx) => {
        const coords = resolveCoords(s.location_lat, s.location_lng, s.city, idx);
        if (coords) return { ...s, location_lat: coords.lat, location_lng: coords.lng };
        return s;
      });
      setSitters(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam) {
      const initial = { city: cityParam, maxRate: "", minExperience: "", language: "" };
      setFilters(initial); fetchSitters(initial);
    } else { fetchSitters({ city: "", maxRate: "", minExperience: "", language: "" }); }
  }, []);

  /* ── Realtime subscription ──────────────────────────────────────── */
  useEffect(() => {
    const channel = supabase
      .channel("sitter-search-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "babysitter_profiles" },
        (payload: any) => {
          const rec = payload.new as Sitter | undefined;
          const oldRec = payload.old as { id?: string } | undefined;
          if (payload.eventType === "INSERT" && rec) {
            setSitters((prev) => [rec, ...prev]);
          } else if (payload.eventType === "UPDATE" && rec) {
            setSitters((prev) => prev.map((s) => s.id === rec.id ? rec : s));
          } else if (payload.eventType === "DELETE" && oldRec?.id) {
            setSitters((prev) => prev.filter((s) => s.id !== oldRec.id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Search filter ──────────────────────────────────────────────── */
  const filtered = sitters.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.bio?.toLowerCase().includes(q) || s.skills?.some((sk) => sk.toLowerCase().includes(q));
  });

  /* ── Sitters in viewport ────────────────────────────────────────── */
  const displayedSitters = visibleSitters.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.bio?.toLowerCase().includes(q) || s.skills?.some((sk) => sk.toLowerCase().includes(q));
  });

  /* ── Stable ref so map event handlers never need to be re-registered ── */
  const syncRef = useRef<() => void>(() => {});

  /* ── Helper: sync visible sitters from current map bounds ──────── */
  const syncVisibleSitters = useCallback(() => {
    const map = mapInst.current;
    if (!map) return;
    const bounds = map.getBounds();
    const inView = sitters.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.bio?.toLowerCase().includes(q) || s.skills?.some((sk) => sk.toLowerCase().includes(q));
      return matchesSearch && s.location_lat != null && s.location_lng != null &&
        bounds.contains([s.location_lat!, s.location_lng!]);
    });
    setVisibleSitters(inView);
  }, [sitters, search]);

  // Keep the ref pointing at the latest version – no effect re-runs, no map event rebinding
  useEffect(() => { syncRef.current = syncVisibleSitters; }, [syncVisibleSitters]);

  /* ── Also sync the list whenever sitters or search changes ─────── */
  useEffect(() => { syncVisibleSitters(); }, [syncVisibleSitters]);

  /* ── Map init (runs ONCE) ──────────────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current || mapInitialized.current) return;

    const map = L.map(mapRef.current, {
      center: [28.6139, 77.2090],
      zoom: 5,
      zoomControl: false,
      zoomSnap: 0.1,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 60,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });
    mapInst.current = map;
    mapInitialized.current = true;

    const tileLayer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      maxZoom: 19,
    }).addTo(map);

    tileLayer.on("loading", () => setLoadingMap(true));
    tileLayer.on("load", () => setLoadingMap(false));

    L.control.zoom({ position: "topright" }).addTo(map);

    // Create a layer group for sitter markers
    const markerGroup = L.layerGroup().addTo(map);
    markersRef.current = markerGroup;

    // Stable handler – always calls the latest syncVisibleSitters via ref
    const stableHandler = () => syncRef.current();
    map.on("moveend", stableHandler);
    map.on("zoomend", stableHandler);

    return () => {
      map.remove();
      mapInst.current = null;
      mapInitialized.current = false;
      markersRef.current = null;
    };
  }, []);

  /* ── Home marker (updates when homeCoords change) ───────────────── */
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;

    // Remove old home marker
    if (homeMarkerRef.current) {
      map.removeLayer(homeMarkerRef.current);
      homeMarkerRef.current = null;
    }

    if (!homeCoords) return;

    const homeIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:40px;height:40px;
        background:rgba(244,180,192,0.85);
        border:3px solid rgba(255,255,255,0.9);
        border-radius:50%;
        box-shadow:0 2px 12px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      "><svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22" fill="rgba(244,180,192,0.85)" stroke="rgba(244,180,192,0.85)"/></svg></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
    });

    const marker = L.marker(homeCoords, { icon: homeIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<div style="font-family:system-ui,sans-serif;text-align:center;padding:2px 0">
        <p style="font-weight:700;font-size:13px;margin:0 0 2px;color:#1c1917">📍 Your location</p>
        ${homeCity ? `<p style="font-size:11px;color:#78716c;margin:0">${homeCity}</p>` : ""}
      </div>`);
    homeMarkerRef.current = marker;

    // Pan to home on first load
    map.setView(homeCoords, 11, { animate: false });
  }, [homeCoords, homeCity]);

  /* ── Update sitter markers (without destroying the map) ─────────── */
  useEffect(() => {
    const map = mapInst.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    // Clear old sitter markers
    markerGroup.clearLayers();

    const withCoords = filtered.filter((s) => s.location_lat != null && s.location_lng != null);

    const sitterIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:34px;height:34px;
        background:linear-gradient(135deg,${PINK},#C2185B);
        border:3px solid rgba(255,255,255,0.9);
        border-radius:50%;
        box-shadow:0 2px 12px rgba(233,30,140,0.45);
        display:flex;align-items:center;justify-content:center;
      "><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20],
    });

    withCoords.forEach((s) => {
      const stars = s.rating_avg ? `⭐ ${Number(s.rating_avg).toFixed(1)}` : "";
      const verified = s.is_verified ? `<span style="color:#16a34a;font-size:11px;font-weight:600">✓ Verified</span>` : "";
      const popup = `
        <div style="min-width:200px;font-family:system-ui,sans-serif;padding:2px 0">
          <p style="font-weight:700;font-size:14px;margin:0 0 3px;color:#1c1917">${s.name}</p>
          ${s.city ? `<p style="font-size:11px;color:#78716c;margin:0 0 3px">📍 ${s.city}</p>` : ""}
          ${s.bio ? `<p style="font-size:11px;color:#57534e;margin:0 0 4px;max-width:220px">${s.bio.length > 80 ? s.bio.slice(0, 80) + "…" : s.bio}</p>` : ""}
          ${s.hourly_rate ? `<p style="font-size:13px;font-weight:700;color:${PINK};margin:0 0 3px">₹${Number(s.hourly_rate).toFixed(0)}/hr</p>` : ""}
          <div style="display:flex;align-items:center;gap:8px;margin:0 0 2px">
            ${stars ? `<span style="font-size:11px;color:#a8a29e">${stars}</span>` : ""}
            ${verified}
          </div>
          ${s.years_experience ? `<p style="font-size:10px;color:#a8a29e;margin:0">${s.years_experience} yr${s.years_experience > 1 ? "s" : ""} experience</p>` : ""}
        </div>`;
      L.marker([s.location_lat!, s.location_lng!], { icon: sitterIcon }).bindPopup(popup).addTo(markerGroup);
    });

    // Fit map to show all markers if no home coords and this is the first data load
    if (!homeCoords && withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((s) => [s.location_lat!, s.location_lng!] as [number, number]));
      // Add some padding so pins aren't at the edge
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: false });
    }

    // Sync visible sitters
    setTimeout(() => syncVisibleSitters(), 50);
  }, [filtered, homeCoords]);

  const clearFilters = () => setFilters({ city: "", maxRate: "", minExperience: "", language: "" });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const avatarColors = [TEAL, "#60A5FA", "#A78BFA", "#F472B6", "#FB923C", "#34D399"];

  /* ── Time-ago helper ───────────────────────────────────────────── */
  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return days === 1 ? "yesterday" : `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {/* Top nav */}
      <header className="sticky top-0 z-30" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
              <ArrowLeft size={15} />
            </button>
            <Link to="/" className="flex items-center gap-2">

              <span className="font-heading font-bold text-white text-sm hidden sm:block">Baby<span style={{ color: TEAL }}>Care</span></span>
            </Link>
          </div>
          {user ? (
            <Link to={role === "babysitter" ? "/babysitter/dashboard" : "/parent/dashboard"} 
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition-all whitespace-nowrap"
              style={{ background: TEAL, color: "#fff" }}>
              Go to Dashboard <ArrowRight size={14} className="ml-0.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Log in</Link>
              <Link to="/signup" className="text-xs font-semibold px-4 py-1.5 rounded-full text-white" style={{ background: TEAL }}>Sign up free</Link>
            </div>
          )}
        </div>
      </header>

      {/* Search bar + filters */}
      <div className="sticky top-14 z-20" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white mb-1">Find a Babysitter</h1>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            {displayedSitters.length > 0
              ? `${displayedSitters.length} babysitter${displayedSitters.length !== 1 ? "s" : ""} available in the map area`
              : "Browse trusted babysitters near you"}
          </p>

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, or skill…"
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
              {search && <button onClick={() => setSearch("")} style={{ color: "rgba(255,255,255,0.3)" }}><X size={14} /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 h-[42px] rounded-full text-sm font-semibold border transition-all"
              style={{ background: hasActiveFilters ? TEAL : "rgba(255,255,255,0.05)", color: hasActiveFilters ? "#fff" : "rgba(255,255,255,0.6)", borderColor: hasActiveFilters ? TEAL : BORDER }}>
              <SlidersHorizontal size={15} /> Filters
              {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-white/25 text-[10px] flex items-center justify-center font-bold">{Object.values(filters).filter(Boolean).length}</span>}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-white">Filter results</span>
                {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-red-400 flex items-center gap-1"><X size={11} /> Clear all</button>}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}><MapPin size={11} /> City / Area</label>
                  <input placeholder="e.g. Delhi" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className={fieldCls} style={fieldStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}><DollarSign size={11} /> Max rate (INR/hr)</label>
                  <input type="number" placeholder="e.g. 500" value={filters.maxRate} onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })} className={fieldCls} style={fieldStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}><Clock size={11} /> Min experience (yrs)</label>
                  <input type="number" placeholder="e.g. 2" value={filters.minExperience} onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })} className={fieldCls} style={fieldStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Language</label>
                  <input placeholder="e.g. Hindi" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className={fieldCls} style={fieldStyle} />
                </div>
              </div>
              <button onClick={() => fetchSitters(filters)} className="mt-4 font-semibold rounded-full px-5 py-2 text-sm text-white transition-all hover:opacity-90" style={{ background: TEAL }}>Apply Filters</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Split layout: sitter cards (left) + map (right) ───────── */}
      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>

        {/* ── Left panel: sitter cards ────────────────────────────── */}
        <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col overflow-y-auto px-4 lg:pl-6 lg:pr-4 py-4 relative z-10"
          style={{ maxHeight: "calc(100vh - 200px)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(61,190,181,0.10)", color: TEAL, border: `1px solid rgba(61,190,181,0.2)` }}>
              🧑‍🍼 {displayedSitters.length} sitter{displayedSitters.length !== 1 ? "s" : ""} in view
            </span>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Sorted by rating</span>
          </div>

          {/* Cards */}
          <div className="flex-1 space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="flex gap-4">
                    <div className="w-[72px] h-[72px] rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <div className="h-3 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                    </div>
                  </div>
                </div>
              ))
            ) : displayedSitters.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }}>
                  <Search size={28} />
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2">No sitters in this area</h3>
                <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>Zoom out on the map to find babysitters in a wider area</p>
                {hasActiveFilters && <button onClick={clearFilters} className="text-sm font-medium underline underline-offset-2" style={{ color: TEAL }}>Clear all filters</button>}
              </div>
            ) : (
              displayedSitters.map((sitter, idx) => {
                const dist = homeCoords
                  ? distanceKm(homeCoords[0], homeCoords[1], sitter.location_lat!, sitter.location_lng!)
                  : null;
                return (
                  <Link key={sitter.id} to={`/babysitters/${sitter.id}`}
                    className="group rounded-2xl p-4 hover:brightness-110 transition-all flex relative"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}
                    onMouseEnter={() => {
                      if (mapInst.current && sitter.location_lat && sitter.location_lng) {
                        mapInst.current.panTo([sitter.location_lat, sitter.location_lng], { animate: true, duration: 0.5 });
                      }
                    }}
                  >
                    <div className="flex gap-4 w-full">
                      {/* Avatar */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                        <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden"
                          style={{ background: sitter.photo_url ? "transparent" : avatarColors[idx % avatarColors.length] }}>
                          {sitter.photo_url
                            ? <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover" />
                            : sitter.name.charAt(0).toUpperCase()}
                        </div>
                        {dist != null && (
                          <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: TEAL }}>
                            ~ {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-white group-hover:text-[#3DBEB5] transition-colors truncate text-sm leading-tight">{sitter.name}</h3>
                          {sitter.is_verified && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(61,190,181,0.12)", color: TEAL, border: "1px solid rgba(61,190,181,0.2)" }}>
                              <Shield size={9} /> Verified
                            </span>
                          )}
                          {/* Heart */}
                          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                            <span style={{ color: PINK }} className="text-sm">♥</span>
                            {sitter.rating_count != null && sitter.rating_count > 0 && (
                              <span className="text-[10px] font-bold" style={{ color: PINK }}>{sitter.rating_count}</span>
                            )}
                          </div>
                        </div>

                        {sitter.city && (
                          <p className="text-xs flex items-center gap-0.5 mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            <MapPin size={10} /> Babysitter in {sitter.city}
                          </p>
                        )}

                        {sitter.rating_avg ? (
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map((s) => <Star key={s} size={10} className={s <= Math.round(Number(sitter.rating_avg)) ? "text-amber-400 fill-amber-400" : "fill-current"} style={s > Math.round(Number(sitter.rating_avg)) ? { color: "rgba(255,255,255,0.1)" } : {}} />)}
                            <span className="text-[11px] font-semibold text-white ml-0.5">{Number(sitter.rating_avg).toFixed(1)}</span>
                          </div>
                        ) : <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>No reviews yet</p>}

                        {sitter.bio && (
                          <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{sitter.bio}</p>
                        )}

                        {/* Detail chips */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {sitter.max_kids && (
                            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: TEAL }}>
                              <Baby size={11} /> Max {sitter.max_kids} children
                            </span>
                          )}
                          {sitter.years_experience != null && sitter.years_experience > 0 && (
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                              ⚡ {sitter.years_experience} yr{sitter.years_experience > 1 ? "s" : ""} exp
                            </span>
                          )}
                          {sitter.updated_at && (
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                              <Clock size={10} className="inline mr-0.5" />
                              Last active: {timeAgo(sitter.updated_at)}
                            </span>
                          )}
                        </div>

                        {sitter.hourly_rate != null && (
                          <p className="text-xs font-bold mt-2 text-right" style={{ color: TEAL }}>
                            INR {Number(sitter.hourly_rate).toFixed(2)}/hr
                          </p>
                        )}

                        {/* Skills */}
                        {(sitter.skills?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sitter.skills?.slice(0, 3).map((skill) => <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{skill}</span>)}
                            {(sitter.skills?.length ?? 0) > 3 && <span className="text-[10px] px-1 self-center" style={{ color: "rgba(255,255,255,0.25)" }}>+{(sitter.skills?.length ?? 0) - 3} more</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-70 transition-opacity">
                      <ChevronRight size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: map ────────────────────────────────────── */}
        <div className="w-full lg:w-[58%] xl:w-[62%] flex-shrink-0 p-4 lg:p-6 lg:pl-0">
          <div className="w-full relative z-0 rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)', height: "calc(100vh - 232px)", minHeight: 400 }}>
            {loadingMap && <MapLoadingSpinner />}
            <div ref={mapRef} className="absolute inset-0" />
            {homeCoords && (
              <button
                onClick={() => { if (mapInst.current && homeCoords) mapInst.current.flyTo(homeCoords, 14, { duration: 0.8 }); }}
                className="absolute z-[1000] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                style={{
                  top: 90, right: 16,
                  width: 40, height: 40, borderRadius: '50%',
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)", cursor: "pointer",
                }}
                title="Go to my location">
                <Crosshair size={18} style={{ color: "white" }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSitters;
