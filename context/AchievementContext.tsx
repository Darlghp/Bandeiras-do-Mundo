
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';

export interface Achievement {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  category: 'explorer' | 'quiz' | 'collector' | 'designer';
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  viewedFlags: string[];
  quizzesCompleted: number;
  perfectQuizzes: number;
  maxStreak: number;
  favoritesCount: number;
  flagsDesigned: number;
}

interface AchievementContextType {
  achievements: Achievement[];
  stats: UserStats;
  unlockAchievement: (id: string) => void;
  trackFlagView: (cca3: string) => void;
  trackQuizResult: (score: number, total: number, streak: number) => void;
  trackFavorite: (count: number) => void;
  trackDesign: () => void;
  notificationQueue: Achievement[];
  popNotification: () => void;
}

const INITIAL_STATS: UserStats = {
  viewedFlags: [],
  quizzesCompleted: 0,
  perfectQuizzes: 0,
  maxStreak: 0,
  favoritesCount: 0,
  flagsDesigned: 0,
};

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('user_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATS, ...parsed };
      }
    } catch (e) {
      console.error("Error loading user stats from storage", e);
    }
    return INITIAL_STATS;
  });

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading achievements from storage", e);
    }
    return [];
  });

  const notifiedIdsRef = useRef<Set<string>>(new Set(unlockedIds));
  const [notificationQueue, setNotificationQueue] = useState<Achievement[]>([]);

  const achievementsBase = useMemo(() => [
    { id: 'first_steps', titleKey: 'achFirstStepsTitle', descKey: 'achFirstStepsDesc', icon: '👣', category: 'explorer' as const, maxProgress: 1 },
    { id: 'world_traveler', titleKey: 'achWorldTravelerTitle', descKey: 'achWorldTravelerDesc', icon: '🌍', category: 'explorer' as const, maxProgress: 50 },
    { id: 'vexillology_expert', titleKey: 'achVexExpertTitle', descKey: 'achVexExpertDesc', icon: '🎓', category: 'explorer' as const, maxProgress: 150 },
    { id: 'quiz_starter', titleKey: 'achQuizStarterTitle', descKey: 'achQuizStarterDesc', icon: '📝', category: 'quiz' as const, maxProgress: 1 },
    { id: 'perfect_score', titleKey: 'achPerfectScoreTitle', descKey: 'achPerfectScoreDesc', icon: '✨', category: 'quiz' as const, maxProgress: 1 },
    { id: 'streak_master', titleKey: 'achStreakMasterTitle', descKey: 'achStreakMasterDesc', icon: '🔥', category: 'quiz' as const, maxProgress: 10 },
    { id: 'curator', titleKey: 'achCuratorTitle', descKey: 'achCuratorDesc', icon: '💖', category: 'collector' as const, maxProgress: 10 },
    { id: 'flag_artist', titleKey: 'achArtistTitle', descKey: 'achArtistDesc', icon: '🎨', category: 'designer' as const, maxProgress: 1 },
  ], []);

  const achievementsList: Achievement[] = useMemo(() => achievementsBase.map(a => ({
    ...a,
    isUnlocked: unlockedIds.includes(a.id),
    progress: a.id === 'curator' ? stats.favoritesCount :
              a.id === 'flag_artist' ? stats.flagsDesigned :
              a.id === 'quiz_starter' ? stats.quizzesCompleted :
              a.id === 'perfect_score' ? stats.perfectQuizzes :
              a.id === 'streak_master' ? stats.maxStreak :
              a.id === 'first_steps' || a.id === 'world_traveler' || a.id === 'vexillology_expert' ? stats.viewedFlags.length : 0
  })), [achievementsBase, unlockedIds, stats]);

  useEffect(() => {
    localStorage.setItem('user_stats', JSON.stringify(stats));
    localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedIds));
  }, [stats, unlockedIds]);

  useEffect(() => {
    const checkUnlocks = () => {
      const toUnlock: string[] = [];
      
      if (stats.viewedFlags.length >= 1) toUnlock.push('first_steps');
      if (stats.viewedFlags.length >= 50) toUnlock.push('world_traveler');
      if (stats.viewedFlags.length >= 150) toUnlock.push('vexillology_expert');
      if (stats.quizzesCompleted >= 1) toUnlock.push('quiz_starter');
      if (stats.perfectQuizzes >= 1) toUnlock.push('perfect_score');
      if (stats.maxStreak >= 10) toUnlock.push('streak_master');
      if (stats.favoritesCount >= 10) toUnlock.push('curator');
      if (stats.flagsDesigned >= 1) toUnlock.push('flag_artist');

      const newUnlocks = toUnlock.filter(id => !notifiedIdsRef.current.has(id));
      
      if (newUnlocks.length > 0) {
        newUnlocks.forEach(id => notifiedIdsRef.current.add(id));
        setUnlockedIds(Array.from(notifiedIdsRef.current));
        
        const newAchObjs = newUnlocks
          .map(id => {
            const base = achievementsBase.find(a => a.id === id);
            if (!base) return null;
            return {
              ...base,
              isUnlocked: true,
              progress: base.maxProgress,
            };
          })
          .filter((a): a is Achievement => a !== null);
          
        setNotificationQueue(prev => [...prev, ...newAchObjs]);
      }
    };

    checkUnlocks();
  }, [stats, achievementsBase]);

  const trackFlagView = useCallback((cca3: string) => {
    setStats(prev => {
      if (prev.viewedFlags.includes(cca3)) return prev;
      return { ...prev, viewedFlags: [...prev.viewedFlags, cca3] };
    });
  }, []);

  const trackQuizResult = useCallback((score: number, total: number, streak: number) => {
    setStats(prev => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1,
      perfectQuizzes: score === total ? prev.perfectQuizzes + 1 : prev.perfectQuizzes,
      maxStreak: Math.max(prev.maxStreak, streak)
    }));
  }, []);

  const trackFavorite = useCallback((count: number) => {
    setStats(prev => ({ ...prev, favoritesCount: count }));
  }, []);

  const trackDesign = useCallback(() => {
    setStats(prev => ({ ...prev, flagsDesigned: prev.flagsDesigned + 1 }));
  }, []);

  const popNotification = useCallback(() => {
    setNotificationQueue(prev => prev.slice(1));
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    if (!notifiedIdsRef.current.has(id)) {
      notifiedIdsRef.current.add(id);
      setUnlockedIds(Array.from(notifiedIdsRef.current));
    }
  }, []);

  return (
    <AchievementContext.Provider value={{ 
      achievements: achievementsList, 
      stats, 
      unlockAchievement,
      trackFlagView,
      trackQuizResult,
      trackFavorite,
      trackDesign,
      notificationQueue,
      popNotification
    }}>
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) throw new Error('useAchievements must be used within AchievementProvider');
  return context;
};
