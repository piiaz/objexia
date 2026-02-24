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

  useEffect(() => {
    if (!isLoading && !user && roadmapId) {
      router.push(`/login?redirect=/roadmap/${roadmapId}`);
    }
  }, [user, isLoading, router, roadmapId])

  if (!roadmapId || isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#191b19]">
        <div className="text-[#3f407e] font-bold animate-pulse">Authenticating...</div>
      </div>
    )
  }

  const safeRoadmapId = roadmapId as string;

  return (
    <LiveblocksProvider 
      // THE FIX 1: Pass the 'room' argument directly from Liveblocks
      authEndpoint={async (room) => {
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId: user.id }), 
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Authentication failed");
        return data;
      }}
    >
      {/* THE FIX 2: Explicitly declare 'activity: null' so Liveblocks doesn't crash when we update it! */}
      <RoomProvider id={safeRoadmapId} initialPresence={{ cursor: null, activity: null }}>
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