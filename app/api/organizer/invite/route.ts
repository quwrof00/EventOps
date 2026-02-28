import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Simple HMAC token: "eventId:inviteeEmail:expiry" signed with NEXTAUTH_SECRET
function createInviteToken(eventId: string, email: string): string {
    const expiry = Date.now() + 48 * 60 * 60 * 1000; // 48h
    const payload = `${eventId}:${email}:${expiry}`;
    const sig = crypto
        .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback')
        .update(payload)
        .digest('hex');
    return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(getAuthOptions());
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId, email } = await req.json();
        if (!eventId || !email) {
            return NextResponse.json({ error: 'eventId and email are required' }, { status: 400 });
        }

        // Verify the caller is an organizer of this event
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizers: true },
        });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        const isOrganizer = event.organizers.some((o) => o.id === session.user.id);
        if (!isOrganizer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Check if already a co-organizer
        const alreadyOrganizer = event.organizers.some((o) => o.email === email);
        if (alreadyOrganizer) {
            return NextResponse.json({ error: 'This person is already a co-organizer.' }, { status: 409 });
        }

        // Build invite link
        const token = createInviteToken(eventId, email);
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const inviteUrl = `${appUrl}/api/organizer/invite/accept?token=${token}`;

        // Send email via nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"EventOps" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `You've been invited to co-organise "${event.title}"`,
            html: `
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:2px solid #e5e7eb;">
                    <div style="height:3px;background:#0D9488;margin-bottom:24px;"></div>
                    <p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6B7280;margin:0 0 8px;">EventOps Invitation</p>
                    <h2 style="font-size:22px;font-weight:800;color:#1e293b;margin:0 0 12px;">You're invited to co-organise</h2>
                    <h3 style="font-size:18px;color:#0D9488;margin:0 0 20px;">${event.title}</h3>
                    <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
                        <strong style="color:#1e293b;">${session.user.name || session.user.email}</strong> has invited you to become a co-organiser of this event on EventOps.
                        Click the button below to accept — the link expires in 48 hours.
                    </p>
                    <a href="${inviteUrl}" style="display:inline-block;background:#f97316;color:#fff;font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:12px 28px;text-decoration:none;">
                        Accept Invitation →
                    </a>
                    <p style="margin:28px 0 0;font-size:12px;color:#9CA3AF;">
                        If you didn't expect this, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        return NextResponse.json({ success: true, message: `Invitation sent to ${email}` });
    } catch (err: any) {
        console.error('[invite] error:', err);
        return NextResponse.json({ error: err.message || 'Failed to send invite' }, { status: 500 });
    }
}
