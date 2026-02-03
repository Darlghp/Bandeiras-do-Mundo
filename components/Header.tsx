
import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import type { View } from '../App';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
    scrollProgress: number;
}

const WavingFlagIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-sky-400 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors" viewBox="0 0 24 24" fill="currentColor">
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
            className={`relative px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-in-out focus:outline-none rounded-xl
                ${isActive ? 'text-blue-600 dark:text-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
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
    }, [currentView, t, navItems.length]);

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/40 backdrop-blur-2xl z-20 border-b border-slate-200/50 dark:border-slate-800/40 transition-colors duration-500 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-1 flex justify-start">
                        <button onClick={() => setView('explorer')} className="flex items-center space-x-3 group" aria-label={t('headerTitle')}>
                            <WavingFlagIcon />
                            <span className="hidden sm:inline text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">
                                {t('headerTitle')}
                            </span>
                        </button>
                    </div>
                    
                    <div className="hidden md:block">
                        <div ref={navRef} className="relative flex items-center justify-center p-1.5 bg-slate-200/40 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-300/30 dark:border-slate-800/30 transition-colors duration-500">
                             <div className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)" style={magicLineStyle}></div>
                            {navItems.map(item => (
                                <NavItem 
                                    key={item.id}
                                    label={item.label}
                                    isActive={currentView === item.id}
                                    onClick={() => setView(item.id as View)}
                                    data-nav-id={item.id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-[-1px] left-0 h-[2px] bg-blue-600 dark:bg-sky-400 rounded-r-full transition-all duration-300 ease-out" style={{ width: `${scrollProgress}%`, boxShadow: scrollProgress > 0 ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none' }} />
        </header>
    );
};

export default Header;
