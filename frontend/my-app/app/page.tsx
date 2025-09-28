"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { useSidebarContext } from "@/components/sidebar-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signIn } = useAuth();
  const { isHovered } = useSidebarContext();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to search history
      const history = JSON.parse(
        localStorage.getItem("citesight-search-history") || "[]",
      );
      const updatedHistory = [
        searchQuery,
        ...history.filter((item: string) => item !== searchQuery),
      ].slice(0, 10);
      localStorage.setItem(
        "citesight-search-history",
        JSON.stringify(updatedHistory),
      );

      // Navigate to search results
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 relative transition-all duration-300 ${isHovered ? "ml-64" : "ml-20"}`}
      >
        <div className="w-full max-w-2xl space-y-8">
          {/* Logo/Title */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-serif font-bold text-foreground tracking-tight">
              CiteSight
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover and read academic papers with ease
            </p>
          </div>

          {/* Search Section */}
          <div className="space-y-6">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for a paper..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 pr-12 h-14 text-lg bg-card border-2 border-border focus:border-primary focus:outline-none transition-all duration-300 light-shadow dark:dark-glow"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 light-shadow dark:dark-glow"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Sign In Prompt - Only show if user is not logged in */}
            {!user && (
              <div className="text-center space-y-4 p-6 bg-card rounded-lg border border-border light-shadow dark:dark-glow">
                <p className="text-muted-foreground">
                  Sign in with Google to save your favorite papers and access
                  personalized features
                </p>
                <Button
                  onClick={signIn}
                  size="lg"
                  className="h-12 px-8 text-base font-medium light-shadow dark:dark-glow transition-all duration-200"
                >
                  Sign in with Google
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
