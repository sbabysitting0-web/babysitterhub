import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MessageCircle, Star, Calendar, Clock, User,
  CalendarCheck, ArrowRight, LogOut, Home, Bell,
  Settings, MapPin, Shield, BookOpen,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import newLogo from "@/assets/new logo.png";

const TEAL = "#3DBEB5";
const BG = "#080F0D";
const CARD = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

interface Booking {
  id: string; start_time: string; end_time: string; status: string;
  total_price: number | null; notes: string | null;
  babysitter_id: string; babysitter_name?: string;
}
interface ParentProfile { name: string; city: string | null; }
interface SitterLocation {
  id: string; user_id: string; name: string; city: string | null;
  hourly_rate: number | null; rating_avg: number | null;
  is_verified: boolean | null; lat: number; lng: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "rgba(251,191,36,0.12)",  text: "#FB923C", dot: "#FB923C" },
  confirmed: { bg: "rgba(61,190,181,0.12)",  text: "#3DBEB5", dot: "#3DBEB5" },
  completed: { bg: "rgba(99,102,241,0.12)",  text: "#818CF8", dot: "#818CF8" },
  cancelled: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.35)", dot: "rgba(255,255,255,0.25)" },
};

function SidebarLink({ icon: Icon, label, href, active }: {
  icon: React.ElementType; label: string; href: string; active?: boolean;
}) {
  return (
    <Link to={href} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full"
      style={{ background: active ? "rgba(61,190,181,0.12)" : "transparent", color: active ? TEAL : "rgba(255,255,255,0.45)" }}>
      <Icon size={17} />{label}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, iconColor, loading }: {
  icon: React.ElementType; label: string; value: string | number; iconColor: string; loading: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 transition-all hover:brightness-110" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${iconColor}18` }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      {loading ? <Skeleton className="h-7 w-14 mb-1 rounded" /> : <p className="text-2xl font-heading font-bold text-white">{value}</p>}
      <p className="text-xs mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
    </div>
  );
}

const ParentDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [sitterLocations, setSitterLocations] = useState<SitterLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // committed search term
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const [profileRes, bookingsRes] = await Promise.all([
          supabase.from("parent_profiles").select("name, city").eq("user_id", user.id).maybeSingle(),
          supabase.from("bookings").select("*").eq("parent_id", user.id).order("start_time", { ascending: false }),
        ]);
        if (profileRes.data) setProfile(profileRes.data as ParentProfile);
        const { data: sitterData } = await supabase.from("babysitter_profiles")
          .select("id, user_id, name, city, hourly_rate, rating_avg, is_verified, location_lat, location_lng");
        if (sitterData) {
          setSitterLocations(sitterData.filter((s) => s.location_lat !== null && s.location_lng !== null).map((s) => ({
            id: s.id, user_id: s.user_id, name: s.name, city: s.city,
            hourly_rate: s.hourly_rate, rating_avg: s.rating_avg, is_verified: s.is_verified,
            lat: s.location_lat as number, lng: s.location_lng as number,
          })));
        }
        if (bookingsRes.data) {
          const ids = [...new Set(bookingsRes.data.map((b) => b.babysitter_id))];
          if (ids.length > 0) {
            const { data: sitterProfiles } = await supabase.from("babysitter_profiles").select("user_id, name").in("user_id", ids);
            const nameMap: Record<string, string> = {};
            sitterProfiles?.forEach((s) => { nameMap[s.user_id] = s.name; });
            setBookings(bookingsRes.data.map((b) => ({ ...b, babysitter_name: nameMap[b.babysitter_id] ?? "Babysitter" })));
          } else {
            setBookings(bookingsRes.data.map((b) => ({ ...b, babysitter_name: "Babysitter" })));
          }
        }
      } catch { /* fail silently */ }
      setLoading(false);
    };
    load();
  }, [user]);

  const cancelBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (!error) { setBookings((p) => p.map((b) => b.id === id ? { ...b, status: "cancelled" } : b)); toast({ title: "Booking cancelled" }); }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.start_time) >= now && b.status !== "cancelled");
  const past = bookings.filter((b) => new Date(b.start_time) < now || b.status === "cancelled");
  const displayed = activeTab === "upcoming" ? upcoming : past;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  useEffect(() => {
    if (!mapDivRef.current) return;
    const source = activeSearch.trim()
      ? sitterLocations.filter((s) => s.city?.toLowerCase().includes(activeSearch.trim().toLowerCase()) || s.name?.toLowerCase().includes(activeSearch.trim().toLowerCase()))
      : sitterLocations;
    const center: [number, number] = source.length > 0 ? [source[0].lat, source[0].lng] : [1.3521, 103.8198];
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    const map = L.map(mapDivRef.current, { center, zoom: source.length > 0 ? 12 : 11, scrollWheelZoom: false });
    mapInstanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' }).addTo(map);
    const pinIcon = L.divIcon({ className: "", html: `<div style="width:28px;height:28px;background:${TEAL};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30] });
    source.forEach((s) => {
      const html = `<div style="min-width:160px;font-family:sans-serif"><p style="font-weight:700;font-size:14px;margin:0 0 3px;color:#1c1917">${s.name}</p>${s.city ? `<p style="font-size:12px;color:#78716c;margin:0 0 6px">📍 ${s.city}</p>` : ""}<a href="/babysitters/${s.id}" style="display:block;background:${TEAL};color:#fff;text-align:center;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;text-decoration:none">View Profile</a></div>`;
      L.marker([s.lat, s.lng], { icon: pinIcon }).addTo(map).bindPopup(html);
    });
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [sitterLocations, activeSearch]);

  const firstName = profile?.name?.split(" ")[0] ?? "";
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })();

  // Filter sitters by city when search is committed
  const filteredSitters = activeSearch.trim()
    ? sitterLocations.filter((s) => s.city?.toLowerCase().includes(activeSearch.trim().toLowerCase()) || s.name?.toLowerCase().includes(activeSearch.trim().toLowerCase()))
    : sitterLocations;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[252px] fixed inset-y-0 left-0 z-40" style={{ background: CARD, borderRight: `1px solid ${BORDER}` }}>
        <div className="px-6 pt-6 pb-7">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={newLogo} alt="Logo" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-base font-heading font-bold text-white">BabySitter<span style={{ color: TEAL }}>Hub</span></span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          <SidebarLink icon={Home} label="Dashboard" href="/parent/dashboard" active />
          <SidebarLink icon={MessageCircle} label="Messages" href="/parent/inbox" />
        </nav>
        <div className="px-3 pb-5">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all w-full text-left hover:text-red-400" style={{ color: "rgba(255,255,255,0.35)" }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-[252px] min-h-screen pb-24 lg:pb-8">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={newLogo} alt="Logo" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
              <span className="font-heading font-bold text-white text-sm">BabySitter<span style={{ color: TEAL }}>Hub</span></span>
            </Link>
            <div className="flex items-center gap-1.5">
              <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}><Bell size={16} /></button>
              <button onClick={handleSignOut} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}><LogOut size={16} /></button>
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5">
          <div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{greeting}</p>
            <h1 className="text-2xl font-heading font-bold text-white mt-0.5">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: CARD, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.4)" }}><Bell size={17} /></button>
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setShowProfileMenu((v) => !v)} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: TEAL }}>{firstName?.charAt(0) || "U"}</button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-52 rounded-2xl shadow-2xl py-1 z-[2000]" style={{ background: "#0A1714", border: `1px solid ${BORDER}` }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <p className="font-semibold text-sm text-white">{profile?.name || "My Account"}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{user?.email}</p>
                  </div>

                  <Link to="/onboarding/parent" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}><User size={14} /> Edit Profile</Link>
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button onClick={() => { setShowProfileMenu(false); handleSignOut(); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 w-full text-left"><LogOut size={14} /> Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 max-w-[1080px] pt-4">


          {/* Map */}
          <div className="rounded-2xl overflow-hidden mb-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div>
                <h2 className="text-base font-heading font-bold text-white">Babysitters Near You</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {activeSearch
                    ? filteredSitters.length > 0
                      ? `${filteredSitters.length} sitter${filteredSitters.length !== 1 ? "s" : ""} in "${activeSearch}"`
                      : `No sitters found in "${activeSearch}"`
                    : sitterLocations.length > 0 ? `${sitterLocations.length} sitter${sitterLocations.length !== 1 ? "s" : ""} on the map` : "Discover verified sitters in your area"}
                </p>
              </div>
              <Link to="/babysitters"><button className="inline-flex items-center gap-1.5 font-semibold rounded-full px-4 py-2 text-sm text-white transition-all hover:opacity-90" style={{ background: TEAL }}><Search size={13} />Search</button></Link>
            </div>
            <div ref={mapDivRef} style={{ height: 320, width: "100%" }} />
          </div>

          {/* Nearby strip */}
          {sitterLocations.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-heading font-bold text-white">Nearby Sitters</h3>
                <Link to="/babysitters" className="text-xs font-medium flex items-center gap-1" style={{ color: TEAL }}>See all <ArrowRight size={12} /></Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {filteredSitters.slice(0, 8).map((s) => (
                  <Link key={s.id} to={`/babysitters/${s.id}`} className="shrink-0 w-[148px] rounded-2xl p-4 hover:brightness-110 transition-all group" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 group-hover:scale-105 transition-transform" style={{ background: TEAL }}>{s.name.charAt(0).toUpperCase()}</div>
                    <p className="font-semibold text-white text-sm truncate">{s.name}</p>
                    {s.city && <p className="text-[11px] flex items-center gap-0.5 mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}><MapPin size={9} /> {s.city}</p>}
                    <div className="flex items-center justify-between mt-2">
                      {s.rating_avg ? <span className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: "#FCD34D" }}><Star size={10} className="fill-current" />{Number(s.rating_avg).toFixed(1)}</span> : <span />}
                      {s.hourly_rate && <span className="text-[11px] font-bold" style={{ color: TEAL }}>${Number(s.hourly_rate).toFixed(0)}/hr</span>}
                    </div>
                    {s.is_verified && <span className="inline-flex items-center gap-0.5 mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(61,190,181,0.12)", color: TEAL }}><Shield size={9} /> Verified</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <Link to="/parent/dashboard"><StatCard icon={Calendar} label="Total Bookings" value={bookings.length} iconColor={TEAL} loading={loading} /></Link>
            <button onClick={() => setActiveTab("upcoming")} className="text-left w-full"><StatCard icon={Clock} label="Upcoming" value={upcoming.length} iconColor="#60A5FA" loading={loading} /></button>
            <button onClick={() => setActiveTab("past")} className="text-left w-full"><StatCard icon={CalendarCheck} label="Completed" value={completedCount} iconColor="#FB923C" loading={loading} /></button>
            <Link to="/babysitters"><StatCard icon={BookOpen} label="Find Sitters" value="Browse" iconColor="#A78BFA" loading={loading} /></Link>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              { to: "/babysitters", icon: Search, label: "Find a Sitter", desc: "Search & compare verified babysitters", color: TEAL },
              { to: "/parent/inbox", icon: MessageCircle, label: "Messages", desc: "Chat directly with your sitters", color: "#60A5FA" },
              { to: "/parent/inbox", icon: BookOpen, label: "My Bookings", desc: "View all your booking history", color: "#A78BFA" },
            ].map(({ to, icon: Icon, label, desc, color }) => (
              <Link key={label} to={to} className="group rounded-2xl p-4 flex items-center gap-4 transition-all hover:brightness-110" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
                </div>
                <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform" style={{ color: "rgba(255,255,255,0.2)" }} />
              </Link>
            ))}
          </div>

          {/* Bookings panel */}
          <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 pt-5 pb-0">
              <h3 className="text-base font-heading font-bold text-white mb-4">Your Bookings</h3>
              <div className="flex gap-1 rounded-xl p-1 mb-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                {(["upcoming", "past"] as const).map((tab) => {
                  const count = tab === "upcoming" ? upcoming.length : past.length;
                  const isActive = activeTab === tab;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 text-sm font-medium capitalize rounded-lg transition-all"
                      style={{ background: isActive ? CARD : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.35)", boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.3)" : "none" }}>
                      {tab} <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-md font-semibold" style={{ background: isActive ? "rgba(61,190,181,0.12)" : "rgba(255,255,255,0.06)", color: isActive ? TEAL : "rgba(255,255,255,0.35)" }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)" }}><Skeleton className="h-10 w-full rounded" /></div>)}</div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.05)" }}><Calendar className="w-7 h-7" style={{ color: "rgba(255,255,255,0.25)" }} /></div>
                  <p className="text-white font-heading font-bold mb-1">{activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}</p>
                  <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.35)" }}>{activeTab === "upcoming" ? "Find a trusted babysitter and book your first session!" : "Your completed bookings will show up here"}</p>
                  {activeTab === "upcoming" && <Link to="/babysitters"><button className="flex items-center gap-2 font-semibold rounded-full px-6 py-2.5 text-sm text-white mx-auto" style={{ background: TEAL }}><Search size={14} /> Browse babysitters</button></Link>}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayed.map((booking) => {
                    const sc = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.cancelled;
                    return (
                      <div key={booking.id} className="rounded-xl p-4 hover:brightness-110 transition-all" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: TEAL }}>{booking.babysitter_name?.charAt(0) ?? "B"}</div>
                            <div>
                              <p className="font-semibold text-white text-sm">{booking.babysitter_name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}><Calendar size={11} className="inline mr-0.5" />{new Date(booking.start_time).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>
                                <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}><Clock size={11} className="inline mr-0.5" />{new Date(booking.start_time).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })} – {new Date(booking.end_time).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}</span>
                                {booking.total_price && <span className="text-xs font-semibold" style={{ color: TEAL }}>SGD {Number(booking.total_price).toFixed(2)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            {booking.status === "pending" && <button className="text-xs font-medium px-2 py-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors" onClick={() => cancelBooking(booking.id)}>Cancel</button>}
                            {booking.status === "completed" && <button className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: TEAL }} onClick={() => navigate(`/parent/review/${booking.id}?sitter=${booking.babysitter_id}`)}><Star size={11} /> Review</button>}
                            <Link to={`/parent/inbox?with=${booking.babysitter_id}`}><button className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg" style={{ color: "rgba(255,255,255,0.4)" }}><MessageCircle size={11} /> Chat</button></Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
};

function BottomNav() {
  const location = useLocation();
  const items = [
    { icon: Home, label: "Home", href: "/parent/dashboard" },
    { icon: Search, label: "Search", href: "/babysitters" },
    { icon: MessageCircle, label: "Inbox", href: "/parent/inbox" },
    { icon: User, label: "Profile", href: "/onboarding/parent" },
  ];
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="px-2 pb-[env(safe-area-inset-bottom)]" style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-around py-2">
          {items.map(({ icon: Icon, label, href }) => {
            const active = location.pathname === href;
            return (
              <Link key={href} to={href} className="flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors" style={{ color: active ? TEAL : "rgba(255,255,255,0.35)" }}>
                <Icon size={20} /><span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;
