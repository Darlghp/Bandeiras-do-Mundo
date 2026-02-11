
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Achievement {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  category: 'explorer' | 'quiz' | 'collector';
  rarity: Rarity;
  xp: number;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  viewedFlags: string[];
  viewedByContinent: Record<string, string[]>;
  quizzesCompleted: number;
  perfectQuizzes: number;
  maxStreak: number;
  favoritesCount: number;
  vexyQueries: number;
  comparisonsMade: number;
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
  trackFlagView: (cca3: string, continents?: string[]) => void;
  trackQuizResult: (score: number, total: number, streak: number) => void;
  trackFavorite: (count: number) => void;
  trackVexyQuery: () => void;
  trackComparison: () => void;
  notificationQueue: Achievement[];
  popNotification: () => void;
  exportProgress: () => void;
  importProgress: (jsonData: string) => boolean;
  resetProgress: () => void;
}

const INITIAL_STATS: UserStats = {
  viewedFlags: [],
  viewedByContinent: {},
  quizzesCompleted: 0,
  perfectQuizzes: 0,
  maxStreak: 0,
  favoritesCount: 0,
  vexyQueries: 0,
  comparisonsMade: 0,
  totalXP: 0,
  lastUpdated: Date.now(),
};

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('user_stats_v4');
      if (saved) return { ...INITIAL_STATS, ...JSON.parse(saved) };
    } catch (e) {}
    return INITIAL_STATS;
  });

  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_achievements_v4');
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
    { id: 'vex_scholar', titleKey: 'achVexScholarTitle', descKey: 'achVexScholarDesc', icon: '📖', category: 'explorer', rarity: 'Epic', xp: 800, maxProgress: 200 },
    { id: 'master_explorer', titleKey: 'achMasterExplorerTitle', descKey: 'achMasterExplorerDesc', icon: '👑', category: 'explorer', rarity: 'Legendary', xp: 1200, maxProgress: 240 },
    
    // REGIONAL SPECIALISTS
    { id: 'african_specialist', titleKey: 'achAfricanSpecialistTitle', descKey: 'achAfricanSpecialistDesc', icon: '🦁', category: 'explorer', rarity: 'Rare', xp: 300, maxProgress: 20 },
    { id: 'asian_specialist', titleKey: 'achAsianSpecialistTitle', descKey: 'achAsianSpecialistDesc', icon: '🐉', category: 'explorer', rarity: 'Rare', xp: 300, maxProgress: 20 },
    { id: 'european_specialist', titleKey: 'achEuropeanSpecialistTitle', descKey: 'achEuropeanSpecialistDesc', icon: '🏰', category: 'explorer', rarity: 'Rare', xp: 300, maxProgress: 20 },
    { id: 'american_specialist', titleKey: 'achAmericanSpecialistTitle', descKey: 'achAmericanSpecialistDesc', icon: '🦅', category: 'explorer', rarity: 'Rare', xp: 300, maxProgress: 20 },
    { id: 'oceanian_specialist', titleKey: 'achOceanianSpecialistTitle', descKey: 'achOceanianSpecialistDesc', icon: '🏄', category: 'explorer', rarity: 'Rare', xp: 300, maxProgress: 10 },
    
    // INTERACTION
    { id: 'curious_mind', titleKey: 'achCuriousMindTitle', descKey: 'achCuriousMindDesc', icon: '🤔', category: 'explorer', rarity: 'Common', xp: 150, maxProgress: 5 },
    { id: 'ai_expert', titleKey: 'achAIExpertTitle', descKey: 'achAIExpertDesc', icon: '🧠', category: 'explorer', rarity: 'Rare', xp: 400, maxProgress: 25 },
    
    // QUIZ
    { id: 'quiz_starter', titleKey: 'achQuizStarterTitle', descKey: 'achQuizStarterDesc', icon: '📝', category: 'quiz', rarity: 'Common', xp: 100, maxProgress: 1 },
    { id: 'quiz_scholar', titleKey: 'achQuizScholarTitle', descKey: 'achQuizScholarDesc', icon: '📚', category: 'quiz', rarity: 'Common', xp: 200, maxProgress: 10 },
    { id: 'quiz_marathoner', titleKey: 'achQuizMarathonerTitle', descKey: 'achQuizMarathonerDesc', icon: '🏃', category: 'quiz', rarity: 'Epic', xp: 600, maxProgress: 50 },
    { id: 'quiz_veteran', titleKey: 'achQuizVeteranTitle', descKey: 'achQuizVeteranDesc', icon: '🏛️', category: 'quiz', rarity: 'Legendary', xp: 1500, maxProgress: 100 },
    { id: 'quiz_titan', titleKey: 'achQuizTitanTitle', descKey: 'achQuizTitanDesc', icon: '🌋', category: 'quiz', rarity: 'Legendary', xp: 3000, maxProgress: 250 },
    { id: 'streak_master', titleKey: 'achStreakMasterTitle', descKey: 'achStreakMasterDesc', icon: '🔥', category: 'quiz', rarity: 'Rare', xp: 250, maxProgress: 10 },
    { id: 'streak_godlike', titleKey: 'achStreakGodlikeTitle', descKey: 'achStreakGodlikeDesc', icon: '⚡', category: 'quiz', rarity: 'Legendary', xp: 1200, maxProgress: 25 },
    { id: 'streak_unreal', titleKey: 'achStreakUnrealTitle', descKey: 'achStreakUnrealDesc', icon: '🌌', category: 'quiz', rarity: 'Legendary', xp: 4000, maxProgress: 100 },
    { id: 'perfect_score', titleKey: 'achPerfectScoreTitle', descKey: 'achPerfectScoreDesc', icon: '✨', category: 'quiz', rarity: 'Epic', xp: 500, maxProgress: 1 },
    { id: 'perfect_legend', titleKey: 'achPerfectLegendTitle', descKey: 'achPerfectLegendDesc', icon: '🏆', category: 'quiz', rarity: 'Legendary', xp: 1500, maxProgress: 10 },
    
    // COLLECTOR
    { id: 'curator', titleKey: 'achCuratorTitle', descKey: 'achCuratorDesc', icon: '💖', category: 'collector', rarity: 'Rare', xp: 250, maxProgress: 10 },
    { id: 'collector_pro', titleKey: 'achCollectorProTitle', descKey: 'achCollectorProDesc', icon: '💎', category: 'collector', rarity: 'Epic', xp: 500, maxProgress: 25 },
    { id: 'world_curator', titleKey: 'achWorldCuratorTitle', descKey: 'achWorldCuratorDesc', icon: '🏛️', category: 'collector', rarity: 'Legendary', xp: 1000, maxProgress: 50 },
    { id: 'collection_master', titleKey: 'achCollectionMasterTitle', descKey: 'achCollectionMasterDesc', icon: '🏯', category: 'collector', rarity: 'Legendary', xp: 2000, maxProgress: 75 },
    { id: 'analyst', titleKey: 'achAnalystTitle', descKey: 'achAnalystDesc', icon: '📊', category: 'collector', rarity: 'Common', xp: 150, maxProgress: 10 },
    { id: 'master_analyst', titleKey: 'achMasterAnalystTitle', descKey: 'achMasterAnalystDesc', icon: '🧐', category: 'collector', rarity: 'Epic', xp: 600, maxProgress: 50 },
    { id: 'judge_maestro', titleKey: 'achJudgeMaestroTitle', descKey: 'achJudgeMaestroDesc', icon: '⚖️', category: 'collector', rarity: 'Legendary', xp: 2000, maxProgress: 100 },
  ], []);

  const achievementsList: Achievement[] = useMemo(() => achievementsBase.map(a => {
    let progress = stats.viewedFlags.length;
    if (a.id === 'curator' || a.id === 'collector_pro' || a.id === 'world_curator' || a.id === 'collection_master') progress = stats.favoritesCount;
    else if (a.id === 'quiz_starter' || a.id === 'quiz_scholar' || a.id === 'quiz_marathoner' || a.id === 'quiz_veteran' || a.id === 'quiz_titan') progress = stats.quizzesCompleted;
    else if (a.id === 'perfect_score' || a.id === 'perfect_legend') progress = stats.perfectQuizzes;
    else if (a.id === 'streak_master' || a.id === 'streak_godlike' || a.id === 'streak_unreal') progress = stats.maxStreak;
    else if (a.id === 'curious_mind' || a.id === 'ai_expert') progress = stats.vexyQueries;
    else if (a.id === 'analyst' || a.id === 'master_analyst' || a.id === 'judge_maestro') progress = stats.comparisonsMade;
    else if (a.id === 'african_specialist') progress = stats.viewedByContinent['Africa']?.length || 0;
    else if (a.id === 'asian_specialist') progress = stats.viewedByContinent['Asia']?.length || 0;
    else if (a.id === 'european_specialist') progress = stats.viewedByContinent['Europe']?.length || 0;
    else if (a.id === 'american_specialist') progress = (stats.viewedByContinent['North America']?.length || 0) + (stats.viewedByContinent['South America']?.length || 0);
    else if (a.id === 'oceanian_specialist') progress = stats.viewedByContinent['Oceania']?.length || 0;

    return {
      ...a,
      isUnlocked: unlockedIds.includes(a.id),
      progress
    };
  }), [achievementsBase, unlockedIds, stats]);

  const level = useMemo(() => Math.floor(Math.sqrt(stats.totalXP / 80)) + 1, [stats.totalXP]);
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 80;
  const xpForNextLevel = Math.pow(level, 2) * 80;
  const levelProgress = ((stats.totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  useEffect(() => {
    localStorage.setItem('user_stats_v4', JSON.stringify({ ...stats, lastUpdated: Date.now() }));
    localStorage.setItem('unlocked_achievements_v4', JSON.stringify(unlockedIds));
  }, [stats, unlockedIds]);

  useEffect(() => {
    const toUnlock: {id: string, xp: number}[] = [];
    const check = (id: string, condition: boolean, xp: number) => { if (condition) toUnlock.push({id, xp}); };

    check('first_steps', stats.viewedFlags.length >= 1, 100);
    check('world_traveler', stats.viewedFlags.length >= 50, 250);
    check('century_club', stats.viewedFlags.length >= 100, 300);
    check('vexillology_expert', stats.viewedFlags.length >= 150, 500);
    check('vex_scholar', stats.viewedFlags.length >= 200, 800);
    check('master_explorer', stats.viewedFlags.length >= 240, 1200);

    const amCount = (stats.viewedByContinent['North America']?.length || 0) + (stats.viewedByContinent['South America']?.length || 0);
    check('african_specialist', (stats.viewedByContinent['Africa']?.length || 0) >= 20, 300);
    check('asian_specialist', (stats.viewedByContinent['Asia']?.length || 0) >= 20, 300);
    check('european_specialist', (stats.viewedByContinent['Europe']?.length || 0) >= 20, 300);
    check('american_specialist', amCount >= 20, 300);
    check('oceanian_specialist', (stats.viewedByContinent['Oceania']?.length || 0) >= 10, 300);
    
    check('quiz_starter', stats.quizzesCompleted >= 1, 100);
    check('quiz_scholar', stats.quizzesCompleted >= 10, 200);
    check('quiz_marathoner', stats.quizzesCompleted >= 50, 600);
    check('quiz_veteran', stats.quizzesCompleted >= 100, 1500);
    check('quiz_titan', stats.quizzesCompleted >= 250, 3000);
    
    check('streak_master', stats.maxStreak >= 10, 250);
    check('streak_godlike', stats.maxStreak >= 25, 1200);
    check('streak_unreal', stats.maxStreak >= 100, 4000);
    
    check('perfect_score', stats.perfectQuizzes >= 1, 500);
    check('perfect_legend', stats.perfectQuizzes >= 10, 1500);
    
    check('curator', stats.favoritesCount >= 10, 250);
    check('collector_pro', stats.favoritesCount >= 25, 500);
    check('world_curator', stats.favoritesCount >= 50, 1000);
    check('collection_master', stats.favoritesCount >= 75, 2000);

    check('curious_mind', stats.vexyQueries >= 5, 150);
    check('ai_expert', stats.vexyQueries >= 25, 400);

    check('analyst', stats.comparisonsMade >= 10, 150);
    check('master_analyst', stats.comparisonsMade >= 50, 600);
    check('judge_maestro', stats.comparisonsMade >= 100, 2000);

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

  const trackFlagView = useCallback((cca3: string, continents?: string[]) => {
    setStats(prev => {
      const alreadyViewed = prev.viewedFlags.includes(cca3);
      if (alreadyViewed) return prev;
      
      const newByContinent = { ...prev.viewedByContinent };
      if (continents) {
        continents.forEach(cont => {
          if (!newByContinent[cont]) newByContinent[cont] = [];
          if (!newByContinent[cont].includes(cca3)) {
            newByContinent[cont] = [...newByContinent[cont], cca3];
          }
        });
      }
      
      return { 
        ...prev, 
        viewedFlags: [...prev.viewedFlags, cca3],
        viewedByContinent: newByContinent
      };
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

  const trackVexyQuery = useCallback(() => {
    setStats(prev => ({ ...prev, vexyQueries: prev.vexyQueries + 1 }));
  }, []);

  const trackComparison = useCallback(() => {
    setStats(prev => ({ ...prev, comparisonsMade: prev.comparisonsMade + 1 }));
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
    const data = { stats, unlockedIds, timestamp: Date.now(), version: "4.0" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vexillology_explorer_v4_${new Date().toISOString().slice(0, 10)}.json`;
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
    localStorage.removeItem('user_stats_v4');
    localStorage.removeItem('unlocked_achievements_v4');
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
      trackVexyQuery,
      trackComparison,
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
