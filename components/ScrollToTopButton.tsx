import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const { t } = useLanguage();

    const size = 52;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (scrollProgress / 100) * circumference;

    const handleScroll = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }

        const totalScroll = document.documentElement.scrollTop;
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = (totalScroll / windowHeight) * 100;
        setScrollProgress(progress > 100 ? 100 : progress);
    };
    
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <button
            type="button"
            onClick={scrollToTop}
            className={`hide-on-keyboard fixed bottom-5 right-5 z-20 transition-all duration-300 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
            aria-label={t('goToTop')}
        >
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    className="transform -rotate-90"
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                >
                    <circle
                        className="text-gray-300/50 dark:text-gray-600/50"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className="text-blue-600 dark:text-sky-500"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ScrollToTopButton;