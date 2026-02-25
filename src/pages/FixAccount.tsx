import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

const FIX_SQL = `-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor

-- 1. Add missing enum values to booking_status
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 2. Disable RLS on public.users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Backfill public.users for all existing accounts
INSERT INTO public.users (id, role)
SELECT user_id, 'parent' FROM public.parent_profiles
ON CONFLICT (id) DO UPDATE SET role = 'parent';

INSERT INTO public.users (id, role)
SELECT user_id, 'babysitter' FROM public.babysitter_profiles
ON CONFLICT (id) DO UPDATE SET role = 'babysitter';

INSERT INTO public.users (id, role)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'role','parent')
FROM auth.users au ON CONFLICT (id) DO NOTHING;

-- 4. Drop FK constraints on bookings that block inserts
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_parent_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_babysitter_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_parent_id_fkey1;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_babysitter_id_fkey1;

-- 5. Disable RLS on bookings
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- 6. ensure_user_record helper (used during onboarding)
CREATE OR REPLACE FUNCTION public.ensure_user_record(p_role text DEFAULT 'parent')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, role) VALUES (auth.uid(), p_role)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_user_record(text) TO authenticated;`;

const FixAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [fixed, setFixed] = useState(false);

  const copySQL = async () => {
    await navigator.clipboard.writeText(FIX_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({ title: "SQL copied!", description: "Paste it in the Supabase SQL Editor." });
  };

  const checkFixed = async () => {
    if (!user) return;
    setChecking(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)("ensure_user_record", { p_role: "parent" });
    await supabase.from("users").upsert({ id: user.id, role: "parent" }, { onConflict: "id" });
    const { data } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
    setChecking(false);
    if (data) {
      setFixed(true);
      toast({ title: "Account fixed!", description: "You can now book babysitters." });
      setTimeout(() => navigate(-1), 1500);
    } else {
      toast({ title: "Not fixed yet", description: "Please run the SQL in Supabase, then click Check Again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: BG }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(251,191,36,0.12)" }}>
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">One-time account fix needed</h1>
          <p className="mt-2 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Your profile data is saved, but one database setup step is missing. Run the SQL below once in your Supabase dashboard to fix bookings permanently.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {/* Steps */}
          <div className="p-6 space-y-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h2 className="font-heading font-semibold text-white">Steps</h2>
            {[
              { n: 1, text: 'Click "Open Supabase SQL Editor" below, or go to your Supabase dashboard → SQL Editor' },
              { n: 2, text: 'Click "Copy SQL" and paste it into the SQL Editor' },
              { n: 3, text: 'Click "Run" in Supabase, then click "Check Again" here' },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: TEAL }}>{n}</span>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{text}</p>
              </div>
            ))}
          </div>
          {/* SQL block */}
          <div className="relative p-5" style={{ background: "#020806" }}>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed" style={{ color: "#3DBEB5" }}>{FIX_SQL}</pre>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={copySQL} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)" }}>
            {copied ? <CheckCircle size={16} style={{ color: TEAL }} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy SQL"}
          </button>
          <a href="https://supabase.com/dashboard/project/utqlshqdbefcgoaigmnz/editor" target="_blank" rel="noopener noreferrer" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)" }}>
              <ExternalLink size={16} /> Open Supabase SQL Editor
            </button>
          </a>
          <button onClick={checkFixed} disabled={checking || fixed} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: TEAL }}>
            {fixed ? "Fixed! Redirecting..." : checking ? "Checking..." : "Check Again"}
          </button>
        </div>

        <button className="mt-6 text-sm mx-auto block transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.35)" }} onClick={() => navigate(-1)}>
          ← Go back
        </button>
      </div>
    </div>
  );
};

export default FixAccount;
