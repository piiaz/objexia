import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ laneId: string }> }
) {
  const { laneId } = await params;
  try {
    const body = await req.json();
    
    const existingLane = await prisma.lane.findUnique({ where: { id: laneId } });
    if (!existingLane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    const [updated] = await prisma.$transaction([
      prisma.lane.update({
        where: { id: laneId },
        data: { ...body }
      }),
      prisma.roadmap.update({
        where: { id: existingLane.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ lane: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lane' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ laneId: string }> }
) {
  const { laneId } = await params;
  try {
    const existingLane = await prisma.lane.findUnique({ where: { id: laneId } });
    if (!existingLane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.lane.delete({ where: { id: laneId } }),
      prisma.roadmap.update({
        where: { id: existingLane.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lane' }, { status: 500 });
  }
}