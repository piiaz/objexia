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

  const extraOffset = isMilestoneRow ? 20 : 0;
  const availableHeight = laneHeight - 48 - extraOffset;
  const maxLines = Math.max(1, Math.floor(availableHeight / 20));

  const finalTransform = isDragging && transform 
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.02) rotate(1deg)`
      : CSS.Translate.toString(transform);

  const style = {
    gridColumn: 1,
    gridRow: gridRow,
    transform: finalTransform,
    transition: isDragging ? 'none' : transition,
    // UPGRADED: High z-index to dominate any hovered roadmap items
    zIndex: isDragging ? 1000 : 80, 
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      // UPGRADED: px-3 for spacing, z-80 and isolate for perfect clipping
      className="sticky left-0 h-full w-full group/sidebar touch-none py-2 px-3 z-[80] isolate"
    >
      {sidebarOpen && (
        <div 
            id={group.id} 
            onClick={onEdit} 
            className={`
                relative flex items-center justify-between 
                w-full h-full p-4 rounded-xl
                ${bgColor} ${borderClass} ${textColor}
                cursor-pointer transition-all duration-300 ease-in-out overflow-hidden
                ${isDragging 
                    ? 'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] ring-2 ring-white/30 brightness-110' 
                    : 'shadow-sm hover:shadow-md hover:brightness-105'
                }
            `}
        >
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
                <circle cx="9" cy="8" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="9" cy="16" r="1.5" />
                <circle cx="15" cy="8" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="15" cy="16" r="1.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}