'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)

    // 1. Initial State Sync
    useEffect(() => {
        // Check actual DOM state on mount to set initial icon
        setIsDark(document.documentElement.classList.contains('dark'))
    }, [])

    // 2. Global Shortcut Listener
    useEffect(() => {
        const handleExternalThemeChange = () => {
            // Re-check the DOM whenever the Command Palette triggers a change
            setIsDark(document.documentElement.classList.contains('dark'))
        }

        // Listen for the custom broadcast from the Command Palette
        window.addEventListener('objexia-theme-change', handleExternalThemeChange)
        
        return () => {
            window.removeEventListener('objexia-theme-change', handleExternalThemeChange)
        }
    }, [])

    const toggleTheme = () => {
        const currentIsDark = document.documentElement.classList.contains('dark');
        const newTheme = currentIsDark ? 'light' : 'dark';
        
        // Apply to DOM
        document.documentElement.classList.toggle('dark');
        document.body.classList.toggle('dark');
        
        // Save Preference
        localStorage.setItem('roadmap_theme', newTheme);
        
        // Update Local Icon State
        setIsDark(!currentIsDark);
        
        // BROADCAST: Notify other components (like Command Palette)
        window.dispatchEvent(new CustomEvent('objexia-theme-change', { 
            detail: { theme: newTheme } 
        }));
    }

    return (
        <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group"
            title="Toggle Light/Dark Mode (T)"
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Sun Icon (Visible in Light Mode) */}
                <svg 
                    className={`absolute transition-all duration-300 transform ${isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>

                {/* Moon Icon (Visible in Dark Mode) */}
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