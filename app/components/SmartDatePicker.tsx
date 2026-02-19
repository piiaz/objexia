'use client'

import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { format, parseISO, isValid, getMonth, getYear } from 'date-fns'

// --- CUSTOM CSS ---
// Removed 'overflow: hidden' so our custom dropdowns can pop out if needed
const customDatePickerStyles = `
  .react-datepicker {
    font-family: inherit;
    font-size: 0.8rem !important;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    background-color: white;
  }
  .dark .react-datepicker {
    background-color: #1e293b; 
    border-color: #334155;
    color: #e2e8f0;
  }
  
  /* Hide default header because we are building a custom one */
  .react-datepicker__header {
    background-color: transparent;
    border-bottom: none;
    padding-top: 0;
  }
  
  .react-datepicker__day-name {
    color: #64748b;
    font-weight: 700;
    font-size: 0.65rem;
    text-transform: uppercase;
    width: 1.7rem;
    line-height: 1.7rem;
    margin: 0.1rem;
  }
  .dark .react-datepicker__day-name { color: #94a3b8; }
  
  .react-datepicker__day--selected, 
  .react-datepicker__day--keyboard-selected {
    background-color: #3f407e !important;
    color: white !important;
    border-radius: 0.35rem;
    font-weight: bold;
  }
  
  .react-datepicker__day:hover {
    background-color: #b3bbea !important;
    color: #3f407e !important;
    border-radius: 0.35rem;
  }
  .dark .react-datepicker__day:hover {
    background-color: #3f407e !important;
    color: white !important;
  }
  
  .react-datepicker__day {
    color: #334155;
    font-weight: 500;
    width: 1.7rem;
    line-height: 1.7rem;
    margin: 0.1rem;
  }
  .dark .react-datepicker__day { color: #cbd5e1; }
  
  .react-datepicker__triangle { display: none; }
`

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- CUSTOM HEADER COMPONENT ---
// This replaces the default green bar with our interactive "Objexia" header
const CustomHeader = ({ date, changeYear, changeMonth, decreaseMonth, increaseMonth }: any) => {
    const [showMonthList, setShowMonthList] = useState(false);
    const [showYearList, setShowYearList] = useState(false);
    
    // Generate years (1990 - 2040)
    const years = Array.from({ length: 51 }, (_, i) => 1990 + i);
    const currentYear = getYear(date);
    const currentMonth = MONTHS[getMonth(date)];

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-700 p-2 rounded-t-xl relative">
            <div className="flex items-center justify-between px-1">
                {/* PREV BUTTON */}
                <button onClick={decreaseMonth} type="button" className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>

                {/* MIDDLE SELECTORS */}
                <div className="flex items-center gap-1">
                    {/* Month Trigger */}
                    <button 
                        type="button"
                        onClick={() => { setShowMonthList(!showMonthList); setShowYearList(false); }}
                        className="px-2 py-1 text-xs font-black text-[#3f407e] dark:text-[#b3bbea] uppercase tracking-wider hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                    >
                        {currentMonth}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                    </button>

                    {/* Year Trigger */}
                    <button 
                        type="button"
                        onClick={() => { setShowYearList(!showYearList); setShowMonthList(false); }}
                        className="px-2 py-1 text-xs font-black text-[#3f407e] dark:text-[#b3bbea] uppercase tracking-wider hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                    >
                        {currentYear}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                </div>

                {/* NEXT BUTTON */}
                <button onClick={increaseMonth} type="button" className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>

            {/* --- MONTH OVERLAY --- */}
            {showMonthList && (
                <div className="absolute top-10 left-0 right-0 bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-600 z-50 p-2 grid grid-cols-3 gap-1 rounded-xl h-[180px] overflow-y-auto">
                    {MONTHS.map((m, i) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => { changeMonth(i); setShowMonthList(false); }}
                            className={`text-[10px] font-bold py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${getMonth(date) === i ? 'bg-[#3f407e] text-white hover:bg-[#3f407e]' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            {m.slice(0, 3)}
                        </button>
                    ))}
                </div>
            )}

            {/* --- YEAR OVERLAY --- */}
            {showYearList && (
                <div className="absolute top-10 left-0 right-0 bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-600 z-50 p-2 grid grid-cols-4 gap-1 rounded-xl h-[180px] overflow-y-auto custom-scrollbar">
                    {years.map((y) => (
                        <button
                            key={y}
                            type="button"
                            onClick={() => { changeYear(y); setShowYearList(false); }}
                            className={`text-[10px] font-bold py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${getYear(date) === y ? 'bg-[#3f407e] text-white hover:bg-[#3f407e]' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

type Props = {
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
    maxDate?: string;
    className?: string;
    inputClassName?: string;
    usePortal?: boolean;
}

export default function SmartDatePicker({ value, onChange, minDate, maxDate, className, inputClassName, usePortal = false }: Props) {
    const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null;
    const minDateObj = minDate && isValid(parseISO(minDate)) ? parseISO(minDate) : undefined;
    const maxDateObj = maxDate && isValid(parseISO(maxDate)) ? parseISO(maxDate) : undefined;

    const handleDateChange = (date: Date | null) => {
        if (date) onChange(format(date, 'yyyy-MM-dd'));
    };

    return (
        <div className={`relative ${className}`}>
            <style>{customDatePickerStyles}</style>
            
            <div className="relative group">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDateObj}
                    maxDate={maxDateObj}
                    dateFormat="MMM d, yyyy"
                    portalId={usePortal ? "root-portal" : undefined}
                    
                    // --- INJECT CUSTOM HEADER ---
                    renderCustomHeader={(props) => <CustomHeader {...props} />}
                    
                    className={`w-full pl-3 pr-9 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#3f407e] focus:border-transparent dark:focus:border-transparent outline-none text-sm font-bold text-gray-700 dark:text-slate-200 cursor-pointer transition-shadow shadow-sm hover:border-[#3f407e]/30 ${inputClassName || 'py-2'}`}
                    placeholderText="Select date..."
                    onFocus={(e) => (e.target as HTMLInputElement).readOnly = true} 
                />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#3f407e] dark:text-[#b3bbea] opacity-70 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
            </div>
        </div>
    )
}