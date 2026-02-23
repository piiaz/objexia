'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import ObjexiaLogo from './ObjexiaLogo'

type Command = {
    id: string
    title: string
    shortcut?: string
    section: string
    action: () => void
    icon: React.ReactNode
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const [roadmapContext, setRoadmapContext] = useState<{items: any[], milestones: any[], groups: any[]}>({ items: [], milestones: [], groups: [] })
    const [allRoadmaps, setAllRoadmaps] = useState<any[]>([]) 
    
    // --- NEW: Sequence buffer for shortcuts like "G D" ---
    const [keySequence, setKeySequence] = useState<string[]>([])
    const sequenceTimeout = useRef<NodeJS.Timeout | null>(null)

    const { logout, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        const handleTimelineData = (e: any) => setRoadmapContext(e.detail);
        const handleRoadmapList = (e: any) => setAllRoadmaps(e.detail.roadmaps || []);
        window.addEventListener('objexia-roadmap-data', handleTimelineData);
        window.addEventListener('objexia-roadmap-list', handleRoadmapList);
        return () => {
            window.removeEventListener('objexia-roadmap-data', handleTimelineData);
            window.removeEventListener('objexia-roadmap-list', handleRoadmapList);
        }
    }, []);

    const commands: Command[] = useMemo(() => {
        const baseCommands: Command[] = [
                        {
                id: 'jump-today',
                title: 'Jump to Today',
                shortcut: 'J', // New shortcut for easy navigation
                section: 'Navigation',
                action: () => {
                    // Triggers the existing logic in Timeline.tsx
                    const event = new CustomEvent('objexia-jump-today');
                    window.dispatchEvent(event);
                },
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line></svg>
            },
            {
                id: 'dashboard',
                title: 'Go to Dashboard',
                shortcut: 'D', // The sequence shortcut
                section: 'Navigation',
                action: () => router.push('/dashboard'),
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            },
            {
    id: 'theme',
    title: 'Toggle Dark Mode',
    shortcut: 'T',
    section: 'Settings',
    action: () => {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        
        // Apply classes to the DOM
        document.documentElement.classList.toggle('dark');
        document.body.classList.toggle('dark');
        
        // Save to local storage
        localStorage.setItem('roadmap_theme', newTheme);
        
        // BROADCAST: Notify the ThemeToggle component to update its icon
        window.dispatchEvent(new CustomEvent('objexia-theme-change', { detail: { theme: newTheme } }));
    },
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
},
            {
                id: 'profile',
                title: 'View Profile',
                shortcut: 'P',
                section: 'Settings',
                action: () => router.push('/profile'),
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            },
            {
                id: 'logout',
                title: 'Sign Out',
                section: 'Account',
                action: () => logout(),
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            }
        ];

        const roadmapNavCommands: Command[] = allRoadmaps.map(roadmap => ({
            id: `nav-${roadmap.id}`,
            title: `Open: ${roadmap.title}`,
            section: 'Roadmaps',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
            action: () => router.push(`/roadmap/${roadmap.id}`)
        }));

        const trackCommands: Command[] = roadmapContext.groups.map(track => ({
            id: `track-${track.id}`,
            title: `Jump to Track: ${track.title}`,
            section: 'Tracks',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
            action: () => {
                const el = document.getElementById(track.id);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    el.classList.add('ring-4', 'ring-[#3f407e]', 'dark:ring-[#b3bbea]', 'ring-offset-4', 'dark:ring-offset-[#1e2126]', 'z-50', 'transition-all', 'duration-500');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-[#3f407e]', 'dark:ring-[#b3bbea]', 'ring-offset-4', 'dark:ring-offset-[#1e2126]', 'z-50'), 3000);
                }
            }
        }));

        const objectiveCommands: Command[] = roadmapContext.items.map(item => ({
            id: item.id,
            title: item.title,
            section: 'Objectives',
            icon: (
                <div className="flex items-center justify-center w-5 h-5 bg-[#3f407e]/10 dark:bg-[#b3bbea]/10 rounded-md border border-[#3f407e]/20">
                    <div className="w-2.5 h-1 bg-[#3f407e] dark:bg-[#b3bbea] rounded-full" />
                </div>
            ),
            action: () => {
                const el = document.getElementById(item.id);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    el.classList.add('ring-4', 'ring-[#3f407e]', 'dark:ring-[#b3bbea]', 'ring-offset-4', 'dark:ring-offset-[#1e2126]', 'z-50', 'transition-all', 'duration-500');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-[#3f407e]', 'dark:ring-[#b3bbea]', 'ring-offset-4', 'dark:ring-offset-[#1e2126]', 'z-50'), 3000);
                }
            }
        }));

        const milestoneCommands: Command[] = roadmapContext.milestones.map(m => ({
            id: m.id,
            title: m.title,
            section: 'Milestones',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
            action: () => {
                const el = document.getElementById(m.id);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    el.classList.add('scale-150', 'z-[2000]', 'transition-all', 'duration-500');
                    setTimeout(() => el.classList.remove('scale-150', 'z-[2000]'), 3000);
                }
            }
        }));

        return [...baseCommands, ...roadmapNavCommands, ...trackCommands, ...objectiveCommands, ...milestoneCommands];
    }, [router, roadmapContext, allRoadmaps, logout]);

    const filteredCommands = commands.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) || 
        c.section.toLowerCase().includes(query.toLowerCase())
    );

    // --- KEYBOARD SHORTCUTS LOGIC ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Toggle Palette (Cmd+K)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                return;
            }

            // If an input is focused (like the search bar), don't trigger global shortcuts
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') setIsOpen(false);
                return;
            }

            // 2. Global Shortcut Processing (When Palette is CLOSED)
            if (!isOpen) {
                const char = e.key.toUpperCase();
                const newSequence = [...keySequence, char];
                
                // Clear sequence after 1 second of inactivity
                if (sequenceTimeout.current) clearTimeout(sequenceTimeout.current);
                sequenceTimeout.current = setTimeout(() => setKeySequence([]), 1000);

                // Check for single-key or sequence matches
                const fullSequence = newSequence.join(' ');
                const match = commands.find(c => c.shortcut === char || c.shortcut === fullSequence);

                if (match) {
                    e.preventDefault();
                    match.action();
                    setKeySequence([]);
                } else {
                    setKeySequence(newSequence);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, commands, keySequence]);

    const executeCommand = (command: Command) => {
        if (!command) return;
        command.action();
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} className="relative w-full max-w-xl bg-white dark:bg-[#1e2126] rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="flex items-center px-4 border-b border-slate-100 dark:border-white/5">
                        <svg className="text-slate-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input autoFocus placeholder="Jump to track, objective, or settings..." className="w-full p-5 bg-transparent outline-none text-slate-800 dark:text-white font-bold text-lg placeholder:text-slate-400" value={query} onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }} onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => Math.min(prev + 1, filteredCommands.length - 1)); }
                            if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => Math.max(prev - 1, 0)); }
                            if (e.key === 'Enter') executeCommand(filteredCommands[activeIndex]);
                        }} />
                        <kbd className="px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-tighter">ESC</kbd>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto p-3 custom-scrollbar">
                        {filteredCommands.length > 0 ? (
                            filteredCommands.map((command, index) => (
                                <div key={command.id}>
                                    {(index === 0 || filteredCommands[index - 1].section !== command.section) && (
                                        <div className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#3f407e] dark:text-[#b3bbea] flex items-center gap-2">
                                            <span>{command.section}</span>
                                            <div className="h-px flex-1 bg-gradient-to-r from-[#3f407e]/20 dark:from-[#b3bbea]/20 to-transparent" />
                                        </div>
                                    )}
                                    <button onClick={() => executeCommand(command)} onMouseEnter={() => setActiveIndex(index)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${index === activeIndex ? 'bg-[#3f407e] text-white shadow-xl scale-[1.02]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                        <div className="flex items-center gap-4 truncate">
                                            <div className={`${index === activeIndex ? 'text-white' : ''}`}> {command.icon} </div>
                                            <span className="font-extrabold text-[15px] truncate tracking-tight">{command.title}</span>
                                        </div>
                                        {command.shortcut && (
                                            <kbd className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${index === activeIndex ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}> {command.shortcut} </kbd>
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-16 text-center text-slate-400 font-medium">No matches found</div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500">↵</kbd> SELECT</span>
                            <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500">↑↓</kbd> NAVIGATE</span>
                        </div>
                        <div className="flex items-center gap-2"> <ObjexiaLogo className="w-4 h-4 opacity-40" /> <span>Objexia Workspace</span> </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}