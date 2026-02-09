
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
  lastUpdated?: number;
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
  exportProgress: () => void;
  importProgress: (jsonData: string) => boolean;
  resetProgress: () => void;
}

const INITIAL_STATS: UserStats = {
  viewedFlags: [],
  quizzesCompleted: 0,
  perfectQuizzes: 0,
  maxStreak: 0,
  favoritesCount: 0,
  flagsDesigned: 0,
  totalXP: 0,
  lastUpdated: Date.now(),
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
    // EXPLORER
    { id: 'first_steps', titleKey: 'achFirstStepsTitle', descKey: 'achFirstStepsDesc', icon: '👣', category: 'explorer', rarity: 'Common', xp: 100, maxProgress: 1 },
    { id: 'world_traveler', titleKey: 'achWorldTravelerTitle', descKey: 'achWorldTravelerDesc', icon: '🌍', category: 'explorer', rarity: 'Rare', xp: 250, maxProgress: 50 },
    { id: 'century_club', titleKey: 'achCenturyClubTitle', descKey: 'achCenturyClubDesc', icon: '💯', category: 'explorer', rarity: 'Rare', xp: 300, maxProgress: 100 },
    { id: 'vexillology_expert', titleKey: 'achVexExpertTitle', descKey: 'achVexExpertDesc', icon: '🎓', category: 'explorer', rarity: 'Epic', xp: 500, maxProgress: 150 },
    { id: 'master_explorer', titleKey: 'achMasterExplorerTitle', descKey: 'achMasterExplorerDesc', icon: '👑', category: 'explorer', rarity: 'Legendary', xp: 1000, maxProgress: 240 },
    
    // QUIZ
    { id: 'quiz_starter', titleKey: 'achQuizStarterTitle', descKey: 'achQuizStarterDesc', icon: '📝', category: 'quiz', rarity: 'Common', xp: 100, maxProgress: 1 },
    { id: 'quiz_scholar', titleKey: 'achQuizScholarTitle', descKey: 'achQuizScholarDesc', icon: '📚', category: 'quiz', rarity: 'Common', xp: 200, maxProgress: 10 },
    { id: 'quiz_marathoner', titleKey: 'achQuizMarathonerTitle', descKey: 'achQuizMarathonerDesc', icon: '🏃', category: 'quiz', rarity: 'Epic', xp: 600, maxProgress: 50 },
    { id: 'streak_master', titleKey: 'achStreakMasterTitle', descKey: 'achStreakMasterDesc', icon: '🔥', category: 'quiz', rarity: 'Rare', xp: 250, maxProgress: 10 },
    { id: 'streak_godlike', titleKey: 'achStreakGodlikeTitle', descKey: 'achStreakGodlikeDesc', icon: '⚡', category: 'quiz', rarity: 'Legendary', xp: 1200, maxProgress: 25 },
    { id: 'perfect_score', titleKey: 'achPerfectScoreTitle', descKey: 'achPerfectScoreDesc', icon: '✨', category: 'quiz', rarity: 'Epic', xp: 500, maxProgress: 1 },
    { id: 'perfect_legend', titleKey: 'achPerfectLegendTitle', descKey: 'achPerfectLegendDesc', icon: '🏆', category: 'quiz', rarity: 'Legendary', xp: 1500, maxProgress: 10 },
    
    // COLLECTOR
    { id: 'curator', titleKey: 'achCuratorTitle', descKey: 'achCuratorDesc', icon: '💖', category: 'collector', rarity: 'Rare', xp: 250, maxProgress: 10 },
    { id: 'collector_pro', titleKey: 'achCollectorProTitle', descKey: 'achCollectorProDesc', icon: '💎', category: 'collector', rarity: 'Epic', xp: 500, maxProgress: 25 },
    { id: 'world_curator', titleKey: 'achWorldCuratorTitle', descKey: 'achWorldCuratorDesc', icon: '🏛️', category: 'collector', rarity: 'Legendary', xp: 1000, maxProgress: 50 },
    
    // DESIGNER
    { id: 'flag_artist', titleKey: 'achArtistTitle', descKey: 'achArtistDesc', icon: '🎨', category: 'designer', rarity: 'Rare', xp: 250, maxProgress: 1 },
    { id: 'prolific_designer', titleKey: 'achProlificDesignerTitle', descKey: 'achProlificDesignerDesc', icon: '⚒️', category: 'designer', rarity: 'Rare', xp: 400, maxProgress: 10 },
    { id: 'design_visionary', titleKey: 'achDesignVisionaryTitle', descKey: 'achDesignVisionaryDesc', icon: '🦄', category: 'designer', rarity: 'Legendary', xp: 1100, maxProgress: 30 },
  ], []);

  const achievementsList: Achievement[] = useMemo(() => achievementsBase.map(a => ({
    ...a,
    isUnlocked: unlockedIds.includes(a.id),
    progress: a.id === 'curator' || a.id === 'collector_pro' || a.id === 'world_curator' ? stats.favoritesCount :
              a.id === 'flag_artist' || a.id === 'prolific_designer' || a.id === 'design_visionary' ? stats.flagsDesigned :
              a.id === 'quiz_starter' || a.id === 'quiz_scholar' || a.id === 'quiz_marathoner' ? stats.quizzesCompleted :
              a.id === 'perfect_score' || a.id === 'perfect_legend' ? stats.perfectQuizzes :
              a.id === 'streak_master' || a.id === 'streak_godlike' ? stats.maxStreak :
              stats.viewedFlags.length
  })), [achievementsBase, unlockedIds, stats]);

  const level = useMemo(() => Math.floor(Math.sqrt(stats.totalXP / 80)) + 1, [stats.totalXP]);
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 80;
  const xpForNextLevel = Math.pow(level, 2) * 80;
  const levelProgress = ((stats.totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  useEffect(() => {
    localStorage.setItem('user_stats_v2', JSON.stringify({ ...stats, lastUpdated: Date.now() }));
    localStorage.setItem('unlocked_achievements_v2', JSON.stringify(unlockedIds));
  }, [stats, unlockedIds]);

  useEffect(() => {
    const toUnlock: {id: string, xp: number}[] = [];
    
    const check = (id: string, condition: boolean, xp: number) => {
        if (condition) toUnlock.push({id, xp});
    };

    check('first_steps', stats.viewedFlags.length >= 1, 100);
    check('world_traveler', stats.viewedFlags.length >= 50, 250);
    check('century_club', stats.viewedFlags.length >= 100, 300);
    check('vexillology_expert', stats.viewedFlags.length >= 150, 500);
    check('master_explorer', stats.viewedFlags.length >= 240, 1000);
    
    check('quiz_starter', stats.quizzesCompleted >= 1, 100);
    check('quiz_scholar', stats.quizzesCompleted >= 10, 200);
    check('quiz_marathoner', stats.quizzesCompleted >= 50, 600);
    
    check('streak_master', stats.maxStreak >= 10, 250);
    check('streak_godlike', stats.maxStreak >= 25, 1200);
    
    check('perfect_score', stats.perfectQuizzes >= 1, 500);
    check('perfect_legend', stats.perfectQuizzes >= 10, 1500);
    
    check('curator', stats.favoritesCount >= 10, 250);
    check('collector_pro', stats.favoritesCount >= 25, 500);
    check('world_curator', stats.favoritesCount >= 50, 1000);
    
    check('flag_artist', stats.flagsDesigned >= 1, 250);
    check('prolific_designer', stats.flagsDesigned >= 10, 400);
    check('design_visionary', stats.flagsDesigned >= 30, 1100);

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
      maxStreak: Math.max(prev.maxStreak, streak),
      totalXP: prev.totalXP + (score * 5)
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

  const exportProgress = useCallback(() => {
    const data = {
        stats,
        unlockedIds,
        timestamp: Date.now(),
        version: "2.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexillology_explorer_save_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, unlockedIds]);

  const importProgress = useCallback((jsonData: string) => {
    try {
        const data = JSON.parse(jsonData);
        if (data.stats && Array.isArray(data.unlockedIds)) {
            setStats(data.stats);
            setUnlockedIds(data.unlockedIds);
            notifiedIdsRef.current = new Set(data.unlockedIds);
            return true;
        }
    } catch (e) {}
    return false;
  }, []);

  const resetProgress = useCallback(() => {
    setStats(INITIAL_STATS);
    setUnlockedIds([]);
    notifiedIdsRef.current = new Set();
    localStorage.removeItem('user_stats_v2');
    localStorage.removeItem('unlocked_achievements_v2');
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
      popNotification,
      exportProgress,
      importProgress,
      resetProgress
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
