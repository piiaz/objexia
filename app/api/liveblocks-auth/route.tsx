import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { prisma } from "@/app/lib/prisma";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If a specific room is requested, check permissions
    if (room) {
      const roadmap = await prisma.roadmap.findUnique({
        where: { id: room },
        include: { collaborators: true }
      });

      if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

      const isOwner = roadmap.userId === user.id;
      const isCollaborator = roadmap.collaborators.some(
        c => c.userId === user.id && c.status === 'ACCEPTED'
      );

      if (!isOwner && !isCollaborator) {
        return NextResponse.json({ error: "Forbidden - Access denied" }, { status: 403 });
      }
    }

    // Prepare Liveblocks session
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.firstName,
        avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}&background=3f407e&color=fff`,
        color: ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8"][Math.floor(Math.random() * 5)]
      }
    });

    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { status, body: authBody } = await session.authorize();
    
    // Return the successful auth token properly formatted
    return new NextResponse(authBody, { 
        status, 
        headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}