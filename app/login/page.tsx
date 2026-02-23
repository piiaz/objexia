'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Script from 'next/script' 
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation' // <--- ADDED useSearchParams
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import ObjexiaLogo from '../components/ObjexiaLogo'

const InputField = ({ label, type = "text", placeholder, value, onChange, onBlur, icon, error, className = "", rightElement }: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex justify-between items-center ml-1">
                <label className={`block text-[10px] font-bold uppercase tracking-wider transition-colors ${error ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {label}
                </label>
                {rightElement ? rightElement : (error && <span className="text-[10px] font-bold text-red-500 animate-pulse">{error}</span>)}
            </div>
            
            <div className="relative group">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#3f407e] dark:group-focus-within:text-[#b3bbea]'}`}>
                    {icon}
                </div>
                <input 
                    type={actualType} 
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-[#15171c] border rounded-lg font-medium outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm
                        ${error 
                            ? 'border-red-300 dark:border-red-900/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 text-red-600 dark:text-red-400' 
                            : 'border-slate-200 dark:border-slate-700 focus:border-[#3f407e] dark:focus:border-[#b3bbea] focus:ring-2 focus:ring-[#3f407e]/10 dark:focus:ring-[#b3bbea]/10 text-slate-900 dark:text-white'
                        }
                    `}
                    placeholder={placeholder} 
                />
                {isPassword && (
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${error ? 'text-red-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        {showPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

function GoogleLoginBtn({ onSuccess, text = "signin_with" }: { onSuccess: (cred: string) => void, text?: string }) {
  const [theme, setTheme] = useState<'outline' | 'filled_black'>('outline');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'filled_black' : 'outline');

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isDarkNow = document.documentElement.classList.contains('dark');
                setTheme(isDarkNow ? 'filled_black' : 'outline');
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const renderButton = () => {
        if (typeof window !== 'undefined' && (window as any).google) {
            try {
                (window as any).google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!, 
                    callback: (response: any) => onSuccess(response.credential)
                });
                (window as any).google.accounts.id.renderButton(
                    document.getElementById("googleBtnLogin"),
                    { theme: theme, size: "large", width: "100%", text: text, shape: "pill", logo_alignment: "left" } 
                );
            } catch (error) { console.error("Google Sign-In Error:", error); }
        }
    };

    renderButton();
    const checkInterval = setInterval(() => {
        if ((window as any).google) {
            renderButton();
            clearInterval(checkInterval);
        }
    }, 500);
    return () => clearInterval(checkInterval);
  }, [onSuccess, theme, text]);

  return (
      <div className="w-full h-[42px] rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131314] flex items-center justify-center">
          <div id="googleBtnLogin" className="w-full"></div>
      </div>
  );
}

function LoginForm() {
    const { login } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams() // <--- GET PARAMS
    const redirectUrl = searchParams.get('redirect') || '/dashboard' // <--- SET REDIRECT URL
    
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleLogin = async (credential: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('roadmap_user', JSON.stringify(data.user));
                window.location.href = redirectUrl; // <--- REDIRECT HERE
            } else { setError(data.error || "Google login failed"); }
        } catch (e) { setError("Network error during Google login"); } 
        finally { setIsLoading(false); }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setTouched({ email: true, password: true });

        if(!formData.email || !formData.password) return;

        setError(null); setIsLoading(true);
        try {
            await login(formData.email, formData.password)
            router.push(redirectUrl) // <--- REDIRECT HERE
        } catch (err: any) { setError(err.message || 'Invalid email or password') } 
        finally { setIsLoading(false) }
    }

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }

    const hasError = (field: keyof typeof formData) => {
        return touched[field] && !formData[field] ? "Required" : null;
    }

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0f1115] transition-colors font-sans relative overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#3f407e]/15 dark:bg-[#3f407e]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
            <div className="absolute top-6 right-6 z-50"> <ThemeToggle /> </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                transition={{ duration: 0.4, ease: "easeOut" }} 
                className="w-full max-w-[400px] max-h-[90vh] flex flex-col bg-white/80 dark:bg-[#1e2126]/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 border border-white/50 dark:border-slate-700/50 relative overflow-y-auto custom-scrollbar mx-4"
            >
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex justify-center items-center mb-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_0_20px_rgba(63,64,126,0.15)] dark:shadow-[0_0_25px_rgba(179,187,234,0.1)]">
                            <ObjexiaLogo className="w-12 h-12 mt-2" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Welcome back</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Please enter your details to sign in.</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputField 
                            label="Email Address" type="email" placeholder="name@company.com" value={formData.email} 
                            onChange={(e: any) => setFormData({...formData, email: e.target.value})} onBlur={() => handleBlur('email')} error={hasError('email')}
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}
                        />

                        <InputField 
                            label="Password" type="password" placeholder="••••••••" value={formData.password} 
                            onChange={(e: any) => setFormData({...formData, password: e.target.value})} onBlur={() => handleBlur('password')} error={hasError('password')}
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}
                            rightElement={ <Link href="/forgot-password" className="text-[10px] font-bold text-[#3f407e] dark:text-[#b3bbea] hover:underline"> Forgot password? </Link> }
                        />

                        <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#3f407e] hover:bg-[#323366] text-white font-bold rounded-lg shadow-lg shadow-[#3f407e]/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2 text-sm">
                            {isLoading ? ( <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Signing in...</span></> ) : ( <span>Sign in</span> )}
                        </button>
                    </form>

                    <div className="my-6 relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700/60"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-white dark:bg-[#1e2126] text-slate-400 font-bold uppercase tracking-widest">Or</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <GoogleLoginBtn onSuccess={handleGoogleLogin} text="signin_with" />
                    </div>

                    <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Don't have an account? <Link href={`/signup${redirectUrl !== '/dashboard' ? `?redirect=${redirectUrl}` : ''}`} className="text-[#3f407e] dark:text-[#b3bbea] font-bold hover:underline ml-1">Create one</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0f1115]"><div className="animate-pulse font-bold text-[#3f407e]">Loading...</div></div>}>
            <LoginForm />
        </Suspense>
    )
}