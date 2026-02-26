import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getCurrencyForCity } from "@/lib/utils";
import {
  Calendar, MessageCircle, Star, User, CheckCircle, XCircle,
  Edit3, Save, DollarSign, Clock, Home, Settings, LogOut,
  Bell, Shield, TrendingUp, CalendarCheck, LucideIcon,
} from "lucide-react";
import newLogo from "@/assets/new logo.png";

const TEAL = "#3DBEB5";
const BG   = "#080F0D";
const CARD = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

interface Booking {
  id: string; parent_id: string; start_time: string; end_time: string;
  status: string; total_price: number | null; notes: string | null; parent_name?: string;
}
interface Profile {
  id: string; name: string; bio: string | null; city: string | null;
  hourly_rate: number | null; years_experience: number | null;
  rating_avg: number | null; rating_count: number | null; skills: string[] | null; is_verified: boolean | null;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "rgba(251,191,36,0.12)",  text: "#FB923C", dot: "#FB923C" },
  confirmed: { bg: "rgba(61,190,181,0.12)",  text: "#3DBEB5", dot: "#3DBEB5" },
  completed: { bg: "rgba(99,102,241,0.12)",  text: "#818CF8", dot: "#818CF8" },
  cancelled: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.35)", dot: "rgba(255,255,255,0.25)" },
};

const TABS = ["bookings", "profile", "availability"] as const;
type Tab = (typeof TABS)[number];

const SidebarLink = ({ icon: Icon, label, href, active = false, onClick }: {
  icon: LucideIcon; label: string; href?: string; active?: boolean; onClick?: () => void;
}) => {
  const cls = "flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all w-full cursor-pointer";
  const style = active ? { background: "rgba(61,190,181,0.12)", color: TEAL } : { color: "rgba(255,255,255,0.45)" };
  if (href && !onClick) return <Link to={href} className={cls} style={style}><Icon size={17} />{label}</Link>;
  return <button className={cls} style={style} onClick={onClick}><Icon size={17} />{label}</button>;
};

const StatCard = ({ icon: Icon, label, value, iconColor }: { icon: LucideIcon; label: string; value: string | number; iconColor: string; }) => (
  <div className="rounded-2xl px-5 py-4 flex items-center gap-4 transition-all hover:brightness-110" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}18` }}>
      <Icon className="w-5 h-5" style={{ color: iconColor }} />
    </div>
    <div>
      <p className="text-2xl font-heading font-bold text-white leading-none">{value}</p>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
    </div>
  </div>
);

/* Dark input helpers */
const fieldCls = "w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all";
const fieldStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" };

const BabysitterDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editProfile, setEditProfile] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
      const [profileRes, bookingsRes] = await Promise.all([
        supabase.from("babysitter_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("bookings").select("*").eq("babysitter_id", user.id).order("start_time", { ascending: false }),
      ]);
      if (profileRes.data) { setProfile(profileRes.data as Profile); setEditProfile(profileRes.data as Profile); }
      if (bookingsRes.data) {
        const parentIds = [...new Set(bookingsRes.data.map((b) => b.parent_id))];
        const { data: parentProfiles } = await supabase.from("parent_profiles").select("user_id, name").in("user_id", parentIds);
        const nameMap: Record<string, string> = {};
        parentProfiles?.forEach((p) => { nameMap[p.user_id] = p.name; });
        setBookings(bookingsRes.data.map((b) => ({ ...b, parent_name: nameMap[b.parent_id] ?? "Parent" })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: "confirmed" | "cancelled" | "completed") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId).eq("babysitter_id", user?.id ?? "");
    if (!error) { setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b)); toast({ title: `Booking ${status}` }); }
    else toast({ title: "Failed to update booking", description: error.message, variant: "destructive" });
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const isComplete = !!(editProfile.name && editProfile.bio && editProfile.city && editProfile.hourly_rate);
    const { error } = await supabase.from("babysitter_profiles").update({ name: editProfile.name, bio: editProfile.bio, city: editProfile.city, hourly_rate: editProfile.hourly_rate, years_experience: editProfile.years_experience, is_verified: isComplete, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    setSaving(false);
    if (!error) { setProfile((prev) => prev ? { ...prev, ...editProfile, is_verified: isComplete } : null); toast({ title: "Profile updated!" }); }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const completed = bookings.filter((b) => b.status === "completed");
  const firstName = profile?.name?.split(" ")[0] ?? "";
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })();
  const currency = getCurrencyForCity(editProfile.city ?? profile?.city ?? "");

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
          <SidebarLink icon={Home} label="Dashboard" href="/babysitter/dashboard" active />
          <SidebarLink icon={MessageCircle} label="Messages" href="/parent/inbox" />
        </nav>
        <div className="px-3 pb-5">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all w-full hover:text-red-400 text-left" style={{ color: "rgba(255,255,255,0.35)" }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

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
              <button onClick={() => setShowProfileMenu((v) => !v)} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: TEAL }}>{firstName?.charAt(0) || "B"}</button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-52 rounded-2xl shadow-2xl py-1 z-50" style={{ background: "#0A1714", border: `1px solid ${BORDER}` }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <p className="font-semibold text-sm text-white">{profile?.name || "My Account"}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{user?.email}</p>
                  </div>
                  <Link to="/onboarding/babysitter" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}><User size={14} /> Edit Profile</Link>
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button onClick={() => { setShowProfileMenu(false); handleSignOut(); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 w-full text-left"><LogOut size={14} /> Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 max-w-[1080px] pt-4">
          {/* Verification banner */}
          {profile && !!!(profile.name && profile.bio && profile.city && profile.hourly_rate) && (
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <Shield className="w-4 h-4 shrink-0" style={{ color: "#FB923C" }} />
              <p className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                Profile incomplete. Fill in bio, city and hourly rate to become visible to parents.{" "}
                <button onClick={() => setActiveTab("profile")} className="font-semibold underline underline-offset-2" style={{ color: TEAL }}>Edit profile</button>
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard icon={Clock} label="Pending requests" value={pending.length} iconColor="#FB923C" />
            <StatCard icon={CheckCircle} label="Confirmed" value={confirmed.length} iconColor={TEAL} />
            <StatCard icon={CalendarCheck} label="Jobs done" value={completed.length} iconColor="#60A5FA" />
            <StatCard icon={Star} label="Rating" value={profile?.rating_avg ? Number(profile.rating_avg).toFixed(1) : "—"} iconColor="#FCD34D" />
          </div>

          {/* Tab bar */}
          <div className="flex mb-5 gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 text-sm font-medium capitalize rounded-lg transition-all"
                style={{ background: activeTab === tab ? CARD : "transparent", color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.35)", boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.3)" : "none" }}>
                {tab}
                {tab === "bookings" && pending.length > 0 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "#FB923C22", color: "#FB923C" }}>{pending.length}</span>}
                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5" />}
              </button>
            ))}
          </div>

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-3">
              {loading ? (
                [1,2,3].map((i) => (
                  <div key={i} className="rounded-2xl p-5 flex gap-4 items-start" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
                  </div>
                ))
              ) : bookings.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No booking requests yet.</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>They'll appear here once parents book you.</p>
                </div>
              ) : (
                bookings.map((booking) => {
                  const sc = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.cancelled;
                  return (
                    <div key={booking.id} className="rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap hover:brightness-110 transition-all" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(61,190,181,0.12)" }}>
                          <User size={18} style={{ color: TEAL }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">{booking.parent_name}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />{booking.status}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {new Date(booking.start_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {new Date(booking.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} – {new Date(booking.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {booking.notes && <p className="text-xs mt-1 italic" style={{ color: "rgba(255,255,255,0.35)" }}>"{booking.notes}"</p>}
                          {booking.total_price && (
                            <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: TEAL }}><DollarSign size={11} />{getCurrencyForCity(profile?.city ?? "").code} {Number(booking.total_price).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {booking.status === "pending" && (
                          <>
                            <Button size="sm" className="h-8 text-xs rounded-full px-4 text-white" style={{ background: TEAL }} onClick={() => updateBookingStatus(booking.id, "confirmed")}>
                              <CheckCircle size={12} className="mr-1" /> Accept
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full px-4 text-red-400 border-red-900 bg-transparent hover:bg-red-400/10" onClick={() => updateBookingStatus(booking.id, "cancelled")}>
                              <XCircle size={12} className="mr-1" /> Decline
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-full px-4 bg-transparent border-white/10 text-white/60 hover:text-white" onClick={() => updateBookingStatus(booking.id, "completed")}>
                            Mark complete
                          </Button>
                        )}
                        <Link to={`/parent/inbox?with=${booking.parent_id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-full px-3 bg-transparent border-white/10 text-white/50 hover:text-white">
                            <MessageCircle size={12} className="mr-1" /> Chat
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-2xl p-6 space-y-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-white">Edit Profile</h2>
                <Edit3 size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Full name</label>
                  <input value={editProfile.name ?? ""} onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })} className={fieldCls} style={fieldStyle} placeholder="Jane Smith" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>City / Area</label>
                  <input value={editProfile.city ?? ""} onChange={(e) => setEditProfile({ ...editProfile, city: e.target.value })} className={fieldCls} style={fieldStyle} placeholder="e.g. Singapore" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Hourly rate ({currency.code})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{currency.symbol}</span>
                    <input type="number" value={editProfile.hourly_rate ?? ""} onChange={(e) => setEditProfile({ ...editProfile, hourly_rate: parseFloat(e.target.value) })} className={`${fieldCls} pl-7`} style={fieldStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Years experience</label>
                  <input type="number" value={editProfile.years_experience ?? ""} onChange={(e) => setEditProfile({ ...editProfile, years_experience: parseInt(e.target.value) })} className={fieldCls} style={fieldStyle} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Bio / Introduction</label>
                <textarea value={editProfile.bio ?? ""} onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })} rows={4} placeholder="Tell parents about yourself…" className={`${fieldCls} resize-none`} style={fieldStyle} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 font-semibold rounded-full px-6 py-2.5 text-sm text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: TEAL }}>
                  <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
                </button>
                {!!(profile?.name && profile?.bio && profile?.city && profile?.hourly_rate) && (
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: TEAL }}><TrendingUp size={13} /> Profile complete</span>
                )}
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === "availability" && (
            <div className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="mb-5">
                <h2 className="font-heading font-bold text-white">Manage Availability</h2>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Toggle days on/off and adjust your working hours.</p>
              </div>
              <AvailabilityManager userId={user?.id ?? ""} />
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch" style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
          {([
            { icon: Home, label: "Home", tab: null, href: "/babysitter/dashboard" },
            { icon: Calendar, label: "Bookings", tab: "bookings", href: null },
            { icon: MessageCircle, label: "Messages", tab: null, href: "/parent/inbox" },
            { icon: User, label: "Profile", tab: "profile", href: null },
            { icon: CalendarCheck, label: "Avail.", tab: "availability", href: null },
          ] as const).map(({ icon: Icon, label, tab, href }) => {
            const isActive = tab ? activeTab === tab : false;
            const handleClick = () => { if (tab) setActiveTab(tab as Tab); else if (href) navigate(href); };
            return (
              <button key={label} onClick={handleClick} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors" style={{ color: isActive ? TEAL : "rgba(255,255,255,0.35)" }}>
                <Icon size={18} />{label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

/* ─── Availability Manager ─────────────────────────────── */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AvailabilityManager = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<{ [day: number]: { start: string; end: string; enabled: boolean } }>({
    0: { start: "09:00", end: "18:00", enabled: false },
    1: { start: "09:00", end: "18:00", enabled: true },
    2: { start: "09:00", end: "18:00", enabled: true },
    3: { start: "09:00", end: "18:00", enabled: true },
    4: { start: "09:00", end: "18:00", enabled: true },
    5: { start: "09:00", end: "18:00", enabled: true },
    6: { start: "09:00", end: "18:00", enabled: false },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("babysitter_availability").select("day_of_week, start_time, end_time, is_available").eq("babysitter_id", userId).then(({ data }) => {
      if (!data || data.length === 0) return;
      setAvailability((prev) => {
        const updated = { ...prev };
        data.forEach((row) => { updated[row.day_of_week] = { start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5), enabled: row.is_available ?? true }; });
        return updated;
      });
    });
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const rows = Object.entries(availability).filter(([, v]) => v.enabled).map(([day, v]) => ({ babysitter_id: userId, day_of_week: parseInt(day), start_time: v.start, end_time: v.end, is_available: true }));
    await supabase.from("babysitter_availability").delete().eq("babysitter_id", userId);
    if (rows.length > 0) await supabase.from("babysitter_availability").insert(rows);
    setSaving(false);
    toast({ title: "Availability updated!" });
  };

  const timeCls = "text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all";
  const timeStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" };

  return (
    <div className="space-y-2">
      {DAYS.map((day, i) => (
        <div key={day} className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
          style={{ borderColor: availability[i].enabled ? "rgba(61,190,181,0.3)" : BORDER, background: availability[i].enabled ? "rgba(61,190,181,0.05)" : "rgba(255,255,255,0.02)" }}>
          <input type="checkbox" checked={availability[i].enabled} onChange={() => setAvailability((prev) => ({ ...prev, [i]: { ...prev[i], enabled: !prev[i].enabled } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: TEAL }} />
          <span className="text-sm font-medium w-24" style={{ color: availability[i].enabled ? "#fff" : "rgba(255,255,255,0.35)" }}>{day}</span>
          {availability[i].enabled ? (
            <div className="flex items-center gap-2 ml-auto">
              <input type="time" value={availability[i].start} onChange={(e) => setAvailability((prev) => ({ ...prev, [i]: { ...prev[i], start: e.target.value } }))} className={timeCls} style={timeStyle} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>to</span>
              <input type="time" value={availability[i].end} onChange={(e) => setAvailability((prev) => ({ ...prev, [i]: { ...prev[i], end: e.target.value } }))} className={timeCls} style={timeStyle} />
            </div>
          ) : (
            <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Unavailable</span>
          )}
        </div>
      ))}
      <div className="pt-2">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 font-semibold rounded-full px-6 py-2.5 text-sm text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: TEAL }}>
          <Save size={15} /> {saving ? "Saving…" : "Save Availability"}
        </button>
      </div>
    </div>
  );
};

export default BabysitterDashboard;
