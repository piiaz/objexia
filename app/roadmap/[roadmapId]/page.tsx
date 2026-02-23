'use client'

import { useParams } from 'next/navigation'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react'
import { useAuth } from '../../context/AuthContext'
import Timeline from '../../components/Timeline'

export default function RoadmapPage() {
  const params = useParams()
  const { user } = useAuth()
  
  // Ensure roadmapId is a string
  const rawId = params.roadmapId
  const roadmapId = Array.isArray(rawId) ? rawId[0] : rawId

  if (!roadmapId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#191b19]">
        <div className="text-slate-400 font-bold">Loading Board...</div>
      </div>
    )
  }

  // If the user isn't logged in yet, just show the timeline normally 
  // (Your AuthBarrierModal inside Timeline will handle telling them to log in)
  if (!user) {
    return <Timeline roadmapId={roadmapId} />
  }

  // If they are logged in, connect them to the Liveblocks Room!
  return (
    <LiveblocksProvider 
      authEndpoint={async (room) => {
        // Ping our custom Bouncer API
        const res = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room, userId: user.id }),
        });
        return await res.json();
      }}
    >
      <RoomProvider 
        id={roadmapId} 
        initialPresence={{ cursor: null }} // We will use this for live mouse cursors next!
      >
        <ClientSideSuspense fallback={
          <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#191b19]">
            <div className="text-[#3f407e] font-bold animate-pulse">Connecting to live room...</div>
          </div>
        }>
          {() => <Timeline roadmapId={roadmapId} />}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}