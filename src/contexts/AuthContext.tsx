import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        });
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Login error:", error);
        // Provide more helpful error messages
        if (error.message.includes("Invalid login credentials")) {
          return {
            error: "Invalid email or password. Please check your credentials.",
          };
        }
        if (error.message.includes("Email not confirmed")) {
          return {
            error:
              "Please check your email and confirm your account before signing in.",
          };
        }
        return { error: error.message || "Failed to login" };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        });
      }

      return {};
    } catch (error: any) {
      console.error("Login exception:", error);
      return { error: error.message || "Failed to login" };
    }
  };

  const signup = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Signup error:", error);
        // Provide more helpful error messages
        if (error.message.includes("already registered")) {
          return {
            error:
              "An account with this email already exists. Please sign in instead.",
          };
        }
        if (error.message.includes("Password")) {
          return { error: "Password must be at least 6 characters long." };
        }
        return { error: error.message || "Failed to create account" };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - this is not an error, just info
        // User will need to confirm email before they can log in
        return {
          error:
            "Account created! Please check your email to confirm your account, then you can sign in.",
        };
      }

      // If we have a session, user is automatically logged in
      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        });
        return {}; // Success - no error
      }

      // Fallback
      return {};
    } catch (error: any) {
      console.error("Signup exception:", error);
      return { error: error.message || "Failed to create account" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
