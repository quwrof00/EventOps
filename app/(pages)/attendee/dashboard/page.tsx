import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { fetchFromApi } from "@/lib/api-client";
import { getAttendeeData } from "@/lib/services/attendee"; // Import Service

interface Ticket {
    id: string;
    status: string;
    createdAt: string;
    event: {
        id: string;
        title: string;
        date: string;
        location: string;
        category: string;
    }
}

interface DashboardData {
    tickets: Ticket[];
}

export default async function AttendeeDashboard() {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
        redirect(`/login?error=${encodeURIComponent("You must be logged in to view your tickets.")}`);
    }

    // Call "Service"/Backend Function directly (Server Component Pattern)
    // This satisfies "no DB in component" while avoiding network loopback issues for auth
    const { tickets, recommendedEvents } = await getAttendeeData(session.user.id);

    const now = new Date();
    const validTickets = tickets.filter(t => new Date(t.event.date) > now);
    const pastTickets = tickets.filter(t => new Date(t.event.date) <= now);

    const total = tickets.length;
    const activeCount = validTickets.length;
    const checkedInCount = pastTickets.length;

    return (
        <div className="min-h-screen bg-off-white font-sans text-steel-gray pt-16">
            <main className="mx-auto max-w-7xl px-6 py-14">

                {/* HEADER */}
                <div className="mb-16">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl font-extrabold tracking-tight text-charcoal-blue">
                                My Tickets
                            </h1>
                            <p className="mt-4 text-xl leading-relaxed text-steel-gray">
                                Manage your event registrations, view ticket status, and track upcoming attendance.
                            </p>
                        </div>

                        <Link
                            href="/events"
                            className="group inline-flex items-center gap-2 border-2 border-muted-teal bg-muted-teal px-8 py-4 text-sm font-bold  tracking-widest text-white transition hover:bg-white hover:text-muted-teal"
                        >
                            Browse Events
                            <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* STATS GRID */}
                <section className="mb-20">
                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* TOTAL TICKETS - FEATURED */}
                        <div className="group relative overflow-hidden border-2 border-charcoal-blue bg-charcoal-blue px-10 py-12 transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                            {/* Decorative elements */}
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
                            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/5" />

                            <div className="relative z-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold  tracking-widest text-white/70">
                                        Total Tickets
                                    </span>
                                    <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                </div>
                                <div className="mb-4 text-6xl font-extrabold tracking-tight text-white">
                                    {total}
                                </div>
                                <div className="h-1 w-20 bg-muted-teal" />
                                <p className="mt-4 text-sm leading-relaxed text-white/80">
                                    All event registrations across attended and upcoming events
                                </p>
                            </div>
                        </div>

                        {/* ACTIVE TICKETS */}
                        <div className="group relative overflow-hidden border-2 border-muted-teal bg-white transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="absolute inset-0 bg-linear-to-br from-muted-teal/5 to-transparent" />
                            <div className="absolute bottom-0 left-0 h-2 w-full bg-muted-teal" />

                            <div className="relative z-10 px-8 py-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold  tracking-widest text-muted-teal">
                                        Upcoming
                                    </span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-teal/10">
                                        <svg className="h-5 w-5 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mb-3 text-5xl font-extrabold text-charcoal-blue">
                                    {activeCount}
                                </div>
                                <p className="text-sm font-medium text-steel-gray">
                                    Events you are scheduled to attend
                                </p>
                            </div>
                        </div>

                        {/* CHECKED IN / PAST */}
                        <div className="group relative overflow-hidden border-2 border-gray-300 bg-white transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="absolute inset-0 bg-linear-to-br from-gray-100/50 to-transparent" />
                            <div className="absolute bottom-0 left-0 h-2 w-full bg-gray-400" />

                            <div className="relative z-10 px-8 py-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold  tracking-widest text-gray-600">
                                        Past / Attended
                                    </span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mb-3 text-5xl font-extrabold text-charcoal-blue">
                                    {checkedInCount}
                                </div>
                                <p className="text-sm font-medium text-steel-gray">
                                    Events already concluded
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* MAIN CONTENT GRID */}
                <div className="grid gap-12 lg:grid-cols-3">

                    {/* LEFT COLUMN - TICKET HISTORY */}
                    <div className="lg:col-span-2 space-y-12">

                        <section>
                            <div className="mb-8 flex items-center justify-between">
                                <h2 className="text-2xl font-bold  tracking-widest text-charcoal-blue">
                                    All Tickets
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {tickets.length > 0 ? tickets.map((ticket) => {
                                    const eventDate = new Date(ticket.event.date);
                                    const isPast = eventDate <= now;
                                    const isActive = !isPast;

                                    const locationParts = ticket.event.location ? ticket.event.location.split('|') : ['TBD'];
                                    const displayLocation = locationParts[0];

                                    return (
                                        <div
                                            key={ticket.id}
                                            className="group relative border-2 border-soft-slate bg-white transition-all hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            {/* Status indicator line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? "bg-muted-teal" : "bg-gray-400"}`} />

                                            {/* Right side - Status badge and button */}
                                            <div className="absolute right-6 top-6 flex flex-col items-end gap-3">
                                                <span className={`inline-block border px-4 py-2 text-xs font-bold  tracking-widest ${isActive ? "border-muted-teal bg-muted-teal/10 text-muted-teal" : "border-gray-300 bg-gray-100 text-gray-500"}`}>
                                                    {isActive ? "Valid" : "Past"}
                                                </span>

                                                <Link
                                                    href={`/attendee/ticket/${ticket.id}`}
                                                    className="inline-flex shrink-0 items-center gap-2 border-2 border-charcoal-blue bg-charcoal-blue px-6 py-3 text-sm font-bold  tracking-widest text-white transition hover:bg-white hover:text-charcoal-blue"
                                                >
                                                    View Ticket
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </div>

                                            <div className="p-8 pl-10 pr-32">
                                                <h3 className="mb-3 text-xl font-bold  tracking-tight text-charcoal-blue group-hover:text-muted-teal transition">
                                                    {ticket.event.title}
                                                </h3>

                                                <div className="mb-4 flex flex-wrap gap-4 text-sm font-medium text-steel-gray">
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {eventDate.toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {displayLocation}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-steel-gray">
                                                    <span>Registered: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">ID: {ticket.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="rounded-xl border border-soft-slate bg-white p-12 text-center">
                                        <h3 className="text-lg font-bold text-charcoal-blue">No tickets yet</h3>
                                        <p className="mt-2 text-steel-gray">You haven't registered for any events yet.</p>
                                        <Link href="/events" className="mt-4 inline-block text-sm font-bold text-muted-teal hover:underline">Browse Events</Link>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* QUICK STATS */}
                        <section className="border-2 border-soft-slate bg-white p-8">
                            <h3 className="mb-6 text-lg font-bold  tracking-widest text-charcoal-blue">
                                Your Activity
                            </h3>
                            <div className="grid gap-6 sm:grid-cols-3">
                                <div className="border-l-4 border-muted-teal bg-muted-teal/5 px-4 py-3">
                                    <div className="text-xs font-bold  tracking-wider text-steel-gray">
                                        Upcoming
                                    </div>
                                    <div className="mt-1 text-2xl font-bold text-charcoal-blue">
                                        {activeCount}
                                    </div>
                                </div>
                                <div className="border-l-4 border-charcoal-blue bg-charcoal-blue/5 px-4 py-3">
                                    <div className="text-xs font-bold  tracking-wider text-steel-gray">
                                        Categories
                                    </div>
                                    <div className="mt-1 text-2xl font-bold text-charcoal-blue">
                                        {new Set(tickets.map(t => t.event.category)).size}
                                    </div>
                                </div>
                                <div className="border-l-4 border-gray-400 bg-gray-100/50 px-4 py-3">
                                    <div className="text-xs font-bold  tracking-wider text-steel-gray">
                                        Total Events
                                    </div>
                                    <div className="mt-1 text-2xl font-bold text-charcoal-blue">
                                        {total}
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-8">

                            {/* UPCOMING ATTENDANCE */}
                            <section className="border-2 border-soft-slate bg-white p-8 shadow-sm">
                                <h3 className="mb-6 text-sm font-bold  tracking-wider text-steel-gray">
                                    Next Event
                                </h3>

                                {validTickets.length > 0 ? (
                                    (() => {
                                        const nextEvent = validTickets.sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())[0];
                                        const eventDate = new Date(nextEvent.event.date);
                                        const daysToGo = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                                        return (
                                            <div className="group">
                                                {/* Date Badge */}
                                                <div className="mb-4 inline-flex items-center gap-3">
                                                    <div className="flex h-16 w-16 flex-col items-center justify-center border-2 border-muted-teal bg-muted-teal/10">
                                                        <span className="text-xs font-bold  tracking-widest text-muted-teal">
                                                            {eventDate.toLocaleString('default', { month: 'short' })}
                                                        </span>
                                                        <span className="text-2xl font-extrabold text-muted-teal">
                                                            {eventDate.getDate()}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold  tracking-wider text-steel-gray">
                                                            Days to go
                                                        </span>
                                                        <span className="text-3xl font-extrabold text-charcoal-blue">
                                                            {daysToGo}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h4 className="mb-2 text-lg font-bold  tracking-tight text-charcoal-blue group-hover:text-muted-teal transition line-clamp-1">
                                                    {nextEvent.event.title}
                                                </h4>
                                                <p className="mb-4 text-sm font-medium text-steel-gray">
                                                    {nextEvent.event.location ? nextEvent.event.location.split('|')[0] : 'TBD'}
                                                </p>

                                                <Link
                                                    href={`/attendee/ticket/${nextEvent.id}`}
                                                    className="inline-flex w-full items-center justify-center border-2 border-muted-teal bg-muted-teal px-4 py-3 text-sm font-bold  tracking-widest text-white transition hover:bg-white hover:text-muted-teal"
                                                >
                                                    View Ticket
                                                </Link>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-sm text-steel-gray">No upcoming events</p>
                                )}
                            </section>

                            {/* RECOMMENDATIONS */}
                            <section className="border-2 border-soft-slate bg-white p-8 shadow-sm">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-bold  tracking-widest text-charcoal-blue">
                                        Recommended For You
                                    </h3>
                                    <svg className="h-6 w-6 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>

                                <div className="space-y-6">
                                    {recommendedEvents.length > 0 ? recommendedEvents.map((event, i) => (
                                        <div
                                            key={i}
                                            className="group cursor-pointer border-2 border-soft-slate bg-white p-5 transition-all hover:border-muted-teal hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <h4 className="text-base font-bold  tracking-tight text-charcoal-blue group-hover:text-muted-teal transition line-clamp-1">
                                                    {event.title}
                                                </h4>
                                                <span className="shrink-0 border border-muted-teal/20 bg-muted-teal/5 px-2.5 py-1 text-xs font-bold  tracking-wider text-muted-teal">
                                                    {event.category}
                                                </span>
                                            </div>

                                            <div className="mb-4 flex items-center gap-2 text-sm text-steel-gray">
                                                <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                                            </div>

                                            <Link
                                                href={`/event/${event.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-bold  tracking-wider text-muted-teal hover:text-charcoal-blue transition"
                                            >
                                                View Details
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-steel-gray">No new recommendations.</p>
                                    )}
                                </div>

                                <Link
                                    href="/events"
                                    className="mt-6 flex w-full items-center justify-center border-2 border-charcoal-blue bg-charcoal-blue px-6 py-3 text-sm font-bold  tracking-widest text-white transition hover:bg-white hover:text-charcoal-blue"
                                >
                                    Explore All Events
                                </Link>
                            </section>

                            {/* PROMO */}
                            <section className="relative overflow-hidden border-2 border-charcoal-blue bg-charcoal-blue p-8 text-white">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                                <div className="relative z-10">
                                    <h3 className="mb-2 text-lg font-bold">Invite Friends</h3>
                                    <p className="mb-4 text-sm text-white/80">
                                        Get $20 credit for each friend who registers for an event
                                    </p>
                                    <button className="w-full border-2 border-white bg-white px-4 py-2 text-sm font-bold  tracking-wider text-charcoal-blue transition hover:bg-transparent hover:text-white">
                                        Share Link
                                    </button>
                                </div>
                            </section>

                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
