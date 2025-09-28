"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface AuthContextType {
  user: User | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      // Firebase not configured, check for existing session in localStorage
      const storedUser = localStorage.getItem("citesight-user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Convert Firebase user to our User interface
        const userData: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          image: firebaseUser.photoURL || undefined,
        }
        setUser(userData)
        localStorage.setItem("citesight-user", JSON.stringify(userData))
      } else {
        setUser(null)
        localStorage.removeItem("citesight-user")
        localStorage.removeItem("citesight-favorites")
        localStorage.removeItem("citesight-search-history")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    if (!auth || !googleProvider) {
      console.warn("Firebase is not configured. Please set up your Firebase credentials in .env.local")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      // The user state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing in:", error)
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!auth) {
      // Fallback to local sign out if Firebase is not configured
      setUser(null)
      localStorage.removeItem("citesight-user")
      localStorage.removeItem("citesight-favorites")
      localStorage.removeItem("citesight-search-history")
      return
    }

    try {
      await firebaseSignOut(auth)
      // The user state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, signIn, signOut, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
