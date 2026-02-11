
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';
import { COUNTRY_COLORS } from '../constants/colorData';
import type { Country } from '../types';
import { askVexy } from '../services/geminiService';
import { useAchievements } from '../context/AchievementContext';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'vexy';
    timestamp: Date;
    foundCountry?: Country;
    foundCountries?: Country[];
    suggestions?: string[];
    isTrivia?: boolean;
    dataPoint?: { label: string; value: string; icon: string };
}

interface VexyChatbotProps {
    countries: Country[];
    onNavigate: (view: any) => void;
    onSelectCountry: (country: Country) => void;
}

const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");

const VexyChatbot: React.FC<VexyChatbotProps> = ({ countries, onNavigate, onSelectCountry }) => {
    const { t, language } = useLanguage();
    const { trackVexyQuery } = useAchievements();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [lastContextCountry, setLastContextCountry] = useState<Country | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getCountryDisplayName = useCallback((c: Country) => {
        return language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common;
    }, [language]);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 1,
                text: language === 'pt' 
                    ? 'Olá! Sou o Vexy, seu guia de inteligência artificial pelo mundo das bandeiras. O que você quer descobrir hoje?' 
                    : 'Hello! I am Vexy, your AI guide through the world of flags. What would you like to discover today?',
                sender: 'vexy',
                timestamp: new Date(),
                suggestions: language === 'pt' 
                    ? ['Significado da bandeira do Brasil 🇧🇷', 'Bandeiras com estrelas ⭐', 'Curiosidade aleatória 💡'] 
                    : ['Meaning of the Brazilian flag 🇧🇷', 'Flags with stars ⭐', 'Random flag trivia 💡']
            }]);
        }
    }, [language, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, isTyping]);

    const findCountriesInText = (text: string): Country[] => {
        const found: Country[] = [];
        const seen = new Set<string>();
        const q = normalize(text);

        const sorted = [...countries].sort((a, b) => b.name.common.length - a.name.common.length);

        for (const c of sorted) {
            const namePT = normalize(c.translations?.por?.common || "");
            const nameEN = normalize(c.name.common);
            const code = c.cca3.toLowerCase();

            if ((q.includes(namePT) && namePT.length > 2) || (q.includes(nameEN) && nameEN.length > 2) || q.split(/\s+/).includes(code)) {
                if (!seen.has(c.cca3)) {
                    found.push(c);
                    seen.add(c.cca3);
                }
                if (found.length >= 2) break;
            }
        }
        return found;
    };

    // Main interaction logic leveraging Gemini AI
    const processQuery = async (text: string) => {
        const mentioned = findCountriesInText(text);
        const activeCountry = mentioned[0] || lastContextCountry;

        setIsTyping(true);
        trackVexyQuery(); // NOVO: Rastrear consulta
        const aiResponse = await askVexy(text, activeCountry);
        setIsTyping(false);

        if (activeCountry) setLastContextCountry(activeCountry);

        const vexyMsg: Message = {
            id: Date.now(),
            text: aiResponse,
            sender: 'vexy',
            timestamp: new Date(),
            foundCountry: mentioned[0],
            foundCountries: mentioned.length > 1 ? mentioned : undefined,
        };

        setMessages(prev => [...prev, vexyMsg]);
    };

    const handleSuggestion = (s: string) => {
        const cleanS = s.replace(/[^a-zA-Z0-9\s?]/g, "").trim();
        setInput(cleanS);
        const userMsg: Message = { id: Date.now(), text: s, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setTimeout(async () => {
            await processQuery(cleanS);
            setIsTyping(false);
            setInput('');
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;
        const userMsg: Message = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        await processQuery(currentInput);
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div className="w-[320px] sm:w-[420px] h-[600px] bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-fade-in-up pointer-events-auto mb-4 backdrop-blur-2xl">
                    <div className="p-6 bg-slate-900 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">🤖</div>
                            <div>
                                <h3 className="text-white font-black text-lg leading-tight">Vexy Gemini</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Enhanced AI Mode</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-5 space-y-6 no-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
                        {messages.map(m => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up-short`}>
                                <div className={`relative max-w-[85%] p-4 rounded-2xl text-sm font-bold leading-relaxed shadow-sm ${
                                    m.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700'
                                }`}>
                                    <div className="whitespace-pre-wrap">{m.text}</div>
                                    
                                    {m.foundCountry && m.sender === 'vexy' && (
                                        <div className="mt-4 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden group">
                                            <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer" onClick={() => onSelectCountry(m.foundCountry!)}>
                                                <img src={m.foundCountry.flags.svg} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            </div>
                                            <div className="p-2 text-center text-[9px] font-black uppercase text-slate-500">
                                                {getCountryDisplayName(m.foundCountry)}
                                            </div>
                                        </div>
                                    )}

                                    {m.foundCountries && m.sender === 'vexy' && (
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {m.foundCountries.map(c => (
                                                <div key={c.cca3} className="cursor-pointer group" onClick={() => onSelectCountry(c)}>
                                                    <div className="aspect-[3/2] rounded-lg overflow-hidden border border-black/10 dark:border-white/10 mb-1">
                                                        <img src={c.flags.svg} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="text-[8px] font-black truncate uppercase text-slate-500 text-center">
                                                        {getCountryDisplayName(c)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {m.sender === 'vexy' && m.suggestions && (
                                    <div className="flex flex-wrap gap-2 mt-3 pl-2">
                                        {m.suggestions.map((s, idx) => (
                                            <button key={idx} onClick={() => handleSuggestion(s)} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black text-blue-600 dark:text-sky-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 p-3 px-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 border border-slate-200 dark:border-slate-700">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 items-center shrink-0">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={language === 'pt' ? "Fale com o Vexy..." : "Ask Vexy something..."}
                            className="flex-grow bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl px-5 py-3 text-sm font-bold outline-none dark:text-white"
                        />
                        <button type="submit" disabled={isTyping} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-90 flex-shrink-0 disabled:opacity-50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-20 h-20 bg-blue-600 rounded-[2.2rem] shadow-2xl flex items-center justify-center text-4xl pointer-events-auto hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                <span className="relative z-10">{isOpen ? '✕' : '🤖'}</span>
            </button>
        </div>
    );
};

export default VexyChatbot;
