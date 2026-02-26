import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Baby, User } from "lucide-react";
import newLogo from "@/assets/new logo.png";

type Role = "parent" | "babysitter";

const SelectRole = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>("parent");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
      navigate("/login");
      return;
    }

    const userId = user.id;
    const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";

    // 1. Save role in user_metadata
    await supabase.auth.updateUser({ data: { role } });

    // 2. Upsert user_roles table
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });
    if (roleError) console.warn("user_roles upsert:", roleError.message);

    // 3. Ensure users record
    const { error: rpcError } = await supabase.rpc("ensure_user_record", { p_role: role });
    if (rpcError) {
      const { error: usersError } = await supabase
        .from("users")
        .upsert({ id: userId, role }, { onConflict: "id" });
      if (usersError) console.warn("users upsert:", usersError.message);
    }

    // 4. Create profile row
    if (role === "parent") {
      const { error } = await supabase
        .from("parent_profiles")
        .upsert({ user_id: userId, name }, { onConflict: "user_id" });
      if (error) console.warn("parent_profiles upsert:", error.message);
    } else {
      const { error } = await supabase
        .from("babysitter_profiles")
        .upsert({ user_id: userId, name }, { onConflict: "user_id" });
      if (error) console.warn("babysitter_profiles upsert:", error.message);
    }

    setLoading(false);

    // Navigate to onboarding / dashboard
    if (role === "parent") navigate("/onboarding/parent");
    else navigate("/babysitter/dashboard");
  };

  const roles: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "parent", label: "I'm a Parent", desc: "I'm looking for trusted childcare", icon: <Baby className="w-7 h-7" /> },
    { value: "babysitter", label: "I'm a Babysitter", desc: "I offer childcare services", icon: <User className="w-7 h-7" /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080F0D" }}>
      {/* Glow blob */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.08) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 justify-center mb-6">
            <img src={newLogo} alt="BabyCare" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-xl font-heading font-bold text-white">
              Baby<span style={{ color: "#3DBEB5" }}>Care</span>
            </span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">One last step!</h1>
          <p className="text-white/40 mt-2 text-sm">Tell us who you are so we can personalise your experience.</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#0E1E1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Role cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-center focus:outline-none"
                style={{
                  borderColor: role === r.value ? "#3DBEB5" : "rgba(255,255,255,0.08)",
                  background: role === r.value ? "rgba(61,190,181,0.1)" : "rgba(255,255,255,0.02)",
                  color: role === r.value ? "#3DBEB5" : "rgba(255,255,255,0.45)",
                  transform: role === r.value ? "scale(1.02)" : "scale(1)",
                }}
              >
                {/* Icon circle */}
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: role === r.value ? "rgba(61,190,181,0.18)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  {r.icon}
                </span>
                <span className="font-heading font-bold text-sm">{r.label}</span>
                <span className="text-xs opacity-70 leading-snug">{r.desc}</span>

                {/* Selected checkmark */}
                {role === r.value && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center mt-1"
                    style={{ background: "#3DBEB5" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="w-full font-semibold py-3 rounded-full text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#3DBEB5", fontSize: "16px" }}
          >
            {loading ? "Setting up your account…" : `Continue as ${role === "parent" ? "Parent" : "Babysitter"}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
