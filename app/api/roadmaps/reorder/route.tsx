import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { roadmaps } = body; // Expects array of { id, order }

    // Update all roadmaps in a single transaction
    await prisma.$transaction(
      roadmaps.map((r: any) => 
        prisma.roadmap.update({
          where: { id: r.id },
          data: { order: r.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder failed:", error);
    return NextResponse.json({ error: 'Failed to reorder roadmaps' }, { status: 500 });
  }
}