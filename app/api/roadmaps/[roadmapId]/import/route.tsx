import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  try {
    const { roadmapId } = await params;
    const { groups, items, milestones } = await req.json();

    // Transaction ensures everything saves safely, or rolls back on error
    await prisma.$transaction(async (tx) => {
      // 1. Wipe existing tracks/items to overwrite with CSV
      await tx.item.deleteMany({ where: { roadmapId } });
      await tx.milestone.deleteMany({ where: { roadmapId } });
      await tx.lane.deleteMany({ where: { roadmapId } });

      // 2. Insert Lanes
      for (const group of groups) {
        await tx.lane.create({
          data: {
            id: group.id,
            roadmapId,
            title: group.title,
            color: group.color,
            type: group.type,
            order: group.order || 0
          }
        });
      }

      // 3. Insert Items
      for (const item of items) {
         await tx.item.create({
             data: {
                 id: item.id,
                 roadmapId,
                 groupId: item.groupId,
                 title: item.title,
                 startDate: item.startDate,
                 endDate: item.endDate,
                 progress: item.progress || 0,
                 description: item.description || '',
                 trackIndex: item.trackIndex || 0
             }
         });
      }

      // 4. Insert Milestones
      for (const milestone of milestones) {
         await tx.milestone.create({
             data: {
                 id: milestone.id,
                 roadmapId,
                 groupId: milestone.groupId,
                 title: milestone.title,
                 date: milestone.date,
                 icon: milestone.icon || 'diamond',
                 color: milestone.color || 'text-slate-600',
                 trackIndex: milestone.trackIndex || 0
             }
         });
      }

      // 5. Update roadmap timestamp
      await tx.roadmap.update({
        where: { id: roadmapId },
        data: { lastEdited: new Date() }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}