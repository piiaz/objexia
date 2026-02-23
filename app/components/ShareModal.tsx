'use client'

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

type Collaborator = {
  id: string;
  role: 'VIEWER' | 'EDITOR';
  user: { id: string; email: string; firstName: string; avatarUrl: string | null };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  roadmapId: string;
};

// --- CUSTOM DROPDOWN COMPONENT (Now Strictly Typed!) ---
function CustomRoleSelect({ 
    value, 
    onChange, 
    disabled, 
    variant = 'default' 
}: { 
    value: 'VIEWER' | 'EDITOR', // Strictly typed to match your state
    onChange: (val: 'VIEWER' | 'EDITOR') => void, 
    disabled?: boolean, 
    variant?: 'default' | 'minimal' 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const labels = variant === 'minimal' 
        ? { 'VIEWER': 'Viewer', 'EDITOR': 'Editor' } 
        : { 'VIEWER': 'Can View', 'EDITOR': 'Can Edit' };

    return (
        <div className="relative w-full h-full" ref={ref}>
            <button 
                type="button" 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex w-full h-full items-center justify-between gap-2 outline-none transition-colors ${
                    variant === 'default' 
                    ? 'px-4 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#3f407e]' 
                    : 'bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#3f407e] dark:hover:text-[#b3bbea] px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
            >
                <span className="truncate">{labels[value]}</span>
                {!disabled && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl z-[100] overflow-hidden py-1"
                    >
                        <button type="button" onClick={() => { onChange('VIEWER'); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${value === 'VIEWER' ? 'bg-[#3f407e]/10 text-[#3f407e] dark:text-[#b3bbea]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            {labels['VIEWER']}
                        </button>
                        <button type="button" onClick={() => { onChange('EDITOR'); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${value === 'EDITOR' ? 'bg-[#3f407e]/10 text-[#3f407e] dark:text-[#b3bbea]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            {labels['EDITOR']}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ShareModal({ isOpen, onClose, roadmapId }: Props) {
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        fetchCollaborators();
        setEmail('');
        setRole('VIEWER');
        setInviteError(null);
    }
  }, [isOpen, roadmapId]);

  const fetchCollaborators = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/share`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators);
        setOwner(data.owner);
      }
    } catch (e) { 
      toast.error("Failed to load collaborators");
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsInviting(true);
    setInviteError(null);
    
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setCollaborators([...collaborators, data.access]);
      setEmail('');
      toast.success("User invited successfully!");
    } catch (error: any) {
      // Show the error right under the input field
      setInviteError(error.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'VIEWER' | 'EDITOR') => {
    try {
      setCollaborators(prev => prev.map(c => c.user.id === userId ? { ...c, role: newRole } : c));
      
      const res = await fetch(`/api/roadmaps/${roadmapId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (!res.ok) throw new Error("Update failed");
      toast.success("Role updated");
    } catch (error) { 
      toast.error("Failed to update role"); 
      fetchCollaborators();
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      setCollaborators(prev => prev.filter(c => c.user.id !== userId));
      
      const res = await fetch(`/api/roadmaps/${roadmapId}/share?userId=${userId}`, { 
          method: 'DELETE' 
      });

      if (!res.ok) throw new Error("Delete failed");
      toast.success("User removed");
    } catch (error) { 
      toast.error("Failed to remove user"); 
      fetchCollaborators(); 
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 10 }} 
            className="relative bg-white dark:bg-[#1e2126] rounded-3xl shadow-2xl w-full max-w-lg overflow-visible border border-slate-200 dark:border-slate-700/50 flex flex-col"
          >
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-t-3xl">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                Share Roadmap
              </h2>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition-all transform hover:scale-105"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Invite Form */}
              <form onSubmit={handleInvite} className="mb-6">
                <div className="flex gap-2 items-center">
                    {/* Fixed Height and Darker Placeholder on Input */}
                    <div className="flex-1 relative h-[46px]">
                        <input 
                            type="email" 
                            placeholder="Add email address..." 
                            value={email} 
                            onChange={(e) => { setEmail(e.target.value); setInviteError(null); }} 
                            className="w-full h-full px-4 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-2 focus:ring-[#3f407e]/20 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-500" 
                            required 
                        />
                    </div>
                    
                    {/* Fixed Width for the Dropdown so it doesn't get squished */}
                    <div className="w-[130px] shrink-0 h-[46px]">
                        <CustomRoleSelect value={role} onChange={setRole} />
                    </div>
                    
                    {/* Fixed Height matching the others */}
                    <button 
                        type="submit" 
                        disabled={isInviting || !email} 
                        className="px-6 h-[46px] shrink-0 bg-[#3f407e] text-white text-sm font-bold rounded-xl hover:bg-[#323366] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                        {isInviting ? '...' : 'Invite'}
                    </button>
                </div>
                
                {/* Visual Error for non-existent users */}
                <AnimatePresence>
                    {inviteError && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs font-bold text-red-500 mt-2 px-1 flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {inviteError}
                        </motion.div>
                    )}
                </AnimatePresence>
              </form>

              {/* Collaborators List */}
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 pb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">People with access</h3>
                
                {isLoading ? ( <div className="text-center text-sm text-slate-500 py-4 font-medium animate-pulse">Loading collaborators...</div> ) : (
                  <>
                    {/* Owner */}
                    {owner && (
                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3f407e] to-purple-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden shadow-sm border border-white/10 shrink-0">
                            {owner.avatarUrl ? <img src={owner.avatarUrl} className="w-full h-full object-cover" alt="Owner" /> : owner.firstName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {owner.firstName} {currentUser?.id === owner.id ? '(You)' : ''}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{owner.email}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">Owner</span>
                      </div>
                    )}

                    {/* Guests */}
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center justify-between group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs overflow-hidden border border-white/10 shadow-sm shrink-0">
                            {collab.user.avatarUrl ? <img src={collab.user.avatarUrl} className="w-full h-full object-cover" alt="Collaborator" /> : collab.user.firstName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {collab.user.firstName} {currentUser?.id === collab.user.id ? '(You)' : ''}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{collab.user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 w-[100px] justify-end shrink-0">
                          {(currentUser?.id === owner?.id || currentUser?.id === collab.user.id) ? (
                            <>
                                <CustomRoleSelect 
                                    value={collab.role} 
                                    onChange={(val) => handleUpdateRole(collab.user.id, val)} 
                                    variant="minimal"
                                    disabled={currentUser?.id !== owner?.id} 
                                />
                                <button 
                                    onClick={() => handleRemove(collab.user.id)} 
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shrink-0"
                                    title={currentUser?.id === collab.user.id ? "Leave Roadmap" : "Remove User"}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </>
                          ) : (
                              <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                                  {collab.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                              </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#15171c] rounded-b-3xl">
              <button 
                onClick={copyLink} 
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Copy Link
              </button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}