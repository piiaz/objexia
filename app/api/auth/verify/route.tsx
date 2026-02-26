// app/api/auth/verify/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: Request) {
  try {
    // We use 'email' to look them up in the holding pen instead of 'userId'
    const { email, pin } = await request.json()

    // 1. Find them in the Holding Pen
    const pendingUser = await prisma.pendingUser.findUnique({ where: { email } })

    if (!pendingUser) {
      return NextResponse.json({ error: 'No pending registration found for this email' }, { status: 404 })
    }

    // 2. Check PIN and Expiry
    if (pendingUser.otp !== pin) {
        return NextResponse.json({ error: 'Invalid PIN code' }, { status: 400 })
    }

    if (new Date() > pendingUser.expiresAt) {
        return NextResponse.json({ error: 'PIN code has expired. Please sign up again to get a new code.' }, { status: 400 })
    }

    // 3. SUCCESS: Graduate them to the real User table!
    const newUser = await prisma.user.create({
      data: {
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        email: pendingUser.email,
        password: pendingUser.password, // Already hashed from the signup step
        jobTitle: pendingUser.jobTitle,
        age: pendingUser.age,
        
        // Applying the defaults from your old code
        isVerified: true, 
        provider: 'email',
      }
    })

    // 4. Clean up: Delete the record from the holding pen
    await prisma.pendingUser.delete({ where: { email } })

    return NextResponse.json({ 
      success: true, 
      user: newUser 
    })

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}