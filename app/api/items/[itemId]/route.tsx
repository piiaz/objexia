import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  
  try {
    const body = await req.json();
    
    // 1. Get roadmapId first
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: { roadmapId: true }
    });

    if (!existingItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // 2. TRANSACTION: Update Item + Touch Roadmap
    const [updated] = await prisma.$transaction([
      prisma.item.update({
        where: { id: itemId },
        data: { ...body } // Spread all updates (resize, move, content)
      }),
      prisma.roadmap.update({
        where: { id: existingItem.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  try {
    // 1. Get roadmapId first
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: { roadmapId: true }
    });

    if (!existingItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // 2. TRANSACTION: Delete Item + Touch Roadmap
    await prisma.$transaction([
      prisma.item.delete({ where: { id: itemId } }),
      prisma.roadmap.update({
        where: { id: existingItem.roadmapId },
        data: { lastEdited: new Date() }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}