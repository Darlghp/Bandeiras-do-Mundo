
import React, { useEffect, useState, useRef } from 'react';
import { useAchievements, Achievement, Rarity } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';

const RARITY_THEMES: Record<Rarity, { border: string, shadow: string, glow: string, text: string }> = {
    Legendary: { 
        border: 'border-amber-400', 
        shadow: 'shadow-[0_25px_60px_rgba(251,191,36,0.5)]', 
        glow: 'bg-amber-400',
        text: 'text-amber-500'
    },
    Epic: { 
        border: 'border-purple-500', 
        shadow: 'shadow-[0_25px_60px_rgba(168,85,247,0.4)]', 
        glow: 'bg-purple-500',
        text: 'text-purple-400'
    },
    Rare: { 
        border: 'border-sky-500', 
        shadow: 'shadow-[0_25px_60px_rgba(14,165,233,0.3)]', 
        glow: 'bg-sky-500',
        text: 'text-sky-400'
    },
    Common: { 
        border: 'border-slate-400', 
        shadow: 'shadow-2xl', 
        glow: 'bg-slate-400',
        text: 'text-slate-400'
    }
};

const AchievementToast: React.FC = () => {
  const { notificationQueue, popNotification } = useAchievements();
  const { t } = useLanguage();
  
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [visible, setVisible] = useState(false);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (notificationQueue.length > 0 && !isAnimating.current) {
      isAnimating.current = true;
      const nextAchievement = { ...notificationQueue[0] };
      setCurrent(nextAchievement);
      popNotification();

      setTimeout(() => setVisible(true), 50);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrent(null);
          isAnimating.current = false;
        }, 1000);
      }, 7000);
    }
  }, [notificationQueue, popNotification]);

  if (!current) return null;
  const theme = RARITY_THEMES[current.rarity];

  return (
    <div 
      className={`fixed top-24 z-[100] px-4 w-full max-w-sm left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-1000
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-12 scale-90'}`}
    >
      <div className={`relative overflow-hidden bg-slate-900/95 backdrop-blur-2xl border-2 ${theme.border} ${theme.shadow} rounded-[2.5rem] p-6 flex items-center gap-5 pointer-events-auto`}>
        
        {/* Animated Background Shine */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
        </div>
        
        {/* Glow Pulse */}
        <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 ${theme.glow} blur-2xl opacity-40 animate-pulse`}></div>
            <div className="relative text-5xl bg-slate-800 rounded-3xl w-16 h-16 flex items-center justify-center shadow-lg border border-white/5">
                {current.icon}
            </div>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.text}`}>
                {t(`rarity${current.rarity}`)}
             </span>
             <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                +{current.xp} {t('xp')}
             </span>
          </div>
          <h4 className="text-xl font-black text-white leading-tight truncate mb-1">
            {t(current.titleKey)}
          </h4>
          <p className="text-xs font-semibold text-slate-400 line-clamp-2 leading-tight">
            {t(current.descKey)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
