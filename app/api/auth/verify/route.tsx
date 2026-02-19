// app/api/auth/verify/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId, pin } = await request.json()

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check PIN and Expiry
    if (user.otp !== pin) {
        return NextResponse.json({ error: 'Invalid PIN code' }, { status: 400 })
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return NextResponse.json({ error: 'PIN code has expired' }, { status: 400 })
    }

    // Activate User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}