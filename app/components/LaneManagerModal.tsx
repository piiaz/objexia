'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Group, COLOR_VARIANTS, Item, Milestone, GroupType } from './TimelineConstants'
import ConfirmModal from './ConfirmModal'

type Props = {
  isOpen: boolean
  mode: 'add' | 'manage'
  onClose: () => void
  groups: Group[]
  onCreateLane: (title: string, color: string, type: GroupType) => void
  onUpdateLane: (id: string, data: Partial<Group>) => void
  onDeleteLane: (id: string) => void
  onReorderLanes: (newGroups: Group[]) => void
  onEditLane: (group: Group) => void
  editGroupId?: string | null
  items?: Item[]
  milestones?: Milestone[]
}

export default function LaneManagerModal({ 
    isOpen, mode, onClose, groups, 
    onCreateLane, onUpdateLane, onDeleteLane, onReorderLanes, onEditLane,
    editGroupId, items = [], milestones = [] 
}: Props) {
  
  const [activeTab, setActiveTab] = useState<'add' | 'reorder'>('add')
  const [title, setTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState('brand') 
  const [laneType, setLaneType] = useState<GroupType>('lane')
  
  const [localGroups, setLocalGroups] = useState<Group[]>([])
  const groupsRef = useRef<Group[]>([])

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showTypeWarning, setShowTypeWarning] = useState(false)

  // Initialize state based on whether we are editing or adding
  useEffect(() => {
      if (isOpen) {
          if (editGroupId) {
              const group = groups.find(g => g.id === editGroupId)
              if (group) {
                  setTitle(group.title)
                  setSelectedColor(group.color)
                  setLaneType(group.type)
                  setActiveTab('add') 
              }
          } else {
              setTitle('')
              setSelectedColor('brand')
              setLaneType('lane')
              setActiveTab(mode === 'manage' ? 'reorder' : 'add')
          }
      }
  }, [isOpen, editGroupId, mode, groups]) 

  useEffect(() => {
      setLocalGroups(groups)
      groupsRef.current = groups
  }, [groups])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (editGroupId) {
        const currentGroup = groups.find(g => g.id === editGroupId);
        if (currentGroup && currentGroup.type !== laneType) {
            const hasItems = items.some(i => i.groupId === editGroupId);
            const hasMilestones = milestones.some(m => m.groupId === editGroupId);

            // Trigger warning if changing type would delete data
            if ((laneType === 'milestone' && hasItems) || (laneType === 'lane' && hasMilestones)) {
                setShowTypeWarning(true);
                return;
            }
        }
        onUpdateLane(editGroupId, { title, color: selectedColor, type: laneType })
        onClose()
    } else {
        onCreateLane(title, selectedColor, laneType)
        onClose() 
    }
  }

  const confirmTypeChange = () => {
      if (editGroupId) {
          onUpdateLane(editGroupId, { title, color: selectedColor, type: laneType });
          setShowTypeWarning(false);
          onClose();
      }
  }

  const getTypeWarningMessage = () => {
      if (!editGroupId) return "";
      if (laneType === 'milestone') {
          const count = items.filter(i => i.groupId === editGroupId).length;
          return `This track contains ${count} objective(s). Switching to a Milestone Track will permanently delete them.`;
      } else {
          const count = milestones.filter(m => m.groupId === editGroupId).length;
          return `This track contains ${count} milestone(s). Switching to a Standard Lane will permanently delete them.`;
      }
  }

  const handleReorder = (newOrder: Group[]) => {
      setLocalGroups(newOrder)
      groupsRef.current = newOrder
  }

  const handleDragEnd = () => {
      const initialIds = groups.map(g => g.id).join(',')
      const currentIds = groupsRef.current.map(g => g.id).join(',')
      if (initialIds === currentIds) return 
      onReorderLanes(groupsRef.current)
  }

  const executeDelete = () => {
      if (deleteConfirmId) {
          onDeleteLane(deleteConfirmId)
          setDeleteConfirmId(null)
          if(editGroupId) onClose();
      }
  }

  const getDeleteWarning = () => {
      if (!deleteConfirmId) return ""
      const count = items.filter(i => i.groupId === deleteConfirmId).length + milestones.filter(m => m.groupId === deleteConfirmId).length
      return count > 0 
        ? `This track contains ${count} items. Deleting it will permanently remove all associated objectives and milestones.` 
        : "Are you sure you want to delete this track?"
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative bg-white dark:bg-[#1e2126] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[700px] border border-slate-200/50 dark:border-white/10"
            >
              <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800/60 flex justify-between items-center bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm shrink-0">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {editGroupId ? 'Edit Track' : 'Manage Structure'}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-slate-700 dark:hover:text-white transition-all transform hover:scale-105">✕</button>
              </div>

              {!editGroupId && (
                  <div className="flex p-1.5 mx-8 mt-8 bg-gray-100/80 dark:bg-slate-800/60 rounded-xl shrink-0">
                      <button onClick={() => setActiveTab('add')} className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all duration-300 ${activeTab === 'add' ? 'bg-white dark:bg-slate-700 shadow-md text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                          Add New
                      </button>
                      <button onClick={() => setActiveTab('reorder')} className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all duration-300 ${activeTab === 'reorder' ? 'bg-white dark:bg-slate-700 shadow-md text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
                          Reorder ({localGroups.length})
                      </button>
                  </div>
              )}

              <div className="p-8 overflow-y-auto flex-1">
                  <AnimatePresence mode="wait">
                      {activeTab === 'add' ? (
                          <motion.form 
                            key="add-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmit} 
                            className="space-y-7"
                          >
                              <div>
                                  <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Track Name</label>
                                  <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-[#191b19] focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-4 focus:ring-[#3f407e]/10 dark:focus:ring-[#b3bbea]/10 rounded-2xl outline-none text-lg font-bold text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                                    placeholder="e.g. Q1 Marketing Initiatives"
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">Track Type</label>
                                  <div className="grid grid-cols-2 gap-4">
                                      <button type="button" onClick={() => setLaneType('lane')} className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${laneType === 'lane' ? 'border-[#3f407e] bg-[#3f407e]/5 shadow-sm scale-[1.02]' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                                          <div className={`font-extrabold text-sm transition-colors ${laneType === 'lane' ? 'text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-600 dark:text-slate-300'}`}>Standard Lane</div>
                                          <div className="text-[11px] text-gray-400 font-medium mt-1">For bars and objectives</div>
                                      </button>
                                      <button type="button" onClick={() => setLaneType('milestone')} className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${laneType === 'milestone' ? 'border-[#3f407e] bg-[#3f407e]/5 shadow-sm scale-[1.02]' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                                          <div className={`font-extrabold text-sm transition-colors ${laneType === 'milestone' ? 'text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-600 dark:text-slate-300'}`}>Milestone Track</div>
                                          <div className="text-[11px] text-gray-400 font-medium mt-1">For diamonds and pins</div>
                                      </button>
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Color Theme</label>
                                  <div className="grid grid-cols-5 gap-4">
                                      {Object.entries(COLOR_VARIANTS).map(([key, variant]) => {
                                          const bgClass = laneType === 'lane' ? variant.bg : variant.milestone.bg;
                                          return (
                                              <button key={key} type="button" onClick={() => setSelectedColor(key)} className={`w-11 h-11 mx-auto rounded-full ${bgClass} border-[3px] flex items-center justify-center transition-all duration-300 hover:scale-110 ${selectedColor === key ? 'ring-2 ring-offset-2 ring-gray-900/20 dark:ring-white/40 dark:ring-offset-[#1e2126] border-white/80 dark:border-white shadow-md scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} title={key.charAt(0).toUpperCase() + key.slice(1)}>
                                                  {selectedColor === key && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={laneType === 'lane' ? 'white' : 'currentColor'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                              </button>
                                          )
                                      })}
                                  </div>
                              </div>

                              <div className="pt-4">
                                  <button type="submit" disabled={!title.trim()} className="relative overflow-hidden group w-full py-4 text-sm bg-[#3f407e] text-white font-bold rounded-2xl shadow-[0_4px_14px_0_rgb(63,64,126,0.39)] hover:shadow-[0_6px_20px_rgba(63,64,126,0.23)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-[1px] active:scale-95">
                                      <span className="relative z-10">{editGroupId ? 'Save Changes' : 'Create Track'}</span>
                                      {title.trim() && <div className="absolute inset-0 h-full w-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />}
                                  </button>
                                  {editGroupId && (
                                      <button type="button" onClick={() => setDeleteConfirmId(editGroupId)} className="w-full mt-4 py-3.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-2xl transition-colors">
                                          Delete Track Forever
                                      </button>
                                  )}
                              </div>
                          </motion.form>
                      ) : (
                          <Reorder.Group 
                            axis="y" 
                            values={localGroups} 
                            onReorder={handleReorder} 
                            className="space-y-3 min-h-[300px] pb-10"
                            as="div" 
                          >
                              {localGroups.map((group) => (
                                  <Reorder.Item 
                                    key={group.id} 
                                    value={group} 
                                    layout
                                    layoutId={group.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35,
                                        mass: 1,
                                        opacity: { duration: 0.2 }
                                    }}
                                    as="div"
                                    onDragEnd={handleDragEnd} 
                                    className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing group hover:shadow-md transition-shadow relative"
                                  >
                                      <div className="text-gray-300 dark:text-slate-600 group-hover:text-[#3f407e] dark:group-hover:text-[#b3bbea] transition-colors shrink-0">
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                      </div>
                                      <div className={`w-3.5 h-3.5 rounded-full ${COLOR_VARIANTS[group.color]?.bg || 'bg-gray-400'} shadow-sm shrink-0`} />
                                      <span className="font-bold text-sm text-gray-800 dark:text-slate-200 flex-1 truncate">{group.title}</span>
                                      
                                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => onEditLane(group)} className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-gray-500 hover:text-[#3f407e] dark:text-slate-300 dark:hover:text-[#b3bbea] transition-colors shadow-sm">
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                          </button>
                                          <button onClick={() => setDeleteConfirmId(group.id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors shadow-sm">
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                          </button>
                                      </div>
                                  </Reorder.Item>
                              ))}
                          </Reorder.Group>
                      )}
                  </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} onConfirm={executeDelete} title="Delete Track?" message={getDeleteWarning()} confirmText="Delete Track" isDangerous={true} />

      <ConfirmModal 
        isOpen={showTypeWarning}
        onClose={() => setShowTypeWarning(false)}
        onConfirm={confirmTypeChange}
        title="Change Track Type?"
        message={getTypeWarningMessage()}
        confirmText="Yes, Change & Delete Data"
        cancelText="Cancel"
        isDangerous={true}
      />
    </>
  )
}