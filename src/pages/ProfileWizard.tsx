import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ProfileWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const detectRole = async () => {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = data?.role ?? "parent";
      if (role === "babysitter") {
        navigate("/onboarding/babysitter", { replace: true });
      } else {
        navigate("/onboarding/parent", { replace: true });
      }
    };
    detectRole();
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080F0D" }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3DBEB5", borderTopColor: "transparent" }} />
    </div>
  );
};

export default ProfileWizard;
