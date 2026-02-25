import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const DarkInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/15 transition-all ${className}`}
    />
  )
);
DarkInput.displayName = "DarkInput";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description:
            error.message === "Email not confirmed"
              ? "Please confirm your email before logging in. Check your inbox."
              : error.message,
          variant: "destructive",
        });
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
      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Email</label>
              <DarkInput type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">Password</label>
              <div className="relative">
                <DarkInput
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(61,190,181,0.7)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#3DBEB5")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(61,190,181,0.7)")}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-full text-sm text-white transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50"
              style={{ background: "#3DBEB5" }}
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
