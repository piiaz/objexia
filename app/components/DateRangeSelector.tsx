'use client'

import React from 'react'
import SmartDatePicker from './SmartDatePicker'

type Props = {
    startDate: string
    endDate: string
    onChangeStart: (date: string) => void
    onChangeEnd: (date: string) => void
}

export default function DateRangeSelector({ startDate, endDate, onChangeStart, onChangeEnd }: Props) {
  return (
    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        
        {/* START DATE */}
        <div className="relative group">
            <span className="absolute left-3 top-1 text-[9px] font-extrabold text-[#3f407e] dark:text-[#b3bbea] uppercase tracking-wider z-10 pointer-events-none opacity-80">
                Start
            </span>
            <SmartDatePicker 
                value={startDate} 
                onChange={onChangeStart}
                maxDate={endDate} // <--- VALIDATION: Cannot select a date after End Date
                className="w-36" 
                inputClassName="pt-6 pb-1 h-[42px] text-xs"
                usePortal={true}
            />
        </div>

        <div className="text-slate-300 dark:text-slate-600 font-bold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
            </svg>
        </div>

        {/* END DATE */}
        <div className="relative group">
            <span className="absolute left-3 top-1 text-[9px] font-extrabold text-[#3f407e] dark:text-[#b3bbea] uppercase tracking-wider z-10 pointer-events-none opacity-80">
                End
            </span>
            <SmartDatePicker 
                value={endDate} 
                onChange={onChangeEnd} 
                minDate={startDate} // <--- VALIDATION: Cannot select a date before Start Date
                className="w-36"
                inputClassName="pt-6 pb-1 h-[42px] text-xs"
                usePortal={true}
            />
        </div>

    </div>
  )
}