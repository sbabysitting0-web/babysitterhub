import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Calendar, Search, CheckCircle, XCircle } from "lucide-react";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

interface UserRow   { id: string; role: string | null; created_at: string | null; name?: string; is_verified?: boolean; }
interface BookingRow { id: string; parent_id: string; babysitter_id: string; start_time: string; status: string; total_price: number | null; parent_name?: string; babysitter_name?: string; }

const tabs = ["users", "babysitters", "bookings"] as const;

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(251,191,36,0.12)",  color: "#FBbf24" },
  confirmed: { bg: "rgba(61,190,181,0.12)",  color: TEAL },
  completed: { bg: "rgba(99,102,241,0.12)",  color: "#818CF8" },
  cancelled: { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
};

const AdminPanel = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sitters, setSitters] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [usersRes, sittersRes, bookingsRes] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("babysitter_profiles").select("id, user_id, name, is_verified, created_at").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("start_time", { ascending: false }).limit(50),
      ]);
      if (usersRes.data) setUsers(usersRes.data as UserRow[]);
      if (sittersRes.data) setSitters(sittersRes.data.map((s) => ({ id: s.user_id, role: "babysitter", created_at: s.created_at, name: s.name, is_verified: s.is_verified ?? false })));
      if (bookingsRes.data) {
        const parentIds = [...new Set(bookingsRes.data.map((b) => b.parent_id))];
        const sitterIds = [...new Set(bookingsRes.data.map((b) => b.babysitter_id))];
        const [pp, sp] = await Promise.all([
          supabase.from("parent_profiles").select("user_id, name").in("user_id", parentIds),
          supabase.from("babysitter_profiles").select("user_id, name").in("user_id", sitterIds),
        ]);
        const pMap: Record<string, string> = {}; pp.data?.forEach((p) => { pMap[p.user_id] = p.name; });
        const sMap: Record<string, string> = {}; sp.data?.forEach((p) => { sMap[p.user_id] = p.name; });
        setBookings(bookingsRes.data.map((b) => ({ ...b, parent_name: pMap[b.parent_id] ?? "Parent", babysitter_name: sMap[b.babysitter_id] ?? "Babysitter" })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const verifySitter = async (userId: string, verified: boolean) => {
    const { error } = await supabase.from("babysitter_profiles").update({ is_verified: verified }).eq("user_id", userId);
    if (!error) { setSitters((prev) => prev.map((s) => s.id === userId ? { ...s, is_verified: verified } : s)); toast({ title: verified ? "Babysitter verified ✓" : "Verification removed" }); }
  };

  const fUsers    = users.filter((u) => !search || u.id.includes(search) || u.role?.includes(search));
  const fSitters  = sitters.filter((s) => !search || s.name?.toLowerCase().includes(search.toLowerCase()));
  const fBookings = bookings.filter((b) => !search || b.parent_name?.toLowerCase().includes(search.toLowerCase()) || b.babysitter_name?.toLowerCase().includes(search.toLowerCase()) || b.status.includes(search));

  const thCls = "text-left px-4 py-3 text-xs font-semibold";

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(61,190,181,0.12)" }}>
            <Shield className="w-5 h-5" style={{ color: TEAL }} />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Admin Panel</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Manage users, verify sitters, oversee bookings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total users", value: users.length, icon: Users },
            { label: "Babysitters", value: sitters.length, icon: Users },
            { label: "Verified sitters", value: sitters.filter((s) => s.is_verified).length, icon: CheckCircle },
            { label: "Total bookings", value: bookings.length, icon: Calendar },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <stat.icon className="w-5 h-5 mb-2" style={{ color: TEAL }} />
              <p className="text-2xl font-heading font-bold text-white">{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl pl-9 pr-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" }} />
        </div>

        {/* Tabs */}
        <div className="flex mb-6 gap-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-medium capitalize transition-all"
              style={{ color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.4)", borderBottom: activeTab === tab ? `2px solid ${TEAL}` : "2px solid transparent" }}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: CARD, border: `1px solid ${BORDER}` }} />)}
          </div>
        ) : (
          <>
            {/* Users */}
            {activeTab === "users" && (
              <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <table className="w-full text-sm">
                  <thead style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)" }}>
                    <tr>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>User ID</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Role</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fUsers.map((u) => (
                      <tr key={u.id} className="transition-colors" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{u.id.slice(0, 16)}...</td>
                        <td className="px-4 py-3">
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(61,190,181,0.1)", color: TEAL }}>{u.role ?? "unknown"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("en-SG") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Babysitters */}
            {activeTab === "babysitters" && (
              <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <table className="w-full text-sm">
                  <thead style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)" }}>
                    <tr>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Name</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Status</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Joined</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fSitters.map((s) => (
                      <tr key={s.id} className="transition-colors" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3 font-medium text-white">{s.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          {s.is_verified
                            ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(61,190,181,0.1)", color: TEAL }}><CheckCircle size={10} /> Verified</span>
                            : <span className="inline-block text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.1)", color: "#FBbf24" }}>Pending</span>}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.created_at ? new Date(s.created_at).toLocaleDateString("en-SG") : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {!s.is_verified
                              ? <button onClick={() => verifySitter(s.id, true)} className="text-xs px-3 py-1.5 rounded-full font-semibold text-white flex items-center gap-1 transition-all hover:opacity-90" style={{ background: TEAL }}>
                                  <CheckCircle size={11} /> Verify
                                </button>
                              : <button onClick={() => verifySitter(s.id, false)} className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 transition-all hover:opacity-90" style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}>
                                  <XCircle size={11} /> Revoke
                                </button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bookings */}
            {activeTab === "bookings" && (
              <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <table className="w-full text-sm">
                  <thead style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)" }}>
                    <tr>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Parent</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Babysitter</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Date</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Status</th>
                      <th className={thCls} style={{ color: "rgba(255,255,255,0.4)" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fBookings.map((b) => {
                      const scl = STATUS_STYLES[b.status] ?? { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" };
                      return (
                        <tr key={b.id} className="transition-colors" style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <td className="px-4 py-3 font-medium text-white">{b.parent_name}</td>
                          <td className="px-4 py-3 text-white">{b.babysitter_name}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{new Date(b.start_time).toLocaleDateString("en-SG")}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: scl.bg, color: scl.color }}>{b.status}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-white">{b.total_price ? `SGD ${Number(b.total_price).toFixed(2)}` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
