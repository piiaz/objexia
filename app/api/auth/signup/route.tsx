// app/api/auth/signup/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, age, jobTitle } = body;

    // 1. Check if they are ALREADY a fully registered user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // 2. Generate 6-digit Code & Expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Put them in the Holding Pen (PendingUser)
    // We use upsert so if they close the tab and try again, it just updates their code!
    await prisma.pendingUser.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        password: hashedPassword,
        jobTitle,
        age,
        otp,        
        expiresAt,  
      },
      create: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        jobTitle,
        age,
        otp,        
        expiresAt,  
      },
    });

    // 5. Send Verification Email
    await sendVerificationEmail(email, otp);

    return NextResponse.json({ 
      message: 'OTP sent successfully', 
      requiresVerification: true,
      email: email // Returning the email so the frontend knows who to verify!
    }, { status: 200 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}