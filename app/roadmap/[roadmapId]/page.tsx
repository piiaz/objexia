'use client'

import { useParams } from 'next/navigation'
import Timeline from '../../components/Timeline'

export default function RoadmapPage() {
  const params = useParams()
  
  // Next.js params can sometimes be arrays, so we ensure it's a string
  const rawId = params.roadmapId
  const roadmapId = Array.isArray(rawId) ? rawId[0] : rawId

  if (!roadmapId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#191b19]">
        <div className="text-slate-400 font-bold">Loading Board...</div>
      </div>
    )
  }

  return <Timeline roadmapId={roadmapId} />
}