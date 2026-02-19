'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
// --- 1. ADD DragEndEvent ---
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor, DragEndEvent } from '@dnd-kit/core'
// --- 2. ADD arrayMove ---
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Toaster, toast } from 'react-hot-toast'

import { compressImage } from '../utils/ImageCompression';
import { useAuth } from '../context/AuthContext'
import ObjexiaLogo from '../components/ObjexiaLogo'
import ThemeToggle from '../components/ThemeToggle'
import ConfirmModal from '../components/ConfirmModal'
import { RoadmapMeta } from '../components/TimelineConstants'
import EditRoadmapModal, { RoadmapData } from '../components/EditRoadmapModal'

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

function SortableRoadmapCard({ map, onDelete, onEdit }: { map: RoadmapMeta, onDelete: (id: string) => void, onEdit: (map: RoadmapMeta) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: map.id })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.8 : 1 }

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <motion.div layoutId={map.id} className={`group relative bg-white dark:bg-[#1e2126] rounded-2xl border ${isDragging ? 'border-[#3f407e] shadow-2xl scale-105' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#3f407e]/30 dark:hover:border-[#b3bbea]/30'} transition-all overflow-hidden flex flex-col h-full`}>
                <div {...attributes} {...listeners} className="flex-1 p-6 cursor-grab active:cursor-grabbing touch-none">
                    <div className="flex justify-between items-start mb-4 gap-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3f407e] to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 overflow-hidden border border-white/10 shrink-0">
                            {map.avatarUrl ? ( <img src={map.avatarUrl} alt="Icon" className="w-full h-full object-cover" /> ) : ( <span>{map.title[0].toUpperCase()}</span> )}
                        </div>
                        <div className="flex flex-col items-end text-[9px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded-md leading-tight whitespace-nowrap">
                            <span className="text-slate-400 mb-0.5">Created {format(new Date(map.createdAt), 'MMM d, yyyy')}</span>
                            <span className="text-[#3f407e] dark:text-[#b3bbea]">Edited {formatDistanceToNow(new Date(map.lastEdited))} ago</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#3f407e] dark:group-hover:text-[#b3bbea] transition-colors line-clamp-1 truncate" title={map.title}>{map.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 leading-relaxed">{map.description || "No description provided."}</p>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <Link href={`/roadmap/${map.id}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3f407e]/10 dark:bg-[#b3bbea]/10 text-[#3f407e] dark:text-[#b3bbea] font-bold text-xs hover:bg-[#3f407e] hover:text-white dark:hover:bg-[#b3bbea] dark:hover:text-slate-900 transition-all shadow-sm hover:shadow-md active:scale-95" onPointerDown={(e) => e.stopPropagation()}>
                        <span>Open Board</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(map)} onPointerDown={(e) => e.stopPropagation()} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all p-2 rounded-lg" title="Edit Roadmap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button onClick={() => onDelete(map.id)} onPointerDown={(e) => e.stopPropagation()} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-2 rounded-lg" title="Delete Roadmap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState<RoadmapMeta[]>([])
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [roadmapToEdit, setRoadmapToEdit] = useState<RoadmapData | null>(null)

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [editFormError, setEditFormError] = useState<string | null>(null) 
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }))

  useEffect(() => {
    const timer = setTimeout(() => { if (!isAuthenticated && !localStorage.getItem('roadmap_user')) { router.push('/login') } }, 100)
    return () => clearTimeout(timer)
  }, [isAuthenticated, router])

  const fetchRoadmaps = async () => {
      if (!user?.id) return
      setIsLoading(true)
      try {
          const res = await fetch(`/api/roadmaps?userId=${user.id}`)
          const data = await res.json()
          if (data.roadmaps) setRoadmaps(data.roadmaps)
      } catch (err) {
          console.error("Failed to load roadmaps", err)
      } finally {
          setIsLoading(false)
      }
  }

  useEffect(() => { if (user?.id) fetchRoadmaps() }, [user])

  // --- 3. ADD HANDLE DRAG END ---
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        // 1. Update Local State (Optimistic)
        const oldIndex = roadmaps.findIndex((r) => r.id === active.id);
        const newIndex = roadmaps.findIndex((r) => r.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(roadmaps, oldIndex, newIndex);
            setRoadmaps(newOrder);

            // 2. Persist to Backend
            try {
                const updates = newOrder.map((r, idx) => ({ id: r.id, order: idx }));
                await fetch('/api/roadmaps/reorder', { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roadmaps: updates })
                });
            } catch (e) {
                console.error("Failed to save reorder", e);
                toast.error("Failed to save new order");
            }
        }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setFormError(null)
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { setFormError("Title is required."); return; }

    const isDuplicate = roadmaps.some(
        (r) => r.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (isDuplicate) {
        setFormError("A roadmap with this name already exists.");
        return;
    }

    setIsSubmitting(true)

    try {
        const res = await fetch('/api/roadmaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: trimmedTitle, 
                description: desc, 
                avatarUrl, 
                userId: user.id,
                order: roadmaps.length // Add to end of list
            })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        
        setRoadmaps([...roadmaps, data.roadmap])
        toast.success("Roadmap created successfully");
        setIsCreateModalOpen(false)
    } catch (err: any) {
        setFormError(err.message || "Failed to create")
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleSaveEditedRoadmap = async (updatedData: RoadmapData, newImageFile?: File | null) => {
    setEditFormError(null); 
    
    const isDuplicate = roadmaps.some(
        (r) => r.id !== updatedData.id && r.title.trim().toLowerCase() === updatedData.title.trim().toLowerCase()
    );
    
    if (isDuplicate) {
        setEditFormError("A roadmap with this name already exists.");
        throw new Error("Duplicate name"); 
    }

    try {
        let finalAvatarUrl = updatedData.imageUrl;

        if (newImageFile) {
            finalAvatarUrl = await fileToBase64(newImageFile);
        }

        const res = await fetch(`/api/roadmaps/${updatedData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: updatedData.title, 
                description: updatedData.description, 
                avatarUrl: finalAvatarUrl 
            })
        })

        if (!res.ok) throw new Error("Update failed");
        
        setRoadmaps(prev => prev.map(r => r.id === updatedData.id ? { 
            ...r, 
            title: updatedData.title, 
            description: updatedData.description || '', 
            avatarUrl: finalAvatarUrl || undefined,
            lastEdited: new Date().toISOString() 
        } : r))
        
    } catch (error: any) {
        console.error("Failed to save roadmap changes", error);
        if (error.message !== "Duplicate name") {
           setEditFormError("Failed to save changes. Please try again.");
        }
        throw error; 
    }
  }

  const handleDeleteRoadmap = async () => {
      if (!deleteId) return;
      try {
          await fetch(`/api/roadmaps/${deleteId}`, { method: 'DELETE' });
          setRoadmaps(prev => prev.filter(r => r.id !== deleteId));
          toast.success("Roadmap deleted successfully");
          setDeleteId(null);
      } catch (e) { 
          console.error(e); 
          toast.error("Failed to delete roadmap");
      }
  }

  const openCreate = () => { setTitle(''); setDesc(''); setAvatarUrl(''); setFormError(null); setIsCreateModalOpen(true); }
  
  const openEdit = (map: RoadmapMeta) => { 
      setEditFormError(null); 
      setRoadmapToEdit({
          ...map,
          imageUrl: map.avatarUrl
      });
      setIsEditModalOpen(true); 
  }

  const handleAvatarUploadCreate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setFormError("Please upload an image file.");
            return;
        }
        try {
            const compressedBase64 = await compressImage(file);
            setAvatarUrl(compressedBase64);
            setFormError(null);
        } catch (err) {
            console.error("Compression failed", err);
            setFormError("Failed to process image. Try a different one.");
        }
    }
  }

  const handleRemoveIconCreate = () => setAvatarUrl('');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121417] text-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#191b19]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
       <div className="flex items-center gap-3">
         <ObjexiaLogo className="w-10 h-10" />
         <div className="flex flex-col">
            <span className="font-spartan font-extrabold text-xl text-[#3f407e] dark:text-[#b3bbea] leading-none">Objexia</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
         </div>
       </div>
       <div className="flex items-center gap-4">
         <ThemeToggle />
         {user && <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700"> <Link href={`/profile?from=/dashboard`}> <div className="w-9 h-9 rounded-full bg-[#b3bbea] dark:bg-[#3f407e] border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer overflow-hidden hover:scale-105 transition-transform"> {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#3f407e] dark:text-[#b3bbea] font-bold text-xs">{user.firstName?.[0] || 'U'}</div>} </div> </Link> <button onClick={logout} className="text-xs font-bold text-red-500 hover:text-red-600 px-2">Log Out</button> </div>}
       </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div> <h1 className="text-3xl font-extrabold mb-2">My Roadmaps</h1> <p className="text-slate-500 dark:text-slate-400">Manage your product strategies in one place.</p> </div>
            <button onClick={openCreate} className="px-6 py-3 bg-[#3f407e] hover:bg-[#323366] text-white font-bold rounded-xl shadow-lg shadow-[#3f407e]/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:scale-95"> <span>+ Create New Roadmap</span> </button>
        </div>

        {isLoading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f407e]"></div></div>
        ) : roadmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600"> <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No roadmaps yet</h3> <p className="text-slate-500 mb-8">Create your first roadmap to get started.</p>
                <button onClick={openCreate} className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[#3f407e] dark:text-[#b3bbea] rounded-xl hover:shadow-lg transition-all">Create Roadmap</button>
            </div>
        ) : (
            // --- 4. ATTACH HANDLER HERE ---
            <DndContext onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={closestCenter}>
                <SortableContext items={roadmaps.map(r => r.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roadmaps.map((map) => ( <SortableRoadmapCard key={map.id} map={map} onDelete={setDeleteId} onEdit={openEdit} /> ))}
                    </div>
                </SortableContext>
            </DndContext>
        )}
      </main>

      <AnimatePresence>
        {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.form onSubmit={handleCreate} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-[#1e2126] w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <h2 className="text-2xl font-bold mb-6">Create Roadmap</h2>
                    {formError && ( <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-bold"> {formError} </div> )}
                    
                    <div className="mb-6 space-y-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cover Image</label>
                        <div className="relative group cursor-pointer overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                            <div className={`w-full h-52 rounded-xl overflow-hidden border-2 flex items-center justify-center p-8 transition-all ${avatarUrl ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-[#3f407e]/50 dark:hover:border-[#3f407e]/50'} bg-slate-50 dark:bg-slate-800/50`}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-[#3f407e] dark:group-hover:text-[#b3bbea] transition-colors">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            <span className="text-sm font-bold">Upload Image</span>
                                            <span className="text-xs font-medium opacity-70">PNG, JPG up to 5MB</span>
                                    </div>
                                )}
                            </div>
                            {avatarUrl && (
                                <button type="button" onClick={(e) => {e.stopPropagation(); handleRemoveIconCreate();}} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 z-50 pointer-events-auto transition-transform hover:scale-110">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            )}
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUploadCreate} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div> 
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Roadmap Name <span className="text-red-500">*</span></label> 
                            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q1 Product Strategy" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-[#3f407e] placeholder:text-slate-400" required /> 
                        </div>
                        <div> 
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description (Optional)</label> 
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this roadmap about?" style={{ minHeight: '120px', maxHeight: '300px' }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-[#3f407e] transition-colors resize-y placeholder:text-slate-400" /> 
                        </div>
                        <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800"> 
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button> 
                            <button type="submit" disabled={isSubmitting || !title.trim()} className="flex-1 py-3 font-bold text-white bg-[#3f407e] hover:bg-[#323366] rounded-xl shadow-lg disabled:opacity-70 transition-all disabled:cursor-not-allowed">{isSubmitting ? 'Creating...' : 'Create Roadmap'}</button> 
                        </div>
                    </div>
                </motion.form>
            </div>
        )}

        {isEditModalOpen && roadmapToEdit && (
            <EditRoadmapModal 
                key="edit-modal"
                onClose={() => setIsEditModalOpen(false)} 
                roadmap={roadmapToEdit}
                onSave={handleSaveEditedRoadmap}
                error={editFormError} 
            />
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDeleteRoadmap} title="Delete Roadmap?" message="This action cannot be undone. All tracks and items inside will be lost." confirmText="Delete Forever" isDangerous={true} />
      
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', fontSize: '14px', borderRadius: '12px' } }} />
    </div>
  )
}