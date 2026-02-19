// app/api/auth/google/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { OAuth2Client } from 'google-auth-library'

export async function POST(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error("❌ CRITICAL ERROR: GOOGLE_CLIENT_ID is missing in .env file")
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const client = new OAuth2Client(clientId)
    const { credential } = await request.json()

    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })
    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google Token' }, { status: 400 })
    }

    // 2. Prepare User Data from Google
    const googleData = {
      firstName: payload.given_name || 'User',
      lastName: payload.family_name || '',
      avatarUrl: payload.picture || null, 
      isVerified: true,
      provider: 'google',
    }

    // 3. Upsert: Create if new, Update if exists
    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        // Update user details on login
        firstName: googleData.firstName,
        lastName: googleData.lastName,
        avatarUrl: googleData.avatarUrl, 
        provider: 'google', 
        isVerified: true
      },
      create: {
        email: payload.email,
        ...googleData,
        password: null, // No password for Google users
      }
    })

    return NextResponse.json({ user })

  } catch (error: any) {
    console.error('❌ GOOGLE AUTH ERROR:', error.message)
    return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 })
  }
}