import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles OAuth / magic-link redirects.
 *
 * Google OAuth flow:
 *  - New user  → no role in metadata → send to /select-role
 *  - Returning → has role → send to their dashboard
 *
 * Magic-link flow follows the same role-based routing.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("[AuthCallback] No session:", error?.message);
        navigate("/login");
        return;
      }

      const user = data.session.user;

      // Check role from user_metadata first (fastest)
      const metaRole = user.user_metadata?.role as string | undefined;

      if (metaRole) {
        // Returning user — route to their dashboard
        if (metaRole === "admin") navigate("/admin");
        else if (metaRole === "babysitter") navigate("/babysitter/dashboard");
        else navigate("/parent/dashboard");
        return;
      }

      // No role in metadata — check user_roles table as fallback
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleRow?.role) {
        // Found in DB — role was set before metadata was synced
        const dbRole = roleRow.role as string;
        if (dbRole === "admin") navigate("/admin");
        else if (dbRole === "babysitter") navigate("/babysitter/dashboard");
        else navigate("/parent/dashboard");
        return;
      }

      // Truly new Google/magic-link user — ask them to pick a role
      navigate("/select-role");
    };

    handle();
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#080F0D" }}
    >
      <span
        className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: "rgba(61,190,181,0.2)", borderTopColor: "#3DBEB5" }}
      />
      <p className="text-white/50 text-sm">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
