"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { ChevronLeft, ChevronRight, Sun, Moon, User, LogOut } from "lucide-react"
import { useState, useEffect } from "react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [recentPapers, setRecentPapers] = useState<any[]>([])
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const papers = localStorage.getItem("citesight-recent-papers")
    if (papers) {
      setRecentPapers(JSON.parse(papers))
    }
  }, [])

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 texture-dots light-shadow dark:dark-glow z-40",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-card light-shadow dark:dark-glow"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className="p-4 space-y-4">
        {/* User Section */}
        {user && (
          <div
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg bg-secondary/50 light-shadow dark:dark-glow",
              isCollapsed && "justify-center",
            )}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size={isCollapsed ? "sm" : "default"}
          className={cn("w-full justify-start light-shadow dark:dark-glow", isCollapsed && "justify-center px-2")}
          onClick={toggleTheme}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
        </Button>

        {!isCollapsed && recentPapers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-serif font-medium text-muted-foreground">Recent Papers</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {recentPapers.slice(0, 5).map((paper, index) => (
                <div
                  key={index}
                  className="text-xs p-2 rounded bg-secondary/30 text-muted-foreground hover:bg-secondary/50 cursor-pointer transition-colors light-shadow dark:dark-glow"
                >
                  <div className="font-medium truncate">{paper.title}</div>
                  <div className="text-[10px] opacity-70 mt-1">
                    {paper.action === "view" ? "Viewed" : "Asked about"} • {paper.authors?.[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign Out */}
        {user && (
          <Button
            variant="ghost"
            size={isCollapsed ? "sm" : "default"}
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive light-shadow dark:dark-glow",
              isCollapsed && "justify-center px-2",
            )}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        )}
      </div>
    </div>
  )
}
