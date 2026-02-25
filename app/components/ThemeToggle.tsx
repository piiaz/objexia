'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)
    const { user } = useAuth() // <--- Added Auth Context

    const toggleTheme = useCallback(() => {
        const currentIsDark = document.documentElement.classList.contains('dark');
        const newTheme = currentIsDark ? 'light' : 'dark';
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
        
        localStorage.setItem('roadmap_theme', newTheme);
        setIsDark(newTheme === 'dark');
        
        window.dispatchEvent(new CustomEvent('objexia-theme-change'));

        // --- THE FIX: Silent DB Save ---
        if (user?.id) {
            // Send to database quietly in the background
            fetch(`/api/user/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme })
            }).catch(() => {});

            // Keep the local storage cache synced
            try {
                const storedUser = JSON.parse(localStorage.getItem('roadmap_user') || '{}');
                storedUser.theme = newTheme;
                localStorage.setItem('roadmap_user', JSON.stringify(storedUser));
            } catch(e) {}
        }
    }, [user?.id]);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'))

        const handleSync = () => setIsDark(document.documentElement.classList.contains('dark'))
        window.addEventListener('objexia-theme-change', handleSync)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return; 

            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.key.toLowerCase() === 't') {
                e.preventDefault();
                e.stopImmediatePropagation(); 
                toggleTheme();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('objexia-theme-change', handleSync);
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [toggleTheme])

    const handleManualClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur(); 
        toggleTheme();
    }

    return (
        <button 
            onClick={handleManualClick}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group"
            title="Toggle Light/Dark Mode (T)"
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                <svg 
                    className={`absolute transition-all duration-300 transform ${isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg 
                    className={`absolute transition-all duration-300 transform ${!isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            </div>
        </button>
    )
}