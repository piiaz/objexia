'use client'

import { useState, useRef, useEffect } from 'react'

export type Option = {
  label: React.ReactNode
  value: string
}

type Props = {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ label, value, onChange, options, placeholder = "Select...", className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  const selectedLabel = selectedOption ? selectedOption.label : placeholder

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-left transition-all shadow-sm ${
          isOpen 
            ? 'ring-2 ring-[#3f407e] border-transparent dark:border-transparent' 
            : 'hover:border-[#3f407e]/50 dark:hover:border-[#3f407e]/50'
        }`}
      >
        <span className={`text-sm font-bold flex items-center gap-2 ${value ? 'text-gray-800 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500'}`}>
          {selectedLabel}
        </span>
        <span className="text-gray-400 dark:text-slate-500 text-xs transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl dark:shadow-2xl max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors border-l-4 flex items-center gap-2 ${
                value === option.value
                  ? 'bg-[#3f407e]/5 dark:bg-[#3f407e]/20 text-[#3f407e] dark:text-[#b3bbea] border-[#3f407e]'
                  : 'text-gray-700 dark:text-slate-300 border-transparent hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 italic text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  )
}