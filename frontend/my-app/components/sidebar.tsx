"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { useSidebarContext } from "@/components/sidebar-context"
import { ChevronLeft, ChevronRight, Sun, Moon, User, LogOut, Home, Search, Heart, Plus } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { isHovered, setIsHovered } = useSidebarContext()
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "search", label: "Search", icon: Search, path: "/search" },
    { id: "favorites", label: "Favorites", icon: Heart, path: "/favorites" },
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 texture-dots light-shadow dark:dark-glow z-40 flex flex-col",
        isHovered ? "w-64" : "w-20",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >


      {/* Theme Button - Top Right */}
      <div className="p-4 pb-2">
        <div className={cn("flex", isHovered ? "justify-start" : "justify-center")}>
          <button
            onClick={toggleTheme}
            className={cn(
              "rounded-full flex items-center justify-center transition-all duration-200 light-shadow dark:dark-glow",
              "h-8 w-8",
              theme === "dark" ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-white" />
            ) : (
              <Sun className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 py-2">
        <div className="space-y-3">
          {navigationItems
            .filter(item => item.path !== pathname)
            .map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start h-12 rounded-lg light-shadow dark:dark-glow hover:bg-secondary/50 transition-all duration-200",
                    !isHovered && "justify-center px-2"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    {isHovered && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                </Button>
              )
            })}
        </div>
      </div>

      {/* Bottom Section - User Settings */}
      <div className="p-4 space-y-4">

        {/* User Section */}
        {user && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-12 rounded-lg light-shadow dark:dark-glow hover:bg-secondary/50 transition-all duration-200",
                !isHovered && "justify-center px-2"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                {isHovered && (
                  <div className="text-left">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">Account</div>
                  </div>
                )}
              </div>
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-12 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 light-shadow dark:dark-glow transition-all duration-200",
                !isHovered && "justify-center px-2"
              )}
              onClick={signOut}
            >
              <div className="flex items-center space-x-3">
                <LogOut className="h-5 w-5" />
                {isHovered && <span className="text-sm font-medium">Sign Out</span>}
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
