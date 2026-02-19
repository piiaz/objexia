import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const { milestoneId } = await params;
  try {
    const body = await req.json();
    
    const existing = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!existing) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

    const [updated] = await prisma.$transaction([
      prisma.milestone.update({
        where: { id: milestoneId },
        data: { ...body }
      }),
      prisma.roadmap.update({
        where: { id: existing.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ milestone: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const { milestoneId } = await params;
  try {
    const existing = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!existing) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.milestone.delete({ where: { id: milestoneId } }),
      prisma.roadmap.update({
        where: { id: existing.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}