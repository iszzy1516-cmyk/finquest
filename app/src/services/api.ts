import { api, type ApiResponse, type PaginatedResponse } from "@/api/client"

export type User = {
  id: number
  email: string
  username: string
  full_name: string | null
  is_active: boolean
  current_level: number
  current_xp: number
  total_xp_earned: number
  default_currency: string
}

export type TransactionItem = {
  id: number
  user_id: number
  type: "income" | "expense"
  amount: string
  category_id: number
  description: string | null
  transaction_date: string
  currency: string
  created_at: string
  category_name: string | null
  category_icon: string | null
  category_color: string | null
}

export type CategoryItem = {
  id: number
  user_id: number | null
  name: string
  type: "income" | "expense"
  icon: string
  color: string
  is_default: boolean
  created_at: string
}

export type BudgetItem = {
  id: number
  user_id: number
  name: string
  category_id: number | null
  amount: string
  period_start: string
  period_end: string
  alert_threshold: number
  created_at: string
}

export type BudgetStatusItem = {
  budget: BudgetItem
  spent: number
  remaining: number
  percentage: number
  days_remaining: number
}

export type GoalItem = {
  id: number
  user_id: number
  name: string
  target_amount: string
  current_amount: string
  deadline: string | null
  created_at: string
}

export type GamificationProgress = {
  current_xp: number
  current_level: number
  total_xp_earned: number
  xp_to_next_level: number
  xp_progress: number
  xp_progress_percent: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  recent_xp_records: Array<{
    id: number
    amount: number
    source: string
    description: string | null
    created_at: string
  }>
}

export type Achievement = {
  id: number
  name: string
  description: string
  icon: string
  xp_reward: number
  category: string
}

export type UnlockedAchievement = Achievement & {
  achievement_id: number
  unlocked_at: string
}

export type LockedAchievement = Achievement & {
  condition_type: string
  condition_value: number
  progress: number
  progress_percent: number
}

export type GamificationAchievements = {
  unlocked: UnlockedAchievement[]
  locked: LockedAchievement[]
}

export type GamificationDelta = {
  xp_gained: number
  total_xp: number
  current_level: number
  xp_to_next_level: number
  level_up: boolean
  achievements_unlocked: Achievement[]
  streak_bonus: {
    streak: number
    xp_gained: number
    bonus_xp: number
    is_milestone: boolean
  } | null
}

export type LeaderboardEntry = {
  rank: number
  user_id: number
  name: string
  level: number
  xp: number
  streak: number
  longest_streak: number
}

export type DashboardData = {
  summary: {
    monthly_income: number
    monthly_expense: number
    net_savings: number
    savings_rate: number
    transaction_count_30d: number
  }
  category_spending: Array<{ name: string; color: string; amount: number }>
  monthly_trend: Array<{ month: string; income: number; expense: number }>
  recent_transactions: Array<{
    id: number
    type: string
    amount: string
    description: string | null
    transaction_date: string
    category_name: string | null
    category_icon: string | null
    category_color: string | null
  }>
}

export const authApi = {
  me: () => api.get<ApiResponse<User>>("/auth/me").then(r => r.data),
  login: (username: string, password: string) =>
    api.post<ApiResponse<{ access_token: string; refresh_token: string; token_type: string }>>("/auth/login", { username, password }).then(r => r.data),
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post<ApiResponse<{ user: User; access_token: string; refresh_token: string }>>("/auth/register", data).then(r => r.data),
  refresh: (refresh_token: string) =>
    api.post<ApiResponse<{ access_token: string; refresh_token: string }>>("/auth/refresh", { refresh_token }).then(r => r.data),
  logout: () => api.post<ApiResponse<{ success: boolean }>>("/auth/logout").then(r => r.data),
}

export const userApi = {
  me: () => api.get<ApiResponse<User>>("/users/me").then(r => r.data),
  updateMe: (data: Partial<User>) => api.put<ApiResponse<User>>("/users/me", data).then(r => r.data),
  stats: () => api.get<ApiResponse<{ total_income: number; total_expense: number; net_savings: number; savings_rate: number; transaction_count: number }>>("/users/me/stats").then(r => r.data),
}

export const transactionApi = {
  list: (params?: { page?: number; limit?: number; type?: string; category_id?: number; start_date?: string; end_date?: string }) =>
    api.get<ApiResponse<PaginatedResponse<TransactionItem>>>(`/transactions?page=${params?.page || 1}&limit=${params?.limit || 20}${params?.type ? `&type=${params.type}` : ""}${params?.category_id ? `&category_id=${params.category_id}` : ""}${params?.start_date ? `&start_date=${params.start_date}` : ""}${params?.end_date ? `&end_date=${params.end_date}` : ""}`).then(r => r.data),
  getById: (id: number) => api.get<ApiResponse<TransactionItem>>(`/transactions/${id}`).then(r => r.data),
  create: (data: { type: string; amount: string | number; category_id: number; description?: string; transaction_date: string }) =>
    api.post<ApiResponse<{ transaction: TransactionItem; gamification_delta: GamificationDelta }>>("/transactions", data).then(r => r.data),
  update: (id: number, data: Partial<TransactionItem>) =>
    api.put<ApiResponse<TransactionItem>>(`/transactions/${id}`, data).then(r => r.data),
  delete: (id: number) => api.del<ApiResponse<{ success: boolean }>>(`/transactions/${id}`).then(r => r.data),
}

export const categoryApi = {
  list: () => api.get<ApiResponse<CategoryItem[]>>("/categories").then(r => r.data),
  create: (data: { name: string; type: string; icon?: string; color?: string }) =>
    api.post<ApiResponse<CategoryItem>>("/categories", data).then(r => r.data),
  delete: (id: number) => api.del<ApiResponse<{ success: boolean }>>(`/categories/${id}`).then(r => r.data),
}

export const budgetApi = {
  list: (active?: boolean) => api.get<ApiResponse<BudgetStatusItem[]>>(`/budgets${active !== undefined ? `?active=${active}` : ""}`).then(r => r.data),
  create: (data: { name: string; category_id?: number; amount: string | number; period_start: string; period_end: string; alert_threshold?: number }) =>
    api.post<ApiResponse<BudgetItem>>("/budgets", data).then(r => r.data),
  update: (id: number, data: Partial<BudgetItem>) =>
    api.put<ApiResponse<BudgetItem>>(`/budgets/${id}`, data).then(r => r.data),
  delete: (id: number) => api.del<ApiResponse<{ success: boolean }>>(`/budgets/${id}`).then(r => r.data),
  status: (id: number) => api.get<ApiResponse<BudgetStatusItem>>(`/budgets/${id}/status`).then(r => r.data),
}

export const goalApi = {
  list: () => api.get<ApiResponse<GoalItem[]>>("/goals").then(r => r.data),
  create: (data: { name: string; target_amount: string | number; deadline?: string }) =>
    api.post<ApiResponse<GoalItem>>("/goals", data).then(r => r.data),
  update: (id: number, data: Partial<GoalItem>) =>
    api.put<ApiResponse<GoalItem>>(`/goals/${id}`, data).then(r => r.data),
  delete: (id: number) => api.del<ApiResponse<{ success: boolean }>>(`/goals/${id}`).then(r => r.data),
  contribute: (id: number, amount: string | number) =>
    api.post<ApiResponse<GoalItem>>(`/goals/${id}/contribute`, { amount }).then(r => r.data),
}

export const gamificationApi = {
  progress: () => api.get<ApiResponse<GamificationProgress>>("/gamification/progress").then(r => r.data),
  achievements: () => api.get<ApiResponse<GamificationAchievements>>("/gamification/achievements").then(r => r.data),
  dashboard: () => api.get<ApiResponse<{ progress: GamificationProgress; achievements: GamificationAchievements; recent_xp_records: GamificationProgress["recent_xp_records"] }>>("/gamification/dashboard").then(r => r.data),
  processDaily: () => api.post<ApiResponse<GamificationDelta>>("/gamification/process-daily").then(r => r.data),
  leaderboard: (period?: string, metric?: string) =>
    api.get<ApiResponse<LeaderboardEntry[]>>(`/gamification/leaderboard?period=${period || "all"}&metric=${metric || "xp"}`).then(r => r.data),
}

export const analyticsApi = {
  dashboard: () => api.get<ApiResponse<DashboardData>>("/analytics/dashboard").then(r => r.data),
  spendingByCategory: (start_date?: string, end_date?: string) =>
    api.get<ApiResponse<Array<{ name: string; color: string; amount: number; percentage: number }>>>(`/analytics/spending-by-category${start_date ? `?start_date=${start_date}` : ""}${end_date ? `&end_date=${end_date}` : ""}`).then(r => r.data),
  monthlyTrend: (months?: number) =>
    api.get<ApiResponse<Array<{ month: string; income: number; expense: number }>>>(`/analytics/monthly-trend?months=${months || 6}`).then(r => r.data),
}

export type NotificationItem = {
  id: number
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  read: boolean
  read_at: string | null
  dismissed: boolean
  created_at: string
}

export type NotificationPrefs = {
  email_enabled: boolean
  push_enabled: boolean
  budget_alerts: boolean
  streak_reminders: boolean
  achievement_notifications: boolean
  weekly_summary: boolean
  recurring_reminders: boolean
  ai_insights: boolean
  social_notifications: boolean
  security_alerts: boolean
}

export const notificationApi = {
  list: (unread_only?: boolean) =>
    api.get<ApiResponse<NotificationItem[]>>(`/notifications${unread_only ? "?unread_only=true" : ""}`).then(r => r.data),
  preferences: () => api.get<ApiResponse<NotificationPrefs>>("/notifications/preferences").then(r => r.data),
  updatePreferences: (prefs: Partial<NotificationPrefs>) =>
    api.put<ApiResponse<NotificationPrefs>>("/notifications/preferences", prefs).then(r => r.data),
  markRead: (id: number) => api.put<ApiResponse<{ success: boolean }>>(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put<ApiResponse<{ success: boolean }>>("/notifications/read-all").then(r => r.data),
  dismiss: (id: number) => api.put<ApiResponse<{ success: boolean }>>(`/notifications/${id}/dismiss`).then(r => r.data),
  delete: (id: number) => api.del<ApiResponse<{ success: boolean }>>(`/notifications/${id}`).then(r => r.data),
}

async function rawFetch(endpoint: string): Promise<string> {
  const token = localStorage.getItem("access_token")
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${endpoint}`, { credentials: "include", headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export const exportImportApi = {
  exportCsv: (start_date?: string, end_date?: string) =>
    rawFetch(`/export/transactions.csv${start_date ? `?start_date=${start_date}` : ""}${end_date ? `&end_date=${end_date}` : ""}`),
  exportJson: () => rawFetch("/export/full.json"),
  importCsv: (csv: string) => api.post<ApiResponse<{ imported: number; errors: string[]; skipped: number }>>("/export/csv", { csv }).then(r => r.data),
  importJson: (data: unknown) => api.post<ApiResponse<{ imported: Record<string, number> }>>("/export/json", { data }).then(r => r.data),
}
