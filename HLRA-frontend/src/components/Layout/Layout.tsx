import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Detect mobile and close sidebar on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Close sidebar when switching to desktop view
      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} isMobile={isMobile} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 lg:p-6 transition-colors duration-300">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
