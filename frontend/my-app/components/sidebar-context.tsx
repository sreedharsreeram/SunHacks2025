"use client"

import React, { createContext, useContext, useState } from "react"

interface SidebarContextType {
  isHovered: boolean
  setIsHovered: (hovered: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <SidebarContext.Provider value={{ isHovered, setIsHovered }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebarContext must be used within a SidebarProvider")
  }
  return context
}
