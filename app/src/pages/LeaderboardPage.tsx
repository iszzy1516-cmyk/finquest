// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { gamificationApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { BarChart3, Crown, Medal, Award, Flame, Star, Trophy } from "lucide-react";

export function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["gamification", "leaderboard"],
    queryFn: () => gamificationApi.leaderboard("all", "xp"),
  });
  const { data: myProgress } = useQuery({
    queryKey: ["gamification", "progress"],
    queryFn: () => gamificationApi.progress(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>Leaderboard</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>See how you rank against other players</p>
      </div>

      {/* My Stats Card */}
      {myProgress && (
        <Card className="border p-5" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))", borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your Stats</p>
              <div className="flex items-center gap-6 mt-1">
                <div><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Level</p><p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{myProgress.current_level}</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-secondary)" }}>XP</p><p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{myProgress.total_xp_earned}</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Streak</p><div className="flex items-center gap-1"><Flame className="w-4 h-4 text-amber-500 animate-flame" /><p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{myProgress.current_streak}</p></div></div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card className="border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--divider-color)" }}>
                <th className="text-left text-xs font-medium px-4 py-3 w-16" style={{ color: "var(--text-secondary)" }}>Rank</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-secondary)" }}>Player</th>
                <th className="text-center text-xs font-medium px-4 py-3" style={{ color: "var(--text-secondary)" }}>Level</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: "var(--text-secondary)" }}>XP</th>
                <th className="text-center text-xs font-medium px-4 py-3" style={{ color: "var(--text-secondary)" }}>Streak</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--divider-color)" }}>
                    <td colSpan={5} className="px-4 py-4"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: "var(--bg-surface-elevated)" }} /></td>
                  </tr>
                ))
              ) : leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry) => {
                  const rankIcon = entry.rank === 1 ? <Crown className="w-5 h-5 text-amber-500" /> : entry.rank === 2 ? <Medal className="w-5 h-5 text-gray-400" /> : entry.rank === 3 ? <Award className="w-5 h-5 text-amber-600" /> : <span className="text-sm font-mono text-center w-5" style={{ color: "var(--text-secondary)" }}>{entry.rank}</span>;

                  return (
                    <tr key={entry.user_id} className="transition-colors" style={{ borderBottom: "1px solid var(--divider-color)" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td className="px-4 py-3"><div className="flex items-center justify-center w-8 h-8">{rankIcon}</div></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">{entry.name?.[0]?.toUpperCase() || "?"}</div>
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{entry.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-500 text-xs font-medium"><Trophy className="w-3 h-3" />Lv.{entry.level}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-sm font-mono font-bold" style={{ color: "var(--text-primary)" }}>{entry.xp}</span></td>
                      <td className="px-4 py-3 text-center">{entry.streak > 0 ? <span className="inline-flex items-center gap-1 text-amber-500 text-xs"><Flame className="w-3 h-3 animate-flame" />{entry.streak}</span> : <span className="text-xs" style={{ color: "var(--text-secondary)" }}>-</span>}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--text-secondary)" }} />
                    <p style={{ color: "var(--text-secondary)" }}>No leaderboard data yet</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Start earning XP to appear on the leaderboard</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
