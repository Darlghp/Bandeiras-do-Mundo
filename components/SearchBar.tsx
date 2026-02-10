
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SearchBarProps {
    value: string;
    onChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
    const { t } = useLanguage();

    return (
        <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl leading-5 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-sm font-black transition-all shadow-sm"
                aria-label={t('searchPlaceholder')}
            />
        </div>
    );
};

export default SearchBar;
