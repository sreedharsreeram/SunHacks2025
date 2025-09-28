"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("citesight-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async () => {
    // Mock Google OAuth - in production, integrate with actual Google OAuth
    const mockUser: User = {
      id: "1",
      name: "Sreeram Sreedhar",
      email: "ssreedh9@asu.edu",
      image: "/diverse-user-avatars.png",
    };
    setUser(mockUser);
    localStorage.setItem("citesight-user", JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("citesight-user");
    localStorage.removeItem("citesight-favorites");
    localStorage.removeItem("citesight-search-history");
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
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
