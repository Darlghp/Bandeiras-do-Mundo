
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
    // Processar o próximo item da fila se não houver nada rodando
    if (notificationQueue.length > 0 && !isAnimating.current) {
      isAnimating.current = true;
      
      const nextAchievement = { ...notificationQueue[0] };
      setCurrent(nextAchievement);
      
      // Remove da fila global IMEDIATAMENTE. O componente agora gerencia o "current" localmente.
      popNotification();

      // Sequência de entrada
      const showTimeout = setTimeout(() => {
        setVisible(true);
      }, 100);

      // Sequência de saída (10 segundos depois)
      const hideTimeout = setTimeout(() => {
        setVisible(false);
        
        // Limpeza após animação de saída (700ms é o tempo da transição no CSS)
        const cleanupTimeout = setTimeout(() => {
          setCurrent(null);
          isAnimating.current = false;
        }, 800);

        return () => clearTimeout(cleanupTimeout);
      }, 10000);

      return () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
      };
    }
  }, [notificationQueue, popNotification]);

  if (!current) return null;

  return (
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 transform ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90 pointer-events-none'}`}
    >
      <div className="bg-white dark:bg-slate-800 border-2 border-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex items-center gap-4 min-w-[320px] max-w-[90vw] overflow-hidden relative">
        {/* Barra de progresso visual de 10s */}
        <div 
          className="absolute top-0 left-0 h-1 bg-amber-400 transition-all duration-[10000ms] ease-linear origin-left"
          style={{ width: visible ? '100%' : '0%' }}
        ></div>
        
        <div className="text-4xl flex-shrink-0 animate-bounce">{current.icon}</div>
        <div className="flex-grow min-w-0">
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest truncate">
            {t('achievementUnlocked')}
          </p>
          <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
            {t(current.titleKey)}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {t(current.descKey)}
          </p>
        </div>
        
        <button 
          onClick={() => setVisible(false)}
          className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AchievementToast;
