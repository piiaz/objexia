import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(req: Request) {
    try {
        const { roadmapId, userId, action } = await req.json();

        if (action === 'ACCEPT') {
            await prisma.roadmapAccess.update({
                where: { roadmapId_userId: { roadmapId: String(roadmapId), userId: String(userId) } },
                data: { status: 'ACCEPTED' }
            });
            return NextResponse.json({ success: true });
        } 
        
        if (action === 'REJECT') {
            await prisma.roadmapAccess.delete({
                where: { roadmapId_userId: { roadmapId: String(roadmapId), userId: String(userId) } }
            });
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
}