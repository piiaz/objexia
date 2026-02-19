'use client'

import React from 'react'

// --- DIMENSIONS ---
export const ITEM_HEIGHT = 52; 
export const ITEM_GAP = 12;     
export const BASE_ROW_HEIGHT = 160; 
export const TOP_PADDING = 24; 
export const MILESTONE_STACK_HEIGHT = 48; 
export const HEADER_MAIN_HEIGHT = 48; 
export const HEADER_SUB_HEIGHT = 32; 

// --- TYPES ---
export type GroupType = 'lane' | 'milestone';

export type Group = { 
  id: string; 
  title: string; 
  color: string; 
  type: GroupType 
}

export type Item = { 
  id: string; 
  title: string; 
  startDate: string; 
  endDate: string; 
  groupId: string; 
  progress: number; 
  description: string; 
  trackIndex: number; 
}

export type MilestoneData = {
    id?: string;
    title: string;
    date: string;
    icon: string;
    color: string;
    groupId: string;
    roadmapId?: string;
    trackIndex?: number;
}

export type Milestone = MilestoneData & {
  id: string;
  trackIndex: number;
}

// --- COLORS (DUAL SYSTEM + DARK MODE) ---
type ColorSet = { bg: string, text: string, border: string };
type ColorVariant = ColorSet & { bar: string, milestone: ColorSet };

export const COLOR_VARIANTS: Record<string, ColorVariant> = {
  // --- NEW: OBJEXIA BRAND THEME ---
  brand: { 
    bg: 'bg-[#3f407e]',           // Dark Purple
    text: 'text-white', 
    border: 'border-[#323366]', 
    bar: 'bg-[#3f407e]',
    milestone: { 
      bg: 'bg-[#b3bbea]/20 dark:bg-[#b3bbea]/10',  // Light Periwinkle tint
      text: 'text-[#3f407e] dark:text-[#b3bbea]', 
      border: 'border-[#b3bbea]/50 dark:border-[#3f407e]/50' 
    }
  },
  // --- STANDARD COLORS ---
  slate:  { 
    bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-600', bar: 'bg-slate-500',
    milestone: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-800 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' }
  },
  red:    { 
    bg: 'bg-red-500',   text: 'text-white', border: 'border-red-600',   bar: 'bg-red-500',
    milestone: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-900 dark:text-red-300', border: 'border-red-200 dark:border-red-900/50' }
  },
  orange: { 
    bg: 'bg-orange-500',text: 'text-white', border: 'border-orange-600',bar: 'bg-orange-500',
    milestone: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-900/50' }
  },
  amber:  { 
    bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', bar: 'bg-amber-500',
    milestone: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-900 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-900/50' }
  },
  yellow: { 
    bg: 'bg-yellow-400',text: 'text-white', border: 'border-yellow-500',bar: 'bg-yellow-500',
    milestone: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-900 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-900/50' }
  },
  lime:   { 
    bg: 'bg-lime-500',  text: 'text-white', border: 'border-lime-600',  bar: 'bg-lime-500',
    milestone: { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-900 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-900/50' }
  },
  green:  { 
    bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', bar: 'bg-green-500',
    milestone: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-900 dark:text-green-300', border: 'border-green-200 dark:border-green-900/50' }
  },
  emerald:{ 
    bg: 'bg-emerald-500',text: 'text-white',border: 'border-emerald-600',bar: 'bg-emerald-500',
    milestone: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-900 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900/50' }
  },
  teal:   { 
    bg: 'bg-teal-500',  text: 'text-white', border: 'border-teal-600',  bar: 'bg-teal-500',
    milestone: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-900 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-900/50' }
  },
  cyan:   { 
    bg: 'bg-cyan-500',  text: 'text-white', border: 'border-cyan-600',  bar: 'bg-cyan-500',
    milestone: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-900 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-900/50' }
  },
  sky:    { 
    bg: 'bg-sky-500',   text: 'text-white', border: 'border-sky-600',   bar: 'bg-sky-500',
    milestone: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-900 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-900/50' }
  },
  blue:   { 
    bg: 'bg-blue-500',  text: 'text-white', border: 'border-blue-600',  bar: 'bg-blue-500',
    milestone: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900/50' }
  },
  indigo: { 
    bg: 'bg-indigo-500',text: 'text-white', border: 'border-indigo-600',bar: 'bg-indigo-500',
    milestone: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-900 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-900/50' }
  },
  violet: { 
    bg: 'bg-violet-500',text: 'text-white', border: 'border-violet-600',bar: 'bg-violet-500',
    milestone: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-900 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-900/50' }
  },
  purple: { 
    bg: 'bg-purple-500',text: 'text-white', border: 'border-purple-600',bar: 'bg-purple-500',
    milestone: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-900/50' }
  },
  fuchsia:{ 
    bg: 'bg-fuchsia-500',text: 'text-white',border: 'border-fuchsia-600',bar: 'bg-fuchsia-500',
    milestone: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-900 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-900/50' }
  },
  pink:   { 
    bg: 'bg-pink-500',  text: 'text-white', border: 'border-pink-600',  bar: 'bg-pink-500',
    milestone: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-900 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-900/50' }
  },
  rose:   { 
    bg: 'bg-rose-500',  text: 'text-white', border: 'border-rose-600',  bar: 'bg-rose-500',
    milestone: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-900 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-900/50' }
  },
}

// --- ICONS ---
export const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  diamond: <path d="M12 2L2 12l10 10 10-10L12 2z" />,
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  flag: <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zM4 22v-7" />,
  target: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z" />,
  alert: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />,
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
}

export type RoadmapMeta = {
  id: string;
  title: string;
  description: string;
  avatarUrl?: string; 
  createdAt: string;
  lastEdited: string;
  isFavorite?: boolean;
}