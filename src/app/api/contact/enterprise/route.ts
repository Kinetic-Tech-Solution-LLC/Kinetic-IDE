// Copyright 2026 Kinetic Tech Solution LLC. All rights reserved.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { enterpriseSchema } from '@/lib/validations/contact.schemas';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kinetic-ide.com';

function parseSeats(teamSize: string): number {
  const cleaned = teamSize.replace(/,/g, '');
  const match = cleaned.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.website && body.website.length > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = enterpriseSchema.parse(body);

    const enrichedMessage = [
      `[Role: ${data.role}]`,
      `[Industry: ${data.industry}]`,
      `[Phone: ${data.phone}]`,
      `[Team Size: ${data.teamSize}]`,
      data.subject ? `[Subject: ${data.subject}]` : null,
    ].filter(Boolean).join(' ') + `\n\n${data.message}`;

    const res = await fetch(`${BACKEND}/api/contact/enterprise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    data.name,
        email:   data.companyEmail,
        company: data.companyName,
        seats:   parseSeats(data.teamSize),
        message: enrichedMessage,
      }),
    });

    if (!res.ok) {
      const resp = await res.json().catch(() => ({}));
      return NextResponse.json({ error: resp.error ?? 'Failed to submit' }, { status: res.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
