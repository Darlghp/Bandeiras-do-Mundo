
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { View } from '../App';

const ExplorerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </svg>
);

const InsightsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zM.464 11.5A10.038 10.038 0 0110 2.036V10h7.964A10.039 10.039 0 0112 21.536V12H.464z" clipRule="evenodd" />
    </svg>
);

const QuizIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

interface BottomNavProps {
    currentView: View;
    setView: (view: View) => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => {
    const activeClasses = 'text-blue-600 dark:text-sky-400';
    const inactiveClasses = 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300';

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center p-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ease-in-out focus:outline-none h-full ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            <div className={`flex flex-col items-center justify-center gap-1.5 p-2 px-4 rounded-2xl transition-all duration-500 ${isActive ? 'bg-blue-100/80 dark:bg-sky-500/20' : 'bg-transparent'}`}>
                <div className={`transform transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    {icon}
                </div>
                <span className="transition-all duration-300">{label}</span>
            </div>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
    const { t } = useLanguage();
    const navItems = [
        { id: 'explorer', label: t('explorer'), icon: <ExplorerIcon /> },
        { id: 'discover', label: t('discoverTitle'), icon: <InsightsIcon /> },
        { id: 'quiz', label: t('quizTitle'), icon: <QuizIcon /> },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-20 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] hide-on-keyboard">
            <div className="flex items-center justify-around h-20 px-2">
                {navItems.map(item => (
                    <NavItem 
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentView === item.id}
                        onClick={() => setView(item.id as View)}
                    />
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
