import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import newLogo from "@/assets/new logo.png";

/**
 * Attempt Supabase login with automatic retry + timeout.
 */
async function signInWithRetry(email: string, password: string, maxRetries = 3) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const result = await supabase.auth.signInWithPassword({ email, password });

      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Login] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  throw lastError ?? new Error("Login failed after multiple attempts");
}

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Google loading
  const [googleLoading, setGoogleLoading] = useState(false);

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
      const { data: authData, error } = await signInWithRetry(email, password);

      if (error) {
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
      const message = err instanceof Error ? err.message : "Please try again.";
      const isNetworkError =
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("network") ||
        message.includes("aborted") ||
        message.includes("timed out") ||
        message.includes("timeout");
      toast({
        title: isNetworkError ? "Connection error" : "Something went wrong",
        description: isNetworkError
          ? "Unable to reach the server. Please check your internet connection and try again."
          : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Google OAuth ---
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
    }
    // On success Supabase redirects the browser — no need to setLoading(false)
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

          {/* ── Social / Quick-access buttons ── */}
          <div className="space-y-3 mb-6">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-full font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: "15px" }}
            >
              {googleLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.5-4z" fill="#FFC107"/>
                  <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z" fill="#FF3D00"/>
                  <path d="M24 45c5.5 0 10.5-2 14.2-5.3l-6.6-5.5C29.7 35.9 27 37 24 37c-6.1 0-10.7-3.1-11.8-8.5l-7 5.4C8.2 40.8 15.5 45 24 45z" fill="#4CAF50"/>
                  <path d="M44.5 20H24v8.5h11.8c-.7 2.8-2.8 5.3-5.3 6.9l6.6 5.5C41 37.5 45 32 45 24c0-1.4-.2-2.7-.5-4z" fill="#1976D2"/>
                </svg>
              )}
              Continue with Google
            </button>

          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>or continue with password</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* ── Email + Password form ── */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Email</label>
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                inputMode="email"
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
