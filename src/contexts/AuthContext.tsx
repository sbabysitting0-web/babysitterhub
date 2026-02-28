import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "parent" | "babysitter" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string, user?: User | null) => {
    try {
      // 1. Always check user metadata first — instant, no DB needed
      const metaRole = user?.user_metadata?.role as string | undefined;
      if (metaRole && ["parent", "babysitter", "admin"].includes(metaRole)) {
        setRole(metaRole as UserRole);
        return;
      }

      // 2. Fallback: DB tables with timeout
      const timeout = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 2000),
      );
      const [rolesResult, usersResult] = await Promise.all([
        Promise.race([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle(),
          timeout,
        ]),
        Promise.race([
          supabase.from("users").select("role").eq("id", userId).maybeSingle(),
          timeout,
        ]),
      ]);

      const foundRole =
        rolesResult?.data?.role ?? usersResult?.data?.role ?? null;

      if (foundRole) {
        setRole(foundRole as UserRole);
        return;
      }

      // 3. Final fallback: which profile table has a row? (with 2 s timeout)
      const timeout2 = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 2000),
      );

      const [parentResult, sitterResult] = await Promise.all([
        Promise.race([
          supabase.from("parent_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
          timeout2,
        ]),
        Promise.race([
          supabase.from("babysitter_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
          timeout2,
        ]),
      ]);

      if (parentResult?.data) {
        setRole("parent");
        return;
      }
      if (sitterResult?.data) {
        setRole("babysitter");
        return;
      }

      // Default — keep null, user will be shown parent dashboard
      setRole(null);
    } catch {
      setRole(null);
    }
  };

  useEffect(() => {
    // Get initial session — set loading=false as soon as we know the user,
    // then resolve role in the background (non-blocking).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // unblock UI immediately
      if (session?.user) {
        fetchRole(session.user.id, session.user); // background
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // always unblock immediately
      if (session?.user) {
        fetchRole(session.user.id, session.user); // background
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
