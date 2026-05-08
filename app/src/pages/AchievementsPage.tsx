// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gamificationApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import {
  Trophy, Star, Lock, CheckCircle, Flame, Crown,
  PiggyBank, Target, Flag, Footprints, Receipt, Compass,
  Award, Hash, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints, Receipt, Compass, Flame, Crown, PiggyBank, Banknote: PiggyBank,
  Star, Trophy, Target, Flag, CheckCircle, Award, Hash, Zap,
};

type FilterTab = "all" | "unlocked" | "locked";

export function AchievementsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const { data: achievements, isLoading } = useQuery({
    queryKey: ["gamification", "achievements"],
    queryFn: () => gamificationApi.achievements(),
  });
  const { data: progress } = useQuery({
    queryKey: ["gamification", "progress"],
    queryFn: () => gamificationApi.progress(),
  });

  const filters: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unlocked", label: "Unlocked" },
    { key: "locked", label: "Locked" },
  ];

  const unlocked = achievements?.unlocked || [];
  const locked = achievements?.locked || [];

  const filteredAchievements = filter === "all" ? [...unlocked, ...locked] : filter === "unlocked" ? unlocked : locked;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>Achievements</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {unlocked.length} / {(unlocked.length + locked.length)} unlocked
            {progress && ` - ${progress.total_xp_earned} XP earned`}
          </p>
        </div>
        {progress && (
          <div className="flex items-center gap-3 rounded-lg px-4 py-2 border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
            <Star className="w-5 h-5 text-violet-500" />
            <div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Total XP</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>{progress.total_xp_earned}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              filter === f.key ? "bg-blue-500 text-white border-blue-500" : "border-transparent hover:border-[var(--border-color)]"
            )}
            style={filter !== f.key ? { backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" } : {}}
          >{f.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-surface)" }} />)}
        </div>
      ) : filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((ach: any) => {
            const isUnlocked = "unlocked_at" in ach;
            const IconComp = iconMap[ach.icon] || Trophy;

            return (
              <Card
                key={ach.id}
                className="relative p-5 transition-all hover:scale-[1.02] overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: isUnlocked ? "var(--accent-amber)" : "var(--border-color)",
                  opacity: isUnlocked ? 1 : 0.7,
                }}
              >
                {/* XP Badge */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-500 text-[10px] font-bold">
                  +{ach.xp_reward} XP
                </div>

                {/* Icon */}
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-3", isUnlocked ? "bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20" : "bg-[var(--bg-badge)]")}>
                  {isUnlocked ? <IconComp className="w-7 h-7 text-white" /> : <Lock className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />}
                </div>

                <h3 className="text-sm font-semibold mb-1" style={{ color: isUnlocked ? "var(--text-primary)" : "var(--text-secondary)" }}>{ach.name}</h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{ach.description}</p>

                {isUnlocked ? (
                  <div className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: "var(--text-secondary)" }}>Progress</span>
                      <span className="text-violet-500">{ach.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${ach.progress_percent}%` }} />
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{ach.progress} / {ach.condition_value}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border p-12 text-center" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "var(--text-secondary)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>No achievements in this category</p>
        </Card>
      )}
    </div>
  );
}
