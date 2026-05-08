import { Link } from "react-router";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Zap, TrendingUp, Shield, Trophy, ArrowRight,
  Wallet, Target, BarChart3, ChevronRight,
  Sun, Moon,
} from "lucide-react";

export default function Landing() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const features = [
    {
      icon: Wallet,
      title: "Smart Budgeting",
      desc: "Set spending limits, track usage, and get alerts before you overspend.",
      color: "text-emerald-600",
      bgLight: "bg-emerald-100",
      bgDark: "bg-emerald-500/10",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      desc: "Create savings goals, contribute funds, and celebrate milestones with XP rewards.",
      color: "text-violet-600",
      bgLight: "bg-violet-100",
      bgDark: "bg-violet-500/10",
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      desc: "Visualize spending patterns, income trends, and category breakdowns with charts.",
      color: "text-blue-600",
      bgLight: "bg-blue-100",
      bgDark: "bg-blue-500/10",
    },
    {
      icon: Trophy,
      title: "Achievements",
      desc: "Unlock badges for financial milestones from first transaction to savings hero.",
      color: "text-amber-600",
      bgLight: "bg-amber-100",
      bgDark: "bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      title: "Streaks & XP",
      desc: "Build daily login streaks, earn XP, and climb the leaderboard with friends.",
      color: "text-rose-600",
      bgLight: "bg-rose-100",
      bgDark: "bg-rose-500/10",
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      desc: "JWT authentication, bcrypt hashing, and secure cookie-based sessions.",
      color: "text-cyan-600",
      bgLight: "bg-cyan-100",
      bgDark: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Navbar */}
      <nav
        className="border-b sticky top-0 z-50 backdrop-blur"
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: isLight ? "rgba(255,255,255,0.85)" : "rgba(30,41,59,0.85)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-lg font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}
            >
              FinQuest
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "var(--bg-card-inner)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
              }}
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign In
            </Link>
            <Link to="/register">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-surface)" }}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Gamified Financial Management
          </span>
        </div>
        <h1
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}
        >
          Level Up Your{" "}
          <span className="text-blue-500">Finances</span>
        </h1>
        <p
          className="text-lg max-w-2xl mx-auto mb-10"
          style={{ color: "var(--text-secondary)" }}
        >
          Track transactions, set budgets, achieve goals, and earn XP while building
          healthy financial habits.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
              Start Your Journey <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            >
              Sign In <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`rounded-xl p-6 border transition-all hover:scale-[1.02] ${
                isLight ? "shadow-sm hover:shadow-md" : ""
              }`}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-color)",
              }}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                  isLight ? f.bgLight : f.bgDark
                }`}
              >
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div
          className="rounded-2xl p-10 text-center border"
          style={{
            background: isLight
              ? "linear-gradient(135deg, #dbeafe, #bfdbfe)"
              : "linear-gradient(135deg, #1e293b, #334155)",
            borderColor: isLight ? "#93c5fd" : "var(--border-color)",
            boxShadow: isLight ? "0 4px 20px rgba(59,130,246,0.12)" : "none",
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: isLight ? "#1e3a8a" : "var(--text-primary)",
            }}
          >
            Ready to Master Your Money?
          </h2>
          <p
            className="mb-8 max-w-lg mx-auto"
            style={{ color: isLight ? "#3b82f6" : "var(--text-secondary)" }}
          >
            Join thousands of users who are gamifying their finances and building wealth
            one level at a time.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: "var(--border-color)" }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              FinQuest
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Built with React + FastAPI + Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
}
