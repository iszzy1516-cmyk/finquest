// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useGamification } from "@/contexts/GamificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Receipt, PiggyBank,
  Target, Plus, ArrowUpRight, ArrowDownRight,
  Flame, Star, Zap, CircleDollarSign, Calendar,
} from "lucide-react";
import { Link } from "react-router";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { analyticsApi, budgetApi, goalApi, gamificationApi } from "@/services/api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function Dashboard() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsApi.dashboard(),
  });
  const { data: progress } = useQuery({
    queryKey: ["gamification", "progress"],
    queryFn: () => gamificationApi.progress(),
  });
  const { data: budgetData } = useQuery({
    queryKey: ["budgets", "active"],
    queryFn: () => budgetApi.list(true),
  });
  const { data: goalData } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalApi.list(),
  });
  const { resolvedTheme } = useTheme();
  const { triggerXpGain, triggerAchievement } = useGamification();

  const isLight = resolvedTheme === "light";

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-xl p-5 border"
        style={{
          background: isLight ? "linear-gradient(135deg, #f8fafc, #e2e8f0)" : "linear-gradient(135deg, #1e293b, #334155)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
                Welcome back!
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {progress?.current_streak ? (
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500 animate-flame" />
                    {progress.current_streak}-day streak! Keep it going!
                  </span>
                ) : (
                  "Start your financial journey today"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {progress && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ backgroundColor: "var(--bg-card-inner)" }}
              >
                <Star className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Lv.{progress.current_level}</span>
                <div
                  className="w-20 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-surface-elevated)" }}
                >
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, progress.xp_progress_percent)}%` }}
                  />
                </div>
              </div>
            )}
            <Link
              to="/transactions"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={summary?.monthly_income || 0}
          icon={<CircleDollarSign className="w-5 h-5 text-emerald-500" />}
          trend="up"
          color="emerald"
        />
        <StatCard
          title="Monthly Expenses"
          value={summary?.monthly_expense || 0}
          icon={<Receipt className="w-5 h-5 text-red-500" />}
          trend="down"
          color="red"
        />
        <StatCard
          title="Net Savings"
          value={summary?.net_savings || 0}
          icon={<PiggyBank className="w-5 h-5 text-blue-500" />}
          trend={(summary?.net_savings || 0) >= 0 ? "up" : "down"}
          color="blue"
        />
        <StatCard
          title="Savings Rate"
          value={`${summary?.savings_rate || 0}%`}
          icon={<Target className="w-5 h-5 text-violet-500" />}
          trend="up"
          color="violet"
          isPercentage
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending Breakdown */}
        <Card className="border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
            Spending Breakdown
          </h3>
          {dashboard?.category_spending && dashboard.category_spending.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.category_spending}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {dashboard.category_spending.map((entry, index) => (
                      <Cell key={index} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#ffffff" : "#1e293b",
                      border: isLight ? "1px solid #e2e8f0" : "1px solid #475569",
                      borderRadius: "8px",
                      color: isLight ? "#0f172a" : "#f8fafc",
                      fontSize: "12px",
                      boxShadow: isLight ? "0 4px 12px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend
                    formatter={(value: string) => <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No spending data yet</p>
            </div>
          )}
        </Card>

        {/* Monthly Trend */}
        <Card className="border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
            Monthly Trend
          </h3>
          {dashboard?.monthly_trend && dashboard.monthly_trend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#334155"} />
                  <XAxis dataKey="month" stroke={isLight ? "#94a3b8" : "#94a3b8"} fontSize={11} />
                  <YAxis stroke={isLight ? "#94a3b8" : "#94a3b8"} fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "#ffffff" : "#1e293b",
                      border: isLight ? "1px solid #e2e8f0" : "1px solid #475569",
                      borderRadius: "8px",
                      color: isLight ? "#0f172a" : "#f8fafc",
                      fontSize: "12px",
                      boxShadow: isLight ? "0 4px 12px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend formatter={(value: string) => <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{value}</span>} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No trend data yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Budgets + Recent Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Budgets */}
        <Card className="border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
              Active Budgets
            </h3>
            <Link to="/budgets" className="text-xs hover:underline" style={{ color: "var(--accent-primary)" }}>View all</Link>
          </div>
          {budgetData && budgetData.length > 0 ? (
            <div className="space-y-3">
              {budgetData.slice(0, 3).map((b) => (
                <div key={b.budget.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{b.budget.name}</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {formatCurrency(b.spent)} / {formatCurrency(parseFloat(String(b.budget.amount)))}
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--bg-surface-elevated)" }}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        b.percentage >= 100 ? "bg-red-500" : b.percentage >= b.budget.alert_threshold ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] ${
                      b.percentage >= 100 ? "text-red-500" : b.percentage >= b.budget.alert_threshold ? "text-amber-500" : "text-emerald-500"
                    }`}>
                      {b.percentage.toFixed(0)}% used
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{b.days_remaining}d left</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>No active budgets</p>
              <Link to="/budgets" className="text-xs hover:underline" style={{ color: "var(--accent-primary)" }}>Create one</Link>
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
              Recent Transactions
            </h3>
            <Link to="/transactions" className="text-xs hover:underline" style={{ color: "var(--accent-primary)" }}>View all</Link>
          </div>
          {dashboard?.recent_transactions && dashboard.recent_transactions.length > 0 ? (
            <div className="space-y-2">
              {dashboard.recent_transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${tx.category_color}20` }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: tx.category_color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{tx.description || tx.category_name || "Transaction"}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <span className={`text-sm font-bold font-mono ${
                    tx.type === "income" ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(parseFloat(String(tx.amount)))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>No transactions yet</p>
              <Link to="/transactions" className="text-xs hover:underline" style={{ color: "var(--accent-primary)" }}>Add your first</Link>
            </div>
          )}
        </Card>
      </div>

      {/* Goals */}
      {goalData && goalData.length > 0 && (
        <Card className="border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
              Active Goals
            </h3>
            <Link to="/goals" className="text-xs hover:underline" style={{ color: "var(--accent-primary)" }}>View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalData.slice(0, 3).map((g) => {
              const pct = Math.min(100, (parseFloat(String(g.current_amount)) / parseFloat(String(g.target_amount))) * 100);
              return (
                <div
                  key={g.id}
                  className="rounded-lg p-4 border"
                  style={{ backgroundColor: "var(--bg-card-inner)", borderColor: "var(--border-color)" }}
                >
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>{g.name}</p>
                  <div
                    className="h-2 rounded-full overflow-hidden mb-2"
                    style={{ backgroundColor: "var(--bg-surface-elevated)" }}
                  >
                    <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{pct.toFixed(0)}%</span>
                    <span className="text-xs text-violet-500 font-mono">{formatCurrency(parseFloat(String(g.current_amount)))} / {formatCurrency(parseFloat(String(g.target_amount)))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, isPercentage = false }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: "up" | "down";
  color: string;
  isPercentage?: boolean;
}) {
  const colorMap: Record<string, { bgLight: string; bgDark: string }> = {
    emerald: { bgLight: "bg-emerald-500/10", bgDark: "bg-emerald-500/10" },
    red: { bgLight: "bg-red-500/10", bgDark: "bg-red-500/10" },
    blue: { bgLight: "bg-blue-500/10", bgDark: "bg-blue-500/10" },
    violet: { bgLight: "bg-violet-500/10", bgDark: "bg-violet-500/10" },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card
      className="border p-5 hover:scale-[1.02] transition-all"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${colors.bgLight} flex items-center justify-center`}>
          {icon}
        </div>
        {trend === "up" ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
          {isPercentage ? value : formatCurrency(typeof value === "string" ? parseFloat(value) : value)}
        </p>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 rounded-xl" style={{ backgroundColor: "var(--bg-surface)" }} />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" style={{ backgroundColor: "var(--bg-surface)" }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" style={{ backgroundColor: "var(--bg-surface)" }} />
        <Skeleton className="h-80 rounded-xl" style={{ backgroundColor: "var(--bg-surface)" }} />
      </div>
    </div>
  );
}
