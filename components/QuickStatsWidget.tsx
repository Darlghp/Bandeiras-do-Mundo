
import React from 'react';
import { useAchievements } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';

const QuickStatsWidget: React.FC = () => {
    const { level, stats, levelProgress, xpToNextLevel } = useAchievements();
    const { t } = useLanguage();

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800/50 overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <div className="text-8xl font-black">{level}</div>
            </div>

            <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg animate-pulse-soft opacity-40"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg relative z-10">
                        {level}
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('level')}</h4>
                    <span className="text-lg font-black text-slate-800 dark:text-white tracking-tighter">Vexillologist</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">XP: {stats.totalXP}</span>
                    <span className="text-[9px] font-bold text-slate-400">{xpToNextLevel} XP</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                        style={{ width: `${levelProgress}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <div className="text-sm font-black text-slate-800 dark:text-white">{stats.viewedFlags.length}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('flagsViewed')}</div>
                </div>
                <div className="text-center">
                    <div className="text-sm font-black text-slate-800 dark:text-white">{stats.favoritesCount}</div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('favorites')}</div>
                </div>
            </div>
        </div>
    );
};

export default QuickStatsWidget;
