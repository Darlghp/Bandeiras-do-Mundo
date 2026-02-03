
import React from 'react';
import { useAchievements, Achievement, Rarity } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';

const RARITY_STYLE: Record<Rarity, string> = {
    Legendary: 'border-amber-400 bg-amber-400/5 shadow-[0_0_30px_rgba(251,191,36,0.1)]',
    Epic: 'border-purple-500 bg-purple-500/5',
    Rare: 'border-sky-500 bg-sky-500/5',
    Common: 'border-slate-700 bg-slate-800/40'
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const { t } = useLanguage();
  
  return (
    <div className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 group
      ${achievement.isUnlocked 
        ? `${RARITY_STYLE[achievement.rarity]} scale-100` 
        : 'bg-slate-900/40 border-slate-800/50 opacity-40 grayscale'
    }`}>
      <div className={`text-5xl mb-4 transition-transform duration-700 ${achievement.isUnlocked ? 'group-hover:scale-125 group-hover:rotate-6' : ''}`}>
        {achievement.isUnlocked ? achievement.icon : '🔒'}
      </div>
      
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black uppercase tracking-widest ${achievement.isUnlocked ? 'text-blue-400' : 'text-slate-500'}`}>
                {t(`rarity${achievement.rarity}`)}
            </span>
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                {achievement.xp} {t('xp')}
            </span>
        </div>
        <h4 className="font-black text-white text-lg leading-tight">{t(achievement.titleKey)}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{t(achievement.descKey)}</p>
      </div>
      
      {achievement.maxProgress && achievement.maxProgress > 1 && (
        <div className="w-full">
          <div className="flex justify-between text-[9px] mb-2 font-black uppercase text-slate-500 tracking-tighter">
            <span>{t('progress')}</span>
            <span>{achievement.progress}/{achievement.maxProgress}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${achievement.isUnlocked ? 'bg-blue-500' : 'bg-slate-700'}`} 
              style={{ width: `${Math.min(100, ((achievement.progress || 0) / achievement.maxProgress) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {achievement.isUnlocked && achievement.rarity === 'Legendary' && (
        <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] overflow-hidden">
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
        </div>
      )}
    </div>
  );
};

const AchievementGallery: React.FC = () => {
  const { achievements, level, levelProgress, stats, xpToNextLevel } = useAchievements();
  const { t } = useLanguage();

  const categories = ['explorer', 'quiz', 'collector', 'designer'] as const;

  return (
    <div className="space-y-16 py-8">
      {/* Level Dashboard */}
      <div className="relative bg-slate-900/60 backdrop-blur-3xl p-8 sm:p-12 rounded-[4rem] border-2 border-white/5 overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <div className="text-[12rem] font-black leading-none">{level}</div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-shrink-0 relative">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-blue-500/20">
                    {level}
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    {t('level').toUpperCase()}
                  </div>
              </div>

              <div className="flex-grow w-full space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">{t('vexMastery')}</h2>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">{t('totalXP')}: {stats.totalXP} {t('xp')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('nextLevelAt', { xp: xpToNextLevel.toString() })}</span>
                      </div>
                  </div>
                  
                  <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 animate-shimmer" 
                        style={{ width: `${levelProgress}%`, backgroundSize: '200% 100%' }}
                      ></div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-white/5">
              {[
                  { label: t('flagsViewed'), val: stats.viewedFlags.length, icon: '👁️' },
                  { label: t('perfectQuizzes'), val: stats.perfectQuizzes, icon: '🎯' },
                  { label: t('maxStreak'), val: stats.maxStreak, icon: '🔥' },
                  { label: t('designs'), val: stats.flagsDesigned, icon: '🎨' }
              ].map(stat => (
                  <div key={stat.label} className="text-center">
                      <div className="text-2xl mb-1">{stat.icon}</div>
                      <div className="text-xl font-black text-white">{stat.val}</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* Achievement Sections */}
      {categories.map(cat => {
        const filtered = achievements.filter(a => a.category === cat);
        if (filtered.length === 0) return null;

        return (
          <div key={cat} className="space-y-8">
            <div className="flex items-center gap-6">
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                {t(`cat_${cat}`)}
              </h3>
              <div className="h-px flex-grow bg-white/5"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(ach => (
                <AchievementCard key={ach.id} achievement={ach} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementGallery;
