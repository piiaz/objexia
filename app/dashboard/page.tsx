'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor, DragEndEvent } from '@dnd-kit/core'
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

// --- DRAGGABLE CARD (For My Roadmaps) ---
function SortableRoadmapCard({ map, index, onDelete, onEdit }: { map: RoadmapMeta, index: number, onDelete: (id: string) => void, onEdit: (map: RoadmapMeta) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: map.id })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 }

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <motion.div 
                layoutId={`card-${map.id}`} 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                className={`
                    group relative bg-white/80 dark:bg-[#1e2126]/80 backdrop-blur-xl 
                    rounded-2xl border flex flex-col h-full
                    transition-all duration-300 ease-out
                    ${isDragging 
                        ? 'border-[#3f407e] shadow-2xl scale-105 z-50 brightness-110' 
                        : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#3f407e]/30 dark:hover:border-[#b3bbea]/30'
                    }
                    overflow-hidden
                `}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div {...attributes} {...listeners} className="flex-1 p-6 cursor-grab active:cursor-grabbing touch-none relative z-10">
                    <div className="flex justify-between items-start mb-4 gap-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3f407e] to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden shrink-0 border border-white/10">
                            {map.avatarUrl ? ( <img src={map.avatarUrl} alt="Icon" className="w-full h-full object-cover" /> ) : ( <span>{map.title[0].toUpperCase()}</span> )}
                        </div>
                        <div className="flex flex-col items-end text-[9px] font-bold uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1.5 rounded-md leading-tight whitespace-nowrap">
                            <span className="text-slate-400 mb-0.5">Created {format(new Date(map.createdAt), 'MMM d, yyyy')}</span>
                            <span className="text-[#3f407e] dark:text-[#b3bbea]">Edited {formatDistanceToNow(new Date(map.lastEdited))} ago</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#3f407e] dark:group-hover:text-[#b3bbea] transition-colors line-clamp-1 truncate" title={map.title}>{map.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 leading-relaxed">{map.description || "No description provided."}</p>
                </div>

                <div className="px-6 py-4 border-t border-slate-100/60 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10 relative z-10">
                    <Link 
                        href={`/roadmap/${map.id}`} 
                        className="group/btn flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3f407e]/10 dark:bg-[#b3bbea]/10 text-[#3f407e] dark:text-[#b3bbea] font-bold text-xs hover:bg-[#3f407e] hover:text-white dark:hover:bg-[#b3bbea] dark:hover:text-slate-900 transition-all shadow-sm active:scale-95" 
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <span>Open Board</span>
                        <svg className="transform group-hover/btn:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(map)} onPointerDown={(e) => e.stopPropagation()} className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all p-2 rounded-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button onClick={() => onDelete(map.id)} onPointerDown={(e) => e.stopPropagation()} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-2 rounded-lg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// --- STATIC CARD (For Shared With Me) ---
function SharedRoadmapCard({ map, index }: { map: any, index: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
            className="group relative bg-white/80 dark:bg-[#1e2126]/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-900/50 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex-1 p-6 relative z-10">
                <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden shrink-0 border border-white/10">
                        {map.avatarUrl ? ( <img src={map.avatarUrl} alt="Icon" className="w-full h-full object-cover" /> ) : ( <span>{map.title[0].toUpperCase()}</span> )}
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-blue-200 flex items-center justify-center text-[8px] font-bold text-blue-700">
                            {map.user?.avatarUrl ? <img src={map.user.avatarUrl} className="w-full h-full object-cover"/> : map.user?.firstName?.[0]}
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{map.user?.firstName}'s Board</span>
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 truncate" title={map.title}>{map.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 leading-relaxed">{map.description || "No description provided."}</p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100/60 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10 relative z-10">
                <Link 
                    href={`/roadmap/${map.id}`} 
                    className="group/btn flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm active:scale-95" 
                >
                    <span>Open Board</span>
                    <svg className="transform group-hover/btn:translate-x-1 transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <div className="text-[10px] font-bold text-slate-400">Shared with you</div>
            </div>
        </motion.div>
    )
}

// --- NEW: INVITATION CARD ---
function InvitationCard({ map, index, onAction }: { map: any, index: number, onAction: (roadmapId: string, action: 'ACCEPT' | 'REJECT') => void }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl shadow-sm"
        >
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0 bg-amber-200 flex items-center justify-center font-bold text-amber-700">
                    {map.user?.avatarUrl ? <img src={map.user.avatarUrl} className="w-full h-full object-cover"/> : map.user?.firstName?.[0]}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-amber-600 dark:text-amber-400">{map.user?.firstName}</span> invited you to collaborate
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Board: <span className="font-bold text-slate-700 dark:text-slate-300">{map.title}</span></p>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                    onClick={() => onAction(map.id, 'REJECT')} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                    Decline
                </button>
                <button 
                    onClick={() => onAction(map.id, 'ACCEPT')} 
                    className="flex-1 sm:flex-none px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                    Accept Invite
                </button>
            </div>
        </motion.div>
    );
}

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  
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

  // --- FILTER ROADMAPS BY OWNERSHIP AND STATUS ---
  const myRoadmaps = roadmaps.filter(r => r.userId === user?.id);
  
  // They only show in the main grid if they are ACCEPTED
  const sharedRoadmaps = roadmaps.filter(r => 
      r.userId !== user?.id && r.collaborators?.[0]?.status === 'ACCEPTED'
  );
  
  // They show up top if they are PENDING
  const pendingInvites = roadmaps.filter(r => 
      r.userId !== user?.id && r.collaborators?.[0]?.status === 'PENDING'
  );

  const handleInvitationAction = async (roadmapId: string, action: 'ACCEPT' | 'REJECT') => {
      if (!user?.id) return;
      try {
          const res = await fetch('/api/roadmaps/invitations', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roadmapId, userId: user.id, action })
          });
          
          if (!res.ok) throw new Error("Failed action");
          
          if (action === 'ACCEPT') {
              // Optimistically update the UI to move it to "Shared With Me"
              setRoadmaps(prev => prev.map(r => r.id === roadmapId ? {
                  ...r,
                  collaborators: [{ ...r.collaborators[0], status: 'ACCEPTED' }]
              } : r));
              toast.success("Invitation accepted!");
          } else {
              // Optimistically remove it completely
              setRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
              toast.success("Invitation declined.");
          }
      } catch (e) {
          toast.error("Failed to process invitation");
      }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const oldIndex = myRoadmaps.findIndex((r) => r.id === active.id);
        const newIndex = myRoadmaps.findIndex((r) => r.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(myRoadmaps, oldIndex, newIndex);
            
            // Re-merge lists so state stays in sync
            setRoadmaps([...newOrder, ...sharedRoadmaps, ...pendingInvites]);

            try {
                const updates = newOrder.map((r, idx) => ({ id: r.id, order: idx }));
                await fetch('/api/roadmaps/reorder', { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roadmaps: updates })
                });
            } catch (e) {
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

    const isDuplicate = myRoadmaps.some(
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
                order: myRoadmaps.length 
            })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        
        setRoadmaps([data.roadmap, ...roadmaps])
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
    
    const isDuplicate = myRoadmaps.some(
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
            setFormError("Failed to process image. Try a different one.");
        }
    }
  }

  const handleRemoveIconCreate = () => setAvatarUrl('');

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#121417] text-slate-900 dark:text-slate-100 transition-colors selection:bg-[#3f407e]/20 pb-20">
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#191b19]/70 backdrop-blur-xl backdrop-saturate-150 border-b border-slate-200/50 dark:border-white/5 px-6 py-4 flex items-center justify-between shadow-sm">
       <div className="flex items-center gap-3">
         <ObjexiaLogo className="w-10 h-10" />
         <div className="flex flex-col">
            <span className="font-spartan font-extrabold text-xl text-[#3f407e] dark:text-[#b3bbea] leading-none">Objexia</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
         </div>
       </div>
       <div className="flex items-center gap-4">
         <ThemeToggle />
         {user && <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700"> <Link href={`/profile?from=/dashboard`}> <div className="w-9 h-9 rounded-full bg-[#b3bbea] dark:bg-[#3f407e] border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer overflow-hidden hover:scale-105 hover:shadow-md transition-all"> {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#3f407e] dark:text-[#b3bbea] font-bold text-xs">{user.firstName?.[0] || 'U'}</div>} </div> </Link> <button onClick={logout} className="px-3 py-1.5 border border-red-200/60 dark:border-red-900/40 text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-sm rounded-lg text-xs font-semibold shadow-sm hover:shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200">Sign Out</button> </div>}
       </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
        >
            <div> 
                <h1 className="text-3xl font-extrabold mb-2 tracking-tight">My Roadmaps</h1> 
                <p className="text-slate-500 dark:text-slate-400">Manage your product strategies in one place.</p> 
            </div>
            
            <button 
                onClick={openCreate} 
                className="relative overflow-hidden group px-6 py-3 rounded-xl font-bold text-sm bg-[#3f407e] text-white shadow-[0_4px_14px_0_rgb(63,64,126,0.39)] hover:shadow-[0_6px_20px_rgba(63,64,126,0.23)] hover:-translate-y-[1px] active:scale-95 active:shadow-inner transition-all duration-200 ease-out flex items-center gap-2"
            >
                <span className="relative z-10 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                    Create New Roadmap
                </span>
                <div className="absolute inset-0 h-full w-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </button>
        </motion.div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/50 dark:bg-[#1e2126]/50 rounded-2xl border border-slate-200 dark:border-slate-800 h-[220px] p-6 animate-pulse">
                        <div className="flex justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                            <div className="w-24 h-6 bg-slate-100 dark:bg-slate-800/50 rounded-md" />
                        </div>
                        <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mb-3" />
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800/50 rounded-md mb-2" />
                        <div className="w-2/3 h-4 bg-slate-100 dark:bg-slate-800/50 rounded-md" />
                    </div>
                ))}
            </div>        
        ) : roadmaps.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm"
            >
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-inner"> <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 tracking-tight">No roadmaps yet</h3> <p className="text-slate-500 mb-8">Create your first roadmap to get started.</p>
                <button onClick={openCreate} className="relative overflow-hidden group px-8 py-3 rounded-xl font-bold bg-[#3f407e] text-white shadow-[0_4px_14px_0_rgb(63,64,126,0.39)] hover:shadow-[0_6px_20px_rgba(63,64,126,0.23)] hover:-translate-y-[1px] active:scale-95 active:shadow-inner transition-all duration-200 ease-out">
                    <span className="relative z-10 flex items-center gap-2">Create Roadmap</span>
                    <div className="absolute inset-0 h-full w-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                </button>
            </motion.div>
        ) : (
            <div className="space-y-12">
                
                {/* --- PENDING INVITATIONS --- */}
                {pendingInvites.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                            Action Required ({pendingInvites.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingInvites.map((map, i) => (
                                <InvitationCard key={map.id} map={map} index={i} onAction={handleInvitationAction} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* --- MY ROADMAPS SECTION --- */}
                {myRoadmaps.length > 0 && (
                    <div>
                        <DndContext onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={closestCenter}>
                            <SortableContext items={myRoadmaps.map(r => r.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myRoadmaps.map((map, index) => ( 
                                        <SortableRoadmapCard key={map.id} map={map} index={index} onDelete={setDeleteId} onEdit={openEdit} /> 
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* --- SHARED ROADMAPS SECTION --- */}
                {sharedRoadmaps.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <div className="flex items-center gap-3 mb-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-extrabold tracking-tight">Shared With Me</h2>
                            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full">{sharedRoadmaps.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sharedRoadmaps.map((map, index) => (
                                <SharedRoadmapCard key={map.id} map={map} index={index} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        )}
      </main>

      <AnimatePresence>
        {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" />
                <motion.form onSubmit={handleCreate} initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative bg-white dark:bg-[#1e2126] w-full max-w-lg p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                    <h2 className="text-2xl font-extrabold mb-6 tracking-tight">Create Roadmap</h2>
                    {formError && ( <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-bold"> {formError} </div> )}
                    
                    <div className="mb-6 space-y-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cover Image</label>
                        <div className="relative group cursor-pointer overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                            <div className={`w-full h-52 rounded-xl overflow-hidden border-2 flex items-center justify-center p-8 transition-all duration-300 ${avatarUrl ? 'border-transparent shadow-inner' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-[#3f407e]/50 dark:hover:border-[#3f407e]/50 hover:bg-slate-100 dark:hover:bg-slate-800'} bg-slate-50 dark:bg-slate-800/50`}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-[#3f407e] dark:group-hover:text-[#b3bbea] transition-colors">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            <span className="text-sm font-bold">Upload Image</span>
                                            <span className="text-xs font-medium opacity-70">PNG, JPG up to 5MB</span>
                                    </div>
                                )}
                            </div>
                            {avatarUrl && (
                                <button type="button" onClick={(e) => {e.stopPropagation(); handleRemoveIconCreate();}} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 z-50 pointer-events-auto transition-transform hover:scale-110 active:scale-95">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            )}
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUploadCreate} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div> 
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Roadmap Name <span className="text-red-500">*</span></label> 
                            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q1 Product Strategy" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:border-[#3f407e] focus:ring-4 focus:ring-[#3f407e]/10 transition-all placeholder:text-slate-400" required /> 
                        </div>
                        <div> 
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description (Optional)</label> 
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this roadmap about?" style={{ minHeight: '120px', maxHeight: '300px' }} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-medium outline-none focus:border-[#3f407e] focus:ring-4 focus:ring-[#3f407e]/10 transition-all resize-y placeholder:text-slate-400" /> 
                        </div>
                        <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/50"> 
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button> 
                            <button type="submit" disabled={isSubmitting || !title.trim()} className="flex-1 py-3 font-bold text-white bg-[#3f407e] hover:bg-[#323366] rounded-xl shadow-[0_4px_14px_0_rgb(63,64,126,0.39)] disabled:shadow-none disabled:opacity-70 transition-all disabled:cursor-not-allowed hover:-translate-y-[1px] active:scale-95">{isSubmitting ? 'Creating...' : 'Create Roadmap'}</button> 
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