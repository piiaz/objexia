// app/api/auth/signup/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, age, jobTitle } = body;

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // 2. Generate 6-digit Code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User (Unverified)
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        jobTitle,
        age,
        otp,        // <--- Saving to DB
        otpExpiry,  // <--- Saving to DB
        isVerified: false, 
        provider: 'email'
      },
    });

    // 5. Send Email (Logs to console for now)
    await sendVerificationEmail(email, otp);

    return NextResponse.json({ 
      message: 'Signup successful', 
      requiresVerification: true,
      userId: newUser.id 
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}