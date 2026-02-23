// app/api/roadmaps/[roadmapId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 1. GET
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  const { roadmapId } = await params;
  
  // Grab the userId from the URL query params
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: {
        lanes: { orderBy: { order: 'asc' } },
        items: true,
        milestones: true,
        collaborators: true, // <--- We need this to check their role
      }
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // --- ACCESS CONTROL CHECK ---
    let role = 'NONE';
    if (roadmap.userId === userId) {
      role = 'OWNER';
    } else {
      const access = roadmap.collaborators.find(c => c.userId === userId);
      if (access) role = access.role;
    }

    // If they aren't the owner and aren't in the collaborators list, block them.
    if (role === 'NONE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Send the roadmap data PLUS the user's role
    return NextResponse.json({ ...roadmap, currentUserRole: role });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load roadmap' }, { status: 500 });
  }
}

// 2. PATCH
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  const { roadmapId } = await params;
  
  try {
    const body = await req.json();
    const updateData: any = { lastEdited: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.timeView !== undefined) updateData.timeView = body.timeView;
    if (body.showWeekends !== undefined) updateData.showWeekends = body.showWeekends;

    const updatedRoadmap = await prisma.roadmap.update({
      where: { id: roadmapId },
      data: updateData
    });

    return NextResponse.json(updatedRoadmap);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update roadmap' }, { status: 500 });
  }
}

// 3. DELETE
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  const { roadmapId } = await params;

  try {
    await prisma.roadmap.delete({ where: { id: roadmapId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete roadmap' }, { status: 500 });
  }
}