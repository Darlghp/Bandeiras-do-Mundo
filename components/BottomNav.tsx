import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { View } from '../App';

const ExplorerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </svg>
);

const QuizIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

interface BottomNavProps {
    currentView: View;
    setView: (view: View) => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => {
    const activeClasses = 'text-blue-600 dark:text-sky-400';
    const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100';

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 text-xs font-medium transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
    const { t } = useLanguage();
    const navItems = [
        { id: 'explorer', label: t('explorer'), icon: <ExplorerIcon /> },
        { id: 'quiz', label: t('quizTitle'), icon: <QuizIcon /> },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 border-t border-gray-200 dark:border-slate-700 hide-on-keyboard">
            <div className="flex items-center justify-around h-16">
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