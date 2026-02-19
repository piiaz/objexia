import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 1. GET
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ roadmapId: string }> } // <--- FIX TYPE
) {
  const { roadmapId } = await params;

  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: {
        lanes: { orderBy: { order: 'asc' } },
        items: true,
        milestones: true,
      }
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    return NextResponse.json(roadmap);
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
    
    // We construct a data object dynamically so we only update what is sent
    const updateData: any = { lastEdited: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    
    // --- NEW FIELDS ---
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
  { params }: { params: Promise<{ roadmapId: string }> } // <--- FIX TYPE
) {
  const { roadmapId } = await params;

  try {
    await prisma.roadmap.delete({ where: { id: roadmapId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete roadmap' }, { status: 500 });
  }
}