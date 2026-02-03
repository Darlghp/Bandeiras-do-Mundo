
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Achievement {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  category: 'explorer' | 'quiz' | 'collector' | 'designer';
  rarity: Rarity;
  xp: number;
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
  totalXP: number;
}

interface AchievementContextType {
  achievements: Achievement[];
  stats: UserStats;
  level: number;
  xpToNextLevel: number;
  levelProgress: number;
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
  totalXP: 0,
};

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('user_stats_v2');
      if (saved) return { ...INITIAL_STATS, ...JSON.parse(saved) };
    } catch (e) {}
    return INITIAL_STATS;
  });

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_achievements_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const notifiedIdsRef = useRef<Set<string>>(new Set(unlockedIds));
  const [notificationQueue, setNotificationQueue] = useState<Achievement[]>([]);

  const achievementsBase = useMemo((): Omit<Achievement, 'isUnlocked' | 'progress'>[] => [
    { id: 'first_steps', titleKey: 'achFirstStepsTitle', descKey: 'achFirstStepsDesc', icon: '👣', category: 'explorer', rarity: 'Common', xp: 100, maxProgress: 1 },
    { id: 'world_traveler', titleKey: 'achWorldTravelerTitle', descKey: 'achWorldTravelerDesc', icon: '🌍', category: 'explorer', rarity: 'Rare', xp: 250, maxProgress: 50 },
    { id: 'vexillology_expert', titleKey: 'achVexExpertTitle', descKey: 'achVexExpertDesc', icon: '🎓', category: 'explorer', rarity: 'Epic', xp: 500, maxProgress: 150 },
    { id: 'master_explorer', titleKey: 'achMasterExplorerTitle', descKey: 'achMasterExplorerDesc', icon: '👑', category: 'explorer', rarity: 'Legendary', xp: 1000, maxProgress: 240 },
    
    { id: 'quiz_starter', titleKey: 'achQuizStarterTitle', descKey: 'achQuizStarterDesc', icon: '📝', category: 'quiz', rarity: 'Common', xp: 100, maxProgress: 1 },
    { id: 'streak_master', titleKey: 'achStreakMasterTitle', descKey: 'achStreakMasterDesc', icon: '🔥', category: 'quiz', rarity: 'Rare', xp: 250, maxProgress: 10 },
    { id: 'perfect_score', titleKey: 'achPerfectScoreTitle', descKey: 'achPerfectScoreDesc', icon: '✨', category: 'quiz', rarity: 'Epic', xp: 500, maxProgress: 1 },
    
    { id: 'curator', titleKey: 'achCuratorTitle', descKey: 'achCuratorDesc', icon: '💖', category: 'collector', rarity: 'Rare', xp: 250, maxProgress: 10 },
    { id: 'flag_artist', titleKey: 'achArtistTitle', descKey: 'achArtistDesc', icon: '🎨', category: 'designer', rarity: 'Rare', xp: 250, maxProgress: 1 },
  ], []);

  const achievementsList: Achievement[] = useMemo(() => achievementsBase.map(a => ({
    ...a,
    isUnlocked: unlockedIds.includes(a.id),
    progress: a.id === 'curator' ? stats.favoritesCount :
              a.id === 'flag_artist' ? stats.flagsDesigned :
              a.id === 'quiz_starter' ? stats.quizzesCompleted :
              a.id === 'perfect_score' ? stats.perfectQuizzes :
              a.id === 'streak_master' ? stats.maxStreak :
              stats.viewedFlags.length
  })), [achievementsBase, unlockedIds, stats]);

  // Level Logic
  const level = useMemo(() => Math.floor(Math.sqrt(stats.totalXP / 100)) + 1, [stats.totalXP]);
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  const levelProgress = ((stats.totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  useEffect(() => {
    localStorage.setItem('user_stats_v2', JSON.stringify(stats));
    localStorage.setItem('unlocked_achievements_v2', JSON.stringify(unlockedIds));
  }, [stats, unlockedIds]);

  useEffect(() => {
    const toUnlock: {id: string, xp: number}[] = [];
    if (stats.viewedFlags.length >= 1) toUnlock.push({id: 'first_steps', xp: 100});
    if (stats.viewedFlags.length >= 50) toUnlock.push({id: 'world_traveler', xp: 250});
    if (stats.viewedFlags.length >= 150) toUnlock.push({id: 'vexillology_expert', xp: 500});
    if (stats.viewedFlags.length >= 240) toUnlock.push({id: 'master_explorer', xp: 1000});
    if (stats.quizzesCompleted >= 1) toUnlock.push({id: 'quiz_starter', xp: 100});
    if (stats.perfectQuizzes >= 1) toUnlock.push({id: 'perfect_score', xp: 500});
    if (stats.maxStreak >= 10) toUnlock.push({id: 'streak_master', xp: 250});
    if (stats.favoritesCount >= 10) toUnlock.push({id: 'curator', xp: 250});
    if (stats.flagsDesigned >= 1) toUnlock.push({id: 'flag_artist', xp: 250});

    const newUnlocks = toUnlock.filter(item => !notifiedIdsRef.current.has(item.id));
    
    if (newUnlocks.length > 0) {
      let earnedXP = 0;
      newUnlocks.forEach(item => {
        notifiedIdsRef.current.add(item.id);
        earnedXP += item.xp;
      });

      setUnlockedIds(Array.from(notifiedIdsRef.current));
      setStats(prev => ({ ...prev, totalXP: prev.totalXP + earnedXP }));
      
      const newAchObjs = newUnlocks.map(item => {
        const base = achievementsBase.find(a => a.id === item.id);
        return { ...base!, isUnlocked: true, progress: base!.maxProgress };
      });
      setNotificationQueue(prev => [...prev, ...newAchObjs]);
    }
  }, [stats.viewedFlags.length, stats.quizzesCompleted, stats.perfectQuizzes, stats.maxStreak, stats.favoritesCount, stats.flagsDesigned, achievementsBase]);

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
      maxStreak: Math.max(prev.maxStreak, streak),
      totalXP: prev.totalXP + (score * 5) // Bonus XP for each correct answer
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
      level,
      xpToNextLevel: xpForNextLevel,
      levelProgress,
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
