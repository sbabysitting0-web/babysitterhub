import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Baby, User } from "lucide-react";
import newLogo from "@/assets/new logo.png";

type Role = "parent" | "babysitter";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>("parent");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Use refs to reliably capture autofill values on mobile browsers
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validate = (name: string, email: string, password: string) => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    if (!name || name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email";
    if (!password || password.length < 6) newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Read directly from DOM refs — captures autofill on mobile browsers
    const name = (nameRef.current?.value ?? "").trim();
    const email = (emailRef.current?.value ?? "").trim();
    const password = passwordRef.current?.value ?? "";

    const validationErrors = validate(name, email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (userId) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" });
      if (roleError) console.warn("user_roles upsert:", roleError.message);

      const { error: rpcError } = await supabase.rpc("ensure_user_record", { p_role: role });
      if (rpcError) {
        const { error: usersError } = await supabase.from("users").upsert({ id: userId, role }, { onConflict: "id" });
        if (usersError) console.warn("users upsert:", usersError.message);
      }

      if (role === "parent") {
        const { error: profileError } = await supabase.from("parent_profiles").upsert({ user_id: userId, name }, { onConflict: "user_id" });
        if (profileError) console.warn("parent_profiles upsert:", profileError.message);
      } else {
        const { error: profileError } = await supabase.from("babysitter_profiles").upsert({ user_id: userId, name }, { onConflict: "user_id" });
        if (profileError) console.warn("babysitter_profiles upsert:", profileError.message);
      }
    }

    toast({ title: "Account created!", description: role === "babysitter" ? "Welcome! You can set up your profile from the dashboard." : "Let's set up your profile." });
    if (role === "parent") navigate("/onboarding/parent");
    else navigate("/babysitter/dashboard");
    setLoading(false);
  };

  const roles: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "parent", label: "I'm a Parent", desc: "I'm looking for childcare", icon: <Baby className="w-5 h-5" /> },
    { value: "babysitter", label: "I'm a Babysitter", desc: "I offer childcare services", icon: <User className="w-5 h-5" /> },
  ];

  const inputClass =
    "w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/15 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#080F0D" }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.08) 0%, transparent 70%)" }} />

      {/* Back to home */}
      <Link to="/" className="fixed top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-125"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Home
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-6">
            <img src={newLogo} alt="BabyCare" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-xl font-heading font-bold text-white">Baby<span style={{ color: "#3DBEB5" }}>Care</span></span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-white">Create your account</h1>
          <p className="text-white/40 mt-1 text-sm">Free to join. No credit card needed.</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#0E1E1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                style={{
                  borderColor: role === r.value ? "#3DBEB5" : "rgba(255,255,255,0.08)",
                  background: role === r.value ? "rgba(61,190,181,0.1)" : "rgba(255,255,255,0.02)",
                  color: role === r.value ? "#3DBEB5" : "rgba(255,255,255,0.45)",
                }}
              >
                {r.icon}
                <span className="font-heading font-semibold text-sm">{r.label}</span>
                <span className="text-xs opacity-70">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Full name</label>
              <input
                ref={nameRef}
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                className={inputClass}
                style={{ fontSize: "16px" }}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Email</label>
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                style={{ fontSize: "16px" }}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Password</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className={`${inputClass} pr-10`}
                  style={{ fontSize: "16px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-full text-sm text-white transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: "#3DBEB5", fontSize: "16px" }}
            >
              {loading ? "Creating account…" : `Sign up as ${role === "parent" ? "Parent" : "Babysitter"}`}
            </button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            By signing up you agree to our{" "}
            <Link to="/terms" className="hover:underline" style={{ color: "#3DBEB5" }}>Terms &amp; Privacy</Link>
          </p>

          <p className="text-center text-sm text-white/40 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="font-medium hover:underline" style={{ color: "#3DBEB5" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
