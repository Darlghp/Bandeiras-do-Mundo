import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface CompareModeToggleProps {
    isActive: boolean;
    onToggle: () => void;
}

const CompareModeToggle: React.FC<CompareModeToggleProps> = ({ isActive, onToggle }) => {
    const { t } = useLanguage();
    return (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="flex items-center justify-between">
                <label htmlFor="compare-toggle" className="flex flex-col cursor-pointer">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('compareMode')}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('compareModeTooltip')}</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                        type="checkbox" 
                        name="compare-toggle" 
                        id="compare-toggle" 
                        checked={isActive}
                        onChange={onToggle}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-500 border-4 appearance-none cursor-pointer"
                    />
                    <label htmlFor="compare-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"></label>
                </div>
            </div>
            <style>{`
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: #3b82f6; /* blue-500 */
                    background-color: #fff;
                }
                .toggle-checkbox:checked + .toggle-label {
                    background-color: #3b82f6; /* blue-500 */
                }
                .dark .toggle-checkbox:checked {
                    border-color: #60a5fa; /* blue-400 */
                }
                 .dark .toggle-checkbox:checked + .toggle-label {
                    background-color: #60a5fa; /* blue-400 */
                }
            `}</style>
        </div>
    );
};

export default CompareModeToggle;