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
  
  // Warning State
  const [showTypeWarning, setShowTypeWarning] = useState(false)

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

  // --- CHANGED: Defer validation to Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (editGroupId) {
        // Check if type changed
        const currentGroup = groups.find(g => g.id === editGroupId);
        if (currentGroup && currentGroup.type !== laneType) {
            // Check for data conflict
            const hasItems = items.some(i => i.groupId === editGroupId);
            const hasMilestones = milestones.some(m => m.groupId === editGroupId);

            if ((laneType === 'milestone' && hasItems) || (laneType === 'lane' && hasMilestones)) {
                // CONFLICT DETECTED: Show warning, do NOT save yet
                setShowTypeWarning(true);
                return;
            }
        }

        // No conflict? Proceed.
        onUpdateLane(editGroupId, { title, color: selectedColor, type: laneType })
        onClose()
    } else {
        onCreateLane(title, selectedColor, laneType)
        setTitle('')
        setSelectedColor('brand')
        onClose() 
    }
  }

  // --- NEW: Execute Save AFTER Confirmation ---
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

  const confirmDelete = (id: string) => { setDeleteConfirmId(id) }

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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[700px] border border-transparent dark:border-slate-700/50"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
                <h2 className="text-lg font-extrabold text-gray-800 dark:text-white tracking-tight">
                    {editGroupId ? 'Edit Track' : 'Manage Structure'}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition">✕</button>
              </div>

              {!editGroupId && (
                  <div className="flex p-1 mx-6 mt-6 bg-gray-100 dark:bg-slate-800 rounded-lg shrink-0">
                      <button onClick={() => setActiveTab('add')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'add' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
                          Add New
                      </button>
                      <button onClick={() => setActiveTab('reorder')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'reorder' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
                          Reorder ({localGroups.length})
                      </button>
                  </div>
              )}

              <div className="p-6 overflow-y-auto flex-1">
                  <AnimatePresence mode="wait">
                      {activeTab === 'add' ? (
                          <motion.form 
                            key="add-form"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmit} 
                            className="space-y-5"
                          >
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Track Name</label>
                                  <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-[#3f407e] dark:focus:border-[#3f407e] rounded-xl outline-none text-gray-800 dark:text-white font-bold transition-all placeholder:text-gray-300"
                                    placeholder="e.g. Q1 Marketing Initiatives"
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Track Type</label>
                                  <div className="grid grid-cols-2 gap-3">
                                      {/* --- Reverted to simple state setting, validation happens on Save --- */}
                                      <button type="button" onClick={() => setLaneType('lane')} className={`p-3 rounded-xl border-2 text-left transition-all duration-300 ${laneType === 'lane' ? 'border-[#3f407e] bg-[#3f407e]/5' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300'}`}>
                                          <div className={`font-bold text-sm transition-colors ${laneType === 'lane' ? 'text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-600 dark:text-slate-400'}`}>Standard Lane</div>
                                          <div className="text-[10px] text-gray-400 mt-1">For bars and objectives</div>
                                      </button>
                                      <button type="button" onClick={() => setLaneType('milestone')} className={`p-3 rounded-xl border-2 text-left transition-all duration-300 ${laneType === 'milestone' ? 'border-[#3f407e] bg-[#3f407e]/5' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300'}`}>
                                          <div className={`font-bold text-sm transition-colors ${laneType === 'milestone' ? 'text-[#3f407e] dark:text-[#b3bbea]' : 'text-gray-600 dark:text-slate-400'}`}>Milestone Track</div>
                                          <div className="text-[10px] text-gray-400 mt-1">For diamonds and pins</div>
                                      </button>
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Color Theme</label>
                                  <div className="grid grid-cols-5 gap-3">
                                      {Object.entries(COLOR_VARIANTS).map(([key, variant]) => {
                                          const bgClass = laneType === 'lane' ? variant.bg : variant.milestone.bg;
                                          return (
                                              <button key={key} type="button" onClick={() => setSelectedColor(key)} className={`w-10 h-10 rounded-full ${bgClass} border-2 flex items-center justify-center transition-all duration-500 hover:scale-110 ${selectedColor === key ? 'ring-2 ring-[#3f407e] ring-offset-2 dark:ring-offset-slate-900 border-white' : 'border-transparent opacity-80 hover:opacity-100'}`} title={key.charAt(0).toUpperCase() + key.slice(1)}>
                                                  {selectedColor === key && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={laneType === 'lane' ? 'white' : '#3f407e'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                              </button>
                                          )
                                      })}
                                  </div>
                              </div>

                              <div className="pt-2">
                                  <button type="submit" disabled={!title.trim()} className="w-full py-3 bg-[#3f407e] hover:bg-[#323366] text-white font-bold rounded-xl shadow-lg shadow-[#3f407e]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95">
                                      {editGroupId ? 'Save Changes' : 'Create Track'}
                                  </button>
                                  {editGroupId && (
                                      <button type="button" onClick={() => confirmDelete(editGroupId)} className="w-full mt-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-colors">
                                          Delete Track
                                      </button>
                                  )}
                              </div>
                          </motion.form>
                      ) : (
                          <Reorder.Group 
                            axis="y" 
                            values={localGroups} 
                            onReorder={handleReorder} 
                            className="space-y-2 min-h-[300px]"
                            as="div" 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                              {localGroups.map((group) => (
                                  <Reorder.Item 
                                    key={group.id} 
                                    value={group} 
                                    as="div"
                                    onDragEnd={handleDragEnd} 
                                    className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing group"
                                  >
                                      <div className="text-gray-300 dark:text-slate-600">
                                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                      </div>
                                      <div className={`w-3 h-3 rounded-full ${COLOR_VARIANTS[group.color]?.bg || 'bg-gray-400'}`} />
                                      <span className="font-bold text-sm text-gray-700 dark:text-slate-200 flex-1">{group.title}</span>
                                      
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => onEditLane(group)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-[#3f407e] dark:hover:text-[#b3bbea]">
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                          </button>
                                          <button onClick={() => confirmDelete(group.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-gray-400 hover:text-red-500">
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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

      {/* --- CONFIRM TYPE CHANGE MODAL --- */}
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