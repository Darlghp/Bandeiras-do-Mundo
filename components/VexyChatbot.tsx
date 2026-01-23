
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Country } from '../types';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'vexy';
    timestamp: Date;
    foundCountry?: Country;
    suggestions?: string[];
}

interface VexyChatbotProps {
    countries: Country[];
    onNavigate: (view: any) => void;
    onSelectCountry: (country: Country) => void;
}

const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "");

const VexyChatbot: React.FC<VexyChatbotProps> = ({ countries, onNavigate, onSelectCountry }) => {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [lastContextCountry, setLastContextCountry] = useState<Country | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 1,
                text: language === 'pt' 
                    ? 'Saudações! Sou o Vexy Omni. Sou capaz de analisar estatísticas globais, decifrar heráldica e encontrar curiosidades sobre qualquer nação. O que deseja consultar no registro mundial?' 
                    : 'Greetings! I am Vexy Omni. I can analyze global stats, decipher heraldry, and find curiosities about any nation. What would you like to consult in the world registry?',
                sender: 'vexy',
                timestamp: new Date(),
                suggestions: language === 'pt' ? ['País mais populoso 📈', 'Menor país do mundo 🗺️', 'Fato aleatório 💡'] : ['Most populous country 📈', 'Smallest country 🗺️', 'Random fact 💡']
            }]);
        }
    }, [language, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, isTyping]);

    const getCountryDisplayName = useCallback((c: Country) => {
        return language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common;
    }, [language]);

    const findBestMatch = (query: string): Country | null => {
        const q = normalize(query);
        if (q.length < 2) return null;
        let best: Country | null = null;
        let highestScore = 0;

        countries.forEach(c => {
            let score = 0;
            const namePT = normalize(c.translations?.por?.common || "");
            const nameEN = normalize(c.name.common);
            const code = c.cca3.toLowerCase();
            if (q === code) score += 100;
            if (q === namePT || q === nameEN) score += 95;
            if (q.includes(namePT) || q.includes(nameEN)) score += 40;
            if (score > highestScore) {
                highestScore = score;
                best = c;
            }
        });
        return highestScore > 15 ? best : null;
    };

    const processQuery = (text: string) => {
        const q = normalize(text);
        let response = "";
        let found: Country | null = findBestMatch(text);
        let suggestions: string[] = [];
        let action: (() => void) | null = null;

        // 1. LÓGICA DE SUPERLATIVOS (MAIOR, MENOR, MAIS POVOADO)
        const sortedByArea = [...countries].sort((a, b) => b.area - a.area);
        const sortedByPop = [...countries].sort((a, b) => b.population - a.population);
        const sortedByDensity = [...countries].filter(c => c.area > 0).sort((a, b) => (b.population / b.area) - (a.population / a.area));

        if (q.includes('maior') && (q.includes('pais') || q.includes('area') || q.includes('territorio'))) {
            found = sortedByArea[0];
            response = language === 'pt' 
                ? `O gigante incontestável é ${getCountryDisplayName(found)}, com incríveis ${found.area.toLocaleString('pt-BR')} km². Quer ver onde fica no mapa?`
                : `The undisputed giant is ${getCountryDisplayName(found)}, with an incredible ${found.area.toLocaleString('en-US')} km². Want to see it on the map?`;
            suggestions = [language === 'pt' ? 'E o segundo maior?' : 'What about the second?'];
        }
        else if (q.includes('menor') && (q.includes('pais') || q.includes('area'))) {
            found = sortedByArea.filter(c => c.area > 0).sort((a, b) => a.area - b.area)[0];
            response = language === 'pt'
                ? `${getCountryDisplayName(found)} é o menor estado soberano do mundo, ocupando apenas ${found.area.toLocaleString('pt-BR')} km².`
                : `${getCountryDisplayName(found)} is the world's smallest sovereign state, covering just ${found.area.toLocaleString('en-US')} km².`;
        }
        else if (q.includes('mais') && (q.includes('populoso') || q.includes('gente') || q.includes('habitante'))) {
            found = sortedByPop[0];
            response = language === 'pt'
                ? `Atualmente, ${getCountryDisplayName(found)} lidera o ranking populacional com mais de ${found.population.toLocaleString('pt-BR')} pessoas!`
                : `Currently, ${getCountryDisplayName(found)} leads the population ranking with over ${found.population.toLocaleString('en-US')} people!`;
        }
        else if (q.includes('densidade') || q.includes('denso')) {
            found = sortedByDensity[0];
            response = language === 'pt'
                ? `${getCountryDisplayName(found)} é o país com maior densidade demográfica. Imagine que apertado!`
                : `${getCountryDisplayName(found)} is the country with the highest population density. Imagine how crowded!`;
        }

        // 2. LÓGICA DE HERÁLDICA (SÍMBOLOS)
        else if (q.includes('sol') || q.includes('lua') || q.includes('estrela') || q.includes('cruz') || q.includes('animal')) {
            const symbol = q.includes('sol') ? 'Sun' : q.includes('lua') ? 'Crescent' : q.includes('estrela') ? 'Star' : q.includes('cruz') ? 'Cross' : 'Animal';
            response = language === 'pt'
                ? `Interessante! Muitas nações usam esse símbolo. Quer explorar nossa seção dedicada ao Simbolismo Vexilológico?`
                : `Interesting! Many nations use this symbol. Would you like to explore our Vexillological Symbolism section?`;
            suggestions = [language === 'pt' ? 'Ver Simbolismo 🎨' : 'View Symbolism 🎨'];
            action = () => onNavigate('discover');
        }

        // 3. CONTEXTO E PRONOMES
        const activeCountry = found || (['ele', 'ela', 'dele', 'dela', 'it', 'him', 'her'].some(w => q.split(' ').includes(w)) ? lastContextCountry : null);

        if (activeCountry && !response) {
            setLastContextCountry(activeCountry);
            const name = getCountryDisplayName(activeCountry);
            found = activeCountry;

            // Variância de Respostas para Capitais
            if (q.includes('capital')) {
                const caps = [
                    language === 'pt' ? `A capital de ${name} é ${activeCountry.capital?.[0]}.` : `The capital of ${name} is ${activeCountry.capital?.[0]}.`,
                    language === 'pt' ? `O coração político de ${name} fica em ${activeCountry.capital?.[0]}.` : `The political heart of ${name} is in ${activeCountry.capital?.[0]}.`,
                    language === 'pt' ? `${activeCountry.capital?.[0]} é a cidade principal de ${name}.` : `${activeCountry.capital?.[0]} is the main city of ${name}.`
                ];
                response = caps[Math.floor(Math.random() * caps.length)];
            } else if (q.includes('historia') || q.includes('significado') || q.includes('fato')) {
                const descKey = `${activeCountry.name.common.toLowerCase().replace(/\s/g, '')}FlagDesc`;
                const story = t(descKey);
                response = (story && story !== descKey) ? story : (language === 'pt' ? `A bandeira de ${name} é um ícone de orgulho nacional.` : `The flag of ${name} is an icon of national pride.`);
            } else {
                response = language === 'pt' ? `Deseja saber mais sobre ${name}? Posso te levar aos detalhes ou mostrar no mapa.` : `Want to know more about ${name}? I can show you the details or locate it on the map.`;
                suggestions = language === 'pt' ? ['Ver Detalhes 🔍', 'Mapa 📍', 'Comparar ⚖️'] : ['Details 🔍', 'Map 📍', 'Compare ⚖️'];
            }
        }

        // 4. FALLBACK INTELIGENTE (EFEITO IA)
        if (!response) {
            if (q.includes('oi') || q.includes('ola') || q.includes('hello') || q.includes('bom dia')) {
                response = language === 'pt' ? "Olá explorador! Estou pronto para analisar qualquer bandeira. Qual sua dúvida?" : "Hello explorer! I'm ready to analyze any flag. What's on your mind?";
            } else if (q.includes('obrigado') || q.includes('vlw') || q.includes('thanks')) {
                response = language === 'pt' ? "Por nada! A heráldica é minha paixão. Algo mais?" : "You're welcome! Heraldry is my passion. Anything else?";
            } else {
                // Tentativa de resgate com sugestão aleatória
                const randomCountry = countries[Math.floor(Math.random() * countries.length)];
                response = language === 'pt' 
                    ? `Hum, não tenho esses dados exatos no meu cache local. Que tal falarmos sobre ${getCountryDisplayName(randomCountry)}?`
                    : `Hmm, I don't have that exact data in my local cache. How about we talk about ${getCountryDisplayName(randomCountry)}?`;
                suggestions = language === 'pt' ? ['Pode ser!', 'Me conte um fato curioso 💡'] : ['Sure!', 'Tell me a fun fact 💡'];
                found = randomCountry;
            }
        }

        const vexyMsg: Message = {
            id: Date.now(),
            text: response,
            sender: 'vexy',
            timestamp: new Date(),
            foundCountry: found || undefined,
            suggestions: suggestions.length > 0 ? suggestions : undefined
        };

        setMessages(prev => [...prev, vexyMsg]);
        if (action && !q.includes('capital')) {
            setTimeout(action, 2200);
        }
    };

    const handleSuggestion = (s: string) => {
        const cleanS = s.replace(/[^a-zA-Z0-9\s]/g, "").trim();
        setInput(cleanS);
        const userMsg: Message = { id: Date.now(), text: s, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setTimeout(() => {
            processQuery(cleanS);
            setIsTyping(false);
            setInput('');
        }, 800);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userMsg: Message = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            processQuery(currentInput);
            setIsTyping(false);
        }, 800);
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div className="w-[320px] sm:w-[420px] h-[640px] bg-white/95 dark:bg-slate-950/95 border-2 border-blue-500/20 rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-fade-in-up pointer-events-auto mb-4 backdrop-blur-3xl">
                    {/* Omni Header */}
                    <div className="p-8 bg-gradient-to-br from-indigo-600 via-blue-800 to-slate-900 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg width="100%" height="100%"><pattern id="grid-omni" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#grid-omni)"/></svg>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-3xl animate-float border border-white/20">🤖</div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1">Vexy Omni</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                                    <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.25em]">Cérebro Local v3</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="relative z-10 p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                        {messages.map(m => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up-short`}>
                                <div className={`relative max-w-[92%] p-5 rounded-[2.2rem] text-sm font-bold leading-relaxed shadow-xl ${
                                    m.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700'
                                }`}>
                                    {m.text}
                                    {m.foundCountry && m.sender === 'vexy' && (
                                        <div className="mt-5 p-1 bg-slate-100 dark:bg-slate-950 rounded-[1.8rem] border border-black/5 dark:border-white/5 overflow-hidden group">
                                            <div className="relative aspect-video rounded-[1.5rem] overflow-hidden">
                                                <img src={m.foundCountry.flags.svg} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                            </div>
                                            <div className="p-3 grid grid-cols-2 gap-2">
                                                <button onClick={() => onSelectCountry(m.foundCountry!)} className="py-2.5 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest active:scale-95">INFO</button>
                                                <a href={m.foundCountry.maps.googleMaps} target="_blank" className="py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-xl hover:text-blue-500 transition-all text-center uppercase tracking-widest active:scale-95">MAPA</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {m.sender === 'vexy' && m.suggestions && (
                                    <div className="flex flex-wrap gap-2 mt-3 pl-2">
                                        {m.suggestions.map((s, idx) => (
                                            <button key={idx} onClick={() => handleSuggestion(s)} className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black text-blue-600 dark:text-sky-400 hover:bg-blue-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white transition-all shadow-sm">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start animate-fade-in-up-short">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.2rem] rounded-tl-none shadow-lg flex gap-1.5 border border-slate-200/50 dark:border-slate-700">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input System */}
                    <form onSubmit={handleSubmit} className="p-7 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-3 items-center">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={language === 'pt' ? "Fale com o Vexy Omni..." : "Talk to Vexy Omni..."}
                            className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-[1.8rem] px-6 py-4 text-sm font-bold outline-none dark:text-white transition-all shadow-inner"
                        />
                        <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 active:scale-90 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-24 h-24 bg-blue-600 rounded-[2.8rem] shadow-[0_25px_60px_rgba(37,99,235,0.4)] flex items-center justify-center text-5xl pointer-events-auto hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-slate-800 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                <span className="relative z-10">{isOpen ? '✕' : '🤖'}</span>
            </button>
        </div>
    );
};

export default VexyChatbot;
