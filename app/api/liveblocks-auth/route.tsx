import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { prisma } from "@/app/lib/prisma";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const room = searchParams.get('room');

    if (!userId || !room) {
        return NextResponse.json({ error: "Missing userId or room" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: room },
      include: { collaborators: true }
    });

    if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

    const isOwner = roadmap.userId === user.id;
    const isCollaborator = roadmap.collaborators.some(
      c => c.userId === user.id && c.status.toUpperCase() === 'ACCEPTED'
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden - Access denied" }, { status: 403 });
    }

    // --- THE BULLETPROOF FIX ---
    // A base64 image string is massive (>100,000 chars). 
    // A standard Google OAuth URL is small (~100 chars).
    // If it's over 500 characters, it's a base64 string that will crash Liveblocks.
    let safeAvatarUrl = user.avatarUrl;
    if (!safeAvatarUrl || safeAvatarUrl.length > 500) {
        safeAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName)}&background=3f407e&color=fff`;
    }

    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName,
        email: user.email || 'No email provided', 
        avatar: safeAvatarUrl,
        color: ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8"][Math.floor(Math.random() * 5)]
      }
    });

    session.allow(room, session.FULL_ACCESS);

    const { status, body: authBody } = await session.authorize();
    
    return new NextResponse(authBody, { 
        status, 
        headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}