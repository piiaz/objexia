'use client'

import { useState, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { parseISO, isAfter, isBefore, differenceInDays, format } from 'date-fns'
import { motion } from 'framer-motion'
import { COLOR_VARIANTS, ITEM_GAP, TOP_PADDING, Item, Group } from './TimelineConstants'

type Props = {
  item: Item
  roadmapStart: Date
  roadmapEnd: Date
  groups: Group[]
  onClick: (item: Item) => void
  rowIndex: number
  computedTrackIndex: number
  headerRows: number
  timeView: 'Quarter' | 'Month' | 'Week'
  itemHeight: number
  sidebarWidth: number // Ensure this is passed from Timeline.tsx
}

export default function RoadmapItem({ 
  item, roadmapStart, roadmapEnd, groups, onClick, rowIndex, 
  computedTrackIndex, headerRows, timeView, itemHeight, sidebarWidth 
}: Props) {
  
  const [mousePos, setMousePos] = useState<{ x: string | number, isHovering: boolean }>({ x: '50%', isHovering: false })

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(35, Math.min(e.clientX - rect.left, rect.width - 35));
      setMousePos({ x, isHovering: true });
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
  const { attributes: leftAttr, listeners: leftList, setNodeRef: setLeftRef, transform: leftTransform, isDragging: isDraggingLeft } = useDraggable({ id: `resize-left-${item.id}` })
  const { attributes: rightAttr, listeners: rightList, setNodeRef: setRightRef, transform: rightTransform, isDragging: isDraggingRight } = useDraggable({ id: `resize-right-${item.id}` })

  const isAnyDragging = isDragging || isDraggingLeft || isDraggingRight;
  const [enableLayoutAnim, setEnableLayoutAnim] = useState(true);

  useEffect(() => {
    if (isAnyDragging) {
      setEnableLayoutAnim(false);
    } else {
      const timer = setTimeout(() => setEnableLayoutAnim(true), 200); 
      return () => clearTimeout(timer);
    }
  }, [isAnyDragging]);

  const start = parseISO(item.startDate)
  const end = parseISO(item.endDate)

  if (isAfter(start, roadmapEnd) || isBefore(end, roadmapStart)) return null;

  const effectiveStart = isBefore(start, roadmapStart) ? roadmapStart : start;
  const effectiveEnd = isAfter(end, roadmapEnd) ? roadmapEnd : end;

  const rawOffset = differenceInDays(effectiveStart, roadmapStart);
  const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

  const gridColumnStart = rawOffset + 2; 
  const gridSpan = duration;

  const isClippedLeft = isBefore(start, roadmapStart);
  const isClippedRight = isAfter(end, roadmapEnd);

  const group = groups.find((g) => g.id === item.groupId)
  const colorKey = group?.color || 'blue';
  const colors = COLOR_VARIANTS[colorKey] || COLOR_VARIANTS.blue;

  const topOffset = TOP_PADDING + (computedTrackIndex * (itemHeight + ITEM_GAP));
  const rowStart = rowIndex + headerRows + 1;

  // --- DRAG TRANSFORM LOGIC ---
  let innerTransform = undefined;
  let innerWidth = '100%';
  let innerMarginLeft = '0px';

  if (isDragging && transform) {
      innerTransform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  } else if (isDraggingLeft && leftTransform) {
      innerMarginLeft = `min(${leftTransform.x}px, calc(100% - 24px))`;
      innerWidth = `max(calc(100% - ${leftTransform.x}px), 24px)`;
  } else if (isDraggingRight && rightTransform) {
      innerWidth = `max(calc(100% + ${rightTransform.x}px), 24px)`;
  }

  // CRITICAL: Disable transform when not dragging so sticky works
  const finalTransform = isAnyDragging ? innerTransform : undefined;

  const wrapperStyle = {
    gridColumnStart, 
    gridColumnEnd: `span ${gridSpan}`,
    gridRowStart: rowStart,
    marginTop: `${topOffset}px`,
    height: `${itemHeight}px`,
    zIndex: isAnyDragging ? 999 : (mousePos.isHovering ? 50 : 10),
    touchAction: 'none' as const,
    width: innerWidth,
    marginLeft: innerMarginLeft,
    transform: finalTransform,
    transition: isAnyDragging ? 'none' : enableLayoutAnim ? 'box-shadow 0.2s, transform 0.2s' : 'box-shadow 0.2s',
  }

  const roundingClass = `${isClippedLeft ? 'rounded-l-none' : 'rounded-l-xl'} ${isClippedRight ? 'rounded-r-none' : 'rounded-r-xl'}`;

  const titleSize = timeView === 'Quarter' ? 'text-[10px]' : (timeView === 'Month' ? 'text-xs' : 'text-sm');
  const showDesc = timeView !== 'Quarter';
  
  // Dynamic padding based on state
  const paddingX = timeView === 'Quarter' ? 'px-2' : 'px-4';
  // Add a buffer so the text doesn't touch the exact pixel edge of the sidebar
  const stickyLeftOffset = sidebarWidth + 16; 

  return (
    <motion.div
      layout={false} // Disable motion layout here, it breaks sticky positioning
      ref={setNodeRef}
      style={wrapperStyle}
      className={`relative group/wrapper ${isAnyDragging ? 'z-50' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(prev => ({ ...prev, isHovering: false }))}
      onMouseEnter={() => setMousePos(prev => ({ ...prev, isHovering: true }))}
    >
      {/* TOOLTIP */}
      <div 
          className="absolute -top-10 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-[1000] flex items-center gap-1.5 transition-opacity duration-200"
          style={{ 
              left: mousePos.x, 
              transform: 'translateX(-50%)', 
              opacity: mousePos.isHovering && !isAnyDragging ? 1 : 0 
          }}
      >
          <span>{format(start, 'MMM d')}</span>
          <span className="opacity-50 font-normal">→</span>
          <span>{format(end, 'MMM d, yyyy')}</span>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 border-[5px] border-transparent border-t-slate-900 dark:border-t-white"></div>
      </div>

      <div
        className={`
          relative shadow-sm group/item w-full h-full
          ${colors.bar}
          ${roundingClass}
          ${isClippedLeft ? 'border-l-[6px] border-white/40' : ''} 
          ${isClippedRight ? 'border-r-[6px] border-white/40' : ''}
          ${isAnyDragging 
              ? 'shadow-2xl ring-4 ring-black/10 scale-[1.02] z-50 brightness-110' 
              : 'hover:shadow-md hover:-translate-y-[2px] hover:brightness-105'
          }
        `}
      >
        {/* PROGRESS BAR BACKGROUND (Hidden overflow to keep rounding clean) */}
        <div className={`absolute inset-0 overflow-hidden ${roundingClass} pointer-events-none`}>
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40 pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 bg-black/10 pointer-events-none transition-all duration-300" style={{ width: `${item.progress}%` }} />
            <div className="absolute left-0 bottom-0 h-1.5 bg-black/30 pointer-events-none transition-all duration-300" style={{ width: `${item.progress}%` }} />
        </div>

        {/* CLICK & DRAG AREA */}
        <div
            {...listeners}
            {...attributes}
            onClick={() => onClick(item)}
            className="absolute inset-0 z-10 cursor-pointer active:cursor-grabbing"
        />

        {/* --- THE SMART STICKY TEXT CONTAINER --- 
            Notice we removed 'absolute' and 'overflow-hidden' from this specific wrapper.
            It must span the full height/width to allow the sticky child to travel inside it.
        */}
        <div className="relative w-full h-full pointer-events-none flex items-center">
            <div 
                className={`
                    sticky flex flex-col justify-center ${paddingX}
                    min-w-0 max-w-full
                `}
                style={{ 
                    // This creates the sliding magic
                    left: `${stickyLeftOffset}px`, 
                    // Prevent it from pushing layout
                    width: 'fit-content',
                }}
            >
                <div className="flex items-center drop-shadow-sm">
                    {isClippedLeft && <span className="mr-1.5 text-white/90 font-black text-[9px] flex-shrink-0">◀</span>}
                    <span className={`${titleSize} font-extrabold text-white truncate leading-none mt-0.5`}>
                        {item.title}
                    </span>
                    {isClippedRight && <span className="ml-1.5 text-white/90 font-black text-[9px] flex-shrink-0">▶</span>}
                </div>
                {showDesc && item.description && (
                    <span className="text-[11px] text-white/90 truncate font-medium leading-tight mt-1 opacity-90">
                        {item.description}
                    </span>
                )}
            </div>
        </div>

        {/* LEFT HANDLE */}
        {!isClippedLeft && !isDragging && (
            <div
                ref={setLeftRef}
                {...leftList}
                {...leftAttr}
                onClick={(e) => e.stopPropagation()}
                className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover/wrapper:opacity-100 z-30 cursor-ew-resize hover:scale-110 hover:border-blue-500 dark:hover:border-blue-400 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all touch-none"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        )}

        {/* RIGHT HANDLE */}
        {!isClippedRight && !isDragging && (
            <div
                ref={setRightRef}
                {...rightList}
                {...rightAttr}
                onClick={(e) => e.stopPropagation()}
                className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover/wrapper:opacity-100 z-30 cursor-ew-resize hover:scale-110 hover:border-blue-500 dark:hover:border-blue-400 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all touch-none"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        )}
      </div>
    </motion.div>
  )
}