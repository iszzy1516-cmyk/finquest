import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gamificationApi } from "@/services/api";
import type { ReactNode } from "react";

interface GamificationState {
  xpGained: number | null;
  achievementsUnlocked: Array<{ id: number; name: string; description: string; icon: string; xpReward: number }>;
  levelUp: boolean;
  showXpFloat: boolean;
  xpSource: string | null;
}

interface GamificationContextType {
  state: GamificationState;
  triggerXpGain: (amount: number, source: string) => void;
  triggerAchievement: (achievement: { id: number; name: string; description: string; icon: string; xpReward: number }) => void;
  triggerLevelUp: () => void;
  dismissXp: () => void;
  dismissAchievement: (id?: number) => void;
  dismissLevelUp: () => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>({
    xpGained: null,
    achievementsUnlocked: [],
    levelUp: false,
    showXpFloat: false,
    xpSource: null,
  });

  const queryClient = useQueryClient();

  const processDailyMutation = useMutation({
    mutationFn: () => gamificationApi.processDaily(),
    onSuccess: (data) => {
      if (data.xp_gained > 0) {
        triggerXpGain(data.xp_gained, "daily");
      }
      if (data.level_up) {
        triggerLevelUp();
      }
      if (data.achievements_unlocked.length > 0) {
        data.achievements_unlocked.forEach(triggerAchievement);
      }
      queryClient.invalidateQueries({ queryKey: ["gamification", "progress"] });
    },
  });

  const triggerXpGain = useCallback((amount: number, source: string) => {
    setState(prev => ({
      ...prev,
      xpGained: amount,
      showXpFloat: true,
      xpSource: source,
    }));
    setTimeout(() => {
      setState(prev => ({ ...prev, showXpFloat: false }));
    }, 2000);
  }, []);

  const triggerAchievement = useCallback((achievement: { id: number; name: string; description: string; icon: string; xpReward: number }) => {
    setState(prev => ({
      ...prev,
      achievementsUnlocked: [...prev.achievementsUnlocked, achievement],
    }));
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        achievementsUnlocked: prev.achievementsUnlocked.filter(a => a.id !== achievement.id),
      }));
    }, 6000);
  }, []);

  const triggerLevelUp = useCallback(() => {
    setState(prev => ({ ...prev, levelUp: true }));
  }, []);

  const dismissXp = useCallback(() => {
    setState(prev => ({ ...prev, showXpFloat: false }));
  }, []);

  const dismissAchievement = useCallback((_id?: number) => {
    setState(prev => ({
      ...prev,
      achievementsUnlocked: _id ? prev.achievementsUnlocked.filter(a => a.id !== _id) : prev.achievementsUnlocked,
    }));
  }, []);

  const dismissLevelUp = useCallback(() => {
    setState(prev => ({ ...prev, levelUp: false }));
  }, []);

  useEffect(() => {
    processDailyMutation.mutate();
  }, []);

  return (
    <GamificationContext.Provider value={{
      state,
      triggerXpGain,
      triggerAchievement,
      triggerLevelUp,
      dismissXp,
      dismissAchievement,
      dismissLevelUp,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used within GamificationProvider");
  return context;
}
