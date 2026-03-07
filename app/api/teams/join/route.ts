import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';

// POST /api/teams/join  → join a team by code
export async function POST(request: NextRequest) {
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, code } = await request.json();

    if (!eventId || !code?.trim()) {
        return NextResponse.json({ error: 'eventId and code are required' }, { status: 400 });
    }

    try {
        // Find the team by code+eventId
        const team = await (prisma as any).eventTeam.findUnique({
            where: { code_eventId: { code: code.trim().toUpperCase(), eventId } },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true } } }
                },
                event: true
            }
        });

        if (!team) {
            return NextResponse.json({ error: 'No team found with that code for this event.' }, { status: 404 });
        }

        // Get the max team size from the event's format meta
        let maxSize = Infinity;
        try {
            if (team.event.description) {
                const parsed = JSON.parse(team.event.description);
                const fm = parsed?.formatMeta ?? {};
                if (fm.teamSizeMax) maxSize = parseInt(fm.teamSizeMax);
            }
        } catch { /* ignore parse errors */ }

        if (team.members.length >= maxSize) {
            return NextResponse.json({ error: `Team is full (max ${maxSize} members).` }, { status: 409 });
        }

        // Verify this user has a ticket for this event
        const ticket = await (prisma as any).ticket.findFirst({
            where: { eventId, userId: session.user.id }
        });
        if (!ticket) {
            return NextResponse.json({ error: 'You must be registered for this event first.' }, { status: 403 });
        }

        // Check if user is already in a team for this event
        if (ticket.teamId) {
            if (ticket.teamId === team.id) {
                return NextResponse.json({ error: 'You are already in this team.' }, { status: 409 });
            }
            return NextResponse.json({ error: 'You already belong to a different team for this event.' }, { status: 409 });
        }

        // Check if user is already a member
        const alreadyMember = team.members.some((m: any) => m.userId === session.user.id);
        if (alreadyMember) {
            return NextResponse.json({ error: 'You are already a member of this team.' }, { status: 409 });
        }

        // Add user to the team
        const updatedTeam = await (prisma as any).eventTeam.update({
            where: { id: team.id },
            data: {
                members: {
                    connect: { id: ticket.id }
                }
            },
            include: {
                leader: { select: { id: true, name: true } },
                members: {
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });

        return NextResponse.json({ team: updatedTeam });
    } catch (error) {
        console.error('Team join error:', error);
        return NextResponse.json({ error: 'Failed to join team' }, { status: 500 });
    }
}
