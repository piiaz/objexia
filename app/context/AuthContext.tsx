'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// --- UPDATE THIS TYPE DEFINITION ---
export type UserProfile = {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle?: string;
    avatarUrl?: string;
    age?: string;       // <--- ADDED
    gender?: string;    // <--- ADDED
}
// -----------------------------------

type AuthContextType = {
    user: UserProfile | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: UserProfile, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Persistent Login: Check local storage on refresh
    useEffect(() => {
        const storedUser = localStorage.getItem('roadmap_user')
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                localStorage.removeItem('roadmap_user')
            }
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Login failed')

            setUser(data.user)
            localStorage.setItem('roadmap_user', JSON.stringify(data.user))
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const signup = async (data: UserProfile, password: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, password }),
            })
            const resData = await res.json()
            if (!res.ok) throw new Error(resData.error || 'Signup failed')

            setUser(resData.user)
            localStorage.setItem('roadmap_user', JSON.stringify(resData.user))
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('roadmap_user')
        router.push('/login')
    }

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user?.id) return;
        setIsLoading(true)
        try {
            const res = await fetch(`/api/user/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const updatedUser = await res.json();
            if (!res.ok) throw new Error(updatedUser.error || 'Update failed');

            setUser(updatedUser);
            localStorage.setItem('roadmap_user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error("Profile update failed:", err);
            throw err;
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ 
            user, login, signup, logout, updateProfile, 
            isAuthenticated: !!user, isLoading, error 
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)