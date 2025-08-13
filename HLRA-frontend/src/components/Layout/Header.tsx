import React, { useState, useEffect, useRef } from "react";
import { Search, Menu, X, User, ChevronDown, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { ThemeToggle } from "../ui/theme-toggle";
import NotificationBell from "../ui/notification-bell";
import ProfileSwitcher from "../ui/profile-switcher";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onSidebarToggle,
  isSidebarOpen = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Menu and Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden p-2 rounded-lg hover:bg-accent hover:scale-105 transition-all duration-200 group"
              onClick={onSidebarToggle}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5 transition-all duration-300 group-hover:rotate-90" />
              ) : (
                <Menu className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
              )}
            </Button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <span className="text-white font-bold text-sm">HL</span>
              </div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 hidden sm:block transition-all duration-300 truncate">
                Health Lab Report Analyzer
              </h1>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 sm:hidden transition-all duration-300">
                HLRA
              </h1>
            </div>
          </div>

          {/* Center - Enhanced Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
              <Input
                placeholder="Search reports, patients..."
                className="pl-10 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30 hover:border-slate-200/60 dark:hover:border-slate-600/60 focus-visible:border-blue-500 focus-visible:bg-white dark:focus-visible:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-200 rounded-lg"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Profile Switcher */}
            <ProfileSwitcher className="hidden md:flex" />
            {/* Search Button for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-accent hover:scale-105 transition-all duration-200"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle className="hover:bg-accent hover:scale-105 transition-all duration-200" />

            {/* Notifications */}
            <NotificationBell />

            {/* User Section */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent hover:scale-105 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.full_name || "User"}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-all duration-300 ${
                    isUserMenuOpen ? "rotate-180 text-primary" : "group-hover:text-primary"
                  }`}
                />
              </Button>

              {/* Enhanced User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 z-50 animate-in slide-in-from-top-2 duration-200">
                  <Card className="p-2 shadow-xl border-border/50 backdrop-blur-md bg-card/95">
                    <div className="px-3 py-3 border-b border-border/50 bg-gradient-to-r from-background to-muted/20 rounded-lg mb-2">
                      <p className="text-sm font-medium text-foreground">
                        {user?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-start text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-105 transition-all duration-200 group rounded-lg"
                    >
                      <LogOut className="mr-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      Sign Out
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Search reports, patients..."
                className="pl-10 bg-muted/50 border border-border/30 hover:border-border/60 focus-visible:border-primary focus-visible:bg-background transition-all duration-200 rounded-lg"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
