import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function verifyInviteToken(token: string): { eventId: string; email: string } | null {
    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length < 4) return null;

        // parts = [eventId, email, expiry, sig]
        const sig = parts[parts.length - 1];
        const payload = parts.slice(0, -1).join(':');
        const expiry = parseInt(parts[parts.length - 2], 10);

        // Check expiry
        if (Date.now() > expiry) return null;

        // Verify signature
        const expectedSig = crypto
            .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback')
            .update(payload)
            .digest('hex');
        if (sig !== expectedSig) return null;

        const eventId = parts[0];
        // email may contain ':' theoretically, but emails shouldn't — safe split
        const email = parts.slice(1, -2).join(':');
        return { eventId, email };
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (!token) {
        return NextResponse.redirect(`${appUrl}/login?error=Invalid+invite+link`);
    }

    const payload = verifyInviteToken(token);
    if (!payload) {
        return NextResponse.redirect(`${appUrl}/login?error=Invite+link+expired+or+invalid`);
    }

    const { eventId, email } = payload;

    // Look up the invited user (must already have an account)
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
        // Redirect to signup with hint
        return NextResponse.redirect(
            `${appUrl}/signup?error=${encodeURIComponent(`Please create an account with ${email} first, then use the invite link again.`)}`
        );
    }

    // Check the event still exists
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { organizers: true },
    });
    if (!event) {
        return NextResponse.redirect(`${appUrl}/?error=Event+not+found`);
    }

    // Idempotent: add as organizer if not already
    const alreadyOrganizer = event.organizers.some((o) => o.id === invitee.id);
    if (!alreadyOrganizer) {
        await prisma.event.update({
            where: { id: eventId },
            data: {
                organizers: { connect: { id: invitee.id } },
            },
        });
    }

    // Redirect to the organizer manage page
    return NextResponse.redirect(`${appUrl}/organizer/event/${eventId}?invited=1`);
}
