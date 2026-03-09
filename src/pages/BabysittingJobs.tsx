import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Search, MapPin, Baby, Briefcase, ShieldCheck, SlidersHorizontal,
  Clock, X, Crosshair,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";

/* ── Design tokens ───────────────────────────────────────────────────── */
const TEAL = "#3DBEB5";
const BG   = "#080F0D";
const CARD = "#0E1E1A";
const BDR  = "rgba(255,255,255,0.08)";

/* ── Filter options ──────────────────────────────────────────────────── */
const TYPE_OPTIONS     = ["Regular","Occasional","Overnight","Emergency","After school","Full-time nanny"];
const CHILDREN_OPTIONS = ["1 child","2 children","3+ children"];

/* ── Types ───────────────────────────────────────────────────────────── */
interface Job {
  id: string;
  parent_id: string;
  title: string;
  description: string | null;
  city: string | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hourly_rate: number | null;
  job_type: string | null;
  children_count: number | null;
  children_ages: string[] | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  parent_name?: string;
}

interface Babysitter {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  city: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hourly_rate: number | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  years_experience: number | null;
}

/* ── Filter pill (top bar) ───────────────────────────────────────────── */
function FilterPill({
  icon: Icon, label, count, open, onClick,
}: {
  icon: React.ElementType; label: string; count?: number; open?: boolean; onClick: () => void;
}) {
  const active = (count ?? 0) > 0 || open;
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap"
      style={{
        borderColor: active ? TEAL : "rgba(255,255,255,0.12)",
        background: active ? "rgba(61,190,181,0.10)" : "rgba(255,255,255,0.04)",
        color: active ? TEAL : "rgba(255,255,255,0.6)",
      }}>
      <Icon size={14} />
      {label}
      {count != null && count > 0 && (
        <span className="ml-0.5 text-[10px] font-bold bg-[#3DBEB5] text-white rounded-full w-4 h-4 flex items-center justify-center">{count}</span>
      )}
    </button>
  );
}

/* ── Selectable chip (dropdown) ──────────────────────────────────────── */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
      style={{
        borderColor: active ? TEAL : "rgba(255,255,255,0.12)",
        background: active ? "rgba(61,190,181,0.15)" : "transparent",
        color: active ? TEAL : "rgba(255,255,255,0.45)",
      }}>
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*                         MAIN COMPONENT                               */
/* ══════════════════════════════════════════════════════════════════════ */
const BabysittingJobs = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);

  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  /* babysitter state */
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);

  /* filter state */
  const [selTypes, setSelTypes]       = useState<string[]>([]);
  const [selChildren, setSelChildren] = useState<string[]>([]);
  const [openPanel, setOpenPanel]     = useState<"type"|"children"|"more"|null>(null);

  /* user home location */
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [homeCity, setHomeCity]     = useState<string | null>(null);

  /* ── Load user home location from profile ────────────────────── */
  useEffect(() => {
    if (!user) return;
    const loadHome = async () => {
      // Try babysitter profile first (has lat/lng)
      const { data: bp } = await supabase.from("babysitter_profiles")
        .select("city, location_lat, location_lng")
        .eq("user_id", user.id).maybeSingle();
      if (bp?.location_lat && bp?.location_lng) {
        setHomeCoords([bp.location_lat, bp.location_lng]);
        setHomeCity(bp.city ?? null);
        return;
      }
      // Try parent profile
      const { data: pp } = await supabase.from("parent_profiles")
        .select("city").eq("user_id", user.id).maybeSingle();
      const city = bp?.city || pp?.city;
      if (city) {
        setHomeCity(city);
        // Geocode city name via Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
          const results = await res.json();
          if (results?.[0]) setHomeCoords([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
        } catch { /* silently fail */ }
      }
    };
    loadHome();
  }, [user]);

  /* ── Load jobs ──────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("babysitting_jobs" as any)
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (data && Array.isArray(data)) {
        const parentIds = [...new Set((data as any[]).map((j: any) => j.parent_id))];
        let nameMap: Record<string, string> = {};
        if (parentIds.length > 0) {
          const { data: parents } = await supabase.from("parent_profiles").select("user_id, name").in("user_id", parentIds);
          if (parents) parents.forEach((p) => { nameMap[p.user_id] = p.name; });
        }
        setJobs((data as any[]).map((j: any) => ({ ...j, parent_name: nameMap[j.parent_id] ?? "Parent" })));
      }
      setLoading(false);
    };
    load();
  }, []);

  /* ── Load babysitters + real-time subscription ─────────────────── */
  useEffect(() => {
    const loadBabysitters = async () => {
      const { data } = await supabase
        .from("babysitter_profiles")
        .select("id, user_id, name, photo_url, city, location_lat, location_lng, hourly_rate, is_verified, rating_avg, years_experience");
      if (data) {
        setBabysitters(data.filter((b) => b.location_lat != null && b.location_lng != null));
      }
    };
    loadBabysitters();

    /* Supabase Realtime — listen for INSERT / UPDATE / DELETE */
    const channel = supabase
      .channel("babysitter-locations")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "babysitter_profiles" },
        (payload: any) => {
          const rec = payload.new as Babysitter | undefined;
          const oldRec = payload.old as { id?: string } | undefined;

          if (payload.eventType === "INSERT" && rec?.location_lat && rec?.location_lng) {
            setBabysitters((prev) => [...prev, rec]);
          } else if (payload.eventType === "UPDATE" && rec) {
            setBabysitters((prev) => {
              const without = prev.filter((b) => b.id !== rec.id);
              return rec.location_lat && rec.location_lng ? [...without, rec] : without;
            });
          } else if (payload.eventType === "DELETE" && oldRec?.id) {
            setBabysitters((prev) => prev.filter((b) => b.id !== oldRec.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Filtered jobs ──────────────────────────────────────────────── */
  const filtered = jobs.filter((j) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!j.title?.toLowerCase().includes(q) && !j.city?.toLowerCase().includes(q) && !j.description?.toLowerCase().includes(q)) return false;
    }
    if (selTypes.length > 0 && !selTypes.some((t) => t.toLowerCase() === (j.job_type ?? "regular").toLowerCase())) return false;
    if (selChildren.length > 0) {
      const cnt = j.children_count ?? 1;
      if (!selChildren.some((c) => c === "1 child" ? cnt === 1 : c === "2 children" ? cnt === 2 : cnt >= 3)) return false;
    }
    return true;
  });

  /* ── Leaflet map ────────────────────────────────────────────────── */
  const setupMap = useCallback(() => {
    if (!mapRef.current) return;
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    const withCoords = filtered.filter((j) => j.location_lat && j.location_lng);
    // Prefer home location as center, then job coords, then Singapore default
    const center: [number, number] = homeCoords
      ? homeCoords
      : withCoords.length > 0
        ? [withCoords[0].location_lat!, withCoords[0].location_lng!]
        : [1.3521, 103.8198];

    const map = L.map(mapRef.current, {
      center, zoom: homeCoords ? 13 : withCoords.length > 0 ? 13 : 12,
      zoomControl: false,
    });
    mapInst.current = map;

    /* Dark tiles matching reference (CARTO dark) */
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    /* Zoom control — top right like the reference */
    L.control.zoom({ position: "topright" }).addTo(map);

    /* ── Home icon marker (pink circle + white home SVG) ─────── */
    if (homeCoords) {
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
      L.marker(homeCoords, { icon: homeIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div style="font-family:system-ui,sans-serif;text-align:center;padding:2px 0">
          <p style="font-weight:700;font-size:13px;margin:0 0 2px;color:#1c1917">📍 Your location</p>
          ${homeCity ? `<p style="font-size:11px;color:#78716c;margin:0">${homeCity}</p>` : ""}
        </div>`);
    }

    /* Pin markers for jobs */
    const pinIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:30px;height:30px;
        background:linear-gradient(135deg,${TEAL},#2a9d95);
        border:3px solid rgba(255,255,255,0.85);
        border-radius:50%;
        box-shadow:0 2px 10px rgba(0,0,0,0.45);
        display:flex;align-items:center;justify-content:center;
      "><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
      iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -18],
    });

    withCoords.forEach((j) => {
      const popup = `
        <div style="min-width:190px;font-family:system-ui,sans-serif;padding:2px 0">
          <p style="font-weight:700;font-size:13px;margin:0 0 3px;color:#1c1917">${j.title}</p>
          ${j.city ? `<p style="font-size:11px;color:#78716c;margin:0 0 3px">📍 ${j.city}</p>` : ""}
          ${j.hourly_rate ? `<p style="font-size:12px;font-weight:600;color:${TEAL};margin:0 0 4px">$${Number(j.hourly_rate).toFixed(0)}/hr</p>` : ""}
          <p style="font-size:11px;color:#a8a29e;margin:0">${j.parent_name} · ${j.children_count ?? 1} child${(j.children_count ?? 1) > 1 ? "ren" : ""}</p>
        </div>`;
      L.marker([j.location_lat!, j.location_lng!], { icon: pinIcon }).addTo(map).bindPopup(popup);
    });

    /* ── Babysitter pin markers (pink/magenta — distinct from jobs) ── */
    const sitterIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:32px;height:32px;
        background:linear-gradient(135deg,#E91E8C,#C2185B);
        border:3px solid rgba(255,255,255,0.9);
        border-radius:50%;
        box-shadow:0 2px 12px rgba(233,30,140,0.45);
        display:flex;align-items:center;justify-content:center;
      "><svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><path d="M12 2a5 5 0 0 1 5 5c0 3.5-5 9-5 9S7 10.5 7 7a5 5 0 0 1 5-5z"/><circle cx="12" cy="7" r="2" fill="rgba(233,30,140,0.9)" stroke="rgba(233,30,140,0.9)"/></svg></div>`,
      iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -20],
    });

    babysitters.forEach((b) => {
      const stars = b.rating_avg ? `⭐ ${Number(b.rating_avg).toFixed(1)}` : "";
      const verified = b.is_verified ? `<span style="color:#16a34a;font-size:11px;font-weight:600">✓ Verified</span>` : "";
      const popup = `
        <div style="min-width:180px;font-family:system-ui,sans-serif;padding:2px 0">
          <p style="font-weight:700;font-size:13px;margin:0 0 2px;color:#1c1917">🧑‍🍼 ${b.name}</p>
          ${b.city ? `<p style="font-size:11px;color:#78716c;margin:0 0 3px">📍 ${b.city}</p>` : ""}
          ${b.hourly_rate ? `<p style="font-size:12px;font-weight:600;color:#E91E8C;margin:0 0 3px">$${Number(b.hourly_rate).toFixed(0)}/hr</p>` : ""}
          <div style="display:flex;align-items:center;gap:8px;margin:0 0 2px">
            ${stars ? `<span style="font-size:11px;color:#a8a29e">${stars}</span>` : ""}
            ${verified}
          </div>
          ${b.years_experience ? `<p style="font-size:10px;color:#a8a29e;margin:0">${b.years_experience} yr${b.years_experience > 1 ? "s" : ""} experience</p>` : ""}
        </div>`;
      L.marker([b.location_lat!, b.location_lng!], { icon: sitterIcon }).addTo(map).bindPopup(popup);
    });
  }, [filtered, babysitters, homeCoords, homeCity]);

  useEffect(() => {
    const t = setTimeout(setupMap, 80);
    return () => { clearTimeout(t); if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [setupMap]);

  const toggle = (arr: string[], val: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  /* ══════════════════════════════════════════════════════════════════ */
  /*                           RENDER                                  */
  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <Navbar />

      {/* ── Search + filter bar (below navbar) ────────────────────── */}
      <div className="pt-[76px]"  /* leave room for fixed navbar */ >
        {/* Search */}
        <div style={{ background: CARD, borderBottom: `1px solid ${BDR}` }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                placeholder="Start your search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border text-white placeholder-white/30 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#3DBEB5]/50 transition-all"
                style={{ borderColor: "rgba(255,255,255,0.1)", fontSize: 13 }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: TEAL }}>
              <Search size={15} className="text-white" />
            </button>
            <Link to="/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-all whitespace-nowrap"
              style={{ background: "rgba(61,190,181,0.2)", border: `1px solid ${TEAL}`, color: TEAL }}>
              + Post a job
            </Link>
          </div>

          {/* Filter pills row — matching the reference exactly */}
          <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <FilterPill icon={Briefcase} label="Type of work" count={selTypes.length}
              open={openPanel === "type"} onClick={() => setOpenPanel(openPanel === "type" ? null : "type")} />
            <FilterPill icon={Baby} label="Children" count={selChildren.length}
              open={openPanel === "children"} onClick={() => setOpenPanel(openPanel === "children" ? null : "children")} />
            <FilterPill icon={ShieldCheck} label="Verifications" onClick={() => {}} />
            <FilterPill icon={SlidersHorizontal} label="More filters" open={openPanel === "more"}
              onClick={() => setOpenPanel(openPanel === "more" ? null : "more")} />
          </div>
        </div>

        {/* Dropdown filter panel */}
        {openPanel && (
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-b-2xl p-5 space-y-4 shadow-2xl" style={{ background: CARD, border: `1px solid ${BDR}`, borderTop: "none" }}>
              {openPanel === "type" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/60">Type of work</label>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map((t) => <Chip key={t} label={t} active={selTypes.includes(t)} onClick={() => toggle(selTypes, t, setSelTypes)} />)}
                  </div>
                </div>
              )}
              {openPanel === "children" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/60">Number of children</label>
                  <div className="flex flex-wrap gap-2">
                    {CHILDREN_OPTIONS.map((c) => <Chip key={c} label={c} active={selChildren.includes(c)} onClick={() => toggle(selChildren, c, setSelChildren)} />)}
                  </div>
                </div>
              )}
              {openPanel === "more" && (
                <p className="text-sm text-white/40">More filter options coming soon.</p>
              )}
              <div className="flex items-center gap-4 pt-1">
                <button onClick={() => { setSelTypes([]); setSelChildren([]); }}
                  className="text-xs font-medium hover:opacity-80 transition" style={{ color: TEAL }}>Clear all</button>
                <button onClick={() => setOpenPanel(null)}
                  className="text-xs font-medium px-4 py-1.5 rounded-full text-white" style={{ background: TEAL }}>Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Split layout: listings (left) + map (right) ───────────── */}
      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>

        {/* ── Left panel ──────────────────────────────────────────── */}
        <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col px-4 lg:pl-6 lg:pr-4 py-5 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 160px)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>

          <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
            Babysitting jobs in selected map area
          </h1>
          <p className="text-sm mt-1.5 mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            {loading
              ? "Loading babysitting jobs..."
              : filtered.length > 0
                ? `There ${filtered.length === 1 ? "is" : "are"} currently ${filtered.length} babysitting job${filtered.length !== 1 ? "s" : ""} matching these search criteria.`
                : "There are currently no babysitting jobs matching these search criteria."}
          </p>
          {babysitters.length > 0 && (
            <p className="text-xs font-medium mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(233,30,140,0.10)", color: "#E91E8C", border: "1px solid rgba(233,30,140,0.2)" }}>
              🧑‍🍼 {babysitters.length} babysitter{babysitters.length !== 1 ? "s" : ""} nearby
            </p>
          )}

          {/* content hint when map is empty */}
          {!loading && filtered.length === 0 && (
            <p className="text-sm font-semibold text-white/60 text-center mb-5">
              Zoom out on the map to find more profiles.
            </p>
          )}

          <div className="flex-1 space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BDR}` }}>
                  <div className="space-y-3">
                    <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              /* ── Empty state card (matching reference) ────────── */
              <div className="rounded-2xl p-7 text-center" style={{ background: "rgba(61,190,181,0.06)", border: "1px solid rgba(61,190,181,0.15)" }}>
                <h3 className="text-base font-bold text-white mb-1.5">No babysitting jobs in your neighborhood?</h3>
                <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Add your profile today and we'll work hard to connect families with babysitters like you.
                </p>
                <Link to="/profile-wizard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: TEAL }}>
                  Get started
                </Link>
              </div>
            ) : (
              /* ── Job cards ───────────────────────────────────── */
              filtered.map((job) => (
                <div key={job.id} className="rounded-2xl p-5 hover:brightness-110 transition-all cursor-pointer group"
                  style={{ background: CARD, border: `1px solid ${BDR}` }}>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#3DBEB5] transition-colors truncate">{job.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {job.city && (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <MapPin size={11} /> {job.city}
                      </span>
                    )}
                    {job.hourly_rate != null && (
                      <span className="text-xs font-bold" style={{ color: TEAL }}>${Number(job.hourly_rate).toFixed(0)}/hr</span>
                    )}
                    {job.job_type && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,190,181,0.1)", color: TEAL }}>
                        {job.job_type}
                      </span>
                    )}
                  </div>
                  {job.description && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: "rgba(255,255,255,0.35)" }}>{job.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: TEAL }}>
                        {job.parent_name?.charAt(0).toUpperCase() ?? "P"}
                      </div>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{job.parent_name}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <Clock size={10} className="inline mr-0.5" />
                      {new Date(job.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                    </span>
                    {job.children_count != null && (
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                        <Baby size={10} className="inline mr-0.5" />
                        {job.children_count} child{job.children_count > 1 ? "ren" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Breadcrumb (bottom, matching reference) */}
          <div className="mt-5 pt-3" style={{ borderTop: `1px solid ${BDR}` }}>
            <div className="flex items-center gap-1.5 text-xs">
              <Link to="/" className="font-medium underline" style={{ color: "rgba(255,255,255,0.45)" }}>Babysits</Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span className="font-medium underline" style={{ color: "rgba(255,255,255,0.45)" }}>Babysitting job</span>
            </div>
          </div>
        </div>

        {/* ── Right panel: map ────────────────────────────────────── */}
        <div className="w-full lg:w-[58%] xl:w-[62%] flex-shrink-0 relative">
          <div ref={mapRef} className="w-full" style={{ height: "calc(100vh - 160px)", minHeight: 400 }} />
          {/* Locate-me button (⊙) — below zoom controls, matching reference */}
          {homeCoords && (
            <button
              onClick={() => { if (mapInst.current && homeCoords) mapInst.current.flyTo(homeCoords, 14, { duration: 0.8 }); }}
              className="absolute z-[1000] flex items-center justify-center"
              style={{
                top: 120, right: 10,
                width: 36, height: 36, borderRadius: 4,
                background: "#fff", border: "2px solid rgba(0,0,0,0.15)",
                boxShadow: "0 1px 5px rgba(0,0,0,0.3)", cursor: "pointer",
              }}
              title="Go to my location">
              <Crosshair size={17} style={{ color: "#333" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabysittingJobs;
