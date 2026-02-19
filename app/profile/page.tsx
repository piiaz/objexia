'use client'

import { useState, useRef, useEffect, Suspense, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import ObjexiaLogo from '../components/ObjexiaLogo' 
import ConfirmModal from '../components/ConfirmModal'
import { compressImage } from '../utils/ImageCompression'

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"]

function ProfileContent() {
    const { user, updateProfile, logout } = useAuth()
    const searchParams = useSearchParams()
    
    const backUrl = searchParams.get('from') || '/dashboard'
    const backLabel = backUrl.includes('roadmap') ? 'Back to Board' : 'Back to Dashboard'

    // Store the initial state for comparison
    const [initialData, setInitialData] = useState<any>(null)
    const [formData, setFormData] = useState<any>({
        firstName: '', lastName: '', jobTitle: '', age: '', gender: '', avatarUrl: ''
    })
    
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenderOpen, setIsGenderOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => { 
        if (user) {
            const userData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                jobTitle: user.jobTitle || '',
                age: user.age || '',
                gender: user.gender || '',
                avatarUrl: user.avatarUrl || '',
                email: user.email || ''
            }
            setFormData(userData)
            setInitialData(userData) // Capture baseline
        } 
    }, [user])

    // Detect if changes were made
    const hasChanges = useMemo(() => {
        if (!initialData) return false;
        return JSON.stringify(formData) !== JSON.stringify(initialData);
    }, [formData, initialData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsGenderOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (!file.type.startsWith('image/')) {
                setStatus({ type: 'error', msg: 'Please upload a valid image file.' });
                setTimeout(() => setStatus(null), 3000);
                return;
            }

            try {
                const compressedBase64 = await compressImage(file);
                setFormData({ ...formData, avatarUrl: compressedBase64 });
            } catch (err) {
                console.error("Profile image compression failed:", err);
                setStatus({ type: 'error', msg: 'Failed to process image. Try a different one.' });
                setTimeout(() => setStatus(null), 3000);
            }
        }
    }

    const handleRemoveAvatar = () => {
        setFormData({ ...formData, avatarUrl: '' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hasChanges) return;

        setIsSaving(true); setStatus(null)
        
        try {
            await updateProfile(formData); 
            // Update initial data to the new saved state so button disables again
            setInitialData(formData);
            setStatus({ type: 'success', msg: 'Profile updated successfully!' })
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message || 'Failed to update profile.' })
        } finally {
            setIsSaving(false)
            setTimeout(() => setStatus(null), 3000)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            const res = await fetch(`/api/user/${user?.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete account")
            logout()
        } catch (error) {
            setStatus({ type: 'error', msg: "Could not delete account." })
            setIsDeleteModalOpen(false)
        }
    }

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#121417] text-slate-400 font-bold">Loading...</div>

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#121417] p-6 md:p-10 transition-colors relative overflow-hidden pb-24">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#3f407e]/5 to-transparent pointer-events-none" />
            
            <div className="relative max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <Link href={backUrl} className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1e2126] border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm hover:shadow-md hover:border-[#3f407e] dark:hover:border-[#b3bbea] hover:text-[#3f407e] dark:hover:text-[#b3bbea] transition-all">
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            <span>{backLabel}</span>
                        </Link>
                        
                        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700/60">
                            <ObjexiaLogo className="w-10 h-10" />
                            <div className="flex flex-col">
                                <span className="font-spartan font-extrabold text-xl text-[#3f407e] dark:text-[#b3bbea] leading-none">Objexia</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Theme Preference</span>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1e2126] p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#3f407e]/10 to-transparent opacity-50" />
                            <div className="relative w-36 h-36 mb-6 group cursor-pointer flex-shrink-0 z-10" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-white dark:border-[#2a2e36] shadow-2xl bg-slate-200 dark:bg-slate-800 transition-transform group-hover:scale-105">
                                    {formData.avatarUrl ? ( <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> ) : ( <div className="w-full h-full flex items-center justify-center text-5xl text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800"> {formData.firstName?.[0]} </div> )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                </div>
                                {formData.avatarUrl && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }} className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors z-30" title="Remove Photo">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="z-10 w-full">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white w-full truncate px-2">{formData.firstName} {formData.lastName}</h2>
                                <p className="text-sm font-medium text-[#3f407e] dark:text-[#b3bbea] w-full truncate px-4 mt-1">{formData.jobTitle}</p>
                            </div>
                            <button onClick={logout} className="mt-8 w-full py-3 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors z-10">Sign Out</button>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <motion.form onSubmit={handleSave} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#1e2126] p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-8 relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div> <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">First Name <span className="text-red-500">*</span></label> <input type="text" required maxLength={20} value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700/60 rounded-xl font-medium outline-none focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-4 focus:ring-[#3f407e]/5 dark:focus:ring-[#b3bbea]/10 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" /> </div>
                                <div> <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">Last Name <span className="text-red-500">*</span></label> <input type="text" required maxLength={20} value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700/60 rounded-xl font-medium outline-none focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-4 focus:ring-[#3f407e]/5 dark:focus:ring-[#b3bbea]/10 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" /> </div>
                                
                                <div className="md:col-span-2"> <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">Email Address</label> <input type="email" disabled value={formData.email || ''} className="w-full px-4 py-3.5 bg-slate-100 dark:bg-[#121417]/50 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-500 cursor-not-allowed opacity-75" /> </div>
                                
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="w-full"> 
                                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">Age</label> 
                                        <input type="number" placeholder="25" value={formData.age || ''} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700/60 rounded-xl font-medium outline-none focus:border-[#3f407e] dark:focus:border-[#b3bbea] text-slate-900 dark:text-white placeholder:text-slate-400" /> 
                                    </div>
                                    <div className="w-full relative" ref={dropdownRef}>
                                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">Gender</label>
                                        <button type="button" onClick={() => setIsGenderOpen(!isGenderOpen)} className={`w-full px-4 py-3.5 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700/60 rounded-xl font-medium outline-none text-left flex justify-between items-center transition-all ${isGenderOpen ? 'border-[#3f407e] dark:border-[#b3bbea] ring-1 ring-[#3f407e]' : ''}`}>
                                            <span className={`truncate ${!formData.gender ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{formData.gender || "Select..."}</span>
                                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isGenderOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        <AnimatePresence>
                                            {isGenderOpen && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e2126] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                                    {GENDER_OPTIONS.map((option) => (
                                                        <button key={option} type="button" onClick={() => { setFormData({...formData, gender: option}); setIsGenderOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${formData.gender === option ? 'text-[#3f407e] dark:text-[#b3bbea] bg-slate-50 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-300'}`}>{option}</button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="md:col-span-2"> 
                                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">Job Title</label> 
                                    <input type="text" placeholder="e.g. Product Manager" value={formData.jobTitle || ''} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#15171c] border border-slate-200 dark:border-slate-700/60 rounded-xl font-medium outline-none focus:border-[#3f407e] dark:focus:border-[#b3bbea] text-slate-900 dark:text-white placeholder:text-slate-400" /> 
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end border-t border-slate-100 dark:border-slate-800 mt-6">
                                <button 
                                    type="submit" 
                                    disabled={isSaving || !hasChanges} // <--- Disable if no changes
                                    className="px-8 py-3.5 bg-[#3f407e] hover:bg-[#323366] text-white font-bold rounded-xl shadow-lg shadow-[#3f407e]/20 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                            <AnimatePresence>{status && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute bottom-4 left-0 right-0 mx-auto w-max px-6 py-3 rounded-full text-sm font-bold shadow-xl ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{status.msg}</motion.div>}</AnimatePresence>
                        </motion.form>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#1e2126] border-2 border-red-50 dark:border-red-900/30 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                            <div className="text-center md:text-left">
                                <h3 className="text-slate-900 dark:text-red-400 font-bold mb-1 text-lg">Delete Account</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Permanently remove your account and all data.</p>
                            </div>
                            <button onClick={() => setIsDeleteModalOpen(true)} className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold text-sm rounded-xl hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">Delete Account</button>
                        </motion.div>
                    </div>
                </div>
            </div>

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAccount} title="Delete Account?" message="Are you sure you want to delete your account? All your data will be permanently lost." confirmText="Yes, Delete" isDangerous={true} />
        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#121417] text-slate-400 font-bold">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    )
}   