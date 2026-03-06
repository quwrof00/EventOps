import React from 'react';
import { prisma } from '@/lib/prisma';
import EventsBrowser from '@/components/EventsBrowser';

export const dynamic = 'force-dynamic';

export default async function EventsListPage() {
    // Fetch all events via Prisma directly
    // This allows us to handle client-side filtering completely without API calls per filter change
    const allEventsRaw = await prisma.event.findMany({
        include: { participants: true },
        orderBy: { createdAt: 'desc' }
    });

    const allEvents = allEventsRaw.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        category: event.category,
        date: event.date,
        image: event.image || '/placeholder-1.jpg',
        price: event.price,
        isFree: event.isFree,
        capacity: event.capacity,
        displayLocation: event.location ? event.location.split('|')[0] : 'TBD',
        spotsLeft: event.capacity - event.participants.length,
        attendeesCount: event.participants.length,
    }));

    // Calculate Trending (Top 5 by participants)
    const trendingEvents = [...allEvents]
        .sort((a, b) => b.attendeesCount - a.attendeesCount)
        .slice(0, 5)
        .map(e => ({
            id: e.id,
            title: e.title,
            attendees: e.attendeesCount,
        }));

    return (
        <div className="min-h-screen bg-[#E8F8F5] font-sans text-steel-gray pt-16">
            {/* Subtle page header */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-[#ccf0ea]">
                <main className="mx-auto max-w-400 px-6 py-8">
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-teal mb-1.5">Discover</p>
                    <h1 className="text-3xl font-bold text-charcoal-blue">Explore Events</h1>
                    <p className="mt-1.5 text-[15px] text-steel-gray">Conferences, workshops, and meetups tailored for you.</p>
                </main>
            </div>

            <main className="mx-auto max-w-400 px-6 py-8">
                <EventsBrowser initialEvents={allEvents} trendingEvents={trendingEvents} />
            </main>
        </div>
    );
}