import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SearchBarProps {
    initialQuery: string;
    onAiSearch: (query: string) => void;
    isAiSearching: boolean;
}

const SparkleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ initialQuery, onAiSearch, isAiSearching }) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState(initialQuery);

    useEffect(() => {
        setInputValue(initialQuery);
    }, [initialQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAiSearch(inputValue);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('aiSearchPlaceholder')}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                aria-label={t('aiSearchPlaceholder')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isAiSearching ? (
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <button type="submit" className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400" aria-label={t('aiSearching')}>
                        <SparkleIcon />
                    </button>
                )}
            </div>
        </form>
    );
};

export default SearchBar;