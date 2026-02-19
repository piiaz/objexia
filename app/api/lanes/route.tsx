import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, roadmapId, type, color, order } = body;

    // TRANSACTION: Create Lane + Touch Roadmap
    const [newLane] = await prisma.$transaction([
      prisma.lane.create({
        data: {
          title,
          roadmapId,
          type: type || 'lane',
          color: color || 'gray',
          order: order || 0
        }
      }),
      prisma.roadmap.update({
        where: { id: roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ lane: newLane }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lane' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { lanes } = body; 

    if (!lanes || lanes.length === 0) return NextResponse.json({ success: true });

    // Get roadmap ID from the first lane to update timestamp
    const firstLane = await prisma.lane.findUnique({ where: { id: lanes[0].id } });
    if (!firstLane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    // TRANSACTION: Reorder All + Touch Roadmap
    await prisma.$transaction([
      ...lanes.map((lane: any) => 
        prisma.lane.update({
          where: { id: lane.id },
          data: { order: lane.order },
        })
      ),
      prisma.roadmap.update({
        where: { id: firstLane.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder lanes' }, { status: 500 });
  }
}