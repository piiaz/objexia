'use client'

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import toast from 'react-hot-toast'; // --- NEW: Import Toast
import { RoadmapMeta } from './TimelineConstants';
import { compressImage } from '../utils/ImageCompression';

export type RoadmapData = RoadmapMeta & { imageUrl?: string | null };

type EditRoadmapModalProps = {
  onClose: () => void;
  roadmap: RoadmapData; 
  onSave: (updatedData: RoadmapData, imageFile?: File | null) => Promise<void>;
  error?: string | null;  
};

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        transition: { type: "spring", damping: 25, stiffness: 300 } 
    },
    exit: { 
        opacity: 0, 
        scale: 0.95, 
        y: 10, 
        transition: { duration: 0.2, ease: "easeIn" } 
    }
};

export default function EditRoadmapModal({ onClose, roadmap, onSave, error }: EditRoadmapModalProps) {
  // Capture initial state for comparison
  const initialData = useMemo(() => ({
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description || '',
      imageUrl: roadmap.imageUrl || roadmap.avatarUrl || null,
      createdAt: roadmap.createdAt,
      lastEdited: roadmap.lastEdited 
  }), [roadmap]);

  const [formData, setFormData] = useState<RoadmapData>(initialData);
  
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NEW: Check if form is "dirty" (changed) ---
  const hasChanges = useMemo(() => {
      // 1. Check textual changes
      const textChanged = 
          formData.title !== initialData.title || 
          formData.description !== initialData.description;
      
      // 2. Check if image was changed (file selected or image removed)
      // If selectedImageFile exists -> Changed
      // If previewUrl is null but initial had one -> Removed
      const imageChanged = !!selectedImageFile || (previewUrl === null && !!initialData.imageUrl);

      return textChanged || imageChanged;
  }, [formData, initialData, selectedImageFile, previewUrl]);

  useEffect(() => {
      setPreviewUrl(roadmap.imageUrl || roadmap.avatarUrl || null);
  }, [roadmap]);

  useEffect(() => {
    return () => { if (previewUrl && previewUrl !== formData.imageUrl && !previewUrl.startsWith('data:')) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl, formData.imageUrl]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
       
      try {
          const compressedPreview = await compressImage(file);
          setPreviewUrl(compressedPreview);
      } catch (err) {
          setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, imageUrl: null, avatarUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setIsSaving(true);
    try {
      await onSave(formData, selectedImageFile);
      
      // --- NEW: Success Feedback & Close ---
      toast.success("Roadmap updated successfully");
      onClose(); 
      
    } catch (error) {
      console.error("Failed to save:", error);
      // We don't close on error so user can fix it
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative bg-white dark:bg-[#1e2126] w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto will-change-transform backface-hidden"
      >
        
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Roadmap</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {error && ( 
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-bold animate-in fade-in slide-in-from-top-2"> 
                {error} 
            </div> 
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cover Image</label>
            <div className="flex flex-col gap-4">
                <div 
                    className={`relative w-full h-52 bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border-2 group ${previewUrl ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-[#3f407e]/50 dark:hover:border-[#3f407e]/50'} flex items-center justify-center p-8 transition-all ${isSaving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    onClick={() => !isSaving && fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex flex-col items-center text-white drop-shadow-md">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                <span className="text-sm font-bold mt-2">Change Image</span>
                            </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-[#3f407e] dark:group-hover:text-[#b3bbea] transition-colors">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                          <span className="text-sm font-bold">Upload Image</span>
                          <span className="text-xs font-medium opacity-70">PNG, JPG up to 5MB</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleImageSelect} disabled={isSaving} />
                </div>

                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3f407e]/10 text-[#3f407e] dark:text-[#b3bbea] hover:bg-[#3f407e]/20 transition-colors text-sm font-bold disabled:opacity-50">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        {previewUrl ? 'Change Image' : 'Choose Image'}
                    </button>
                    {previewUrl && (
                        <button type="button" onClick={handleRemoveImage} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-bold disabled:opacity-50">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Remove
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
                <label htmlFor="roadmap-title" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Roadmap Name <span className="text-red-500">*</span></label>
                <input 
                    id="roadmap-title" 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="e.g. Q1 Product Strategy" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3f407e] focus:border-transparent outline-none transition-colors placeholder:font-medium placeholder:text-slate-400" 
                    required 
                />
            </div>

            <div>
                <label htmlFor="roadmap-description" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea 
                    id="roadmap-description" 
                    rows={4} 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="What is this roadmap about?" 
                    style={{ minHeight: '120px', maxHeight: '300px' }} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#3f407e] focus:border-transparent outline-none transition-colors resize-y placeholder:text-slate-400" 
                />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button 
                type="submit" 
                // --- NEW: Disable if saving OR no changes OR no title ---
                disabled={isSaving || !formData.title.trim() || !hasChanges} 
                className="flex-1 py-3 bg-[#3f407e] hover:bg-[#323366] text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSaving ? ( <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Saving...</span></> ) : ( <span>Save Changes</span> )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}