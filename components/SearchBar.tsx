import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SearchBarProps {
    value: string;
    onChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
    const { t } = useLanguage();

    return (
        <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                aria-label={t('searchPlaceholder')}
            />
        </div>
    );
};

export default SearchBar;
