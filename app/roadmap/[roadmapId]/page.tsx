'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react'
import { useAuth } from '../../context/AuthContext'
import Timeline from '../../components/Timeline'

export default function RoadmapPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  
  const rawId = params?.roadmapId
  const roadmapId = Array.isArray(rawId) ? rawId[0] : rawId

  // Redirect to login if they have no account, passing the roadmap URL so they come back after!
  useEffect(() => {
    if (!isLoading && !user && roadmapId) {
      router.push(`/login?redirect=/roadmap/${roadmapId}`);
    }
  }, [user, isLoading, router, roadmapId])

  // If no roadmapId exists yet, or still checking auth
  if (!roadmapId || isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#191b19]">
        <div className="text-[#3f407e] font-bold animate-pulse">Authenticating...</div>
      </div>
    )
  }

  // Tell TypeScript strictly that this is a string to clear the error
  const safeRoadmapId = roadmapId as string;

  return (
    <LiveblocksProvider 
      authEndpoint={async (room) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId: user.id }),
        });
        
        const data = await res.json();
        
        // If the server returned an error (like 403 Forbidden), throw it cleanly
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed");
        }
        
        return data;
      }}
    >
      <RoomProvider id={safeRoadmapId} initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={
          <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#191b19]">
            <div className="text-[#3f407e] font-bold animate-pulse">Connecting to live room...</div>
          </div>
        }>
          {() => <Timeline roadmapId={safeRoadmapId} />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}