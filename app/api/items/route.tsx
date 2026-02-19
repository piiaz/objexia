import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // TRANSACTION: Create Item + Touch Roadmap Timestamp
    const [newItem] = await prisma.$transaction([
      prisma.item.create({
        data: {
          title: body.title,
          startDate: body.startDate,
          endDate: body.endDate,
          progress: body.progress || 0,
          description: body.description || '',
          groupId: body.groupId,
          roadmapId: body.roadmapId,
          trackIndex: body.trackIndex || 0
        }
      }),
      prisma.roadmap.update({
        where: { id: body.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}