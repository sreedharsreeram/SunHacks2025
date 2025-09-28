"use client"

import React from "react"
import { Button } from "./ui/button"

interface ChatHeaderProps {
  leftButton?: React.ReactNode
  title?: string
  primary?: string
  secondary?: string
  rightNode?: React.ReactNode
}

export default function ChatHeader({ leftButton, title, primary, secondary, rightNode }: ChatHeaderProps) {
  return (
    <header className="h-14 flex items-center px-4 border-b bg-background/80 backdrop-blur-sm">
      {/* left button area */}
      <div className="flex items-center shrink-0">
        {leftButton ? (
          // ensure button has consistent sizing
          <div className="flex items-center justify-center">{leftButton}</div>
        ) : null}
      </div>

      {/* main text area - allow truncation */}
      <div className="ml-4 min-w-0 flex-1">
        {title ? (
          <div className="text-lg font-serif font-bold truncate leading-tight">{title}</div>
        ) : null}
        {(primary || secondary) && (
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            {primary ? <div className="text-sm font-serif font-semibold truncate min-w-0">{primary}</div> : null}
            {secondary ? (
              <div className="text-sm text-muted-foreground truncate min-w-0">{secondary}</div>
            ) : null}
          </div>
        )}
      </div>

      {/* right node if any */}
      <div className="ml-4 shrink-0">{rightNode}</div>
    </header>
  )
}
