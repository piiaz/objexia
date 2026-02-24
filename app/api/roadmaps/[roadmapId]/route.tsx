import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 1. GET
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  const { roadmapId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: {
        lanes: { orderBy: { order: 'asc' } },
        items: true,
        milestones: true,
        collaborators: true, // Need this to verify the user's role!
      }
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // --- ACCESS CONTROL & ROLE CHECK ---
    let role = 'NONE';
    if (roadmap.userId === userId) {
      role = 'OWNER';
    } else if (userId) {
      const access = roadmap.collaborators.find(c => c.userId === userId);
      if (access && access.status === 'ACCEPTED') {
        role = access.role;
      }
    }

    // Block if they shouldn't be here
    if (role === 'NONE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return the roadmap data PLUS the user's specific role
    return NextResponse.json({ ...roadmap, currentUserRole: role });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to load roadmap' }, { status: 500 });
  }
}

// 2. PATCH (Keep your existing PATCH code here)
export async function PATCH(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
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
    return NextResponse.json({ error: 'Failed to update roadmap' }, { status: 500 });
  }
}

// 3. DELETE (Keep your existing DELETE code here)
export async function DELETE(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params;
  try {
    await prisma.roadmap.delete({ where: { id: roadmapId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete roadmap' }, { status: 500 });
  }
}