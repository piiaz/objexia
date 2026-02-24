import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { roadmapId, userId, action } = body;

    // 1. Validate Input
    if (!roadmapId || !userId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 2. Process ACCEPT Action
    if (action === 'ACCEPT') {
      const updated = await prisma.roadmapAccess.update({
        where: {
          roadmapId_userId: {
            roadmapId: roadmapId,
            userId: userId,
          }
        },
        data: {
          status: 'ACCEPTED',
        }
      });
      
      // Touch the roadmap so the cache updates for everyone else
      await prisma.roadmap.update({
         where: { id: roadmapId },
         data: { lastEdited: new Date() }
      });

      return NextResponse.json({ success: true, access: updated });
    }

    // 3. Process REJECT Action
    if (action === 'REJECT') {
      await prisma.roadmapAccess.delete({
        where: {
          roadmapId_userId: {
            roadmapId: roadmapId,
            userId: userId,
          }
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('🚨 CRITICAL INVITATION ERROR:', error);
    return NextResponse.json({ 
        error: 'Failed to process invitation', 
        details: error.message 
    }, { status: 500 });
  }
}