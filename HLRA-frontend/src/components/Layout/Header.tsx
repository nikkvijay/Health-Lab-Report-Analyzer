// src/components/Layout/Header.tsx
import React from "react";
import { Activity, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const success = await logout();
      if (success) {
        navigate("/auth", { replace: true });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                HealthLab Analyzer
              </h1>
              <p className="text-sm text-gray-500">
                AI-Powered Lab Reports Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
