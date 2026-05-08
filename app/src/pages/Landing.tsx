import { Link } from "react-router";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Zap, TrendingUp, Shield, Trophy, ArrowRight,
  Wallet, Target, BarChart3, ChevronRight,
} from "lucide-react";

export default function Landing() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Navbar */}
      <nav className="border-b" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-surface)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
              FinQuest
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: "var(--text-secondary)" }}>
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
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-surface)" }}>
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Gamified Financial Management</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
          Level Up Your <span className="text-blue-500">Finances</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "var(--text-secondary)" }}>
          Track transactions, set budgets, achieve goals, and earn XP while building healthy financial habits.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
              Start Your Journey <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="gap-2" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              Sign In <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Wallet,
              title: "Smart Budgeting",
              desc: "Set spending limits, track usage, and get alerts before you overspend.",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              icon: Target,
              title: "Goal Tracking",
              desc: "Create savings goals, contribute funds, and celebrate milestones with XP rewards.",
              color: "text-violet-500",
              bg: "bg-violet-500/10",
            },
            {
              icon: BarChart3,
              title: "Deep Analytics",
              desc: "Visualize spending patterns, income trends, and category breakdowns with charts.",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: Trophy,
              title: "Achievements",
              desc: "Unlock badges for financial milestones from first transaction to savings hero.",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              icon: TrendingUp,
              title: "Streaks & XP",
              desc: "Build daily login streaks, earn XP, and climb the leaderboard with friends.",
              color: "text-rose-500",
              bg: "bg-rose-500/10",
            },
            {
              icon: Shield,
              title: "Bank-Grade Security",
              desc: "JWT authentication, bcrypt hashing, and secure cookie-based sessions.",
              color: "text-cyan-500",
              bg: "bg-cyan-500/10",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 border transition-all hover:scale-[1.02]"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}
            >
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div
          className="rounded-2xl p-10 text-center border"
          style={{
            background: isLight ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "linear-gradient(135deg, #1e293b, #334155)",
            borderColor: "var(--border-color)",
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
            Ready to Master Your Money?
          </h2>
          <p className="mb-8 max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            Join thousands of users who are gamifying their finances and building wealth one level at a time.
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
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>FinQuest</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Built with React + FastAPI + Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
}
