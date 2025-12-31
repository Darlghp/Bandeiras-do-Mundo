import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { View } from '../App';

interface ViewNavigatorProps {
    currentView: View;
    setView: (view: View) => void;
}

const ExplorerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-4 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-4 2a1 1 0 10-2 0v2a1 1 0 102 0v-2z" />
    </svg>
);

const QuizIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    const activeClasses = 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md';
    const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200';

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const ViewNavigator: React.FC<ViewNavigatorProps> = ({ currentView, setView }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'explorer', label: t('explorer'), icon: <ExplorerIcon /> },
        { id: 'quiz', label: t('quizTitle'), icon: <QuizIcon /> },
    ];

    return (
        <nav className="sticky top-[65px] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md z-10 py-3">
            <div className="p-1 bg-gray-200 dark:bg-gray-950/50 rounded-xl max-w-lg mx-auto flex items-center gap-1 shadow-inner">
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

export default ViewNavigator;