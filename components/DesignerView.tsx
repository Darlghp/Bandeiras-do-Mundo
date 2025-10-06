import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { editFlagWithAi, getAiAvailability } from '../services/geminiService';

const svgUrlToBase64Png = (url: string): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType: 'image/png' });
        };
        img.onerror = (e) => {
            reject(new Error(`Failed to load image from ${url}: ${e.toString()}`));
        };
        img.src = url;
    });
};

const ActionButton: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode; className?: string; }> = ({ onClick, disabled, children, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const DesignerView: React.FC<{ countries: Country[] }> = ({ countries }) => {
    const { t, language } = useLanguage();
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [prompt, setPrompt] = useState('');
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<{ base64: string, mimeType: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAiAvailable = getAiAvailability();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = useMemo(() => {
        if (!search) return countries;
        const lowercasedSearch = search.toLowerCase();
        return countries.filter(country => 
            (language === 'pt' ? country.translations.por.common : country.name.common)
            .toLowerCase().includes(lowercasedSearch)
        );
    }, [countries, search, language]);

    const handleCountrySelect = async (country: Country) => {
        setIsDropdownOpen(false);
        setSearch(language === 'pt' ? country.translations.por.common : country.name.common);
        setSelectedCountry(country);
        setIsPreparing(true);
        setCurrentImage(null);
        setError(null);
        try {
            // Try SVG first
            const imageData = await svgUrlToBase64Png(country.flags.svg);
            setOriginalImage(imageData);
            setCurrentImage(`data:${imageData.mimeType};base64,${imageData.base64}`);
        } catch (svgError) {
            console.error("Failed to load SVG, trying PNG fallback:", svgError);
            try {
                // Fallback to PNG
                const imageData = await svgUrlToBase64Png(country.flags.png);
                setOriginalImage(imageData);
                setCurrentImage(`data:${imageData.mimeType};base64,${imageData.base64}`);
            } catch (pngError) {
                console.error("Failed to load PNG as well:", pngError);
                setError(t('designerErrorImage'));
            }
        } finally {
            setIsPreparing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt || !originalImage) return;
        setIsLoading(true);
        setError(null);
        try {
            const imageToEdit = currentImage ? currentImage.split(',')[1] : originalImage.base64;
            const mimeType = currentImage ? currentImage.split(';')[0].split(':')[1] : originalImage.mimeType;

            const newImage = await editFlagWithAi(imageToEdit, mimeType, prompt);
            setCurrentImage(`data:${newImage.mimeType};base64,${newImage.base64}`);
            setPrompt('');
        } catch (e) {
            setError(t('aiError'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (originalImage) {
            setCurrentImage(`data:${originalImage.mimeType};base64,${originalImage.base64}`);
            setError(null);
        }
    };

    const handleDownload = () => {
        if (currentImage) {
            const link = document.createElement('a');
            link.href = currentImage;
            link.download = `${selectedCountry?.name.common.replace(/ /g, '_')}_design.png` || 'flag_design.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!isAiAvailable) {
        return <div className="text-center py-20 text-red-500">{t('aiUnavailable')}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('designerTitle')}</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t('designerDescription')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Left Side: Controls */}
                    <div className="space-y-4">
                        <div ref={dropdownRef} className="relative">
                             <label htmlFor="country-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('selectAFlag')}</label>
                            <input
                                id="country-search"
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setIsDropdownOpen(true); }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            />
                             {isDropdownOpen && filteredCountries.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredCountries.map(country => (
                                        <li key={country.cca3}
                                            onClick={() => handleCountrySelect(country)}
                                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                        >
                                            {language === 'pt' ? country.translations.por.common : country.name.common}
                                        </li>
                                    ))}
                                </ul>
                             )}
                        </div>
                        
                        <div>
                             <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('designerPrompt')}</label>
                             <textarea
                                id="prompt-input"
                                rows={3}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t('designerPromptPlaceholder')}
                                disabled={!selectedCountry || isLoading}
                                className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                             <ActionButton
                                onClick={handleGenerate}
                                disabled={!prompt || isLoading || isPreparing}
                                className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 flex-grow"
                            >
                                {isLoading ? (
                                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> {t('aiThinking')}</>
                                ) : (
                                    <>{t('generate')}</>
                                )}
                            </ActionButton>
                            <ActionButton
                                onClick={handleReset}
                                disabled={!currentImage || isLoading}
                                className="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:ring-gray-400"
                            >
                                {t('reset')}
                            </ActionButton>
                             <ActionButton
                                onClick={handleDownload}
                                disabled={!currentImage || isLoading}
                                className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                            >
                                {t('download')}
                            </ActionButton>
                        </div>
                        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
                    </div>
                     {/* Right Side: Image Display */}
                    <div className="relative aspect-w-4 aspect-h-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg flex items-center justify-center p-2 shadow-inner">
                        {isPreparing ? (
                            <div className="text-center text-gray-500">
                               <svg className="animate-spin mx-auto h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                               <span>{t('designerPreparing')}</span>
                            </div>
                        ) : currentImage ? (
                            <img src={currentImage} alt={t('designerOutputAlt')} className="max-w-full max-h-full object-contain drop-shadow-lg" />
                        ) : (
                             <div className="text-center text-gray-500 p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="mt-2 text-sm">{t('designerStart')}</p>
                            </div>
                        )}
                         {isLoading && (
                            <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center transition-opacity">
                                <div className="w-16 h-16 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignerView;