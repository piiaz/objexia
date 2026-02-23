// app/api/roadmaps/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// GET: Fetch all roadmaps for a specific user (Owned + Shared)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
  }

  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: {
        OR: [
          { userId: userId }, // 1. Roadmaps the user owns
          { collaborators: { some: { userId: userId } } } // 2. Roadmaps shared with the user
        ]
      },
      orderBy: [
        { order: 'asc' },        // <--- Primary Sort: Custom Order
        { lastEdited: 'desc' }   // <--- Secondary Sort: Date
      ], 
      include: {
        _count: {
          select: { lanes: true, items: true, milestones: true }
        },
        // Fetch the owner's info so we can display it on shared cards
        user: {
          select: { id: true, firstName: true, email: true, avatarUrl: true }
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
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A roadmap with this name already exists.' }, 
        { status: 409 }
      )
    }

    console.error('Error creating roadmap:', error)
    return NextResponse.json({ error: 'Failed to create roadmap' }, { status: 500 })
  }
}