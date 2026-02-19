import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// GET: Fetch all roadmaps for a specific user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
  }

  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId },
      orderBy: [
    { order: 'asc' },        // <--- Primary Sort: Custom Order
    { lastEdited: 'desc' }   // <--- Secondary Sort: Date
      ], 
      include: {
        _count: {
          select: { lanes: true, items: true, milestones: true }
        }
      }
    })

    return NextResponse.json({ roadmaps })
  } catch (error) {
    console.error('Error fetching roadmaps:', error)
    return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 })
  }
}

// POST: Create a new roadmap
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, avatarUrl, userId } = body

    if (!title || !userId) {
      return NextResponse.json({ error: 'Title and UserID are required' }, { status: 400 })
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        title: title.trim(),
        description,
        avatarUrl,
        userId,
        // Default lanes
        lanes: {
          create: [
            { title: 'Strategy', color: 'blue', order: 0, type: 'lane' },
            { title: 'Development', color: 'red', order: 1, type: 'lane' }
          ]
        }
      }
    })

    return NextResponse.json({ roadmap })

  } catch (error: any) {
    // --- FIX: Catch Unique Constraint Violation ---
    // Prisma code P2002 = "Unique constraint failed on the {constraint}"
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A roadmap with this name already exists.' }, 
        { status: 409 } // 409 Conflict
      )
    }

    console.error('Error creating roadmap:', error)
    return NextResponse.json({ error: 'Failed to create roadmap' }, { status: 500 })
  }
}

// Add this export at the bottom of the route.ts file if you hit limits
// Note: This specific config style depends slightly on Next.js version, 
// but usually App Router handles streams better.
// If you face 413 errors even after compression, let me know. 
// The client-side compression usually solves it completely without config changes.