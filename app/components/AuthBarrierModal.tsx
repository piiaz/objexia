'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function AuthBarrierModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative bg-white dark:bg-[#1a1d26] p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-slate-200 dark:border-slate-700"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Required</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
                You are currently in <strong>Read-Only View</strong>. To create items, edit roadmaps, or save changes, please sign in.
            </p>

            <div className="flex flex-col gap-3">
                <Link href="/signup" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                    Create Free Account
                </Link>
                <Link href="/login" className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">
                    Log In
                </Link>
            </div>
            
            <button onClick={onClose} className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest">
                Continue Viewing
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}