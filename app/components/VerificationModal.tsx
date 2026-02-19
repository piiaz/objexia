'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  isOpen: boolean
  email: string
  onVerify: (pin: string) => Promise<void>
  isLoading: boolean
  error?: string | null
}

export default function VerificationModal({ isOpen, email, onVerify, isLoading, error }: Props) {
  const [pin, setPin] = useState(['', '', '', '', '', ''])

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const data = e.clipboardData.getData('text').slice(0, 6).split('')
    if (data.length === 6) setPin(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="relative bg-white dark:bg-[#1e2126] w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 text-center"
      >
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Verify your Email</h2>
        <p className="text-slate-500 mb-8">We sent a 6-digit code to <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span></p>

        <div className="flex gap-2 justify-center mb-8">
          {pin.map((digit, i) => (
            <input
              key={i}
              id={`pin-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:border-[#3f407e] outline-none transition-colors"
            />
          ))}
        </div>

        {error && <div className="mb-4 text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</div>}

        <button 
          onClick={() => onVerify(pin.join(''))} 
          disabled={isLoading || pin.join('').length !== 6}
          className="w-full py-3.5 bg-[#3f407e] text-white font-bold rounded-xl shadow-lg hover:bg-[#323366] transition-all disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </button>
      </motion.div>
    </div>
  )
}