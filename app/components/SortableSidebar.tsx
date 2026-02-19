'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { COLOR_VARIANTS, Group } from './TimelineConstants'

type Props = {
  group: Group
  sidebarOpen: boolean
  isMilestoneRow: boolean
  gridRow: number
  onEdit: () => void 
  laneHeight?: number 
}

export default function SortableSidebar({ 
  group, sidebarOpen, isMilestoneRow, gridRow, onEdit, laneHeight = 80 
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id })

  const colors = COLOR_VARIANTS[group.color] || COLOR_VARIANTS.slate;
  
  const bgColor = isMilestoneRow ? colors.milestone.bg : colors.bg;
  const textColor = isMilestoneRow ? colors.milestone.text : colors.text;
  
  const borderClass = isMilestoneRow 
    ? `border-b ${colors.milestone.border}`
    : 'border-b border-white/20 dark:border-white/10';

  const style = {
    gridColumn: 1,
    gridRow: gridRow,
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 100, 
    opacity: isDragging ? 0.9 : 1,
  }

  // --- ADAPTIVE LINE CLAMP LOGIC ---
  const extraOffset = isMilestoneRow ? 20 : 0;
  const availableHeight = laneHeight - 48 - extraOffset;
  const maxLines = Math.max(1, Math.floor(availableHeight / 20));

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="sticky left-0 h-full w-full group/sidebar touch-none py-2 pr-2 bg-slate-50/50 dark:bg-[#191b19]"
    >
      {sidebarOpen && (
        <div 
            onClick={onEdit} 
            className={`
                // --- FIX: Changed items-start to items-center ---
                relative flex items-center justify-between 
                w-full h-full ml-2 p-4 rounded-xl
                ${bgColor} ${borderClass} ${textColor}
                shadow-sm cursor-pointer 
                transition-all duration-200
                hover:shadow-md hover:brightness-105 overflow-hidden
            `}
        >
          {/* --- FIX: Added justify-center here to ensure perfect middle alignment --- */}
          <div className="flex flex-col justify-center flex-1 mr-2 min-w-0 h-full">
                <span 
                    className="text-sm font-extrabold tracking-tight drop-shadow-sm break-words whitespace-normal"
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: maxLines, 
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {group.title}
                </span>
             {isMilestoneRow && (
               <div className='text-[9px] font-bold mt-1.5 uppercase tracking-wider flex items-center gap-1 opacity-70 shrink-0'>
                   ◈ Milestone Track
               </div>
             )}
          </div>
          
          <button 
            {...attributes} 
            {...listeners} 
            onClick={(e) => e.stopPropagation()} 
            className={`
                flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md
                opacity-0 group-hover/sidebar:opacity-100 
                cursor-grab active:cursor-grabbing
                transition-all duration-200
                ${isMilestoneRow 
                    ? 'hover:bg-black/5 dark:hover:bg-white/10 text-current'
                    : 'hover:bg-white/20 text-white/60 hover:text-white'
                }
            `}
            title="Drag to reorder"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="8" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="9" cy="16" r="1.5" />
                <circle cx="15" cy="8" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="15" cy="16" r="1.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}