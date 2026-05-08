import { Link, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/contexts/GamificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { gamificationApi } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Receipt, Wallet, Target, Trophy,
  BarChart3, Flame, LogOut, ChevronLeft, ChevronRight,
  Star, Zap, Sun, Moon, UserCircle,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: Receipt },
  { path: "/budgets", label: "Budgets", icon: Wallet },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/achievements", label: "Achievements", icon: Trophy },
  { path: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: UserCircle },
];

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toggleTheme, resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const { state, dismissLevelUp } = useGamification();

  const { data: progress } = useQuery({
    queryKey: ["gamification", "progress"],
    queryFn: () => gamificationApi.progress(),
    staleTime: 1000 * 60,
  });

  const isLight = resolvedTheme === "light";

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full flex flex-col transition-all duration-300 relative border-r",
          isLight ? "bg-white border-[#e2e8f0]" : "bg-[#1e293b] border-[#475569]/30"
        )}
        style={{ width: collapsed ? "72px" : "240px" }}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 h-16 border-b",
          isLight ? "border-[#e2e8f0]" : "border-[#475569]/30"
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
              FinQuest
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? isLight
                      ? "bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1]"
                      : "bg-[#334155] text-white border border-[#475569]/50"
                    : isLight
                      ? "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                      : "text-[#94a3b8] hover:bg-[#334155]/50 hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-blue-500")} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={cn("px-3 pb-2", collapsed && "flex justify-center")}>
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-2.5 rounded-lg transition-all duration-200 group",
              collapsed ? "justify-center w-10 h-10 p-0" : "px-3 py-2.5 w-full",
              isLight
                ? "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                : "text-[#94a3b8] hover:bg-[#334155]/50 hover:text-white"
            )}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {!collapsed && <span className="text-sm font-medium">{isLight ? "Dark" : "Light"}</span>}
          </button>
        </div>

        {/* Gamification Widget */}
        {progress && !collapsed && (
          <div className="px-3 pb-3">
            <div className={cn(
              "rounded-lg p-3 border",
              isLight ? "bg-[#f8fafc] border-[#e2e8f0]" : "bg-[#0f172a] border-[#475569]/30"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Level {progress.current_level}
                </span>
              </div>
              <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-[#e2e8f0]" : "bg-[#334155]")}>
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progress.xp_progress_percent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  {progress.xp_progress} / {progress.xp_to_next_level} XP
                </span>
                {progress.current_streak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500 animate-flame" />
                    <span className="text-[10px] text-amber-500 font-medium">{progress.current_streak}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className={cn("p-3 border-t", isLight ? "border-[#e2e8f0]" : "border-[#475569]/30")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.username || "User"}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{progress?.total_xp_earned || 0} XP</p>
                </div>
                <button
                  onClick={logout}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isLight ? "text-[#94a3b8] hover:text-red-500 hover:bg-[#f1f5f9]" : "text-[#94a3b8] hover:text-red-400 hover:bg-[#334155]"
                  )}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10 border",
            isLight
              ? "bg-white border-[#cbd5e1] text-[#64748b] hover:text-[#0f172a]"
              : "bg-[#334155] border-[#475569] text-[#94a3b8] hover:text-white"
          )}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 min-h-full">
          <Outlet />
        </div>

        {/* Achievement Notifications */}
        {state.achievementsUnlocked.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none gamification-overlay">
            {state.achievementsUnlocked.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  "pointer-events-auto rounded-xl p-4 shadow-xl animate-slide-in-right glow-amber flex items-start gap-3 max-w-sm border",
                  isLight ? "bg-white border-amber-400/50" : "bg-[#1e293b] border-amber-500/50"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-500 font-medium">Achievement Unlocked!</p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{ach.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{ach.description}</p>
                  <p className="text-xs text-violet-500 mt-1">+{ach.xpReward} XP</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Level Up Modal */}
        {state.levelUp && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: isLight ? "rgba(241,245,249,0.8)" : "rgba(15,23,42,0.8)" }}
          >
            <div className={cn(
              "rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-level-up glow-purple border",
              isLight ? "bg-white border-violet-300/50" : "bg-[#1e293b] border-violet-500/50"
            )}>
              <p className="text-lg text-violet-500 font-medium mb-2">LEVEL UP!</p>
              <div className="text-6xl font-bold text-gradient mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {progress?.current_level || "?"}
              </div>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Star className="w-10 h-10 text-white" />
              </div>
              <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                Congratulations! You have reached a new level. Keep going to unlock more achievements!
              </p>
              <button
                onClick={dismissLevelUp}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
