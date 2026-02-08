import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { localDb } from "../lib/localDB";

type User = { id: string; email: string };
type Session = null;

interface AuthContextType {
  user: User | null;
  session: Session;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "oficina_pro_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) setUser(JSON.parse(raw) as User);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const u = localDb.signIn(email, password);
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setSession(null);
  };

  const signUp = async (email: string, password: string) => {
    localDb.signUp(email, password);
  };

  const signOut = async () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
