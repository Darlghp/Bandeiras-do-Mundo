import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
    const { t } = useLanguage();
    return (
        <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-gray-200 dark:border-slate-700 backdrop-blur-sm">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm text-gray-700 dark:text-slate-300">{t('footerRights')}</p>
                <p className="text-xs mt-2 text-gray-500 dark:text-slate-400">{t('footerBuiltWith')}</p>
            </div>
        </footer>
    );
};

export default Footer;