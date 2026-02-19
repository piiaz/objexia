import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const [newMilestone] = await prisma.$transaction([
      prisma.milestone.create({
        data: {
          title: body.title,
          date: body.date,
          icon: body.icon || 'diamond',
          color: body.color || 'text-slate-600',
          trackIndex: body.trackIndex || 0,
          groupId: body.groupId,
          roadmapId: body.roadmapId
        }
      }),
      prisma.roadmap.update({
        where: { id: body.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ milestone: newMilestone }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}