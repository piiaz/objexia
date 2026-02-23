// app/api/roadmaps/[roadmapId]/share/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET: Fetch all current collaborators and the owner
export async function GET(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params;
  try {
    const collaborators = await prisma.roadmapAccess.findMany({
      where: { roadmapId },
      include: { user: { select: { id: true, email: true, firstName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });
    
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: { user: { select: { id: true, email: true, firstName: true, avatarUrl: true } } }
    });

    return NextResponse.json({ collaborators, owner: roadmap?.user });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}

// POST: Add a new collaborator by email
export async function POST(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params;
  try {
    const { email, role } = await req.json();
    
    // 1. Find target user
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return NextResponse.json({ error: 'User not found. They must sign up first.' }, { status: 404 });

    // 2. Check if they are the owner
    const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
    if (roadmap?.userId === targetUser.id) return NextResponse.json({ error: 'This user is the owner of the roadmap.' }, { status: 400 });

    // 3. Check if already a collaborator
    const existing = await prisma.roadmapAccess.findUnique({
      where: { roadmapId_userId: { roadmapId, userId: targetUser.id } }
    });
    if (existing) return NextResponse.json({ error: 'User is already a collaborator.' }, { status: 400 });

    // 4. Create access
    const access = await prisma.roadmapAccess.create({
      data: { roadmapId, userId: targetUser.id, role },
      include: { user: { select: { id: true, email: true, firstName: true, avatarUrl: true } } }
    });

    return NextResponse.json({ access });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 });
  }
}

// PATCH: Change a collaborator's role (Viewer <-> Editor)
export async function PATCH(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params;
  try {
    const { userId, role } = await req.json();
    const access = await prisma.roadmapAccess.update({
      where: { roadmapId_userId: { roadmapId, userId } },
      data: { role },
      include: { user: { select: { id: true, email: true, firstName: true, avatarUrl: true } } }
    });
    return NextResponse.json({ access });
  } catch(e) { 
    console.error("Error updating role:", e);
    return NextResponse.json({ error: 'Failed to update role'}, { status: 500}); 
  }
}

// DELETE: Remove a collaborator
export async function DELETE(req: Request, { params }: { params: Promise<{ roadmapId: string }> }) {
  const { roadmapId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if(!userId) return NextResponse.json({error: 'userId required'}, {status: 400});
  
  try {
    await prisma.roadmapAccess.delete({
      where: { roadmapId_userId: { roadmapId, userId } }
    });
    return NextResponse.json({ success: true });
  } catch(e) { 
    console.error("Error removing collaborator:", e);
    return NextResponse.json({ error: 'Failed to remove collaborator'}, { status: 500}); 
  }
}