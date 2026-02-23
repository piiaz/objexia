'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, Transition } from 'framer-motion'
import { format } from 'date-fns' 
import SmartDatePicker from './SmartDatePicker'
import CustomSelect from './CustomSelect'
import ConfirmModal from './ConfirmModal'
import { Group, Item, MilestoneData, MILESTONE_ICONS } from './TimelineConstants'

const MILESTONE_COLORS = [
  { label: 'Slate', text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-600 dark:bg-slate-400' },
  { label: 'Red', text: 'text-red-500', bg: 'bg-red-500' },
  { label: 'Orange', text: 'text-orange-500', bg: 'bg-orange-500' },
  { label: 'Amber', text: 'text-amber-500', bg: 'bg-amber-500' },
  { label: 'Green', text: 'text-emerald-500', bg: 'bg-emerald-500' },
  { label: 'Blue', text: 'text-blue-600', bg: 'bg-blue-600' },
  { label: 'Indigo', text: 'text-indigo-500', bg: 'bg-indigo-500' },
  { label: 'Purple', text: 'text-purple-600', bg: 'bg-purple-600' },
  { label: 'Pink', text: 'text-pink-500', bg: 'bg-pink-500' },
]

function ProgressSection({ progress, setProgress }: { progress: number, setProgress: (v: number) => void }) {
    const [localProgress, setLocalProgress] = useState(progress);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isDragging) setLocalProgress(progress);
    }, [progress, isDragging]);

    const activeTransition: Transition = isDragging 
        ? { type: "tween", duration: 0 } 
        : { type: "spring", stiffness: 600, damping: 40, mass: 1 };

    const handleDragComplete = () => {
        setIsDragging(false);
        setProgress(localProgress); 
    }

    return (
        <div className="bg-gray-50/80 dark:bg-slate-800/30 p-5 rounded-2xl border border-gray-200/60 dark:border-slate-700/50 shadow-sm">
            <div className="flex justify-between items-center mb-5">
                <label className="text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Progress Tracking</label>
                <span className="text-xs font-bold text-[#3f407e] dark:text-[#b3bbea] bg-[#3f407e]/10 dark:bg-[#b3bbea]/10 px-2.5 py-1 rounded-lg border border-[#3f407e]/20 dark:border-[#b3bbea]/20">
                    {localProgress}%
                </span>
            </div>
            
            <div className="relative w-full h-3 bg-gray-200/80 dark:bg-slate-700/80 rounded-full flex items-center group touch-none shadow-inner">
                <motion.div 
                    className="absolute left-0 h-full bg-[#3f407e] dark:bg-[#5b5c9d] rounded-full pointer-events-none"
                    animate={{ width: `${localProgress}%` }}
                    transition={activeTransition}
                />
                
                <motion.div 
                    className="absolute w-6 h-6 bg-white border-4 border-[#3f407e] dark:border-[#5b5c9d] rounded-full pointer-events-none flex items-center justify-center z-10"
                    animate={{ 
                        left: `calc(${localProgress}% - 12px)`,
                        scale: isDragging ? 1.2 : 1,
                        boxShadow: isDragging 
                            ? "0 8px 20px rgba(63, 64, 126, 0.4), 0 0 0 6px rgba(63, 64, 126, 0.15)" 
                            : "0 2px 5px rgba(0,0,0,0.2)"
                    }}
                    transition={activeTransition}
                >
                    <motion.div 
                        className="w-1.5 h-1.5 bg-[#3f407e] dark:bg-[#5b5c9d] rounded-full"
                        animate={{ opacity: isDragging ? 1 : 0, scale: isDragging ? 1 : 0.5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    />
                </motion.div>
                
                <input 
                    type="range" min="0" max="100" 
                    value={localProgress} 
                    onChange={(e) => setLocalProgress(Number(e.target.value))} 
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={handleDragComplete}
                    onMouseLeave={handleDragComplete} 
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={handleDragComplete}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" 
                />
            </div>
        </div>
    )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  groups: Group[]
  
  onSaveObjective: (item: Omit<Item, 'id'>) => void
  onDeleteObjective?: () => void
  editObjective?: Item | null
  
  onSaveMilestone: (data: MilestoneData) => void
  onDeleteMilestone?: (id: string) => void
  editMilestone?: MilestoneData | null
}

export default function ItemEditorModal({ 
    isOpen, onClose, groups, 
    onSaveObjective, onDeleteObjective, editObjective,
    onSaveMilestone, onDeleteMilestone, editMilestone
}: Props) {
  
  const [mode, setMode] = useState<'objective' | 'milestone'>('objective')
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [progress, setProgress] = useState(0)
  const [description, setDescription] = useState('')

  const [date, setDate] = useState('')
  const [icon, setIcon] = useState('diamond')
  const [color, setColor] = useState('text-slate-600')

  const objectiveLanes = groups.filter(g => g.type === 'lane')
  const milestoneTracks = groups.filter(g => g.type === 'milestone')

  useEffect(() => {
    if (isOpen) {
      if (editObjective) {
        setMode('objective')
        setTitle(editObjective.title)
        setStartDate(editObjective.startDate)
        setEndDate(editObjective.endDate)
        setGroupId(editObjective.groupId)
        setProgress(editObjective.progress || 0)
        setDescription(editObjective.description || '')
      } else if (editMilestone) {
        setMode('milestone')
        setTitle(editMilestone.title)
        setDate(editMilestone.date)
        setGroupId(editMilestone.groupId)
        setIcon(editMilestone.icon || 'diamond')
        setColor(editMilestone.color || 'text-slate-600')
      } else {
        setMode('objective')
        const today = format(new Date(), 'yyyy-MM-dd')
        setTitle('')
        setStartDate(today)
        setEndDate(today)
        setDate(today)
        setProgress(0)
        setDescription('')
        setIcon('diamond')
        setColor('text-slate-600')
        const validGroups = objectiveLanes 
        setGroupId(validGroups.length > 0 ? validGroups[0].id : '')
      }
    }
  }, [isOpen, editObjective, editMilestone]) 

  useEffect(() => {
      if (!editObjective && !editMilestone && isOpen) {
          const validGroups = mode === 'objective' ? objectiveLanes : milestoneTracks
          if (!validGroups.find(g => g.id === groupId)) {
              setGroupId(validGroups.length > 0 ? validGroups[0].id : '')
          }
      }
  }, [mode, isOpen, objectiveLanes, milestoneTracks, groupId, editObjective, editMilestone])

  const hasChanges = useMemo(() => {
      if (mode === 'objective') {
          if (!editObjective) return title.trim() !== '' && groupId !== '';
          return (
              title !== editObjective.title ||
              startDate !== editObjective.startDate ||
              endDate !== editObjective.endDate ||
              groupId !== editObjective.groupId ||
              progress !== (editObjective.progress || 0) ||
              description !== (editObjective.description || '')
          );
      } else {
          if (!editMilestone) return title.trim() !== '' && groupId !== '';
          return (
              title !== editMilestone.title ||
              date !== editMilestone.date ||
              groupId !== editMilestone.groupId ||
              icon !== (editMilestone.icon || 'diamond') ||
              color !== (editMilestone.color || 'text-slate-600')
          );
      }
  }, [title, startDate, endDate, groupId, progress, description, date, icon, color, mode, editObjective, editMilestone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId) return;

    if (mode === 'objective') {
        onSaveObjective({ title, startDate, endDate, groupId, progress, description, trackIndex: editObjective?.trackIndex || 0 })
    } else {
        const payload: MilestoneData = { title, date, groupId, icon, color };
        if (editMilestone?.id) payload.id = editMilestone.id;
        onSaveMilestone(payload)
    }
    onClose()
  }

  const handleDelete = () => {
    if (mode === 'objective' && onDeleteObjective) onDeleteObjective()
    if (mode === 'milestone' && onDeleteMilestone && editMilestone?.id) onDeleteMilestone(editMilestone.id)
    setIsConfirmOpen(false)
  }

  const isEditing = !!editObjective || !!editMilestone;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* UPGRADED: Deep blur backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" 
            />
            
            <motion.div 
              layout
              // UPGRADED: Spring-loaded physics
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-[#1e2126] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/50 dark:border-white/10"
            >
              <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800/60 flex justify-between items-center bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm z-10 relative">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {isEditing ? (mode === 'objective' ? 'Edit Initiative' : 'Edit Milestone') : 'Add to Roadmap'}
                </h2>
                <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-slate-700 dark:hover:text-white transition-all transform hover:scale-105">✕</button>
              </div>

              <div className="p-8 overflow-y-auto overflow-x-hidden">
                {!isEditing && (
                    <div className="flex p-1.5 bg-gray-100/80 dark:bg-slate-800/60 rounded-xl mb-8">
                        <button type="button" onClick={() => setMode('objective')} className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all duration-300 ${mode === 'objective' ? 'bg-white dark:bg-slate-700 shadow-md text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                            Objective
                        </button>
                        <button type="button" onClick={() => setMode('milestone')} className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all duration-300 ${mode === 'milestone' ? 'bg-white dark:bg-slate-700 shadow-md text-slate-800 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                            Milestone
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {mode === 'objective' ? (
                        <motion.form 
                            id="item-form"
                            key="objective-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmit} 
                            className="space-y-7"
                        >
                            <div>
                                <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Initiative Name</label>
                                {/* UPGRADED: Glowing Input */}
                                <input autoFocus required type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-[#191b19] focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-4 focus:ring-[#3f407e]/10 dark:focus:ring-[#b3bbea]/10 rounded-2xl outline-none text-lg font-bold text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                                    placeholder="e.g. Q1 Global Expansion"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                                    <SmartDatePicker value={startDate} onChange={setStartDate} maxDate={endDate} className="w-full shadow-sm" usePortal={true} />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                                    <SmartDatePicker value={endDate} onChange={setEndDate} minDate={startDate} className="w-full shadow-sm" usePortal={true} />
                                </div>
                            </div>

                            <div>
                                <CustomSelect 
                                    label="Strategic Lane"
                                    value={groupId}
                                    onChange={setGroupId}
                                    options={objectiveLanes.map(g => ({ label: g.title, value: g.id }))}
                                    placeholder="Select a lane..."
                                />
                                {objectiveLanes.length === 0 && <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">⚠️ Please create a Lane first from the "Manage Structure" menu.</p>}
                            </div>

                            <ProgressSection progress={progress} setProgress={setProgress} />
                            
                            <div>
                                <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                                <textarea 
                                    value={description} onChange={(e) => setDescription(e.target.value)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-[#191b19] focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-4 focus:ring-[#3f407e]/10 dark:focus:ring-[#b3bbea]/10 outline-none text-sm text-gray-800 dark:text-slate-200 font-medium min-h-[100px] transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm resize-y"
                                    placeholder="Add extra details, links, or context..."
                                />
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form 
                            id="item-form"
                            key="milestone-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmit} 
                            className="space-y-7"
                        >
                            <div>
                                <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Milestone Name</label>
                                <input autoFocus required type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-[#191b19] focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-4 focus:ring-[#3f407e]/10 dark:focus:ring-[#b3bbea]/10 rounded-2xl outline-none text-lg font-bold text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                                    placeholder="e.g. Code Freeze"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Date</label>
                                <SmartDatePicker value={date} onChange={setDate} className="w-full shadow-sm" usePortal={true} />
                            </div>

                            <div>
                                <CustomSelect 
                                    label="Milestone Track"
                                    value={groupId}
                                    onChange={setGroupId}
                                    options={milestoneTracks.map(g => ({ label: g.title, value: g.id }))}
                                    placeholder="Select a track..."
                                />
                                {milestoneTracks.length === 0 && <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">⚠️ Please create a Milestone Track first from the "Manage Structure" menu.</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Style & Color</label>
                                <div className="flex gap-5 p-6 bg-gray-50/80 dark:bg-slate-800/30 rounded-2xl border border-gray-200/60 dark:border-slate-700/50 shadow-sm">
                                    <div className="grid grid-cols-3 gap-3 flex-1">
                                        {Object.entries(MILESTONE_ICONS).map(([key, svg]) => (
                                            <button key={key} type="button" onClick={() => setIcon(key)} className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all duration-200 ${icon === key ? `bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-500 shadow-md scale-105 ${color}` : 'border-transparent text-gray-400 dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 hover:scale-105'}`}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill={icon === key ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svg}</svg>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {MILESTONE_COLORS.map((c) => (
                                            <button key={c.text} type="button" onClick={() => setColor(c.text)} className={`w-9 h-9 rounded-full border-[3px] transition-all duration-200 flex items-center justify-center ${color === c.text ? 'scale-125 border-gray-900/20 dark:border-white/40 shadow-md' : 'border-transparent hover:scale-110'} ${c.bg}`}>
                                                {color === c.text && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-[#191b19] flex justify-between items-center z-10 relative">
                {isEditing ? (
                 <button type="button" onClick={() => setIsConfirmOpen(true)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800">Delete</button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  {/* UPGRADED: Premium Save Button */}
                  <button 
                    form="item-form"
                    disabled={!groupId || !title || !hasChanges} 
                    type="submit" 
                    className="
                        relative overflow-hidden group
                        px-8 py-3 text-sm font-bold text-white 
                        bg-[#3f407e] rounded-xl 
                        shadow-[0_4px_14px_0_rgb(63,64,126,0.39)] 
                        hover:shadow-[0_6px_20px_rgba(63,64,126,0.23)] 
                        hover:-translate-y-[1px]
                        active:scale-95 active:shadow-inner
                        transition-all duration-200 ease-out
                        disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed
                    "
                  >
                    <span className="relative z-10">{isEditing ? 'Save Changes' : 'Create'}</span>
                    {!(!groupId || !title || !hasChanges) && (
                        <div className="absolute inset-0 h-full w-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title={`Delete ${mode === 'objective' ? 'Initiative' : 'Milestone'}?`} message="This action cannot be undone. Are you sure?" confirmText="Delete" />
    </>
  )
}