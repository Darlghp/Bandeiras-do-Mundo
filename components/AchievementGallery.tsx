
import React from 'react';
import { useAchievements, Achievement } from '../context/AchievementContext';
import { useLanguage } from '../context/LanguageContext';

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const { t } = useLanguage();
  
  return (
    <div className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center ${
      achievement.isUnlocked 
        ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900 shadow-lg scale-100' 
        : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale'
    }`}>
      <div className={`text-5xl mb-3 transform transition-transform duration-500 ${achievement.isUnlocked ? 'hover:scale-125' : ''}`}>
        {achievement.isUnlocked ? achievement.icon : '🔒'}
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{t(achievement.titleKey)}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t(achievement.descKey)}</p>
      
      {achievement.maxProgress && achievement.maxProgress > 1 && (
        <div className="w-full mt-3">
          <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-slate-400">
            <span>{t('progress')}</span>
            <span>{achievement.progress}/{achievement.maxProgress}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-1000" 
              style={{ width: `${Math.min(100, ((achievement.progress || 0) / achievement.maxProgress) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {achievement.isUnlocked && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-bounce">
          {t('newBadge')}
        </div>
      )}
    </div>
  );
};

const AchievementGallery: React.FC = () => {
  const { achievements } = useAchievements();
  const { t } = useLanguage();

  const categories = ['explorer', 'quiz', 'collector', 'designer'] as const;

  return (
    <div className="space-y-12 py-8">
      {categories.map(cat => {
        const filtered = achievements.filter(a => a.category === cat);
        if (filtered.length === 0) return null;

        return (
          <div key={cat} className="space-y-6">
            <div className="flex items-center gap-4">
               <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 capitalize">
                {t(`cat_${cat}`)}
              </h3>
              <div className="h-px flex-grow bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
