import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Use refs to reliably capture autofill values on mobile browsers
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validate = (email: string, password: string) => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Read directly from DOM refs — this captures autofill on mobile browsers
    // (react-hook-form's register can miss autofilled values on mobile)
    const email = (emailRef.current?.value ?? "").trim();
    const password = passwordRef.current?.value ?? "";

    const validationErrors = validate(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      // Wrap in a timeout so mobile users don't stare at "Signing in…" forever
      const timeoutMs = 15000;
      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please check your internet connection and try again.")), timeoutMs)
      );

      const { data: authData, error } = await Promise.race([authPromise, timeoutPromise]);

      if (error) {
        console.error("[Login] Auth error:", error.message);
        let description = error.message;
        if (error.message === "Email not confirmed") {
          description = "Please confirm your email before logging in. Check your inbox.";
        } else if (error.message === "Invalid login credentials") {
          description = "Incorrect email or password. Please try again.";
        }
        toast({ title: "Login failed", description, variant: "destructive" });
        return;
      }

      const user = authData?.user;
      if (!user) {
        toast({ title: "Login failed", description: "Could not retrieve account.", variant: "destructive" });
        return;
      }

      const metaRole = user.user_metadata?.role as string | undefined;
      if (metaRole === "admin") navigate("/admin");
      else if (metaRole === "babysitter") navigate("/babysitter/dashboard");
      else navigate("/parent/dashboard");
    } catch (err: unknown) {
      console.error("[Login] Unexpected error:", err);
      const message = err instanceof Error ? err.message : "Please try again.";
      // Detect common mobile network errors
      const isNetworkError = message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("network");
      toast({
        title: isNetworkError ? "Connection error" : "Something went wrong",
        description: isNetworkError ? "Unable to reach the server. Please check your internet connection." : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/15 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080F0D" }}>
      {/* Subtle glow blob */}
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
          <h1 className="text-2xl font-heading font-bold text-white">Welcome back</h1>
          <p className="text-white/40 mt-1 text-sm">Sign in to your account</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#0E1E1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                  style={{ fontSize: "16px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(61,190,181,0.7)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-full text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#3DBEB5", fontSize: "16px" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium hover:underline" style={{ color: "#3DBEB5" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
