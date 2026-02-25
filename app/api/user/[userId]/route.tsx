import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// 1. GET: Fetch user details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> } // <--- FIX TYPE
) {
  const { userId } = await params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, email: true, firstName: true, lastName: true, 
        jobTitle: true, avatarUrl: true, age: true, gender: true
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// 2. PATCH: Update user details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> } // <--- FIX TYPE
) {
  const { userId } = await params;
  
try {
    const body = await req.json();
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        jobTitle: body.jobTitle,
        avatarUrl: body.avatarUrl,
        age: body.age,
        gender: body.gender,
        // THE FIX: Allow theme to be saved to DB safely
        theme: body.theme !== undefined ? body.theme : undefined 
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// 3. DELETE: Delete account
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> } // <--- FIX TYPE
) {
  const { userId } = await params;

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}