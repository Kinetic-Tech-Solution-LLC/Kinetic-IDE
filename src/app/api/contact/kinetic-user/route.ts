// Copyright 2026 Kinetic Tech Solution LLC. All rights reserved.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { kineticUserSchema } from '@/lib/validations/contact.schemas';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kinetic-ide.com';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.website && body.website.length > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { name, email, message, kineticId, subject } = kineticUserSchema.parse(body);

    const enrichedMessage = `[Kinetic ID: ${kineticId ?? 'not provided'}]${subject ? ` [Subject: ${subject}]` : ''}\n\n${message}`;

    const res = await fetch(`${BACKEND}/api/contact/kinetic-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message: enrichedMessage }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.error ?? 'Failed to submit' }, { status: res.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
