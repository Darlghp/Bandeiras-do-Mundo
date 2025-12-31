
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAchievements } from '../context/AchievementContext';
import { FLAG_COLORS } from '../constants';

type Layout = 'bicolor-h' | 'bicolor-v' | 'tricolor-h' | 'tricolor-v' | 'nordic-cross';
type Symbol = 'none' | 'star' | 'circle';
type Color = keyof typeof FLAG_COLORS;

interface FlagState {
    layout: Layout;
    colors: Color[];
    symbol: Symbol;
    symbolColor: Color;
}

const colorOptions = Object.keys(FLAG_COLORS) as Color[];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateRandomFlag = (): FlagState => {
    const layout = getRandomItem<Layout>(['bicolor-h', 'bicolor-v', 'tricolor-h', 'tricolor-v', 'nordic-cross']);
    const numColors = layout.includes('tricolor') ? 3 : 2;
    const colors: Color[] = [];
    while (colors.length < numColors) {
        const randomColor = getRandomItem(colorOptions);
        if (!colors.includes(randomColor)) {
            colors.push(randomColor);
        }
    }
    const symbol = getRandomItem<Symbol>(['none', 'star', 'circle']);
    const symbolColor = getRandomItem(colorOptions.filter(c => !colors.includes(c)));

    return { layout, colors, symbol, symbolColor };
};


const FlagPreview: React.FC<{ design: FlagState }> = ({ design }) => {
    const { layout, colors, symbol, symbolColor } = design;

    const renderSymbol = () => {
        if (symbol === 'none') return null;
        const fill = FLAG_COLORS[symbolColor];
        if (symbol === 'star') {
            return <path fill={fill} d="M50 15L61.2 35.5L84.5 39.3L67.3 55.4L71.6 78.7L50 67.5L28.4 78.7L32.7 55.4L15.5 39.3L38.8 35.5L50 15Z" />;
        }
        if (symbol === 'circle') {
            return <circle cx="50" cy="50" r="15" fill={fill} />;
        }
        return null;
    };
    
    return (
        <div className="w-full aspect-[5/3] bg-gray-200 dark:bg-slate-700 rounded-lg shadow-inner overflow-hidden">
            <svg viewBox="0 0 100 60" className="w-full h-full" id="flag-svg">
                <defs>
                    <clipPath id="flag-clip"><rect width="100" height="60" /></clipPath>
                </defs>
                <g clipPath="url(#flag-clip)">
                    {layout === 'bicolor-h' && <>
                        <rect width="100" height="30" fill={FLAG_COLORS[colors[0]]} />
                        <rect y="30" width="100" height="30" fill={FLAG_COLORS[colors[1]]} />
                    </>}
                    {layout === 'bicolor-v' && <>
                        <rect width="50" height="60" fill={FLAG_COLORS[colors[0]]} />
                        <rect x="50" width="50" height="60" fill={FLAG_COLORS[colors[1]]} />
                    </>}
                    {layout === 'tricolor-h' && <>
                        <rect width="100" height="20" fill={FLAG_COLORS[colors[0]]} />
                        <rect y="20" width="100" height="20" fill={FLAG_COLORS[colors[1]]} />
                        <rect y="40" width="100" height="20" fill={FLAG_COLORS[colors[2]]} />
                    </>}
                    {layout === 'tricolor-v' && <>
                        <rect width="33.33" height="60" fill={FLAG_COLORS[colors[0]]} />
                        <rect x="33.33" width="33.34" height="60" fill={FLAG_COLORS[colors[1]]} />
                        <rect x="66.67" width="33.33" height="60" fill={FLAG_COLORS[colors[2]]} />
                    </>}
                    {layout === 'nordic-cross' && <>
                        <rect width="100" height="60" fill={FLAG_COLORS[colors[0]]} />
                        <rect y="24" width="100" height="12" fill={FLAG_COLORS[colors[1]]} />
                        <rect x="30" width="12" height="60" fill={FLAG_COLORS[colors[1]]} />
                    </>}
                </g>
                {renderSymbol()}
            </svg>
        </div>
    );
};

const ColorPicker: React.FC<{ label: string, selectedColor: Color, onChange: (color: Color) => void }> = ({ label, selectedColor, onChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <div className="grid grid-cols-6 gap-2">
                {colorOptions.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={`w-full aspect-square rounded-md border-2 transition-transform transform hover:scale-110 ${selectedColor === color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent'}`}
                        style={{ backgroundColor: FLAG_COLORS[color] }}
                        // FIX: Explicitly cast `color` to a string for the `aria-label` attribute to resolve the type error.
                        aria-label={String(color)}
                        aria-pressed={selectedColor === color}
                    />
                ))}
            </div>
        </div>
    );
};


const DesignerView: React.FC = () => {
    const { t } = useLanguage();
    const { trackDesign } = useAchievements();
    const [design, setDesign] = useState<FlagState>(generateRandomFlag);

    const handleDownload = useCallback(() => {
        const svg = document.getElementById('flag-svg');
        if (svg) {
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            const a = document.createElement("a");
            a.href = url;
            a.download = "my-flag.svg";
            a.click();
            
            // Track successful design for achievements
            trackDesign();
        }
    }, [trackDesign]);

    const layoutOptions: { id: Layout, label: string }[] = useMemo(() => [
        { id: 'bicolor-h', label: t('bicolorHorizontal') },
        { id: 'bicolor-v', label: t('bicolorVertical') },
        { id: 'tricolor-h', label: t('tricolorHorizontal') },
        { id: 'tricolor-v', label: t('tricolorVertical') },
        { id: 'nordic-cross', label: t('nordicCross') },
    ], [t]);

    const symbolOptions: { id: Symbol, label: string }[] = useMemo(() => [
        { id: 'none', label: t('noSymbol') },
        { id: 'star', label: t('star') },
        { id: 'circle', label: t('circle') },
    ], [t]);

    const handleLayoutChange = (newLayout: Layout) => {
        setDesign(prev => {
            const prevNumColors = prev.layout.includes('tricolor') ? 3 : 2;
            const newNumColors = newLayout.includes('tricolor') ? 3 : 2;
            let newColors = [...prev.colors];
            if (newNumColors > prevNumColors) {
                const availableColors = colorOptions.filter(c => !newColors.includes(c));
                newColors.push(getRandomItem(availableColors));
            } else if (newNumColors < prevNumColors) {
                newColors = newColors.slice(0, newNumColors);
            }
            return { ...prev, layout: newLayout, colors: newColors };
        });
    };

    const handleColorChange = (index: number, color: Color) => {
        setDesign(prev => {
            const newColors = [...prev.colors];
            newColors[index] = color;
            return { ...prev, colors: newColors };
        });
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('flagDesignerTitle')}</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('flagDesignerSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <FlagPreview design={design} />
                </div>
                
                <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                    <div>
                        <label htmlFor="layout-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('layout')}</label>
                        <select id="layout-select" value={design.layout} onChange={e => handleLayoutChange(e.target.value as Layout)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            {layoutOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('colors')}</h3>
                        {design.layout.includes('nordic-cross') ? (
                            <>
                               <ColorPicker label={t('mainColor')} selectedColor={design.colors[0]} onChange={c => handleColorChange(0, c)} />
                               <ColorPicker label={t('crossColor')} selectedColor={design.colors[1]} onChange={c => handleColorChange(1, c)} />
                            </>
                        ) : (
                            design.colors.map((_, index) => (
                                <ColorPicker key={index} label={t('colorN', { n: (index + 1).toString() })} selectedColor={design.colors[index]} onChange={c => handleColorChange(index, c)} />
                            ))
                        )}
                    </div>

                     <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('symbol')}</h3>
                         <div>
                            <label htmlFor="symbol-select" className="sr-only">{t('symbol')}</label>
                            <select id="symbol-select" value={design.symbol} onChange={e => setDesign(d => ({ ...d, symbol: e.target.value as Symbol }))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                {symbolOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                            </select>
                        </div>
                        {design.symbol !== 'none' && (
                            <ColorPicker label={t('symbolColor')} selectedColor={design.symbolColor} onChange={c => setDesign(d => ({ ...d, symbolColor: c }))} />
                        )}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-4">
                         <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('actions')}</h3>
                         <div className="flex gap-4">
                            <button type="button" onClick={() => setDesign(generateRandomFlag())} className="w-full flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800">
                                {t('randomize')}
                            </button>
                            <button type="button" onClick={handleDownload} className="w-full flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800">
                                {t('download')}
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignerView;
