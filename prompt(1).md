# System Prompt: Gamified Financial Management System

## Project Identity
**Name:** FinQuest — Gamified Financial Management System  
**Stack:** React 18 + TypeScript + FastAPI + SQLAlchemy + Tailwind CSS + Recharts  
**Architecture:** Modular monolith (backend) + Component-based SPA (frontend)  
**Authentication:** JWT (access 30min / refresh 7days) + bcrypt hashing  
**Database:** SQLite (dev) → PostgreSQL (prod)  
**Gamification Engine:** Event-driven XP/Level/Achievement/Streak system

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   React SPA  │  │  Vite Dev    │  │  Tailwind    │  │  Recharts/Viz   │  │
│  │  (TypeScript)│  │  Server      │  │  + Lucide    │  │  Components     │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                                                                    │
│         │ HTTPS / Fetch API                                                  │
│         ▼                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FastAPI Application (uvicorn)                                      │    │
│  │  ├── CORS Middleware (whitelist origins)                            │    │
│  │  ├── Rate Limiting (slowapi / custom)                             │    │
│  │  ├── Request Validation (Pydantic schemas)                        │    │
│  │  ├── JWT Auth Middleware (Bearer token validation)                │    │
│  │  └── Exception Handlers (HTTP 400/401/403/404/500)                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
├─────────┼────────────────────────────────────────────────────────────────────┤
│         │                         SERVICE LAYER                              │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Router Modules (API v1)                                            │    │
│  │  ├── /auth      → auth.py      (register, login, refresh, logout)  │    │
│  │  ├── /users     → users.py     (profile, stats, preferences)       │    │
│  │  ├── /transactions → transactions.py (CRUD + filtering)              │    │
│  │  ├── /budgets   → budgets.py   (CRUD + status monitoring)           │    │
│  │  ├── /categories → categories.py (income/expense categories)         │    │
│  │  ├── /gamification → gamification.py (XP, levels, achievements)      │    │
│  │  └── /analytics → analytics.py (aggregations, charts data)          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         │ Dependency Injection                                                │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Service Layer (Business Logic)                                     │    │
│  │  ├── AuthService        (JWT generation, password hashing)        │    │
│  │  ├── TransactionService (CRUD + balance calculations)               │    │
│  │  ├── BudgetService      (enforcement + alerts)                      │    │
│  │  ├── GamificationService (XP engine + achievement checker)          │    │
│  │  ├── AnalyticsService   (aggregation queries + chart data)          │    │
│  │  └── NotificationService (streak reminders, budget alerts)          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         │ Repository Pattern                                                  │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Data Access Layer (SQLAlchemy ORM)                                 │    │
│  │  ├── UserRepository        (user CRUD + auth queries)               │    │
│  │  ├── TransactionRepository (transaction CRUD + filtering)            │    │
│  │  ├── BudgetRepository      (budget CRUD + status)                    │    │
│  │  ├── GamificationRepository(XP/level/achievement persistence)       │    │
│  │  └── CategoryRepository    (category management)                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                                                                    │
│         ▼                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Database (SQLite dev / PostgreSQL prod)                            │    │
│  ├── Users table          (auth + profile + preferences)            │    │
│  ├── Transactions table   (income/expense records)                  │    │
│  ├── Categories table     (transaction classification)                │    │
│  ├── Budgets table        (spending limits + timeframes)            │    │
│  ├── XP_Records table     (XP history + audit trail)                │    │
│  ├── Achievements table   (unlocked achievements + timestamps)      │    │
│  ├── Streaks table        (login streak tracking)                   │    │
│  └── Refresh_Tokens table (token blacklist + rotation)              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Architecture

```
User Action → React Component → API Service → FastAPI Router → Service Layer → Repository → Database
     ↑                                                                                           │
     └────────────────←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←┘
                                    (Response: JSON → React State → UI Re-render)
```

**Gamification Event Flow:**
```
Transaction Created → TransactionService.save() → GamificationService.process_event()
    → AchievementChecker.check() → XP Awarded → Level Calculator.recalculate()
    → Streak Updater.update() → Response enriched with gamification_delta
```

---

## 2. Backend Architecture (FastAPI)

### 2.1 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory + middleware stack
│   ├── config.py               # Pydantic Settings (env vars validation)
│   ├── database.py             # SQLAlchemy engine + session + base
│   ├── dependencies.py         # FastAPI dependency injection container
│   ├── exceptions.py           # Custom exception classes
│   ├── constants.py            # XP values, level thresholds, achievement definitions
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── security.py         # Password hashing (bcrypt) + JWT encode/decode
│   │   ├── dependencies.py     # get_current_user, get_current_active_user
│   │   └── schemas.py          # LoginRequest, TokenResponse, RefreshRequest
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User ORM model
│   │   ├── transaction.py      # Transaction ORM model
│   │   ├── category.py         # Category ORM model
│   │   ├── budget.py           # Budget ORM model
│   │   └── gamification.py     # XPRecord, Achievement, Streak ORM models
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # UserCreate, UserUpdate, UserResponse
│   │   ├── transaction.py      # TransactionCreate, TransactionUpdate, TransactionResponse
│   │   ├── budget.py           # BudgetCreate, BudgetResponse, BudgetStatus
│   │   └── gamification.py     # XPResponse, LevelResponse, AchievementResponse
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py             # POST /auth/register, /auth/login, /auth/refresh
│   │   ├── users.py            # GET/PUT /users/me, /users/me/stats
│   │   ├── transactions.py     # CRUD /transactions + filtering
│   │   ├── budgets.py          # CRUD /budgets + /budgets/{id}/status
│   │   ├── categories.py       # CRUD /categories
│   │   ├── gamification.py     # GET /gamification/progress, /achievements
│   │   └── analytics.py        # GET /analytics/dashboard, /analytics/charts
│   ├── services/
│   │   ├── __init__.py
│   │   ├── base_service.py     # Abstract base with CRUD operations
│   │   ├── user_service.py     # User business logic
│   │   ├── transaction_service.py  # Transaction + balance calculations
│   │   ├── budget_service.py   # Budget enforcement logic
│   │   ├── gamification_service.py # XP engine + achievement engine
│   │   └── analytics_service.py    # Aggregation + chart data generation
│   └── utils/
│       ├── __init__.py
│       ├── validators.py       # Custom Pydantic validators
│       └── helpers.py          # Date utilities, formatters
├── tests/
│   ├── conftest.py             # Pytest fixtures (db, client, auth)
│   ├── test_auth.py
│   ├── test_transactions.py
│   └── test_gamification.py
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── requirements.txt
├── .env.example
└── pytest.ini
```

### 2.2 Core Models (SQLAlchemy)

```python
# User Model
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    # Gamification fields
    current_xp: Mapped[int] = mapped_column(default=0)
    current_level: Mapped[int] = mapped_column(default=1)
    total_xp_earned: Mapped[int] = mapped_column(default=0)

    # Relationships
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user")
    streaks: Mapped[list["Streak"]] = relationship(back_populates="user")

# Transaction Model
class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(10))  # "income" | "expense"
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    description: Mapped[str | None] = mapped_column(String(255))
    transaction_date: Mapped[date] = mapped_column(default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    user: Mapped["User"] = relationship(back_populates="transactions")
    category: Mapped["Category"] = relationship(back_populates="transactions")

# Gamification Models
class XPRecord(Base):
    __tablename__ = "xp_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int]
    source: Mapped[str] = mapped_column(String(50))  # "transaction", "login", "streak", "achievement"
    description: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=func.now())

class Achievement(Base):
    __tablename__ = "achievements"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))
    icon: Mapped[str] = mapped_column(String(50))  # Lucide icon name
    xp_reward: Mapped[int]
    condition_type: Mapped[str] = mapped_column(String(50))  # "count", "streak", "level", "percentage"
    condition_value: Mapped[int]
    category: Mapped[str] = mapped_column(String(50))  # "transaction", "streak", "level", "savings"

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"))
    unlocked_at: Mapped[datetime] = mapped_column(default=func.now())
    xp_awarded: Mapped[bool] = mapped_column(default=False)

class Streak(Base):
    __tablename__ = "streaks"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_login_date: Mapped[date | None]
    streak_broken_at: Mapped[datetime | None]
```

### 2.3 Gamification Engine Logic

```python
# XP Calculation Formula
class GamificationEngine:
    XP_TABLE = {
        "add_transaction": 10,
        "daily_login": 20,
        "streak_7": 50,
        "streak_30": 200,
        "streak_100": 1000,
        "achievement_unlock": "variable",  # From achievement.xp_reward
        "level_up": "variable",            # level * 50
        "budget_met": 25,
        "savings_goal_20pct": 150,
        "savings_goal_50pct": 500,
    }

    @staticmethod
    def calculate_level(xp: int) -> int:
        # Level progression: each level needs level*100 XP
        level = 1
        xp_needed = 100
        while xp >= xp_needed:
            xp -= xp_needed
            level += 1
            xp_needed = level * 100
        return level

    @staticmethod
    def xp_to_next_level(current_level: int) -> int:
        return current_level * 100

    @staticmethod
    def xp_progress_to_next_level(current_xp: int, current_level: int) -> tuple[int, int]:
        # Returns (current_progress, total_needed)
        xp_needed = current_level * 100
        # Calculate XP spent on previous levels
        spent = sum(l * 100 for l in range(1, current_level))
        progress = current_xp - spent
        return (progress, xp_needed)
```

### 2.4 API Endpoint Specifications

```yaml
# Authentication
POST /api/v1/auth/register:
  body: { email, username, password, full_name? }
  response: { user, access_token, refresh_token }

POST /api/v1/auth/login:
  body: { username, password }
  response: { access_token, refresh_token, token_type: "bearer" }

POST /api/v1/auth/refresh:
  body: { refresh_token }
  response: { access_token, refresh_token }

# Transactions
GET /api/v1/transactions:
  query: { page, limit, type, category_id, start_date, end_date, sort_by, sort_order }
  response: { items[], total, page, pages }

POST /api/v1/transactions:
  body: { type, amount, category_id, description?, transaction_date? }
  response: Transaction + gamification_delta { xp_gained, achievements_unlocked[], level_up? }

# Gamification
GET /api/v1/gamification/progress:
  response: {
    current_xp, current_level, total_xp_earned,
    xp_to_next_level, xp_progress_percent,
    current_streak, longest_streak
  }

GET /api/v1/gamification/achievements:
  response: {
    unlocked: [{ achievement, unlocked_at }],
    locked: [{ achievement, progress_percent, remaining_condition }]
  }

GET /api/v1/gamification/dashboard:
  response: { progress, achievements, recent_xp_records[], leaderboard? }
```

---

## 3. Frontend Architecture (React + TypeScript)

### 3.1 Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point + React root
│   ├── App.tsx                     # Router + ThemeProvider + AuthProvider
│   ├── index.css                   # Tailwind directives + custom CSS
│   ├── vite-env.d.ts               # Vite env types
│   ├──
│   ├── api/                        # Axios instance + interceptors
│   │   ├── client.ts               # Axios config + baseURL + headers
│   │   ├── interceptors.ts         # Request (attach token) + Response (refresh on 401)
│   │   └── endpoints.ts            # API endpoint path constants
│   │
│   ├── types/                      # Global TypeScript interfaces
│   │   ├── auth.ts
│   │   ├── transaction.ts
│   │   ├── gamification.ts
│   │   └── api.ts                  # Generic ApiResponse<T>, PaginatedResponse<T>
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Auth state + login/logout/register
│   │   ├── useTransactions.ts      # Transaction CRUD + filtering
│   │   ├── useGamification.ts      # XP/Level/Achievement data
│   │   ├── useTheme.ts             # Dark/light mode toggle
│   │   └── useLocalStorage.ts      # Persist state to localStorage
│   │
│   ├── context/                    # React Context providers
│   │   ├── AuthContext.tsx         # Auth state + user profile
│   │   └── ThemeContext.tsx        # Theme state + system preference detection
│   │
│   ├── services/                   # API call functions (thin wrappers)
│   │   ├── authService.ts
│   │   ├── transactionService.ts
│   │   ├── budgetService.ts
│   │   └── gamificationService.ts
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Primitive components (shadcn/ui style)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Dialog.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Top nav + user menu + theme toggle
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── MobileNav.tsx       # Bottom nav for mobile
│   │   │   └── Layout.tsx          # Main layout wrapper
│   │   ├── gamification/
│   │   │   ├── XPBar.tsx           # Animated XP progress bar
│   │   │   ├── LevelBadge.tsx      # Level indicator with icon
│   │   │   ├── AchievementCard.tsx # Achievement display (locked/unlocked)
│   │   │   ├── StreakFlame.tsx     # Streak indicator with animation
│   │   │   ├── XPDropAnimation.tsx # XP gain floating animation
│   │   │   └── LevelUpModal.tsx    # Level up celebration overlay
│   │   ├── charts/
│   │   │   ├── SpendingChart.tsx   # Recharts bar/line chart
│   │   │   ├── CategoryPie.tsx     # Category distribution pie
│   │   │   ├── BudgetGauge.tsx     # Budget usage gauge
│   │   │   └── TrendLine.tsx       # Income vs expense trend
│   │   └── transactions/
│   │       ├── TransactionForm.tsx # Add/edit transaction form
│   │       ├── TransactionList.tsx # Paginated transaction list
│   │       ├── TransactionCard.tsx # Individual transaction item
│   │       └── CategorySelect.tsx  # Category dropdown
│   │
│   ├── pages/                      # Route-level pages
│   │   ├── Dashboard.tsx           # Main dashboard with stats + charts
│   │   ├── Transactions.tsx        # Transaction management page
│   │   ├── Budgets.tsx             # Budget setup + monitoring
│   │   ├── Analytics.tsx           # Detailed analytics + reports
│   │   ├── Gamification.tsx        # Gamification hub (achievements, leaderboard)
│   │   ├── Profile.tsx             # User profile + settings
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Registration page
│   │   └── NotFound.tsx            # 404 page
│   │
│   ├── utils/                      # Helper utilities
│   │   ├── formatters.ts           # Currency, date formatting
│   │   ├── validators.ts           # Form validation rules
│   │   ├── constants.ts            # App constants (XP values, level thresholds)
│   │   └── animations.ts           # Framer Motion variants
│   │
│   └── stores/                     # State management (Zustand or Context)
       └── (optional - if needed beyond React Context)
│
├── public/
│   └── assets/                     # Static images, icons
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js              # Custom theme colors + dark mode config
└── vite.config.ts                  # Vite config + proxy for dev API
```

### 3.2 State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GLOBAL STATE                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   AuthContext   │  │  ThemeContext   │  │  (Zustand)  │ │
│  │  ─────────────  │  │  ─────────────  │  │  Optional   │ │
│  │  • user         │  │  • theme        │  │  for complex│ │
│  │  • isLoading    │  │  • systemPref   │  │  state      │ │
│  │  • isAuth       │  │  • toggle()     │  │             │ │
│  │  • login()      │  │  • setTheme()   │  │             │ │
│  │  • logout()     │  │                 │  │             │ │
│  │  • register()   │  │                 │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   LOCAL STATE   │  │   LOCAL STATE   │  │   LOCAL STATE   │
│  (useState)     │  │  (useState)     │  │  (useState)     │
│  ─────────────  │  │  ─────────────  │  │  ─────────────  │
│  DashboardPage  │  │ TransactionForm │  │  BudgetCard     │
│  • stats        │  │  • formData     │  │  • budget       │
│  • chartData    │  │  • errors       │  │  • progress     │
│  • dateRange    │  │  • isSubmitting │  │  • isEditing    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3.3 Component Hierarchy (Dashboard Page)

```
App (Router)
└── Layout
    ├── Navbar (fixed top)
    ├── Sidebar (desktop) / MobileNav (mobile)
    └── <Outlet> → Dashboard Page
        ├── PageHeader (title + date filter)
        ├── StatsGrid (4 cards)
        │   ├── StatCard (Total Balance)
        │   ├── StatCard (Monthly Income)
        │   ├── StatCard (Monthly Expenses)
        │   └── StatCard (Budget Status)
        ├── ChartsSection
        │   ├── SpendingChart (Recharts)
        │   └── CategoryPie (Recharts)
        ├── GamificationWidget
        │   ├── XPBar (animated)
        │   ├── LevelBadge
        │   ├── MiniStreak
        │   └── RecentAchievements
        └── RecentTransactions (table/list)
```

### 3.4 Theme System (Tailwind)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Manual toggle via class on html element
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
        },
        // Gamification colors
        xp: { DEFAULT: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
        level: { DEFAULT: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
        streak: { DEFAULT: '#ef4444', light: '#f87171', dark: '#dc2626' },
        // Semantic colors
        success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
        // Dark mode overrides handled via CSS variables
      },
      animation: {
        'xp-gain': 'xpFloat 1s ease-out forwards',
        'level-up': 'levelPulse 0.5s ease-in-out',
        'streak-flame': 'flameFlicker 2s infinite',
      }
    }
  }
}
```

---

## 4. Database Schema (ER Diagram)

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   users     │       │  transactions   │       │ categories  │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ PK id       │──┐    │ PK id           │   ┌───│ PK id       │
│ email (UQ)  │  └───>│ FK user_id      │   │   │ name        │
│ username(UQ)│       │ type            │   │   │ type        │
│ hashed_pass │       │ amount          │   │   │ icon        │
│ full_name   │       │ FK category_id ─┼───┘   │ color       │
│ is_active   │       │ description     │       │ is_default  │
│ is_verified │       │ transaction_date│       └─────────────┘
│ created_at  │       │ created_at      │
│ updated_at  │       └─────────────────┘
│ current_xp  │
│ current_lvl │       ┌─────────────────┐       ┌─────────────┐
│ total_xp    │       │     budgets     │       │   streaks   │
└─────────────┘       ├─────────────────┤       ├─────────────┤
       │              │ PK id           │       │ PK id       │
       │         ┌───>│ FK user_id      │       │ FK user_id  │
       │         │    │ name            │       │ current     │
       │         │    │ amount          │       │ longest     │
       ▼         │    │ category_id     │       │ last_login  │
┌─────────────┐  │    │ period          │       │ broken_at   │
│ xp_records  │  │    │ start_date      │       └─────────────┘
├─────────────┤  │    │ end_date        │
│ PK id       │  │    │ alert_threshold │
│ FK user_id ─┼──┘    │ created_at      │
│ amount      │       └─────────────────┘
│ source      │
│ description │       ┌─────────────────┐       ┌─────────────┐
│ created_at  │       │  achievements   │       │user_achieve │
└─────────────┘       ├─────────────────┤       ├─────────────┤
                      │ PK id           │<──────│ PK id       │
                      │ name (UQ)       │       │ FK user_id  │
                      │ description     │       │ FK achieve ─┼──┐
                      │ icon            │       │ unlocked_at │  │
                      │ xp_reward       │       │ xp_awarded  │  │
                      │ condition_type  │       └─────────────┘  │
                      │ condition_value │                        │
                      │ category        │                        │
                      └─────────────────┘                        │
                                                                 │
                      ┌─────────────────┐                        │
                      │ refresh_tokens  │                        │
                      ├─────────────────┤                        │
                      │ PK id           │                        │
                      │ FK user_id      │                        │
                      │ token_hash      │                        │
                      │ expires_at      │                        │
                      │ created_at      │                        │
                      │ revoked         │                        │
                      └─────────────────┘                        │
                                                                 │
                      ┌─────────────────┐                        │
                      │ user_settings   │                        │
                      ├─────────────────┤                        │
                      │ PK id           │                        │
                      │ FK user_id ─────┼────────────────────────┘
                      │ theme_pref      │
                      │ currency        │
                      │ notifications   │
                      │ created_at      │
                      └─────────────────┘
```

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

```
┌────────────────────────────────────────────────────────────────┐
│                    AUTH FLOW                                     │
│                                                                 │
│  1. REGISTER                                                    │
│     Client → POST /auth/register {email, username, password}   │
│     Server → bcrypt.hash(password, rounds=12)                   │
│     Server → INSERT user (hashed_password)                      │
│     Server → Generate JWT pair (access + refresh)               │
│     Server → Return tokens + user (without password)            │
│                                                                 │
│  2. LOGIN                                                       │
│     Client → POST /auth/login {username, password}             │
│     Server → bcrypt.verify(password, stored_hash)               │
│     Server → Generate JWT pair                                  │
│     Server → Store refresh_token_hash in DB (rotation)        │
│     Server → Return tokens                                      │
│                                                                 │
│  3. AUTHENTICATED REQUEST                                       │
│     Client → GET /transactions (Header: Bearer <access_token>) │
│     Server → Verify JWT signature (SECRET_KEY)                  │
│     Server → Decode payload → user_id                           │
│     Server → get_current_user(user_id) → inject into endpoint   │
│                                                                 │
│  4. TOKEN REFRESH                                               │
│     Client → POST /auth/refresh {refresh_token}                │
│     Server → Verify refresh_token                               │
│     Server → Check DB: token_hash matches AND not revoked       │
│     Server → Generate NEW pair (rotate refresh token)           │
│     Server → Revoke old refresh_token, store new hash           │
│     Server → Return new tokens                                  │
│                                                                 │
│  5. LOGOUT                                                      │
│     Client → POST /auth/logout (Header: Bearer <token>)        │
│     Server → Add token to blacklist (Redis/DB)                │
│     Server → Revoke refresh_token in DB                        │
│     Client → Clear tokens from storage                          │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Security Measures Matrix

| Layer | Threat | Mitigation | Implementation |
|-------|--------|------------|----------------|
| **Transport** | MITM / Eavesdropping | TLS 1.3 | HTTPS only (nginx/traefik) |
| **Auth** | Password brute force | Slow hashing | bcrypt with 12+ rounds |
| **Auth** | Credential stuffing | Rate limiting | 5 attempts / 15min per IP |
| **Auth** | Token theft | Short expiry + rotation | Access: 30min, Refresh: 7days |
| **Auth** | Session hijacking | HTTPOnly cookies | Set HttpOnly; Secure; SameSite=Strict |
| **Input** | SQL Injection | Parameterized queries | SQLAlchemy ORM (never raw SQL) |
| **Input** | XSS | Output encoding | React auto-escapes, sanitize HTML |
| **Input** | NoSQL/ORM injection | Schema validation | Pydantic strict validation |
| **Input** | File upload abuse | Type/size restrictions | Whitelist extensions, max 5MB |
| **API** | Enumeration | UUIDs instead of sequential IDs | Use UUID7 for all public IDs |
| **API** | Mass assignment | Field whitelisting | Pydantic schemas with explicit fields |
| **API** | DoS / Abuse | Rate limiting | 100 req/min per user, 1000/hour per IP |
| **Data** | Sensitive data exposure | Encryption at rest | AES-256 for DB backups |
| **Data** | Sensitive data in logs | Log filtering | Mask emails/passwords in logs |
| **Infra** | Dependency vulnerabilities | Automated scanning | Dependabot + pip-audit + npm audit |
| **Infra** | Container escape | Non-root user | Docker USER directive, read-only FS |
| **Infra** | Secret leakage | Secret management | Use .env + Docker secrets, NEVER commit |
| **Frontend** | localStorage XSS | httpOnly cookies | Store tokens in httpOnly cookies, NOT localStorage |
| **Frontend** | CSRF | Token validation | Double-submit cookie pattern |
| **Frontend** | DOM-based XSS | innerHTML sanitization | Use DOMPurify for any HTML injection |

### 5.3 JWT Security Configuration

```python
# config.py
class Settings(BaseSettings):
    SECRET_KEY: str = Field(..., min_length=32)  # Cryptographically random
    ALGORITHM: str = "HS256"  # or RS256 for asymmetric (better for microservices)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Security headers
    SECURE_COOKIES: bool = True  # False only in local dev
    SAME_SITE: str = "Strict"    # Lax if cross-site auth needed

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

# Token payload structure
{
  "sub": "user_uuid",           # Subject (user ID)
  "type": "access" | "refresh",  # Token type
  "jti": "unique_token_id",     # JWT ID for revocation tracking
  "iat": 1715184000,            # Issued at
  "exp": 1715185800,            # Expiration
  "scope": "user"               # Role/scope for RBAC
}
```

### 5.4 CORS Policy

```python
# Strict CORS - whitelist only known origins
allowed_origins = [
    "http://localhost:5173",      # Vite dev server
    "https://app.finquest.io",    # Production domain
    "https://staging.finquest.io" # Staging
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,        # Required for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    max_age=600,                   # Preflight cache
)
```

---

## 6. Gamification System Deep Dive

### 6.1 Event-Driven XP Engine

```python
# Event types that trigger XP calculation
class GameEvent(Enum):
    TRANSACTION_CREATED = "transaction_created"
    DAILY_LOGIN = "daily_login"
    STREAK_MILESTONE = "streak_milestone"
    BUDGET_ACHIEVED = "budget_achieved"
    SAVINGS_GOAL = "savings_goal"
    PROFILE_COMPLETED = "profile_completed"
    FIRST_TRANSACTION = "first_transaction"
    CATEGORY_DIVERSITY = "category_diversity"

# Event handler registry
class GamificationService:
    def __init__(self, db: Session):
        self.db = db
        self.handlers = {
            GameEvent.TRANSACTION_CREATED: self._handle_transaction,
            GameEvent.DAILY_LOGIN: self._handle_login,
            GameEvent.STREAK_MILESTONE: self._handle_streak,
        }

    async def process_event(self, user_id: int, event: GameEvent, metadata: dict) -> dict:
        # Process gamification event and return delta
        handler = self.handlers.get(event)
        if not handler:
            return {"xp_gained": 0, "achievements": [], "level_up": False}

        delta = await handler(user_id, metadata)

        # Check for achievements after any event
        new_achievements = await self._check_achievements(user_id)
        delta["achievements"].extend(new_achievements)

        # Check for level up
        if delta["xp_gained"] > 0:
            level_up = await self._check_level_up(user_id)
            delta["level_up"] = level_up

        return delta
```

### 6.2 Achievement Engine

```python
# Achievement definitions (seeded in DB on first run)
ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "first_steps",
        "name": "First Steps",
        "description": "Add your first transaction",
        "icon": "Footprints",
        "xp_reward": 50,
        "condition": {"type": "count", "entity": "transaction", "value": 1},
        "category": "transaction"
    },
    {
        "id": "transaction_pro",
        "name": "Transaction Pro",
        "description": "Add 100 transactions",
        "icon": "Receipt",
        "xp_reward": 300,
        "condition": {"type": "count", "entity": "transaction", "value": 100},
        "category": "transaction"
    },
    {
        "id": "streak_keeper",
        "name": "Streak Keeper",
        "description": "Maintain a 7-day login streak",
        "icon": "Flame",
        "xp_reward": 100,
        "condition": {"type": "streak", "value": 7},
        "category": "streak"
    },
    {
        "id": "dedicated_saver",
        "name": "Dedicated Saver",
        "description": "30-day login streak",
        "icon": "Crown",
        "xp_reward": 500,
        "condition": {"type": "streak", "value": 30},
        "category": "streak"
    },
    {
        "id": "category_explorer",
        "name": "Category Explorer",
        "description": "Use 5 different categories",
        "icon": "Compass",
        "xp_reward": 75,
        "condition": {"type": "unique_count", "entity": "category", "value": 5},
        "category": "transaction"
    },
    {
        "id": "savings_hero",
        "name": "Savings Hero",
        "description": "Save 20% of total income",
        "icon": "PiggyBank",
        "xp_reward": 150,
        "condition": {"type": "percentage", "entity": "savings_rate", "value": 20},
        "category": "savings"
    },
    {
        "id": "level_5",
        "name": "Level 5 Reached",
        "description": "Reach level 5",
        "icon": "Star",
        "xp_reward": 200,
        "condition": {"type": "level", "value": 5},
        "category": "level"
    },
    {
        "id": "level_10",
        "name": "Level 10 Reached",
        "description": "Reach level 10",
        "icon": "Trophy",
        "xp_reward": 500,
        "condition": {"type": "level", "value": 10},
        "category": "level"
    },
]
```

### 6.3 Streak Calculation Logic

```python
class StreakService:
    def update_streak(self, user_id: int) -> dict:
        streak = self.get_streak(user_id)
        today = date.today()

        if streak.last_login_date is None:
            # First login ever
            streak.current_streak = 1
            streak.longest_streak = 1
        elif streak.last_login_date == today:
            # Already logged in today
            return {"streak": streak.current_streak, "xp_gained": 0}
        elif streak.last_login_date == today - timedelta(days=1):
            # Consecutive day
            streak.current_streak += 1
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
        else:
            # Streak broken
            streak.streak_broken_at = datetime.now()
            streak.current_streak = 1

        streak.last_login_date = today
        self.db.commit()

        # Calculate XP
        xp_gained = 20  # Base daily login
        bonus_xp = 0

        if streak.current_streak == 7:
            bonus_xp = 50
        elif streak.current_streak == 30:
            bonus_xp = 200
        elif streak.current_streak == 100:
            bonus_xp = 1000

        return {
            "streak": streak.current_streak,
            "xp_gained": xp_gained + bonus_xp,
            "bonus_xp": bonus_xp,
            "is_milestone": bonus_xp > 0
        }
```

---

## 7. API Response Format Standard

### 7.1 Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-08T20:32:00Z",
    "request_id": "uuid-v4",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### 7.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Minimum 8 characters required" }
    ],
    "timestamp": "2026-05-08T20:32:00Z",
    "request_id": "uuid-v4"
  }
}
```

### 7.3 Gamification-Enriched Response (Transaction Created)

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "type": "expense",
      "amount": 50.00,
      "category": "Food",
      "description": "Lunch",
      "created_at": "2026-05-08T20:32:00Z"
    },
    "gamification_delta": {
      "xp_gained": 10,
      "total_xp": 1250,
      "current_level": 3,
      "xp_to_next_level": 75,
      "level_up": false,
      "achievements_unlocked": [
        {
          "id": "first_steps",
          "name": "First Steps",
          "xp_reward": 50,
          "icon": "Footprints"
        }
      ],
      "streak_bonus": 0
    }
  }
}
```

---

## 8. Development Guidelines

### 8.1 Code Style & Conventions

**Backend (Python / FastAPI):**
- Follow PEP 8 with Black formatter (line length 88)
- Type hints REQUIRED on all function signatures
- Docstrings: Google style for all public functions
- Async/await for all I/O operations (DB, HTTP)
- Dependency injection via FastAPI Depends()
- Repository pattern for all DB access
- Service layer for all business logic (no logic in routers)
- Custom exceptions inherit from HTTPException
- Log all errors with structured logging (JSON format)

**Frontend (React / TypeScript):**
- Strict TypeScript (strict: true in tsconfig)
- Functional components with hooks (no class components)
- Custom hooks for reusable logic (prefix with use)
- Props interfaces named {ComponentName}Props
- Export default only page components, named exports for others
- CSS: Tailwind utility classes only (no inline styles)
- Colors: Use theme tokens, never hardcoded hex values
- Icons: Lucide React only
- State: React Context for global, useState for local
- API calls: Centralized in services/ directory
- Error handling: Try/catch in services, toast notifications in UI

### 8.2 Git Workflow

```
main (protected) ──→ deploy to production
  │
  └── develop ──────→ integration branch
        │
        ├── feature/gamification-engine
        ├── feature/dark-mode
        ├── feature/budget-alerts
        └── bugfix/auth-refresh-token
```

**Commit Convention:**
```
type(scope): subject

body (optional)

footer (optional)

Types: feat, fix, docs, style, refactor, test, chore, security
Example: feat(gamification): add streak milestone bonuses
```

### 8.3 Testing Strategy

**Backend:**
- Unit tests: Services and utilities (pytest)
- Integration tests: API endpoints (TestClient)
- Coverage target: 80% minimum
- Mock external dependencies (DB, email)

**Frontend:**
- Unit tests: Components with React Testing Library
- Integration tests: User flows (Playwright/Cypress)
- Mock API calls with MSW (Mock Service Worker)

### 8.4 Environment Configuration

```bash
# .env (backend)
ENVIRONMENT=development|staging|production
SECRET_KEY=openssl rand -hex 32
DATABASE_URL=sqlite:///./finance.db  # or postgresql://user:pass@host/db
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173,https://app.finquest.io
RATE_LIMIT_PER_MINUTE=100
LOG_LEVEL=INFO

# .env (frontend)
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=FinQuest
VITE_ENABLE_ANALYTICS=false
```

---

## 9. Deployment Architecture

### 9.1 Container Strategy (Docker)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY ./app ./app
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 9.2 Docker Compose (Development)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/finance.db
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

  # Optional: PostgreSQL for production-like dev
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: finquest
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: finquest
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 9.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
          pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: |
          cd frontend
          npm ci
          npm run test:ci
          npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Backend vulnerability scan
        run: |
          cd backend
          pip install pip-audit
          pip-audit -r requirements.txt
      - name: Frontend audit
        run: |
          cd frontend
          npm audit --audit-level=moderate

  deploy-staging:
    needs: [backend-tests, frontend-tests, security-scan]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging server"

  deploy-production:
    needs: [backend-tests, frontend-tests, security-scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: echo "Deploy to production server"
```

---

## 10. Performance Considerations

### 10.1 Backend Optimization

- **Database:** Index on user_id for all user-scoped tables
- **Pagination:** All list endpoints use cursor/offset pagination (default 20 items)
- **Caching:** Redis for session store + frequent queries (user stats, leaderboard)
- **N+1 Prevention:** Use SQLAlchemy selectinload for relationships
- **Async:** All endpoints async, use asyncpg for PostgreSQL
- **Compression:** Gzip middleware for responses > 1KB

### 10.2 Frontend Optimization

- **Code Splitting:** React.lazy() for route-level code splitting
- **Tree Shaking:** Import only needed Lucide icons (lucide-react/dist/esm/icons/X)
- **Memoization:** React.memo for chart components, useMemo for expensive calculations
- **Virtualization:** React-window for long transaction lists (>100 items)
- **Images:** WebP format, lazy loading, blur-up placeholders
- **Bundle:** Analyze with vite-bundle-visualizer, target <200KB initial JS

---

## 11. Monitoring & Observability

### 11.1 Logging

```python
# Structured JSON logging
{
  "timestamp": "2026-05-08T20:32:00Z",
  "level": "ERROR",
  "service": "finquest-api",
  "trace_id": "uuid-v4",
  "user_id": "hashed_user_id",
  "endpoint": "POST /api/v1/transactions",
  "duration_ms": 45,
  "status_code": 500,
  "error": "DatabaseConnectionError",
  "message": "Failed to connect to database",
  "stack_trace": "..."
}
```

### 11.2 Health Checks

```python
# GET /health
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": "3d 12h 45m",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "disk_space": "ok"
  }
}
```

### 11.3 Metrics (Prometheus)

- http_requests_total (counter, labeled by method, endpoint, status)
- http_request_duration_seconds (histogram)
- active_users (gauge)
- transactions_per_minute (counter)
- xp_awarded_total (counter)

---

## 12. Development Commands Reference

```bash
# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd app && uvicorn main:app --reload --port 8000
pytest                    # Run tests
pytest --cov=app          # Run with coverage
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head      # Run migrations

# Frontend
npm install
npm run dev               # Start dev server (port 5173)
npm run build             # Production build
npm run test              # Run tests
npm run lint              # ESLint check
npm run typecheck         # TypeScript check

# Docker
docker-compose up --build # Start all services
docker-compose logs -f    # Follow logs
docker-compose down       # Stop all
```

---

## 13. File Generation Order (Build Sequence)

When implementing this system, generate files in this order:

### Phase 1: Foundation
1. backend/app/config.py — Environment configuration
2. backend/app/database.py — SQLAlchemy setup
3. backend/app/models/*.py — All ORM models
4. backend/app/schemas/*.py — All Pydantic schemas
5. backend/alembic/ — Initial migration

### Phase 2: Core Backend
6. backend/app/auth/security.py — Password + JWT utilities
7. backend/app/auth/dependencies.py — Auth middleware
8. backend/app/routers/auth.py — Auth endpoints
9. backend/app/routers/users.py — User endpoints
10. backend/app/services/base_service.py — Base service class

### Phase 3: Financial Features
11. backend/app/routers/categories.py — Categories CRUD
12. backend/app/routers/transactions.py — Transaction CRUD
13. backend/app/routers/budgets.py — Budget CRUD
14. backend/app/services/transaction_service.py — Transaction logic
15. backend/app/services/budget_service.py — Budget logic

### Phase 4: Gamification
16. backend/app/constants.py — XP tables + achievement definitions
17. backend/app/services/gamification_service.py — XP engine
18. backend/app/routers/gamification.py — Gamification endpoints
19. backend/app/routers/analytics.py — Analytics endpoints

### Phase 5: Frontend Foundation
20. frontend/src/api/client.ts — Axios setup
21. frontend/src/context/AuthContext.tsx — Auth provider
22. frontend/src/context/ThemeContext.tsx — Theme provider
23. frontend/src/hooks/useAuth.ts — Auth hook
24. frontend/src/hooks/useTheme.ts — Theme hook

### Phase 6: Frontend UI
25. frontend/src/components/ui/*.tsx — Primitive components
26. frontend/src/components/layout/*.tsx — Layout components
27. frontend/src/pages/Login.tsx + Register.tsx
28. frontend/src/pages/Dashboard.tsx

### Phase 7: Frontend Features
29. frontend/src/pages/Transactions.tsx
30. frontend/src/pages/Budgets.tsx
31. frontend/src/components/gamification/*.tsx — Gamification UI
32. frontend/src/pages/Gamification.tsx
33. frontend/src/pages/Analytics.tsx

### Phase 8: Polish
34. frontend/src/components/charts/*.tsx — Chart components
35. frontend/tailwind.config.js — Final theme tuning
36. backend/app/main.py — Final middleware stack
37. docker-compose.yml + Dockerfiles
38. .github/workflows/ci.yml — CI/CD

---

## 14. Critical Security Checklist (DO NOT SKIP)

Before ANY deployment, verify:

- [ ] SECRET_KEY is cryptographically random (32+ bytes, hex)
- [ ] SECRET_KEY is NOT in code/repo (use env var only)
- [ ] Passwords hashed with bcrypt (min 12 rounds)
- [ ] JWT access tokens expire in <= 30 minutes
- [ ] JWT refresh tokens rotate on every use
- [ ] Refresh tokens stored hashed in DB (not plaintext)
- [ ] CORS origins explicitly whitelisted (no wildcard)
- [ ] Rate limiting enabled on all auth endpoints
- [ ] SQL injection impossible (ORM only, no raw SQL)
- [ ] XSS prevented (React auto-escape, no dangerousSetInnerHTML)
- [ ] Tokens stored in httpOnly cookies (NOT localStorage)
- [ ] HTTPS enforced in production (HSTS header)
- [ ] Input validated on server (Pydantic strict mode)
- [ ] Error messages don't leak stack traces to client
- [ ] Dependencies scanned for vulnerabilities (pip-audit, npm audit)
- [ ] Database backups encrypted (AES-256)
- [ ] Admin endpoints protected by role middleware
- [ ] File uploads restricted by type and size
- [ ] Session invalidation on logout (token blacklist)

---

## 15. Extension Points (Future Features) — Detailed Implementation Specs

Design the system to easily accommodate these extensions with minimal refactoring:

---

### 15.1 Multi-Currency Support

**Database Changes:**
```sql
-- Add to transactions table
ALTER TABLE transactions ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE transactions ADD COLUMN original_amount DECIMAL(12,2);
ALTER TABLE transactions ADD COLUMN exchange_rate DECIMAL(10,6);

-- New table: exchange_rates
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    source VARCHAR(20) DEFAULT 'api',
    fetched_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(base_currency, target_currency)
);

-- User preference
ALTER TABLE users ADD COLUMN default_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE users ADD COLUMN preferred_currencies VARCHAR(3)[] DEFAULT ARRAY['USD'];
```

**Backend Implementation:**
```python
# services/currency_service.py
class CurrencyService:
    SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'NGN', 'CAD', 'AUD']

    def __init__(self, db: Session, exchange_api: ExchangeRateAPI):
        self.db = db
        self.api = exchange_api

    async def convert(self, amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
        if from_currency == to_currency:
            return amount
        rate = await self.get_rate(from_currency, to_currency)
        return amount * rate

    async def get_rate(self, base: str, target: str) -> Decimal:
        # Check cache first (valid for 1 hour)
        cached = self.db.query(ExchangeRate).filter(
            ExchangeRate.base_currency == base,
            ExchangeRate.target_currency == target,
            ExchangeRate.expires_at > datetime.now()
        ).first()
        if cached:
            return cached.rate
        # Fetch from API (e.g., ExchangeRate-API, Fixer.io)
        rate = await self.api.fetch_rate(base, target)
        new_rate = ExchangeRate(
            base_currency=base, target_currency=target, rate=rate,
            expires_at=datetime.now() + timedelta(hours=1)
        )
        self.db.add(new_rate)
        self.db.commit()
        return rate

    async def get_user_balance(self, user_id: int, in_currency: str = None) -> dict:
        user = self.db.query(User).get(user_id)
        target = in_currency or user.default_currency
        balances = {}
        for tx in user.transactions:
            if tx.currency not in balances:
                balances[tx.currency] = Decimal('0')
            if tx.type == 'income':
                balances[tx.currency] += tx.amount
            else:
                balances[tx.currency] -= tx.amount
        converted = {}
        for curr, amount in balances.items():
            converted[curr] = {
                'original': amount,
                'converted': await self.convert(amount, curr, target),
                'rate': await self.get_rate(curr, target)
            }
        total = sum(v['converted'] for v in converted.values())
        return {'total': total, 'currency': target, 'breakdown': converted}
```

**Frontend Changes:**
- Add currency selector to transaction form (default to user preference)
- Display amounts with currency symbol (e.g., $50.00, EUR 45.00, NGN 75,000)
- Show converted totals in dashboard cards
- Currency toggle in settings page

**API Endpoints:**
```yaml
GET /api/v1/currencies/supported
GET /api/v1/currencies/rates?base=USD
GET /api/v1/currencies/convert?amount=100&from=USD&to=EUR
PUT /api/v1/users/me/currency
```

---

### 15.2 Recurring Transactions

**Database Changes:**
```sql
-- Add to transactions table
ALTER TABLE transactions ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN recurrence_rule JSONB;
ALTER TABLE transactions ADD COLUMN parent_transaction_id INTEGER REFERENCES transactions(id);
ALTER TABLE transactions ADD COLUMN generated_at TIMESTAMP;

-- New table: recurrence_logs
CREATE TABLE recurrence_logs (
    id SERIAL PRIMARY KEY,
    parent_transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    generated_transaction_id INTEGER REFERENCES transactions(id),
    scheduled_date DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);
```

**Recurrence Rule Format (iCal RRULE):**
```json
{
  "freq": "MONTHLY",
  "interval": 1,
  "byweekday": ["MO", "FR"],
  "bymonthday": [1, 15],
  "until": "2026-12-31",
  "count": 12,
  "wkst": "MO"
}
```

**Backend Implementation:**
```python
# services/recurring_service.py
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY
from apscheduler.schedulers.asyncio import AsyncIOScheduler

class RecurringTransactionService:
    def __init__(self, db: Session):
        self.db = db
        self.scheduler = AsyncIOScheduler()

    def parse_rrule(self, rule_json: dict) -> rrule:
        freq_map = {'DAILY': DAILY, 'WEEKLY': WEEKLY, 'MONTHLY': MONTHLY, 'YEARLY': YEARLY}
        return rrule(
            freq=freq_map[rule_json['freq']],
            interval=rule_json.get('interval', 1),
            byweekday=rule_json.get('byweekday'),
            bymonthday=rule_json.get('bymonthday'),
            until=datetime.strptime(rule_json['until'], '%Y-%m-%d') if 'until' in rule_json else None,
            count=rule_json.get('count'),
            dtstart=datetime.now()
        )

    async def generate_instances(self, parent_tx: Transaction, months_ahead: int = 3):
        rule = self.parse_rrule(parent_tx.recurrence_rule)
        end_date = datetime.now() + relativedelta(months=months_ahead)
        dates = list(rule.between(datetime.now(), end_date))
        for tx_date in dates:
            existing = self.db.query(RecurrenceLog).filter(
                RecurrenceLog.parent_transaction_id == parent_tx.id,
                RecurrenceLog.scheduled_date == tx_date.date()
            ).first()
            if not existing:
                new_tx = Transaction(
                    user_id=parent_tx.user_id, type=parent_tx.type,
                    amount=parent_tx.amount, category_id=parent_tx.category_id,
                    description=f"{parent_tx.description} (Recurring)",
                    transaction_date=tx_date.date(),
                    parent_transaction_id=parent_tx.id,
                    generated_at=datetime.now()
                )
                self.db.add(new_tx)
                self.db.flush()
                log = RecurrenceLog(
                    parent_transaction_id=parent_tx.id,
                    generated_transaction_id=new_tx.id,
                    scheduled_date=tx_date.date(), status='generated'
                )
                self.db.add(log)
        self.db.commit()

    async def schedule_daily_generation(self):
        self.scheduler.add_job(self._daily_generation_task, 'cron', hour=0, minute=1)
        self.scheduler.start()

    async def _daily_generation_task(self):
        parents = self.db.query(Transaction).filter(Transaction.is_recurring == True).all()
        for parent in parents:
            await self.generate_instances(parent)
```

**Frontend Changes:**
- Add "Make Recurring" toggle to transaction form
- Recurrence rule builder UI (frequency, interval, end condition)
- Calendar view showing upcoming recurring transactions
- List of recurring templates with edit/disable options

**API Endpoints:**
```yaml
POST /api/v1/transactions/{id}/recurring
PUT /api/v1/transactions/{id}/recurring
DELETE /api/v1/transactions/{id}/recurring
GET /api/v1/recurring/upcoming
GET /api/v1/recurring/templates
```

---

### 15.3 Social Features — Friends, Shared Budgets, Leaderboards

**Database Changes:**
```sql
-- Friends system
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id),
    addressee_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

-- Shared budgets
CREATE TABLE shared_budgets (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES budgets(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shared_budget_members (
    id SERIAL PRIMARY KEY,
    shared_budget_id INTEGER NOT NULL REFERENCES shared_budgets(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    allocation DECIMAL(12,2),
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE leaderboard_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    period VARCHAR(20) NOT NULL,
    metric VARCHAR(30) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    rank INTEGER,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, period, metric, period_start)
);
```

**Backend Implementation:**
```python
# services/social_service.py
class SocialService:
    def __init__(self, db: Session):
        self.db = db

    async def send_friend_request(self, requester_id: int, addressee_id: int):
        if requester_id == addressee_id:
            raise ValueError("Cannot friend yourself")
        existing = self.db.query(Friendship).filter(
            or_(
                and_(Friendship.requester_id == requester_id, Friendship.addressee_id == addressee_id),
                and_(Friendship.requester_id == addressee_id, Friendship.addressee_id == requester_id)
            )
        ).first()
        if existing:
            raise ValueError("Friendship already exists")
        friendship = Friendship(requester_id=requester_id, addressee_id=addressee_id, status='pending')
        self.db.add(friendship)
        self.db.commit()
        await self._notify_user(addressee_id, f"New friend request from {requester_id}")
        return friendship

    async def get_friends(self, user_id: int) -> list[User]:
        friendships = self.db.query(Friendship).filter(
            or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
            Friendship.status == 'accepted'
        ).all()
        friend_ids = [f.addressee_id if f.requester_id == user_id else f.requester_id for f in friendships]
        return self.db.query(User).filter(User.id.in_(friend_ids)).all()

    async def create_shared_budget(self, owner_id: int, name: str, total_amount: Decimal, member_ids: list[int]) -> SharedBudget:
        budget = Budget(user_id=owner_id, name=name, amount=total_amount)
        self.db.add(budget)
        self.db.flush()
        shared = SharedBudget(budget_id=budget.id, owner_id=owner_id, name=name, total_amount=total_amount)
        self.db.add(shared)
        self.db.flush()
        allocation = total_amount / len(member_ids)
        for member_id in member_ids:
            member = SharedBudgetMember(
                shared_budget_id=shared.id, user_id=member_id,
                allocation=allocation, role='member' if member_id != owner_id else 'owner'
            )
            self.db.add(member)
        self.db.commit()
        return shared

    async def compute_leaderboard(self, period: str, metric: str) -> list[dict]:
        now = datetime.now()
        if period == 'weekly':
            start = now - timedelta(days=now.weekday())
            end = start + timedelta(days=6)
        elif period == 'monthly':
            start = now.replace(day=1)
            end = (start + relativedelta(months=1)) - timedelta(days=1)
        else:
            start = datetime.min
            end = now
        if metric == 'xp':
            results = self.db.query(
                XPRecord.user_id, func.sum(XPRecord.amount).label('total_xp')
            ).filter(XPRecord.created_at.between(start, end)).group_by(XPRecord.user_id).order_by(desc('total_xp')).all()
        elif metric == 'savings_rate':
            subq = self.db.query(
                Transaction.user_id,
                func.sum(case([(Transaction.type == 'income', Transaction.amount)], else_=0)).label('income'),
                func.sum(case([(Transaction.type == 'expense', Transaction.amount)], else_=0)).label('expense')
            ).filter(Transaction.transaction_date.between(start.date(), end.date())).group_by(Transaction.user_id).subquery()
            results = self.db.query(
                subq.c.user_id, ((subq.c.income - subq.c.expense) / subq.c.income * 100).label('savings_rate')
            ).filter(subq.c.income > 0).order_by(desc('savings_rate')).all()
        for rank, (user_id, value) in enumerate(results, 1):
            entry = LeaderboardEntry(
                user_id=user_id, period=period, metric=metric, value=value,
                rank=rank, period_start=start.date(), period_end=end.date()
            )
            self.db.merge(entry)
        self.db.commit()
        return results[:100]
```

**Privacy & Security Considerations:**
- Users can set profile visibility: public, friends_only, private
- Leaderboards only show users who opted in
- Shared budgets: members can only see their own spending within the shared budget
- Blocked users cannot send friend requests or see any activity
- GDPR-compliant: users can export and delete all social data

**Frontend Changes:**
- Friends page: search users, send/accept/decline requests, friend list
- Shared budget creation wizard: invite friends, set allocations
- Leaderboard page: tabs for weekly/monthly/all-time, filter by metric
- Activity feed: friends achievements (anonymized if private)

**API Endpoints:**
```yaml
POST /api/v1/social/friends/request/{user_id}
PUT /api/v1/social/friends/accept/{request_id}
DELETE /api/v1/social/friends/{friend_id}
GET /api/v1/social/friends
POST /api/v1/social/shared-budgets
GET /api/v1/social/shared-budgets
GET /api/v1/social/shared-budgets/{id}/status
PUT /api/v1/social/shared-budgets/{id}/members
GET /api/v1/social/leaderboard?period=weekly&metric=xp
GET /api/v1/social/leaderboard/me
```

---

### 15.4 AI Insights — Spending Pattern Analysis & Budget Recommendations

**Architecture:**
```
User Data (aggregated anonymized) -> AI Service (Python/FastAPI) -> Insights (stored in DB)
                           |
                    scikit-learn models + Custom heuristics
```

**Database Changes:**
```sql
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2),
    data JSONB,
    action_taken BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE spending_patterns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    pattern_type VARCHAR(50),
    avg_monthly_spend DECIMAL(12,2),
    trend_slope DECIMAL(10,6),
    seasonality JSONB,
    last_analyzed TIMESTAMP DEFAULT NOW()
);
```

**Backend Implementation:**
```python
# services/ai_service.py
import numpy as np
from sklearn.linear_model import LinearRegression
from scipy import stats

class AIInsightService:
    def __init__(self, db: Session):
        self.db = db

    async def analyze_spending_patterns(self, user_id: int) -> list[dict]:
        insights = []
        end_date = datetime.now()
        start_date = end_date - relativedelta(months=12)
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user_id, Transaction.type == 'expense',
            Transaction.transaction_date.between(start_date.date(), end_date.date())
        ).all()
        category_monthly = defaultdict(lambda: defaultdict(Decimal))
        for tx in transactions:
            month_key = tx.transaction_date.strftime('%Y-%m')
            category_monthly[tx.category_id][month_key] += tx.amount
        for category_id, monthly_data in category_monthly.items():
            if len(monthly_data) < 3:
                continue
            months = sorted(monthly_data.keys())
            amounts = [float(monthly_data[m]) for m in months]
            x = np.arange(len(months)).reshape(-1, 1)
            y = np.array(amounts)
            model = LinearRegression()
            model.fit(x, y)
            slope = model.coef_[0]
            if slope > amounts[-1] * 0.1:
                pattern_type = 'trending_up'
                insight = f"Your spending in {category_id} is increasing by {slope:.0f} per month"
            elif slope < -amounts[-1] * 0.1:
                pattern_type = 'trending_down'
                insight = f"Great job! Your {category_id} spending is decreasing"
            else:
                pattern_type = 'stable'
                insight = f"Your {category_id} spending is consistent"
            cv = np.std(amounts) / np.mean(amounts) if np.mean(amounts) > 0 else 0
            if cv > 0.5:
                pattern_type = 'seasonal'
                insight += " with high seasonal variation"
            pattern = SpendingPattern(
                user_id=user_id, category_id=category_id, pattern_type=pattern_type,
                avg_monthly_spend=sum(amounts) / len(amounts), trend_slope=slope,
                seasonality=self._compute_seasonality(months, amounts)
            )
            self.db.merge(pattern)
            insights.append({
                'type': 'spending_pattern', 'category': category_id,
                'pattern': pattern_type, 'insight': insight,
                'confidence': min(1.0, len(months) / 12)
            })
        self.db.commit()
        return insights

    async def generate_budget_recommendations(self, user_id: int) -> list[dict]:
        recommendations = []
        patterns = self.db.query(SpendingPattern).filter(SpendingPattern.user_id == user_id).all()
        for pattern in patterns:
            category = self.db.query(Category).get(pattern.category_id)
            current_budget = self.db.query(Budget).filter(
                Budget.user_id == user_id, Budget.category_id == pattern.category_id
            ).first()
            if not current_budget:
                recommended = pattern.avg_monthly_spend * Decimal('1.1')
                recommendations.append({
                    'type': 'budget_recommendation', 'category': category.name,
                    'current_budget': None, 'recommended_budget': recommended,
                    'reason': f"Based on your average monthly spend of {pattern.avg_monthly_spend}",
                    'confidence': 0.8
                })
            else:
                usage = self._get_budget_usage(user_id, pattern.category_id)
                if usage > 100:
                    recommended = pattern.avg_monthly_spend * Decimal('1.2')
                    recommendations.append({
                        'type': 'budget_recommendation', 'category': category.name,
                        'current_budget': current_budget.amount, 'recommended_budget': recommended,
                        'reason': f"You are consistently over budget. Consider increasing to {recommended}",
                        'confidence': 0.9
                    })
                elif usage < 50 and pattern.pattern_type == 'trending_down':
                    recommended = current_budget.amount * Decimal('0.9')
                    recommendations.append({
                        'type': 'budget_recommendation', 'category': category.name,
                        'current_budget': current_budget.amount, 'recommended_budget': recommended,
                        'reason': "You are well under budget and spending is decreasing",
                        'confidence': 0.7
                    })
        for rec in recommendations:
            insight = AIInsight(
                user_id=user_id, type='budget_recommendation',
                title=f"Budget recommendation: {rec['category']}",
                description=rec['reason'], confidence=rec['confidence'],
                data=rec, expires_at=datetime.now() + timedelta(days=30)
            )
            self.db.add(insight)
        self.db.commit()
        return recommendations

    async def detect_anomalies(self, user_id: int) -> list[dict]:
        anomalies = []
        recent = self.db.query(Transaction).filter(
            Transaction.user_id == user_id, Transaction.type == 'expense',
            Transaction.transaction_date >= (datetime.now() - timedelta(days=30)).date()
        ).all()
        for tx in recent:
            historical = self.db.query(Transaction.amount).filter(
                Transaction.user_id == user_id, Transaction.category_id == tx.category_id,
                Transaction.type == 'expense',
                Transaction.transaction_date < (datetime.now() - timedelta(days=30)).date()
            ).all()
            if len(historical) < 5:
                continue
            amounts = [float(h[0]) for h in historical]
            mean = np.mean(amounts)
            std = np.std(amounts)
            if std == 0:
                continue
            z_score = (float(tx.amount) - mean) / std
            if z_score > 3:
                anomalies.append({
                    'type': 'anomaly', 'transaction_id': tx.id, 'category': tx.category.name,
                    'amount': tx.amount, 'usual_average': mean, 'z_score': z_score,
                    'severity': 'high' if z_score > 4 else 'medium',
                    'message': f"Unusually high spending in {tx.category.name}: {tx.amount} (usually {mean:.2f})"
                })
        return anomalies

    async def forecast_spending(self, user_id: int, months_ahead: int = 3) -> dict:
        monthly_totals = self.db.query(
            func.date_trunc('month', Transaction.transaction_date).label('month'),
            func.sum(Transaction.amount).label('total')
        ).filter(Transaction.user_id == user_id, Transaction.type == 'expense').group_by('month').order_by('month').all()
        if len(monthly_totals) < 6:
            return {'error': 'Not enough data for forecasting'}
        amounts = [float(m.total) for m in monthly_totals]
        x = np.arange(len(amounts))
        model = LinearRegression()
        model.fit(x.reshape(-1, 1), amounts)
        future_x = np.arange(len(amounts), len(amounts) + months_ahead)
        predictions = model.predict(future_x.reshape(-1, 1))
        return {
            'forecast': [
                {'month': (datetime.now() + relativedelta(months=i+1)).strftime('%Y-%m'), 'predicted_amount': max(0, pred)}
                for i, pred in enumerate(predictions)
            ],
            'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing',
            'confidence': 0.6
        }
```

**Frontend Changes:**
- Insights dashboard card: "AI Insights" with dismissible cards
- Spending pattern visualization: trend lines per category
- Budget recommendation modal: one-click apply recommended budget
- Anomaly alerts: toast notifications for unusual spending
- Forecast chart: projected spending next 3 months

**API Endpoints:**
```yaml
GET /api/v1/ai/insights
PUT /api/v1/ai/insights/{id}/dismiss
PUT /api/v1/ai/insights/{id}/action
GET /api/v1/ai/patterns
GET /api/v1/ai/recommendations
GET /api/v1/ai/anomalies
GET /api/v1/ai/forecast?months=3
POST /api/v1/ai/analyze
```

**Privacy Note:** All AI processing happens server-side. No data leaves the platform. Users can opt out of AI insights in settings.

---

### 15.5 Export/Import — CSV/JSON/Excel Data Portability

**Supported Formats:**
- **CSV** — Simple table format, compatible with Excel/Google Sheets
- **JSON** — Full data with nested relationships
- **Excel (.xlsx)** — Multi-sheet workbook with formatting
- **QIF/OFX** — Standard financial interchange formats (for bank imports)

**Backend Implementation:**
```python
# services/export_service.py
import csv
import json
from io import StringIO, BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

class ExportService:
    def __init__(self, db: Session):
        self.db = db

    async def export_transactions_csv(self, user_id: int, start_date: date = None, end_date: date = None) -> str:
        query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        transactions = query.order_by(Transaction.transaction_date.desc()).all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description', 'Created At'])
        for tx in transactions:
            writer.writerow([
                tx.transaction_date.isoformat(), tx.type,
                tx.category.name if tx.category else '', str(tx.amount),
                tx.currency or 'USD', tx.description or '', tx.created_at.isoformat()
            ])
        return output.getvalue()

    async def export_full_json(self, user_id: int) -> dict:
        user = self.db.query(User).get(user_id)
        return {
            'export_metadata': {
                'version': '1.0', 'exported_at': datetime.now().isoformat(), 'user_id': user_id
            },
            'profile': {
                'username': user.username, 'email': user.email, 'full_name': user.full_name,
                'created_at': user.created_at.isoformat(), 'default_currency': user.default_currency
            },
            'transactions': [
                {
                    'id': tx.id, 'type': tx.type, 'amount': str(tx.amount),
                    'currency': tx.currency or 'USD',
                    'category': tx.category.name if tx.category else None,
                    'description': tx.description,
                    'transaction_date': tx.transaction_date.isoformat(),
                    'created_at': tx.created_at.isoformat(),
                    'is_recurring': tx.is_recurring, 'recurrence_rule': tx.recurrence_rule
                }
                for tx in user.transactions
            ],
            'categories': [
                {'id': cat.id, 'name': cat.name, 'type': cat.type, 'icon': cat.icon, 'color': cat.color}
                for cat in self.db.query(Category).filter(
                    or_(Category.user_id == user_id, Category.is_default == True)
                ).all()
            ],
            'gamification': {
                'current_xp': user.current_xp, 'current_level': user.current_level,
                'total_xp_earned': user.total_xp_earned,
                'achievements': [
                    {'name': ua.achievement.name, 'unlocked_at': ua.unlocked_at.isoformat()}
                    for ua in user.achievements
                ],
                'streaks': {
                    'current': user.streaks[0].current_streak if user.streaks else 0,
                    'longest': user.streaks[0].longest_streak if user.streaks else 0
                }
            }
        }

    async def export_excel(self, user_id: int) -> BytesIO:
        wb = Workbook()
        ws_tx = wb.active
        ws_tx.title = "Transactions"
        headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description']
        for col, header in enumerate(headers, 1):
            cell = ws_tx.cell(row=1, column=col, value=header)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="3B82F6", end_color="3B82F6", fill_type="solid")
            cell.alignment = Alignment(horizontal="center")
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.transaction_date.desc()).all()
        for row, tx in enumerate(transactions, 2):
            ws_tx.cell(row=row, column=1, value=tx.transaction_date)
            ws_tx.cell(row=row, column=2, value=tx.type)
            ws_tx.cell(row=row, column=3, value=tx.category.name if tx.category else '')
            ws_tx.cell(row=row, column=4, value=float(tx.amount))
            ws_tx.cell(row=row, column=5, value=tx.currency or 'USD')
            ws_tx.cell(row=row, column=6, value=tx.description or '')
            if tx.type == 'income':
                ws_tx.cell(row=row, column=2).font = Font(color="10B981")
            else:
                ws_tx.cell(row=row, column=2).font = Font(color="EF4444")
        ws_summary = wb.create_sheet("Summary")
        ws_budget = wb.create_sheet("Budgets")
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output

# services/import_service.py
class ImportService:
    def __init__(self, db: Session):
        self.db = db

    async def import_csv(self, user_id: int, csv_content: str, mapping: dict = None) -> dict:
        results = {'imported': 0, 'errors': [], 'skipped': 0}
        reader = csv.DictReader(StringIO(csv_content))
        default_mapping = {
            'date': 'Date', 'type': 'Type', 'amount': 'Amount',
            'category': 'Category', 'description': 'Description', 'currency': 'Currency'
        }
        mapping = mapping or default_mapping
        for row_num, row in enumerate(reader, 2):
            try:
                if not row.get(mapping.get('date')) or not row.get(mapping.get('amount')):
                    results['errors'].append(f"Row {row_num}: Missing required fields")
                    continue
                amount = Decimal(str(row[mapping['amount']]).replace(',', ''))
                category_name = row.get(mapping.get('category'), 'Uncategorized')
                category = self.db.query(Category).filter(
                    Category.name == category_name,
                    or_(Category.user_id == user_id, Category.is_default == True)
                ).first()
                if not category:
                    category = Category(name=category_name, type='expense', user_id=user_id)
                    self.db.add(category)
                    self.db.flush()
                tx = Transaction(
                    user_id=user_id, type=row.get(mapping.get('type'), 'expense').lower(),
                    amount=amount, category_id=category.id,
                    description=row.get(mapping.get('description')),
                    transaction_date=datetime.strptime(row[mapping['date']], '%Y-%m-%d').date(),
                    currency=row.get(mapping.get('currency'), 'USD')
                )
                self.db.add(tx)
                results['imported'] += 1
            except Exception as e:
                results['errors'].append(f"Row {row_num}: {str(e)}")
        self.db.commit()
        return results

    async def import_json(self, user_id: int, data: dict) -> dict:
        results = {'imported': {'transactions': 0, 'categories': 0, 'budgets': 0}}
        for cat_data in data.get('categories', []):
            existing = self.db.query(Category).filter(
                Category.name == cat_data['name'], Category.user_id == user_id
            ).first()
            if not existing:
                category = Category(
                    name=cat_data['name'], type=cat_data.get('type', 'expense'),
                    icon=cat_data.get('icon'), color=cat_data.get('color'), user_id=user_id
                )
                self.db.add(category)
                results['imported']['categories'] += 1
        self.db.flush()
        for tx_data in data.get('transactions', []):
            category = self.db.query(Category).filter(
                Category.name == tx_data.get('category'), Category.user_id == user_id
            ).first()
            tx = Transaction(
                user_id=user_id, type=tx_data['type'], amount=Decimal(tx_data['amount']),
                currency=tx_data.get('currency', 'USD'),
                category_id=category.id if category else None,
                description=tx_data.get('description'),
                transaction_date=datetime.fromisoformat(tx_data['transaction_date']).date(),
                is_recurring=tx_data.get('is_recurring', False),
                recurrence_rule=tx_data.get('recurrence_rule')
            )
            self.db.add(tx)
            results['imported']['transactions'] += 1
        self.db.commit()
        return results
```

**Frontend Changes:**
- Export modal: choose format (CSV/JSON/Excel), date range, categories
- Import modal: drag-and-drop CSV/JSON, field mapping UI, preview before import
- Progress indicator for large imports
- Duplicate detection option (skip if same date+amount+description)

**API Endpoints:**
```yaml
GET /api/v1/export/transactions.csv?start=2026-01-01&end=2026-05-08
GET /api/v1/export/full.json
GET /api/v1/export/report.xlsx
POST /api/v1/import/csv
POST /api/v1/import/json
POST /api/v1/import/validate
```

---

### 15.6 Notifications — Email (SendGrid) + Push (Firebase)

**Notification Types:**
1. **Budget Alerts** — Approaching limit (80%), exceeded limit
2. **Streak Reminders** — Daily push: "Log in to keep your streak alive!"
3. **Achievement Unlocks** — "You unlocked 'Savings Hero'! +150 XP"
4. **Weekly Summary** — Email digest of spending, income, budget status
5. **Recurring Transaction Reminders** — "Rent payment due tomorrow"
6. **AI Insights** — "You spent 30% more on dining this week"
7. **Friend Activity** — "John accepted your friend request"
8. **Security Alerts** — "New login from unknown device"

**Database Changes:**
```sql
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    budget_alerts BOOLEAN DEFAULT TRUE,
    streak_reminders BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    recurring_reminders BOOLEAN DEFAULT TRUE,
    ai_insights BOOLEAN DEFAULT TRUE,
    social_notifications BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

**Backend Implementation:**
```python
# services/notification_service.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import firebase_admin
from firebase_admin import messaging

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.sendgrid = SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
        if not firebase_admin._apps:
            firebase_admin.initialize_app()

    async def send_notification(self, user_id: int, notification_type: str, title: str, body: str, data: dict = None) -> dict:
        prefs = self.db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).first()
        if not prefs:
            prefs = NotificationPreference(user_id=user_id)
            self.db.add(prefs)
            self.db.commit()
        type_enabled = getattr(prefs, f"{notification_type}_enabled", True)
        if not type_enabled:
            return {'sent': False, 'reason': 'disabled_by_user'}
        if self._is_quiet_hours(prefs):
            return {'sent': False, 'reason': 'quiet_hours'}
        notif = Notification(
            user_id=user_id, type=notification_type, title=title, body=body,
            data=data or {}, expires_at=datetime.now() + timedelta(days=7)
        )
        self.db.add(notif)
        self.db.flush()
        results = {'notification_id': notif.id, 'channels': {}}
        if prefs.email_enabled:
            try:
                await self._send_email(user_id, title, body, data)
                notif.email_sent = True
                notif.email_sent_at = datetime.now()
                results['channels']['email'] = 'sent'
            except Exception as e:
                results['channels']['email'] = f'failed: {str(e)}'
        if prefs.push_enabled:
            try:
                push_result = await self._send_push(user_id, title, body, data)
                notif.push_sent = True
                notif.push_sent_at = datetime.now()
                results['channels']['push'] = push_result
            except Exception as e:
                results['channels']['push'] = f'failed: {str(e)}'
        self.db.commit()
        return results

    async def _send_email(self, user_id: int, title: str, body: str, data: dict):
        user = self.db.query(User).get(user_id)
        message = Mail(
            from_email='notifications@finquest.io', to_emails=user.email,
            subject=title, html_content=self._render_email_template(title, body, data)
        )
        response = self.sendgrid.send(message)
        return response.status_code

    async def _send_push(self, user_id: int, title: str, body: str, data: dict):
        tokens = self.db.query(PushToken).filter(
            PushToken.user_id == user_id, PushToken.is_active == True
        ).all()
        if not tokens:
            return 'no_tokens'
        for token in tokens:
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
                token=token.token
            )
            try:
                response = messaging.send(message)
                token.last_used = datetime.now()
            except messaging.UnregisteredError:
                token.is_active = False
        self.db.commit()
        return 'sent'

    def _is_quiet_hours(self, prefs: NotificationPreference) -> bool:
        if not prefs.quiet_hours_start or not prefs.quiet_hours_end:
            return False
        now = datetime.now().time()
        if prefs.quiet_hours_start < prefs.quiet_hours_end:
            return prefs.quiet_hours_start <= now <= prefs.quiet_hours_end
        else:
            return now >= prefs.quiet_hours_start or now <= prefs.quiet_hours_end

    async def schedule_streak_reminder(self, user_id: int):
        streak = self.db.query(Streak).filter(Streak.user_id == user_id).first()
        if not streak or streak.last_login_date == date.today():
            return
        await self.send_notification(
            user_id=user_id, notification_type='streak_reminders',
            title='Keep Your Streak Alive!',
            body=f'You have a {streak.current_streak}-day streak. Log in today to keep it going!',
            data={'action': 'open_app', 'screen': 'dashboard'}
        )

    async def send_weekly_summary(self, user_id: int):
        end = datetime.now()
        start = end - timedelta(days=7)
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date.between(start.date(), end.date())
        ).all()
        income = sum(tx.amount for tx in transactions if tx.type == 'income')
        expenses = sum(tx.amount for tx in transactions if tx.type == 'expense')
        category_spending = defaultdict(Decimal)
        for tx in transactions:
            if tx.type == 'expense':
                category_spending[tx.category.name] += tx.amount
        top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:5]
        await self.send_notification(
            user_id=user_id, notification_type='weekly_summary',
            title='Your Weekly Financial Summary',
            body=f'Income: {income}, Expenses: {expenses}, Net: {income - expenses}',
            data={
                'income': str(income), 'expenses': str(expenses),
                'top_categories': json.dumps(top_categories), 'template': 'weekly_summary'
            }
        )
```

**Frontend Changes:**
- Notification bell icon in navbar with unread count badge
- Notification drawer/sidebar: list of all notifications, mark as read/dismiss
- Settings page: notification preferences toggles, quiet hours time picker
- Push notification permission request on first visit
- Service worker for background push handling

**API Endpoints:**
```yaml
GET /api/v1/notifications
PUT /api/v1/notifications/{id}/read
PUT /api/v1/notifications/{id}/dismiss
PUT /api/v1/notifications/read-all
DELETE /api/v1/notifications/{id}
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences
POST /api/v1/notifications/push-token
DELETE /api/v1/notifications/push-token/{token}
```

---

### 15.7 Dark Mode Auto — System Preference Detection & Time-Based Switching

**Implementation Strategy:**
```
Priority Order:
1. User explicit preference (saved in DB)
2. System preference (media query: prefers-color-scheme)
3. Time-based (sunset/sunrise at user's location)
4. Default: light mode

Modes:
- manual    -> User toggles, saved to DB
- system    -> Follows OS preference
- auto      -> Time-based with location
- schedule  -> Custom time range (e.g., 8PM - 6AM)
```

**Database Changes:**
```sql
ALTER TABLE user_settings ADD COLUMN theme_mode VARCHAR(20) DEFAULT 'system';
ALTER TABLE user_settings ADD COLUMN manual_theme VARCHAR(10) DEFAULT 'light';
ALTER TABLE user_settings ADD COLUMN schedule_start TIME;
ALTER TABLE user_settings ADD COLUMN schedule_end TIME;
ALTER TABLE user_settings ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE user_settings ADD COLUMN longitude DECIMAL(11, 8);
```

**Backend Implementation:**
```python
# services/theme_service.py
from suntime import Sun

class ThemeService:
    def __init__(self, db: Session):
        self.db = db

    def get_effective_theme(self, user_id: int, system_pref: str = 'light') -> str:
        settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            return system_pref
        mode = settings.theme_mode
        if mode == 'manual':
            return settings.manual_theme or 'light'
        elif mode == 'system':
            return system_pref
        elif mode == 'auto':
            return self._get_time_based_theme(settings)
        elif mode == 'schedule':
            return self._get_scheduled_theme(settings)
        return 'light'

    def _get_time_based_theme(self, settings: UserSettings) -> str:
        if settings.latitude is None or settings.longitude is None:
            hour = datetime.now().hour
            return 'dark' if hour >= 20 or hour < 6 else 'light'
        sun = Sun(settings.latitude, settings.longitude)
        try:
            sunrise = sun.get_local_sunrise_time()
            sunset = sun.get_local_sunset_time()
            now = datetime.now(sunrise.tzinfo)
            if sunrise <= now <= sunset:
                return 'light'
            else:
                return 'dark'
        except:
            hour = datetime.now().hour
            return 'dark' if hour >= 20 or hour < 6 else 'light'

    def _get_scheduled_theme(self, settings: UserSettings) -> str:
        now = datetime.now().time()
        start = settings.schedule_start
        end = settings.schedule_end
        if not start or not end:
            return 'light'
        if start > end:
            return 'dark' if now >= start or now <= end else 'light'
        else:
            return 'dark' if start <= now <= end else 'light'

    async def update_theme_preference(self, user_id: int, mode: str, manual_theme: str = None,
                                       schedule_start: str = None, schedule_end: str = None,
                                       latitude: float = None, longitude: float = None):
        settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            settings = UserSettings(user_id=user_id)
            self.db.add(settings)
        settings.theme_mode = mode
        if manual_theme:
            settings.manual_theme = manual_theme
        if schedule_start:
            settings.schedule_start = datetime.strptime(schedule_start, '%H:%M').time()
        if schedule_end:
            settings.schedule_end = datetime.strptime(schedule_end, '%H:%M').time()
        if latitude is not None:
            settings.latitude = latitude
        if longitude is not None:
            settings.longitude = longitude
        self.db.commit()
        return settings
```

**Frontend Implementation:**
```typescript
// hooks/useAutoTheme.ts
import { useEffect, useState } from 'react';

export function useAutoTheme(userSettings: UserSettings | null) {
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!userSettings) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    const mode = userSettings.theme_mode;
    if (mode === 'manual') {
      setEffectiveTheme(userSettings.manual_theme as 'light' | 'dark');
    } else if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (mode === 'auto' || mode === 'schedule') {
      const checkTheme = () => {
        fetch('/api/v1/users/me/theme')
          .then(res => res.json())
          .then(data => setEffectiveTheme(data.theme));
      };
      checkTheme();
      const interval = setInterval(checkTheme, 60000);
      return () => clearInterval(interval);
    }
  }, [userSettings]);

  return effectiveTheme;
}

// ThemeContext.tsx — updated
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mode, setMode] = useState<string>('system');
  const effectiveTheme = useAutoTheme(user?.settings || null);

  useEffect(() => {
    setTheme(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [theme]);

  const toggleManual = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setMode('manual');
    fetch('/api/v1/users/me/theme', {
      method: 'PUT',
      body: JSON.stringify({ mode: 'manual', manual_theme: newTheme })
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleManual }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Settings UI:**
```
Theme Settings
├── Mode Selection (Radio cards)
│   ├── Manual        -> Show light/dark toggle
│   ├── System        -> Follow OS (no extra options)
│   ├── Auto (Sun)    -> Request location permission
│   │                   └── Show: "Sunset: 7:42 PM, Sunrise: 6:15 AM"
│   └── Schedule      -> Time pickers: Start [20:00] End [06:00]
└── Preview Card
    └── Shows current theme with sample components
```

**API Endpoints:**
```yaml
GET /api/v1/users/me/theme
PUT /api/v1/users/me/theme
  body: {
    mode: "manual" | "system" | "auto" | "schedule",
    manual_theme: "light" | "dark",
    schedule_start: "20:00",
    schedule_end: "06:00",
    latitude: 6.5244,
    longitude: 3.3792
  }
```

**Additional Frontend Considerations:**
- Smooth CSS transitions between themes (300ms ease)
- color-scheme: light dark in CSS for native form controls
- theme-color meta tag updates for mobile browser chrome
- Respect prefers-reduced-motion for theme transitions
- Store last known theme to prevent flash on page load

---

**End of System Prompt**  
*Version: 1.0*  
*Last Updated: 2026-05-08*  
*Stack: React 18 + TypeScript + FastAPI + SQLAlchemy + Tailwind CSS*
