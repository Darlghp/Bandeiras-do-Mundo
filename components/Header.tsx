import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import type { View } from '../App';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    scrollProgress: number;
}

const WavingFlagIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-sky-500 group-hover:text-blue-700 dark:group-hover:text-sky-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </svg>
);

const NavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    'data-nav-id': string;
}> = ({ label, isActive, onClick, 'data-nav-id': dataNavId }) => {
    return (
        <button
            onClick={onClick}
            data-nav-id={dataNavId}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-in-out focus:outline-none rounded-md
                ${isActive ? 'text-blue-600 dark:text-sky-400' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {label}
        </button>
    );
};


const Header: React.FC<HeaderProps> = ({ currentView, setView, scrollProgress }) => {
    const { t } = useLanguage();
    const navRef = useRef<HTMLDivElement>(null);
    const [magicLineStyle, setMagicLineStyle] = useState({});

    const navItems = [
        { id: 'explorer', label: t('explorer') },
        { id: 'discover', label: t('discoverTitle') },
        { id: 'quiz', label: t('quizTitle') },
    ];

    useEffect(() => {
        // A small delay to allow for font loading and accurate measurement
        const timer = setTimeout(() => {
            if (navRef.current) {
                const activeItem = navRef.current.querySelector(`[data-nav-id="${currentView}"]`) as HTMLElement;
                if (activeItem) {
                    setMagicLineStyle({
                        left: activeItem.offsetLeft,
                        width: activeItem.offsetWidth,
                    });
                }
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [currentView, t, navItems.length]); // Re-run when t changes (language switch) or items change

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 border-b border-gray-200 dark:border-slate-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side: Logo and Title */}
                    <div className="flex-1 flex justify-start">
                        <button onClick={() => setView('explorer')} className="flex items-center space-x-3 group" aria-label={t('headerTitle')}>
                            <WavingFlagIcon />
                            <span className="hidden sm:inline text-xl font-bold text-gray-800 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-slate-50 transition-colors whitespace-nowrap">
                                {t('headerTitle')}
                            </span>
                        </button>
                    </div>
                    
                    {/* Center: Navigation */}
                    <div className="hidden md:block">
                        <div ref={navRef} className="flex items-center justify-center p-1 bg-gray-100 dark:bg-slate-800/50 rounded-lg">
                            <div className="relative flex items-center">
                                {navItems.map(item => (
                                    <NavItem 
                                        key={item.id}
                                        label={item.label}
                                        isActive={currentView === item.id}
                                        onClick={() => setView(item.id as View)}
                                        data-nav-id={item.id}
                                    />
                                ))}
                                <div className="magic-line" style={magicLineStyle}></div>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Language and Theme Switchers */}
                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <LanguageSwitcher />
                            <ThemeSwitcher />
                        </div>
                    </div>
                </div>
            </div>
             {/* Scroll Progress Bar */}
            <div className="absolute bottom-[-1px] left-0 h-[3px] bg-blue-600 dark:bg-sky-500 rounded-r-full transition-all duration-150 ease-linear" style={{ width: `${scrollProgress}%` }} />
        </header>
    );
};

export default Header;