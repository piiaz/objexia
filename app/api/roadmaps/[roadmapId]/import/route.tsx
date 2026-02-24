import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  try {
    const { roadmapId } = await params;
    const { groups, items, milestones } = await req.json();

    // Transaction ensures everything saves safely, or rolls back on error
    await prisma.$transaction(async (tx) => {
      // 1. Wipe existing tracks/items on this board
      await tx.item.deleteMany({ where: { roadmapId } });
      await tx.milestone.deleteMany({ where: { roadmapId } });
      await tx.lane.deleteMany({ where: { roadmapId } });

      // 2. Insert Lanes & build an ID Map
      // We generate NEW IDs so we never have a database conflict
      const laneIdMap = new Map<string, string>(); 

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        // Clean up any stray quotes from the CSV parser
        const cleanType = group.type?.replace(/['"]/g, '') === 'milestone' ? 'milestone' : 'lane';

        const newLane = await tx.lane.create({
          data: {
            roadmapId,
            title: group.title?.replace(/['"]/g, '') || 'Untitled Track',
            color: group.color?.replace(/['"]/g, '') || 'blue',
            type: cleanType,
            order: i 
          }
        });
        
        // Save the mapping: Old CSV ID -> New Database ID
        laneIdMap.set(group.id, newLane.id); 
      }

      // 3. Insert Items (Using the mapped Track IDs)
      for (const item of items) {
         // Clean the old groupId and find its new equivalent
         const cleanGroupId = item.groupId?.replace(/['"]/g, '');
         const newGroupId = laneIdMap.get(cleanGroupId);
         if (!newGroupId) continue; 

         await tx.item.create({
             data: {
                 roadmapId,
                 groupId: newGroupId,
                 title: item.title?.replace(/['"]/g, '') || 'Untitled Item',
                 startDate: item.startDate?.replace(/['"]/g, ''),
                 endDate: item.endDate?.replace(/['"]/g, ''),
                 progress: Number(item.progress) || 0,
                 description: item.description?.replace(/^"|"$/g, '') || '', // Only remove outer quotes
                 trackIndex: Number(item.trackIndex) || 0
             }
         });
      }

      // 4. Insert Milestones (Using the mapped Track IDs)
      for (const milestone of milestones) {
         const cleanGroupId = milestone.groupId?.replace(/['"]/g, '');
         const newGroupId = laneIdMap.get(cleanGroupId);
         if (!newGroupId) continue;

         await tx.milestone.create({
             data: {
                 roadmapId,
                 groupId: newGroupId,
                 title: milestone.title?.replace(/['"]/g, '') || 'Untitled Milestone',
                 date: milestone.date?.replace(/['"]/g, ''),
                 icon: milestone.icon?.replace(/['"]/g, '') || 'diamond',
                 color: milestone.color?.replace(/['"]/g, '') || 'text-slate-600',
                 trackIndex: Number(milestone.trackIndex) || 0
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
  } catch (error: any) {
    // If it fails, this will log the EXACT reason in your VS Code terminal
    console.error("🚨 IMPORT ERROR:", error);
    return NextResponse.json({ 
        error: "Failed to process import",
        details: error.message
    }, { status: 500 });
  }
}