'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('roadmap_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme as 'light' | 'dark');
        } else {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isDark ? 'dark' : 'light');
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        const body = document.body;

        const applyTheme = () => {
            localStorage.setItem('roadmap_theme', theme);
            if (theme === 'dark') { 
                root.classList.add('dark'); body.classList.add('dark'); 
            } else { 
                root.classList.remove('dark'); body.classList.remove('dark'); 
            }
        };

        if (!(document as any).startViewTransition) applyTheme();
        else (document as any).startViewTransition(() => applyTheme());
    }, [theme, mounted]);

    if (!mounted) {
        return <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm" />;
    }

    return (
      <motion.button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-colors z-50"
          aria-label="Toggle Theme"
      >
          <AnimatePresence mode="wait" initial={false}>
              <motion.div
                  key={theme}
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                  className="absolute flex items-center justify-center inset-0"
              >
                  {theme === 'dark' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  )}
              </motion.div>
          </AnimatePresence>
      </motion.button>
    );
}