import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';

// Generate a unique 6-char uppercase alphanumeric code
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// GET /api/teams?eventId=xxx&userId=xxx  → get a user's team for an event
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    if (!eventId || !userId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    try {
        // Find a ticket for this user in this event that has a teamId
        const ticket = await (prisma as any).ticket.findFirst({
            where: { eventId, userId },
            include: {
                teamMembership: {
                    include: {
                        leader: { select: { id: true, name: true } },
                        members: {
                            include: { user: { select: { id: true, name: true } } }
                        }
                    }
                }
            }
        });

        if (!ticket?.teamMembership) {
            return NextResponse.json({ team: null });
        }

        return NextResponse.json({ team: ticket.teamMembership });
    } catch (error) {
        console.error('Team fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

// POST /api/teams  → create a new team
export async function POST(request: NextRequest) {
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, teamName, maxSize } = await request.json();

    if (!eventId || !teamName?.trim()) {
        return NextResponse.json({ error: 'eventId and teamName are required' }, { status: 400 });
    }

    try {
        // Verify event exists and is a team-format event
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Verify this user has a ticket for this event
        const ticket = await (prisma as any).ticket.findFirst({
            where: { eventId, userId: session.user.id }
        });
        if (!ticket) {
            return NextResponse.json({ error: 'You must be registered for this event first.' }, { status: 403 });
        }

        // Check if user already has a team for this event
        if (ticket.teamId) {
            return NextResponse.json({ error: 'You already belong to a team for this event.' }, { status: 409 });
        }

        // Generate a unique code for this event
        let code = generateCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await (prisma as any).eventTeam.findUnique({
                where: { code_eventId: { code, eventId } }
            });
            if (!existing) break;
            code = generateCode();
            attempts++;
        }

        // Create the team and connect the leader's ticket
        const team = await (prisma as any).eventTeam.create({
            data: {
                code,
                name: teamName.trim(),
                eventId,
                leaderId: session.user.id,
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

        return NextResponse.json({ team }, { status: 201 });
    } catch (error) {
        console.error('Team create error:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}
