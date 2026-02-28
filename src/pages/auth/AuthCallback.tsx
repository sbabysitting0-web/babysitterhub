import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles OAuth / magic-link redirects.
 *
 * Uses onAuthStateChange to WAIT for Supabase to finish the token exchange —
 * fixes mobile browsers where getSession() returns null immediately after redirect.
 *
 * Google OAuth flow:
 *  - New user  → no role in metadata → send to /select-role
 *  - Returning → has role → send to their dashboard
 *
 * Magic-link flow follows the same role-based routing.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let settled = false;

    // Show "still working…" message after 4 s
    const slowTimer = setTimeout(() => setSlow(true), 4000);

    // Hard timeout — if after 12 s we still have no session, send to login
    const hardTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        navigate("/login");
      }
    }, 12000);

    const routeUser = async (userId: string, userMeta: Record<string, unknown>) => {
      // Check role from user_metadata first (fastest)
      const metaRole = userMeta?.role as string | undefined;

      if (metaRole) {
        if (metaRole === "admin") navigate("/admin");
        else if (metaRole === "babysitter") navigate("/babysitter/dashboard");
        else navigate("/parent/dashboard");
        return;
      }

      // No role in metadata — check user_roles table as fallback
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleRow?.role) {
        const dbRole = roleRow.role as string;
        if (dbRole === "admin") navigate("/admin");
        else if (dbRole === "babysitter") navigate("/babysitter/dashboard");
        else navigate("/parent/dashboard");
        return;
      }

      // Truly new Google/magic-link user — ask them to pick a role
      navigate("/select-role");
    };

    // Listen for the session to arrive — this is the key fix for mobile.
    // On mobile, the OAuth URL token hasn't been exchanged yet when the
    // component mounts, so getSession() returns null. onAuthStateChange
    // waits for Supabase to finish the exchange before firing.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (settled) return;

        if (session?.user) {
          settled = true;
          clearTimeout(slowTimer);
          clearTimeout(hardTimeout);
          await routeUser(session.user.id, session.user.user_metadata ?? {});
          return;
        }

        // SIGNED_OUT or no session after token exchange — go back to login
        if (event === "SIGNED_OUT") {
          settled = true;
          clearTimeout(slowTimer);
          clearTimeout(hardTimeout);
          navigate("/login");
        }
      }
    );

    // Also try getSession() immediately in case session is already available
    // (e.g. desktop browsers where it's instant)
    supabase.auth.getSession().then(({ data, error }) => {
      if (settled) return;
      if (!error && data.session?.user) {
        settled = true;
        clearTimeout(slowTimer);
        clearTimeout(hardTimeout);
        subscription.unsubscribe();
        routeUser(data.session.user.id, data.session.user.user_metadata ?? {});
      }
    });

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
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
      {slow && (
        <p className="text-white/30 text-xs mt-1">
          This is taking a moment — please wait…
        </p>
      )}
    </div>
  );
};

export default AuthCallback;
