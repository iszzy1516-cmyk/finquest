import { Routes, Route } from 'react-router'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import { Dashboard } from './pages/Dashboard'
import { TransactionsPage } from './pages/TransactionsPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { GoalsPage } from './pages/GoalsPage'
import { AchievementsPage } from './pages/AchievementsPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import Profile from './pages/Profile'
import { GamificationProvider } from './contexts/GamificationContext'

export default function App() {
  return (
    <GamificationProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </GamificationProvider>
  )
}
