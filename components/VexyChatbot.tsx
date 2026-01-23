
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';
import { COUNTRY_COLORS } from '../constants/colorData';
import type { Country } from '../types';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'vexy';
    timestamp: Date;
    foundCountry?: Country;
    foundCountries?: Country[];
    suggestions?: string[];
    isTrivia?: boolean;
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

    const getCountryDisplayName = useCallback((c: Country) => {
        return language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common;
    }, [language]);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 1,
                text: language === 'pt' 
                    ? 'Saudações! Sou o Vexy Deep-Logic. Posso calcular recordes continentais, comparar nações com precisão matemática e te guiar pelas ferramentas do app. O que vamos analisar?' 
                    : 'Greetings! I am Vexy Deep-Logic. I can calculate continental records, compare nations with mathematical precision, and guide you through the app tools. What shall we analyze?',
                sender: 'vexy',
                timestamp: new Date(),
                suggestions: language === 'pt' ? ['Maior da Europa? 🌍', 'Brasil vs Japão ⚖️', 'Me conte um fato 💡'] : ['Largest in Europe? 🌍', 'USA vs China ⚖️', 'Tell me a fact 💡']
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

        countries.forEach(c => {
            const namePT = normalize(c.translations?.por?.common || "");
            const nameEN = normalize(c.name.common);
            const code = c.cca3.toLowerCase();

            if ((q.includes(namePT) && namePT.length > 3) || (q.includes(nameEN) && nameEN.length > 3) || q.split(' ').includes(code)) {
                if (!seen.has(c.cca3)) {
                    found.push(c);
                    seen.add(c.cca3);
                }
            }
        });
        return found;
    };

    const processQuery = (text: string) => {
        const q = normalize(text);
        let response = "";
        let foundCountry: Country | undefined;
        let foundCountries: Country[] | undefined;
        let suggestions: string[] = [];
        let isTrivia = false;

        const mentioned = findCountriesInText(text);
        const activeCountry = mentioned[0] || lastContextCountry;

        // --- 1. HEURÍSTICA DE REDIRECIONAMENTO (INTENT DETECTION) ---
        if (q.includes('jogar') || q.includes('quiz') || q.includes('game') || q.includes('testar')) {
            response = language === 'pt' 
                ? "Parece que você quer um desafio! O nosso Quiz Vexilológico tem vários modos, inclusive o 'Flagle' de adivinhação. Vamos lá?"
                : "Looks like you want a challenge! Our Vexillology Quiz has several modes, including the 'Flagle' guessing game. Shall we go?";
            suggestions = [language === 'pt' ? 'Ir para o Quiz 🏆' : 'Go to Quiz 🏆'];
        }
        else if (q.includes('desenhar') || q.includes('criar') || q.includes('fazer') && q.includes('bandeira')) {
            response = language === 'pt'
                ? "Solte sua criatividade! Temos uma Oficina de Heráldica onde você pode criar e exportar seu próprio design. Quer conhecer?"
                : "Unleash your creativity! We have a Heraldry Workshop where you can create and export your own design. Want to see it?";
            suggestions = [language === 'pt' ? 'Oficina de Design 🎨' : 'Design Workshop 🎨'];
        }

        // --- 2. HEURÍSTICA DE EXTREMOS CONTINENTAIS ---
        else if ((q.includes('maior') || q.includes('menor') || q.includes('populoso')) && 
                (q.includes('africa') || q.includes('europa') || q.includes('asia') || q.includes('oceania') || q.includes('america'))) {
            
            const regions = Object.keys(CONTINENT_NAMES).filter(r => r !== 'All' && r !== 'Favorites');
            const targetRegion = regions.find(r => q.includes(normalize(r)) || (language === 'pt' && q.includes(normalize(CONTINENT_NAMES[r].pt))));
            
            if (targetRegion) {
                const regionCountries = countries.filter(c => c.continents.includes(targetRegion));
                const sorted = [...regionCountries].sort((a, b) => q.includes('maior') ? b.area - a.area : q.includes('menor') ? a.area - b.area : b.population - a.population);
                const winner = sorted[0];
                const regionName = language === 'pt' ? CONTINENT_NAMES[targetRegion].pt : targetRegion;
                
                response = language === 'pt'
                    ? `Analisando a região de ${regionName}... O recordista é ${getCountryDisplayName(winner)}, com ${q.includes('populoso') ? winner.population.toLocaleString('pt-BR') + ' habitantes' : winner.area.toLocaleString('pt-BR') + ' km²'}.`
                    : `Analyzing ${regionName}... The record holder is ${getCountryDisplayName(winner)}, with ${q.includes('populoso') ? winner.population.toLocaleString('en-US') + ' people' : winner.area.toLocaleString('en-US') + ' km²'}.`;
                foundCountry = winner;
            }
        }

        // --- 3. HEURÍSTICA DE COMPARAÇÃO PROPORCIONAL ---
        else if (mentioned.length >= 2 || (mentioned.length === 1 && lastContextCountry && (q.includes('comparar') || q.includes('vs')))) {
            const c1 = mentioned[0];
            const c2 = mentioned[1] || lastContextCountry;
            if (c1 && c2 && c1.cca3 !== c2.cca3) {
                const n1 = getCountryDisplayName(c1);
                const n2 = getCountryDisplayName(c2);
                
                const areaRatio = c1.area > c2.area ? (c1.area / c2.area).toFixed(1) : (c2.area / c1.area).toFixed(1);
                const popRatio = c1.population > c2.population ? (c1.population / c2.population).toFixed(1) : (c2.population / c1.population).toFixed(1);
                const areaWinner = c1.area > c2.area ? n1 : n2;
                const popWinner = c1.population > c2.population ? n1 : n2;

                response = language === 'pt'
                    ? `⚖️ Análise Matemática:\n• ${areaWinner} é territorialmente ${areaRatio}x maior que seu par.\n• ${popWinner} tem uma população ${popRatio}x superior.\n\nQual desses você considera mais influente?`
                    : `⚖️ Mathematical Analysis:\n• ${areaWinner} is territorially ${areaRatio}x larger than its peer.\n• ${popWinner} has a population ${popRatio}x higher.\n\nWhich one do you consider more influential?`;
                foundCountries = [c1, c2];
            }
        }

        // --- 4. HEURÍSTICA DE CORES E DESIGN ---
        else if (q.includes('cor') || q.includes('verde') || q.includes('vermelho') || q.includes('azul') || q.includes('amarelo') || q.includes('preto') || q.includes('branco')) {
            const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'];
            const targetColor = colors.find(c => q.includes(normalize(c)) || (language === 'pt' && normalize(t(c.toLowerCase())).includes(q)));
            
            if (targetColor) {
                const matches = countries.filter(c => (COUNTRY_COLORS[c.cca3] || []).includes(targetColor)).slice(0, 5);
                response = language === 'pt'
                    ? `Muitas bandeiras usam ${t(targetColor.toLowerCase())}. Aqui estão 5 exemplos notáveis. Sabia que cada cor tem um significado histórico?`
                    : `Many flags use ${targetColor}. Here are 5 notable examples. Did you know each color has a historical meaning?`;
                foundCountries = matches;
                suggestions = [language === 'pt' ? 'Ver todos com essa cor 🎨' : 'See all with this color 🎨'];
            }
        }

        // --- 5. HEURÍSTICA DE TRIVIA LOCAL ---
        else if (q.includes('curiosidade') || q.includes('fato') || q.includes('trivia') || q.includes('me conte')) {
            const triviaList = language === 'pt' ? [
                "O Nepal é o único país cuja bandeira não é retangular nem quadrada.",
                "A bandeira das Filipinas é hasteada invertida (vermelho no topo) quando o país está em guerra.",
                "A Suíça e o Vaticano são os únicos países com bandeiras oficialmente quadradas.",
                "O Sol na bandeira da Argentina e do Uruguai representa o Sol de Maio, em referência à revolução de 1810.",
                "A bandeira do Canadá (Maple Leaf) só foi adotada oficialmente em 1965!"
            ] : [
                "Nepal is the only country whose flag is neither rectangular nor square.",
                "The Philippines flag is flown upside down (red on top) when the country is at war.",
                "Switzerland and Vatican City are the only countries with officially square flags.",
                "The Sun on Argentina and Uruguay's flags represents the Sun of May, referring to the 1810 revolution.",
                "The Canadian flag (Maple Leaf) was only officially adopted in 1965!"
            ];
            response = triviaList[Math.floor(Math.random() * triviaList.length)];
            isTrivia = true;
            suggestions = [language === 'pt' ? 'Outro fato! 💡' : 'Another fact! 💡'];
        }

        // --- 6. FALLBACK INTELIGENTE (SEM API) ---
        if (!response) {
            if (mentioned.length === 1) {
                foundCountry = mentioned[0];
                setLastContextCountry(foundCountry);
                response = language === 'pt' 
                    ? `Encontrei ${getCountryDisplayName(foundCountry)}! Posso te dar a capital, a população ou comparar com outro país. O que prefere?`
                    : `I found ${getCountryDisplayName(foundCountry)}! I can give you the capital, population, or compare it with another country. What do you prefer?`;
                suggestions = ['Capital', 'População', 'Mapa'];
            } else {
                const random = countries[Math.floor(Math.random() * countries.length)];
                response = language === 'pt'
                    ? `Não consegui processar essa pergunta específica, mas meu banco de dados sugere explorarmos ${getCountryDisplayName(random)}. Deseja ver os detalhes?`
                    : `I couldn't process that specific question, but my database suggests we explore ${getCountryDisplayName(random)}. Want to see the details?`;
                foundCountry = random;
                suggestions = [language === 'pt' ? 'Sim, mostrar! ✅' : 'Yes, show it! ✅', 'Jogar Quiz 🏆'];
            }
        }

        const vexyMsg: Message = {
            id: Date.now(),
            text: response,
            sender: 'vexy',
            timestamp: new Date(),
            foundCountry,
            foundCountries,
            isTrivia,
            suggestions: suggestions.length > 0 ? suggestions : undefined
        };

        setMessages(prev => [...prev, vexyMsg]);
    };

    const handleSuggestion = (s: string) => {
        if (s.includes('Quiz')) { onNavigate('quiz'); return; }
        if (s.includes('Design')) { onNavigate('designer'); return; }
        if (s.includes('cor')) { onNavigate('discover'); return; }
        
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
                <div className="w-[320px] sm:w-[440px] h-[680px] bg-white/95 dark:bg-slate-950/95 border-2 border-blue-500/20 rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-fade-in-up pointer-events-auto mb-4 backdrop-blur-3xl">
                    {/* Omni-Logic Header */}
                    <div className="p-8 bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg width="100%" height="100%"><pattern id="grid-omni" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#grid-omni)"/></svg>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-3xl animate-float border border-white/20">🤖</div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1">Vexy Deep</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.5)]"></span>
                                    <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.25em]">Local Heuristic v6</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="relative z-10 p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                        {messages.map(m => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up-short`}>
                                <div className={`relative max-w-[92%] p-5 rounded-[2.2rem] text-sm font-bold leading-relaxed shadow-xl ${
                                    m.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : m.isTrivia 
                                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border-2 border-amber-400/30'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700'
                                }`}>
                                    <div className="whitespace-pre-wrap">{m.text}</div>
                                    
                                    {m.foundCountry && m.sender === 'vexy' && (
                                        <div className="mt-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-[1.8rem] border border-black/5 dark:border-white/5 overflow-hidden group">
                                            <div className="relative aspect-video rounded-[1.5rem] overflow-hidden">
                                                <img src={m.foundCountry.flags.svg} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            </div>
                                            <div className="p-3">
                                                <button onClick={() => onSelectCountry(m.foundCountry!)} className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest active:scale-95">REVELAR DETALHES</button>
                                            </div>
                                        </div>
                                    )}

                                    {m.foundCountries && m.sender === 'vexy' && (
                                        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                            {m.foundCountries.map(c => (
                                                <div key={c.cca3} className="flex-shrink-0 w-24 group cursor-pointer" onClick={() => onSelectCountry(c)}>
                                                    <div className="aspect-[3/2] rounded-lg overflow-hidden border border-black/10 dark:border-white/10 mb-2 transition-transform group-hover:-translate-y-1">
                                                        <img src={c.flags.svg} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="text-[8px] font-black truncate uppercase text-slate-500 dark:text-slate-400 text-center">
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
                                            <button key={idx} onClick={() => handleSuggestion(s)} className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black text-blue-600 dark:text-sky-400 hover:bg-blue-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white transition-all shadow-sm active:scale-90">
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

                    {/* AI Input Field */}
                    <form onSubmit={handleSubmit} className="p-7 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-3 items-center">
                        <div className="relative flex-grow">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={language === 'pt' ? "Compare nações ou peça um fato..." : "Compare nations or ask for a fact..."}
                                className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-[1.8rem] px-6 py-4 text-sm font-bold outline-none dark:text-white transition-all shadow-inner"
                            />
                        </div>
                        <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 active:scale-90 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Chat Trigger Button */}
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
