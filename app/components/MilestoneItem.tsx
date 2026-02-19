'use client'

import { useState, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { parseISO, isAfter, isBefore, differenceInDays, format } from 'date-fns'
import { motion } from 'framer-motion'
import { MILESTONE_ICONS, MILESTONE_STACK_HEIGHT, Milestone } from './TimelineConstants'

type Props = {
  milestone: Milestone
  roadmapStart: Date
  roadmapEnd: Date
  onClick: (milestone: Milestone) => void
  rowIndex: number
  trackIndex: number
  headerRows: number
  isWeekly?: boolean
  stackHeight?: number
  timeView: 'Quarter' | 'Month' | 'Week' // Received prop
}

export default function MilestoneItem({ milestone, roadmapStart, roadmapEnd, onClick, rowIndex, trackIndex, headerRows, isWeekly = false, stackHeight = MILESTONE_STACK_HEIGHT, timeView }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: milestone.id })
  
  const [mousePos, setMousePos] = useState<{ x: string | number, isHovering: boolean }>({ x: '50%', isHovering: false })

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setMousePos({ x, isHovering: true });
  }

  const [enableLayoutAnim, setEnableLayoutAnim] = useState(true);

  useEffect(() => {
    if (isDragging) {
      setEnableLayoutAnim(false);
    } else {
      const timer = setTimeout(() => setEnableLayoutAnim(true), 200); 
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  const date = parseISO(milestone.date)
  if (isBefore(date, roadmapStart) || isAfter(date, roadmapEnd)) return null;

  const dayIndex = differenceInDays(date, roadmapStart)
  const Icon = MILESTONE_ICONS[milestone.icon || 'diamond'] || MILESTONE_ICONS['diamond']
  const colorClass = milestone.color || 'text-slate-600'

  const topOffset = 20 + (trackIndex * stackHeight);
  const rowStart = rowIndex + headerRows + 1;

  const wrapperStyle = {
    gridColumnStart: dayIndex + 2,
    gridRowStart: rowStart,
    marginTop: `${topOffset}px`, 
    zIndex: (transform || isDragging) ? 999 : (mousePos.isHovering ? 50 : 30), 
    touchAction: 'none' as const
  }

  const innerStyle = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  }

  // --- ADAPTIVE ICON SIZING ---
  const iconSize = timeView === 'Quarter' ? "16" : (timeView === 'Month' ? "18" : "24");
  const padding = timeView === 'Quarter' ? 'p-0.5' : (timeView === 'Month' ? 'p-1' : 'p-2');
  const textSize = timeView === 'Quarter' ? 'text-[9px]' : (timeView === 'Month' ? 'text-[10px]' : 'text-[11px]');

  return (
    <motion.div
      layout={enableLayoutAnim ? "position" : false}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      style={wrapperStyle}
      className="relative flex flex-col items-center w-full self-start"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(prev => ({ ...prev, isHovering: false }))}
      onMouseEnter={() => setMousePos(prev => ({ ...prev, isHovering: true }))}
    >
      {/* TOOLTIP */}
      <div 
          className="absolute -top-10 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-[1000] flex items-center gap-1.5 transition-opacity duration-200"
          style={{ 
              left: '50%', 
              transform: 'translateX(-50%)', 
              opacity: mousePos.isHovering && !isDragging ? 1 : 0 
          }}
      >
          <span>{format(date, 'MMM d, yyyy')}</span>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 border-[5px] border-transparent border-t-slate-900 dark:border-t-white"></div>
      </div>

      <div 
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          onClick={(e) => { 
              if(!isDragging) { e.stopPropagation(); onClick(milestone) }
          }}
          className="flex flex-col items-center group relative w-full cursor-grab active:cursor-grabbing" 
          style={innerStyle}
      >
          <div className={`
              ${colorClass} mb-1 rounded-full bg-white shadow-sm border border-slate-100
              group-hover:scale-110 group-hover:shadow-md transition-all duration-200
              ${isDragging ? 'scale-125 shadow-xl' : ''}
              ${padding}
          `}>
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  {Icon}
              </svg>
          </div>
          
          <div className={`
              font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap 
              bg-white/90 rounded-md shadow-sm border border-slate-100 backdrop-blur-sm 
              -ml-px pointer-events-none transform transition-transform group-hover:-translate-y-0.5
              ${textSize} px-2 py-0.5
          `}>
              {milestone.title}
          </div>
          
          <div className={`w-[1px] h-[100vh] border-l border-dashed border-slate-300 absolute top-[30px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
    </motion.div>
  )
}