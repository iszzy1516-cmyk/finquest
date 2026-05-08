# FinQuest — Gamified Financial Management System

## Build Todo List (Derived from prompt.md)

---

## Phase 1: Foundation
- [ ] 1.1 `backend/app/config.py` — Environment configuration (Pydantic Settings, SECRET_KEY, JWT expiry, CORS, rate limits)
- [ ] 1.2 `backend/app/database.py` — SQLAlchemy setup (engine, session, base, async support)
- [ ] 1.3 `backend/app/models/user.py` — User ORM model (auth + profile + gamification fields)
- [ ] 1.4 `backend/app/models/transaction.py` — Transaction ORM model
- [ ] 1.5 `backend/app/models/category.py` — Category ORM model
- [ ] 1.6 `backend/app/models/budget.py` — Budget ORM model
- [ ] 1.7 `backend/app/models/gamification.py` — XPRecord, Achievement, UserAchievement, Streak ORM models
- [ ] 1.8 `backend/app/models/notification.py` — Notification, NotificationPreference, PushToken models
- [ ] 1.9 `backend/app/models/social.py` — Friendship, SharedBudget, SharedBudgetMember, LeaderboardEntry models
- [ ] 1.10 `backend/app/models/ai.py` — AIInsight, SpendingPattern models
- [ ] 1.11 `backend/app/models/currency.py` — ExchangeRate model
- [ ] 1.12 `backend/app/models/recurring.py` — RecurrenceLog model (add fields to Transaction)
- [ ] 1.13 `backend/app/models/refresh_token.py` — RefreshToken model
- [ ] 1.14 `backend/app/models/user_settings.py` — UserSettings model
- [ ] 1.15 `backend/app/schemas/*.py` — All Pydantic schemas (user, transaction, budget, gamification)
- [ ] 1.16 `backend/alembic/` — Initial migration

## Phase 2: Core Backend
- [ ] 2.1 `backend/app/auth/security.py` — Password hashing (bcrypt) + JWT encode/decode
- [ ] 2.2 `backend/app/auth/dependencies.py` — get_current_user, get_current_active_user
- [ ] 2.3 `backend/app/dependencies.py` — FastAPI DI container (DB session)
- [ ] 2.4 `backend/app/exceptions.py` — Custom exception classes
- [ ] 2.5 `backend/app/routers/auth.py` — Auth endpoints (register, login, refresh, logout)
- [ ] 2.6 `backend/app/routers/users.py` — User endpoints (profile, stats, preferences, theme)
- [ ] 2.7 `backend/app/services/base_service.py` — Abstract base with CRUD operations
- [ ] 2.8 `backend/app/services/user_service.py` — User business logic

## Phase 3: Financial Features
- [ ] 3.1 `backend/app/routers/categories.py` — Categories CRUD
- [ ] 3.2 `backend/app/routers/transactions.py` — Transaction CRUD + filtering + stats
- [ ] 3.3 `backend/app/routers/budgets.py` — Budget CRUD + status monitoring
- [ ] 3.4 `backend/app/routers/goals.py` — Goal CRUD + contributions
- [ ] 3.5 `backend/app/services/transaction_service.py` — Transaction + balance calculations
- [ ] 3.6 `backend/app/services/budget_service.py` — Budget enforcement logic + alerts
- [ ] 3.7 `backend/app/services/goal_service.py` — Goal logic + milestones

## Phase 4: Gamification
- [ ] 4.1 `backend/app/constants.py` — XP tables + achievement definitions
- [ ] 4.2 `backend/app/services/gamification_service.py` — XP engine + achievement engine
- [ ] 4.3 `backend/app/services/streak_service.py` — Streak calculation logic
- [ ] 4.4 `backend/app/routers/gamification.py` — Gamification endpoints (progress, achievements, leaderboard)
- [ ] 4.5 `backend/app/routers/analytics.py` — Analytics endpoints (dashboard, charts data)
- [ ] 4.6 `backend/app/services/analytics_service.py` — Aggregation + chart data generation

## Phase 5: Extension — Multi-Currency (15.1)
- [ ] 5.1 Add currency/exchange_rate fields to transactions & users
- [ ] 5.2 `backend/app/services/currency_service.py` — Currency conversion + rate caching
- [ ] 5.3 `backend/app/routers/currency.py` — Currency endpoints (supported, rates, convert)

## Phase 6: Extension — Recurring Transactions (15.2)
- [ ] 6.1 Add recurring fields to Transaction model
- [ ] 6.2 `backend/app/models/recurring.py` — RecurrenceLog table
- [ ] 6.3 `backend/app/services/recurring_service.py` — RRULE parser + instance generation
- [ ] 6.4 `backend/app/routers/recurring.py` — Recurring endpoints

## Phase 7: Extension — Social Features (15.3)
- [ ] 7.1 `backend/app/services/social_service.py` — Friends, shared budgets, leaderboards
- [ ] 7.2 `backend/app/routers/social.py` — Social endpoints

## Phase 8: Extension — AI Insights (15.4)
- [ ] 8.1 `backend/app/services/ai_service.py` — Spending patterns, budget recommendations, anomalies, forecasting
- [ ] 8.2 `backend/app/routers/ai.py` — AI endpoints (insights, patterns, recommendations, anomalies, forecast)

## Phase 9: Extension — Export/Import (15.5)
- [ ] 9.1 `backend/app/services/export_service.py` — CSV/JSON/Excel export
- [ ] 9.2 `backend/app/services/import_service.py` — CSV/JSON import + validation
- [ ] 9.3 `backend/app/routers/export_import.py` — Export/Import endpoints

## Phase 10: Extension — Notifications (15.6)
- [ ] 10.1 `backend/app/services/notification_service.py` — Email + push notifications
- [ ] 10.2 `backend/app/routers/notifications.py` — Notification endpoints

## Phase 11: Frontend Foundation
- [ ] 11.1 `frontend/src/api/client.ts` — Axios setup + interceptors
- [ ] 11.2 `frontend/src/context/AuthContext.tsx` — Auth provider
- [ ] 11.3 `frontend/src/context/ThemeContext.tsx` — Theme provider (manual/system/auto/schedule)
- [ ] 11.4 `frontend/src/hooks/useAuth.ts` — Auth hook
- [ ] 11.5 `frontend/src/hooks/useTheme.ts` — Theme hook
- [ ] 11.6 `frontend/src/hooks/useAutoTheme.ts` — Auto theme detection

## Phase 12: Frontend UI Components
- [ ] 12.1 `frontend/src/components/ui/*.tsx` — Primitive components (shadcn style)
- [ ] 12.2 `frontend/src/components/layout/*.tsx` — Navbar, Sidebar, MobileNav, Layout
- [ ] 12.3 `frontend/src/components/gamification/XPBar.tsx`
- [ ] 12.4 `frontend/src/components/gamification/LevelBadge.tsx`
- [ ] 12.5 `frontend/src/components/gamification/AchievementCard.tsx`
- [ ] 12.6 `frontend/src/components/gamification/StreakFlame.tsx`
- [ ] 12.7 `frontend/src/components/gamification/XPDropAnimation.tsx`
- [ ] 12.8 `frontend/src/components/gamification/LevelUpModal.tsx`
- [ ] 12.9 `frontend/src/components/charts/SpendingChart.tsx`
- [ ] 12.10 `frontend/src/components/charts/CategoryPie.tsx`
- [ ] 12.11 `frontend/src/components/charts/BudgetGauge.tsx`
- [ ] 12.12 `frontend/src/components/charts/TrendLine.tsx`
- [ ] 12.13 `frontend/src/components/transactions/TransactionForm.tsx`
- [ ] 12.14 `frontend/src/components/transactions/TransactionList.tsx`
- [ ] 12.15 `frontend/src/components/transactions/TransactionCard.tsx`
- [ ] 12.16 `frontend/src/components/transactions/CategorySelect.tsx`

## Phase 13: Frontend Pages
- [ ] 13.1 `frontend/src/pages/Login.tsx`
- [ ] 13.2 `frontend/src/pages/Register.tsx`
- [ ] 13.3 `frontend/src/pages/Dashboard.tsx`
- [ ] 13.4 `frontend/src/pages/Transactions.tsx`
- [ ] 13.5 `frontend/src/pages/Budgets.tsx`
- [ ] 13.6 `frontend/src/pages/Goals.tsx`
- [ ] 13.7 `frontend/src/pages/Gamification.tsx`
- [ ] 13.8 `frontend/src/pages/AchievementsPage.tsx`
- [ ] 13.9 `frontend/src/pages/LeaderboardPage.tsx`
- [ ] 13.10 `frontend/src/pages/Analytics.tsx`
- [ ] 13.11 `frontend/src/pages/Profile.tsx` — User profile + settings + notification prefs
- [ ] 13.12 `frontend/src/pages/NotFound.tsx`

## Phase 14: Security & Middleware
- [ ] 14.1 `backend/app/main.py` — FastAPI app factory + CORS + rate limiting + exception handlers
- [ ] 14.2 JWT security configuration (access 30min / refresh 7days / rotation)
- [ ] 14.3 bcrypt password hashing (12+ rounds)
- [ ] 14.4 Refresh token blacklist + rotation
- [ ] 14.5 Rate limiting on auth endpoints (5 attempts / 15min)
- [ ] 14.6 HTTPS-only cookies (HttpOnly, Secure, SameSite=Strict)
- [ ] 14.7 Input validation (Pydantic strict mode)
- [ ] 14.8 Error handling (no stack traces leaked)

## Phase 15: Deployment & DevOps
- [ ] 15.1 `backend/Dockerfile`
- [ ] 15.2 `frontend/Dockerfile`
- [ ] 15.3 `docker-compose.yml`
- [ ] 15.4 `.github/workflows/ci.yml`
- [ ] 15.5 `backend/requirements.txt`
- [ ] 15.6 `backend/.env.example`
- [ ] 15.7 `frontend/.env.example`

## Phase 16: Testing
- [ ] 16.1 `backend/tests/conftest.py` — Pytest fixtures
- [ ] 16.2 `backend/tests/test_auth.py`
- [ ] 16.3 `backend/tests/test_transactions.py`
- [ ] 16.4 `backend/tests/test_gamification.py`
- [ ] 16.5 Frontend unit tests (React Testing Library)
- [ ] 16.6 Frontend integration tests (Playwright/Cypress)

## Phase 17: Monitoring & Observability
- [ ] 17.1 Structured JSON logging
- [ ] 17.2 `GET /health` endpoint
- [ ] 17.3 Prometheus metrics (http_requests_total, duration, active_users, etc.)

## Phase 18: Polish & Integration
- [ ] 18.1 `frontend/tailwind.config.js` — Final theme tuning (gamification colors, animations)
- [ ] 18.2 `frontend/src/utils/constants.ts` — App constants (XP values, level thresholds)
- [ ] 18.3 `frontend/src/utils/formatters.ts` — Currency, date formatting
- [ ] 18.4 `frontend/src/utils/validators.ts` — Form validation rules
- [ ] 18.5 `frontend/src/utils/animations.ts` — Framer Motion variants
- [ ] 18.6 Final integration testing end-to-end
