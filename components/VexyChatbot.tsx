
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Country } from '../types';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'vexy';
    timestamp: Date;
    foundCountry?: Country;
}

interface VexyChatbotProps {
    countries: Country[];
    onNavigate: (view: any) => void;
    onSelectCountry: (country: Country) => void;
}

const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const VexyChatbot: React.FC<VexyChatbotProps> = ({ countries, onNavigate, onSelectCountry }) => {
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: language === 'pt' 
                ? 'Olá! Eu sou o Vexy. Quer saber o significado de alguma bandeira ou uma curiosidade histórica? É só perguntar!' 
                : 'Hi! I am Vexy. Want to know the meaning of a flag or a historical curiosity? Just ask!',
            sender: 'vexy',
            timestamp: new Date()
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const getCountryDisplayName = useCallback((c: Country) => {
        return language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common;
    }, [language]);

    const findBestCountryMatch = (query: string): Country | null => {
        const q = normalize(query);
        if (!q) return null;

        const scoredCountries = countries.map(c => {
            let score = 0;
            const namePT = normalize(c.translations?.por?.common || "");
            const officialPT = normalize(c.translations?.por?.official || "");
            const nameEN = normalize(c.name.common);
            const officialEN = normalize(c.name.official);
            const code = c.cca3.toLowerCase();
            const capitals = (c.capital || []).map(cap => normalize(cap));

            if (q === code) score += 100;
            if (q === namePT || q === nameEN) score += 90;
            if (q === officialPT || q === officialEN) score += 85;
            if (capitals.includes(q)) score += 80;

            const words = q.split(/\s+/);
            if (words.includes(namePT) || words.includes(nameEN)) score += 60;

            if (q.length > 3) {
                if (namePT.includes(q) || nameEN.includes(q)) score += 30;
            }

            return { country: c, score };
        });

        const best = scoredCountries.sort((a, b) => b.score - a.score)[0];
        return (best && best.score > 0) ? best.country : null;
    };

    const processMessage = (text: string) => {
        const query = normalize(text);
        let response = "";
        let foundCountry: Country | null = null;
        let action: (() => void) | null = null;

        const isAskingForFact = query.includes('fato') || query.includes('curiosidade') || query.includes('historia') || 
                               query.includes('significado') || query.includes('fact') || query.includes('curiosity') || 
                               query.includes('meaning') || query.includes('story');

        // 1. Curiosidade Aleatória Geral
        if (isAskingForFact && query.length < 15 && !findBestCountryMatch(text)) {
            try {
                const facts = JSON.parse(t('flagFactsList'));
                const randomFact = facts[Math.floor(Math.random() * facts.length)];
                // Remove markdown bold (**) para o chat ficar limpo
                response = randomFact.replace(/\*\*/g, "");
            } catch (e) {
                response = language === 'pt' ? "Você sabia que a bandeira da Dinamarca é a mais antiga em uso contínuo?" : "Did you know that Denmark's flag is the oldest in continuous use?";
            }
        } 
        // 2. Comandos estatísticos (População/Área)
        else if (query.includes('maior populacao') || query.includes('mais populoso') || query.includes('most populous')) {
            foundCountry = [...countries].sort((a, b) => b.population - a.population)[0];
            response = language === 'pt'
                ? `O gigante populacional é ${getCountryDisplayName(foundCountry)} com ${foundCountry.population.toLocaleString('pt-BR')} pessoas!`
                : `${getCountryDisplayName(foundCountry)} is the population leader with ${foundCountry.population.toLocaleString('en-US')} people!`;
        } 
        else if (query.includes('maior pais') || query.includes('territorio') || query.includes('biggest country')) {
            foundCountry = [...countries].sort((a, b) => b.area - a.area)[0];
            response = language === 'pt'
                ? `${getCountryDisplayName(foundCountry)} tem a maior área terrestre do mundo!`
                : `${getCountryDisplayName(foundCountry)} has the largest land area in the world!`;
        }
        // 3. Busca de País (com ou sem pedido de fato)
        else {
            foundCountry = findBestCountryMatch(text);
            
            if (foundCountry) {
                const name = getCountryDisplayName(foundCountry);
                
                if (isAskingForFact) {
                    // Tentar pegar descrição específica do arquivo de tradução
                    // A maioria dos nomes em português no contexto termina em 'FlagDesc'
                    // Ex: 'brazilFlagDesc', 'nepalFlagDesc'
                    const descKey = `${foundCountry.name.common.toLowerCase().replace(/\s/g, '')}FlagDesc`;
                    const fact = t(descKey);

                    if (fact && fact !== descKey) {
                        response = fact;
                    } else {
                        response = language === 'pt' 
                            ? `Sobre ${name}: A capital é ${foundCountry.capital?.[0] || 'não informada'} e fica na região de ${foundCountry.continents[0]}. Quer ver os detalhes?` 
                            : `About ${name}: The capital is ${foundCountry.capital?.[0] || 'N/A'} and it's located in ${foundCountry.continents[0]}. Want to see details?`;
                    }
                } else {
                    response = language === 'pt'
                        ? `Encontrei! Preparando para mostrar a bandeira de ${name}...`
                        : `Found it! Getting ready to show you the flag of ${name}...`;
                }
                action = () => onSelectCountry(foundCountry!);
            } else {
                response = language === 'pt'
                    ? "Não consegui identificar esse país ou fato. Tente perguntar 'Me conte um fato' ou 'História da bandeira do Japão'."
                    : "I couldn't identify that country or fact. Try asking 'Tell me a fact' or 'History of the flag of Japan'.";
            }
        }

        const vexyMessage: Message = {
            id: Date.now(),
            text: response,
            sender: 'vexy',
            timestamp: new Date(),
            foundCountry: foundCountry || undefined
        };

        setMessages(prev => [...prev, vexyMessage]);
        if (action) setTimeout(action, 1800);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTimeout(() => processMessage(userMsg.text), 600);
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end pointer-events-none">
            {isOpen && (
                <div className="w-[320px] sm:w-[400px] h-[550px] bg-white dark:bg-slate-950 border-2 border-blue-500/30 rounded-[2.8rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-fade-in-up pointer-events-auto mb-4 backdrop-blur-2xl">
                    <div className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg width="100%" height="100%"><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#grid)"/></svg>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-float border border-white/20 backdrop-blur-md shadow-inner">🤖</div>
                            <div>
                                <h3 className="text-white font-black text-base tracking-tight leading-none mb-1">Vexy Specialist</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em]">Especialista em Fatos</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="relative z-10 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 space-y-5 no-scrollbar bg-slate-50 dark:bg-slate-900/30">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up-short`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-bold leading-relaxed shadow-sm ${
                                    m.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700'
                                }`}>
                                    {m.text}
                                    
                                    {m.foundCountry && (
                                        <div className="mt-4 p-2 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                                            <img 
                                                src={m.foundCountry.flags.svg} 
                                                alt="" 
                                                className="w-full h-24 object-cover rounded-xl shadow-md"
                                            />
                                            <div className="mt-2 text-center text-[10px] uppercase tracking-widest opacity-70">
                                                {getCountryDisplayName(m.foundCountry)}
                                            </div>
                                        </div>
                                    )}

                                    <div className={`text-[8px] mt-2 opacity-50 font-black ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={language === 'pt' ? "Peça um fato ou história de um país..." : "Ask for a fact or country history..."}
                            className="flex-grow bg-slate-100 dark:bg-slate-900 border-none rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all shadow-inner"
                        />
                        <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-90">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                    </form>
                </div>
            )}

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-20 h-20 bg-blue-600 rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-center text-4xl pointer-events-auto hover:scale-110 active:scale-90 transition-all border-4 border-white dark:border-slate-800 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                {isOpen ? '✕' : '🤖'}
            </button>
        </div>
    );
};

export default VexyChatbot;
