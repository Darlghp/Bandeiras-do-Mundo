import React, { useEffect, useState, useRef } from 'react';
import { useAchievements, Achievement } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';

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

      // Trigger entrance animation
      const showTimeout = setTimeout(() => {
        setVisible(true);
      }, 50);

      // Display for 8 seconds
      const hideTimeout = setTimeout(() => {
        setVisible(false);
        
        // Cleanup after exit transition
        const cleanupTimeout = setTimeout(() => {
          setCurrent(null);
          isAnimating.current = false;
        }, 1000);

        return () => clearTimeout(cleanupTimeout);
      }, 8000);

      return () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [notificationQueue, popNotification]);

  if (!current) return null;

  return (
    <div 
      className={`fixed bottom-24 z-[100] px-4 w-full max-w-sm pointer-events-none transition-all duration-1000
        ${visible ? 'animate-achievement opacity-100' : 'left-1/2 -translate-x-1/2 opacity-0 translate-y-12 scale-90'}`}
    >
      <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-400/60 shadow-[0_25px_60px_rgba(251,191,36,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-[2.5rem] p-6 flex items-center gap-5 pointer-events-auto">
        
        {/* Progress Bar */}
        <div 
          className={`absolute top-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 origin-left transition-all duration-[8000ms] ease-linear`}
          style={{ width: visible ? '100%' : '0%' }}
        ></div>

        {/* Dynamic Metallic Shimmer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
            <div className="absolute top-0 -left-[100%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
        </div>
        
        {/* Icon with Glowing Pulse */}
        <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-40 animate-pulse"></div>
            <div className="relative text-5xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/20 w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg border border-amber-200/50 dark:border-amber-700/30">
                {current.icon}
            </div>
        </div>

        <div className="flex-grow min-w-0">
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.25em] mb-1">
            {t('achievementUnlocked')}
          </p>
          <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight truncate mb-1">
            {t(current.titleKey)}
          </h4>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight opacity-90">
            {t(current.descKey)}
          </p>
        </div>
        
        <button 
          onClick={() => setVisible(false)}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AchievementToast;