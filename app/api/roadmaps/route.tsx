import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// GET: Fetch all roadmaps for a specific user (Owned + Shared + Pending)
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
          { userId: userId }, 
          { collaborators: { some: { userId: userId } } } 
        ]
      },
      orderBy: [
        { order: 'asc' },        
        { lastEdited: 'desc' }   
      ], 
      include: {
        _count: {
          select: { lanes: true, items: true, milestones: true }
        },
        user: {
          select: { id: true, firstName: true, email: true, avatarUrl: true }
        },
        collaborators: {
          where: { userId: userId },
          select: { status: true, role: true }
        }
      }
    })

    return NextResponse.json({ roadmaps })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 })
  }
}

// POST: Create a new roadmap
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, avatarUrl, userId, order } = body

    const roadmap = await prisma.roadmap.create({
      data: {
        title: title.trim(),
        description,
        avatarUrl,
        userId,
        order: order || 0,
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
    return NextResponse.json({ error: 'Failed to create roadmap' }, { status: 500 })
  }
}