import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  X,
  Stethoscope,
  TestTube,
  FileHeart,
  HeartPulse,
  Brain,
  UserCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Clinical Dashboard',
      href: '/dashboard',
      icon: Stethoscope,
      description: 'Medical overview & insights',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'upload',
      label: 'Lab Reports',
      href: '/upload',
      icon: TestTube,
      description: 'Upload medical test results',
      badge: 'New',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'reports',
      label: 'Medical Records',
      href: '/reports',
      icon: FileHeart,
      description: 'View clinical history',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      id: 'results',
      label: 'Test Parameters',
      href: '/results',
      icon: Activity,
      description: 'Detailed clinical values',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'trends',
      label: 'Health Analytics',
      href: '/trends',
      icon: HeartPulse,
      description: 'Track wellness trends',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      id: 'chat',
      label: 'AI Health Assistant',
      href: '/chat',
      icon: Brain,
      description: 'Ask health questions',
      badge: '🔥 New',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const bottomItems = [
    {
      id: 'settings',
      label: 'Patient Settings',
      href: '/settings',
      icon: UserCheck,
      description: 'Account & privacy settings',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const getCurrentPage = () => {
    const pathname = location.pathname;
    return pathname.replace('/', '') || 'dashboard';
  };

  const NavItem = ({ item, isActive = false }: { item: any; isActive?: boolean }) => (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-auto p-3 sm:p-4 mb-1 sm:mb-2 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]",
        isActive && `${item.bgColor || "bg-blue-50"} ${item.color || "text-blue-600"} border-l-4 ${item.color?.replace('text-', 'border-') || 'border-blue-600'} shadow-lg hover:shadow-xl`,
        !isActive && "hover:bg-accent hover:shadow-lg hover:border-l-4 hover:border-primary/30 border-l-4 border-transparent"
      )}
      onClick={() => handleNavigation(item.href)}
    >
      <div className={cn(
        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mr-2 sm:mr-3 transition-all duration-300 group-hover:scale-110",
        isActive ? `${item.bgColor || "bg-blue-100"} shadow-md` : "bg-muted group-hover:bg-primary/10 group-hover:shadow-md"
      )}>
        <item.icon className={cn(
          "h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:scale-110",
          isActive ? (item.color || "text-blue-600") : "text-muted-foreground group-hover:text-primary"
        )} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-xs sm:text-sm font-semibold transition-all duration-300 truncate",
            isActive ? (item.color || "text-blue-600") : "text-foreground group-hover:text-primary"
          )}>{item.label}</span>
          {item.badge && (
            <Badge className="text-xs ml-1 sm:ml-2 bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse flex-shrink-0">
              {item.badge}
            </Badge>
          )}
        </div>
        <p className={cn(
          "text-xs leading-relaxed transition-colors duration-300 hidden sm:block",
          isActive ? "text-muted-foreground" : "text-muted-foreground/80 group-hover:text-muted-foreground"
        )}>{item.description}</p>
      </div>
    </Button>
  );

  const currentPage = getCurrentPage();

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 sm:w-72 lg:w-80 xl:w-72 bg-gradient-to-b from-card via-card to-muted/30 backdrop-blur-xl border-r border-border/50 shadow-2xl transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 scrollbar-enhanced",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Medical Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-medical-brand text-lg sm:text-xl truncate">DiagnosticDeck</h2>
                <p className="text-xs text-muted-foreground font-medium hidden sm:block">Smart Health Reports</p>
              </div>
            </div>
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-accent hover:scale-105 transition-all duration-200">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Medical Navigation */}
          <nav className="flex-1 p-3 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto scrollbar-enhanced">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.id}
                />
              ))}
            </div>
          </nav>

          {/* Enhanced Clinical Settings */}
          <div className="p-6 border-t border-border/50 bg-gradient-to-r from-background to-muted/10">
            {bottomItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={currentPage === item.id}
              />
            ))}
          </div>

          {/* Enhanced Clinical Health Score */}
          <div className="p-6">
            <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-violet-50 dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-violet-950/20 rounded-xl p-5 border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center shadow-md">
                    <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-parameter-label text-emerald-700 dark:text-emerald-400">Clinical Health Score</h4>
                </div>
                <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold animate-pulse">
                  85/100
                </Badge>
              </div>
              <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-3 mb-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500 h-3 rounded-full transition-all duration-500 animate-pulse-glow shadow-sm" 
                  style={{ width: '85%' }}
                ></div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Excellent overall health indicators
                </p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last updated: Today</span>
                  <span>Based on 12 parameters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
