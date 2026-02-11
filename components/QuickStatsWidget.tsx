import React from 'react';
import { useAchievements } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';

const QuickStatsWidget: React.FC = () => {
    const { level, stats, levelProgress, xpToNextLevel } = useAchievements();
    const { t, language } = useLanguage();

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800/50 overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-1000 pointer-events-none transform group-hover:scale-150 group-hover:rotate-12">
                <div className="text-[10rem] font-black leading-none">{level}</div>
            </div>

            <div className="flex items-center gap-5 mb-6 relative z-10">
                <div className="relative group/level">
                    <div className="absolute inset-0 bg-blue-500 rounded-[1.5rem] blur-xl animate-pulse-soft opacity-40 group-hover/level:opacity-70 transition-opacity"></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-[1.5rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl relative z-10 transform transition-transform group-hover/level:rotate-6">
                        {level}
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{t('level')}</h4>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-sky-400 dark:to-blue-400">
                        {t('rankVexillologist')}
                    </span>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">XP: {stats.totalXP.toLocaleString(language)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{xpToNextLevel.toLocaleString(language)} XP</span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5 p-[2px]">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 transition-all duration-[1.5s] cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)] relative overflow-hidden"
                        style={{ width: `${levelProgress}%`, backgroundSize: '200% 100%' }}
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ width: '50%' }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div className="text-center group/stat p-2 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className="text-lg font-black text-slate-900 dark:text-white transform transition-transform group-hover/stat:scale-110">{stats.viewedFlags.length}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('flagsViewed')}</div>
                </div>
                <div className="text-center group/stat p-2 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className="text-lg font-black text-slate-900 dark:text-white transform transition-transform group-hover/stat:scale-110">{stats.favoritesCount}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('favorites')}</div>
                </div>
            </div>
        </div>
    );
};

export default QuickStatsWidget;
