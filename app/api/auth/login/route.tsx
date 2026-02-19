// app/api/auth/login/route.tsx

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Validate User Existence
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. FIX: Check if user has a password (Google users might not)
    if (!user.password) {
      return NextResponse.json({ 
        error: 'Please sign in with Google' 
      }, { status: 400 });
    }

    // 4. Check Password (Now guaranteed to be string)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 5. Return User (Exclude password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}