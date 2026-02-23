import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { prisma } from "@/app/lib/prisma";

// Initialize Liveblocks with the secret key you just pasted into .env
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    // 1. Get the room (roadmapId) and userId from the frontend request
    const body = await request.json();
    const { room, userId } = body; 

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch user details from our DB for their Avatar and Name
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    // 3. Verify they have access to this specific roadmap
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: room },
      include: { collaborators: true }
    });

    if (!roadmap) return new NextResponse("Roadmap not found", { status: 404 });

    const isOwner = roadmap.userId === user.id;
    const isCollaborator = roadmap.collaborators.some(c => c.userId === user.id);

    if (!isOwner && !isCollaborator) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // 4. Authorize the user with Liveblocks and assign their cursor info
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.firstName,
        avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}&background=3f407e&color=fff`,
        color: ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8"][Math.floor(Math.random() * 5)] // Random cursor color
      }
    });

    // Grant full access to this specific roadmap room
    session.allow(room, session.FULL_ACCESS);

    const { status, body: authBody } = await session.authorize();
    return new NextResponse(authBody, { status });

  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}