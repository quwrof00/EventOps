import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import { fetchFromApi } from "@/lib/api-client";
import { getAttendeeData } from "@/lib/services/attendee";

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

    // Next upcoming event (sorted soonest)
    const nextEvent = validTickets.length > 0
        ? [...validTickets].sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())[0]
        : null;

    const nextEventDate = nextEvent ? new Date(nextEvent.event.date) : null;
    const daysToGo = nextEventDate
        ? Math.ceil((nextEventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="min-h-screen bg-[#E8F8F5] font-sans text-steel-gray pt-16">

            <main className="mx-auto max-w-7xl px-6 py-14">

                {/* HEADER */}
                <div className="mb-16">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl font-extrabold tracking-tight text-charcoal-blue">
                                Attendee Dashboard
                            </h1>
                            <p className="mt-4 text-xl leading-relaxed text-steel-gray">
                                Track your upcoming events, view your tickets, and discover new experiences.
                            </p>
                        </div>

                        <Link
                            href="/events"
                            className="group inline-flex items-center gap-2 border-2 border-muted-teal bg-muted-teal px-8 py-4 text-sm font-bold tracking-widest text-white transition hover:bg-white hover:text-muted-teal"
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

                        {/* NEXT UP — HERO (matches Total Revenue card) */}
                        <div className="group relative overflow-hidden bg-charcoal-blue px-10 py-12 rounded-2xl transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
                            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
                            <div className="relative z-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-widest text-white/70">Next Up</span>
                                    <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {nextEvent && nextEventDate ? (
                                    <>
                                        <div className="mb-4">
                                            <div className="text-5xl font-extrabold tracking-tight text-white leading-none">{daysToGo}</div>
                                            <div className="text-sm text-white/50 mt-1">days to go</div>
                                        </div>
                                        <div className="h-1 w-20 bg-muted-teal" />
                                        <p className="mt-4 text-sm leading-relaxed text-white/80 line-clamp-2">{nextEvent.event.title}</p>
                                        <div className="mt-4 flex items-center gap-3 text-[12px] text-white/50">
                                            <span>{nextEventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span>·</span>
                                            <span className="truncate">{nextEvent.event.location?.split('|')[0] || 'TBD'}</span>
                                        </div>
                                        <Link
                                            href={`/attendee/ticket/${nextEvent.id}`}
                                            className="mt-5 inline-flex items-center gap-1.5 bg-muted-teal px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white hover:text-muted-teal"
                                        >
                                            View Ticket
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-4 text-5xl font-extrabold tracking-tight text-white">—</div>
                                        <div className="h-1 w-20 bg-muted-teal" />
                                        <p className="mt-4 text-sm text-white/60">No upcoming events registered.</p>
                                        <Link href="/events" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-muted-teal hover:underline underline-offset-2">
                                            Browse events →
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* TOTAL TICKETS (matches Tickets Sold card — teal accent) */}
                        <div className="group relative overflow-hidden border-2 border-muted-teal bg-white transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="absolute inset-0 bg-linear-to-br from-muted-teal/5 to-transparent" />
                            <div className="absolute bottom-0 left-0 h-2 w-full bg-muted-teal" />
                            <div className="relative z-10 px-8 py-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-widest text-muted-teal">Total Tickets</span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-teal/10">
                                        <svg className="h-5 w-5 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mb-3 text-5xl font-extrabold text-charcoal-blue">{total}</div>
                                <p className="text-sm font-medium text-steel-gray">{activeCount} upcoming · {checkedInCount} past</p>
                            </div>
                        </div>

                        {/* UPCOMING + ATTENDED stacked (matches Total Events style — gray) */}
                        <div className="flex flex-col gap-6">

                            {/* Upcoming */}
                            <div className="group relative overflow-hidden border-2 border-gray-200 bg-white flex-1 transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)]">
                                <div className="absolute inset-0 bg-linear-to-br from-muted-teal/5 to-transparent" />
                                <div className="absolute bottom-0 left-0 h-2 w-full bg-muted-teal" />
                                <div className="relative z-10 px-8 py-8">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-widest text-muted-teal">Upcoming</span>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-teal/10">
                                            <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-5xl font-extrabold text-charcoal-blue">{activeCount}</div>
                                </div>
                            </div>

                            {/* Attended */}
                            <div className="group relative overflow-hidden border-2 border-gray-200 bg-white flex-1 transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)]">
                                <div className="absolute inset-0 bg-linear-to-br from-gray-100/50 to-transparent" />
                                <div className="absolute bottom-0 left-0 h-2 w-full bg-gray-400" />
                                <div className="relative z-10 px-8 py-8">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-widest text-gray-600">Attended</span>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-5xl font-extrabold text-charcoal-blue">{checkedInCount}</div>
                                </div>
                            </div>

                        </div>

                    </div>
                </section>

                {/* MAIN CONTENT GRID  */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* LEFT — TICKETS LIST */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.07)]">
                            {/* Teal accent top bar */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />

                            {/* Section header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                <h2 className="text-sm font-bold text-charcoal-blue">All Tickets</h2>
                                <span className="text-[11px] font-bold text-steel-gray bg-gray-100 px-2.5 py-1">
                                    {total} total
                                </span>
                            </div>

                            {/* Ticket rows */}
                            {tickets.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {tickets.map((ticket) => {
                                        const eventDate = new Date(ticket.event.date);
                                        const isPast = eventDate <= now;
                                        const isActive = !isPast;
                                        const displayLocation = ticket.event.location?.split('|')[0] || 'TBD';

                                        return (
                                            <div
                                                key={ticket.id}
                                                className={`group flex items-stretch transition-all ${isActive ? 'hover:bg-muted-teal/[0.03]' : 'hover:bg-gray-50'}`}
                                            >
                                                {/* Status bar */}
                                                <div className={`w-1 shrink-0 transition-all ${isActive ? 'bg-muted-teal group-hover:bg-muted-teal' : 'bg-gray-200'}`} />

                                                <div className="flex flex-1 items-center justify-between px-5 py-4 gap-4 min-w-0">
                                                    {/* Left: date block + info */}
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {/* Compact date badge */}
                                                        <div className={`shrink-0 flex flex-col items-center justify-center w-11 h-11 ${isActive ? 'bg-muted-teal/10' : 'bg-gray-100'}`}>
                                                            <span className={`text-[9px] font-bold tracking-widest uppercase leading-none ${isActive ? 'text-muted-teal' : 'text-gray-400'}`}>
                                                                {eventDate.toLocaleString('default', { month: 'short' })}
                                                            </span>
                                                            <span className={`text-base font-black leading-tight ${isActive ? 'text-muted-teal' : 'text-gray-400'}`}>
                                                                {eventDate.getDate()}
                                                            </span>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 ${isActive ? 'bg-muted-teal/10 text-muted-teal' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {isActive ? 'Upcoming' : 'Past'}
                                                                </span>
                                                                <span className="text-[11px] text-gray-300">{ticket.event.category}</span>
                                                            </div>
                                                            <h3 className="text-[14px] font-semibold text-charcoal-blue group-hover:text-muted-teal transition-colors line-clamp-1 leading-snug">
                                                                {ticket.event.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1 text-[12px] text-steel-gray">
                                                                <svg className="h-3 w-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <span className="truncate">{displayLocation}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right: action */}
                                                    <Link
                                                        href={`/attendee/ticket/${ticket.id}`}
                                                        className="shrink-0 inline-flex items-center gap-1.5 bg-charcoal-blue px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-muted-teal"
                                                    >
                                                        View Ticket
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <p className="text-sm font-semibold text-charcoal-blue">No tickets yet</p>
                                    <p className="mt-1 text-[13px] text-steel-gray">Register for an event to get started.</p>
                                    <Link href="/events" className="mt-4 inline-block text-[13px] font-semibold text-muted-teal hover:underline underline-offset-2">
                                        Browse events →
                                    </Link>
                                </div>
                            )}

                            {/* Footer stats bar */}
                            {tickets.length > 0 && (
                                <div className="flex items-center gap-6 px-6 py-3.5 border-t-2 border-gray-100 bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-muted-teal" />
                                        <span className="text-[11px] text-steel-gray">{activeCount} upcoming</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-gray-300" />
                                        <span className="text-[11px] text-steel-gray">{checkedInCount} past</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-charcoal-blue" />
                                        <span className="text-[11px] text-steel-gray">{new Set(tickets.map(t => t.event.category)).size} categories</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* RIGHT — SIDEBAR */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">

                            {/* RECOMMENDATIONS */}
                            <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                                {/* Teal accent top bar */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />

                                <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-charcoal-blue">Recommended</p>
                                    <svg className="h-3.5 w-3.5 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>

                                {recommendedEvents.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {recommendedEvents.map((event, i) => (
                                            <Link
                                                key={i}
                                                href={`/event/${event.id}`}
                                                className="group flex items-start gap-3.5 px-5 py-4 hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Date mini-block */}
                                                <div className="shrink-0 w-10 text-center">
                                                    <p className="text-[9px] font-bold tracking-widest uppercase text-muted-teal leading-none">
                                                        {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                                    </p>
                                                    <p className="text-lg font-black text-charcoal-blue leading-none mt-0.5">
                                                        {new Date(event.date).getDate()}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-[13px] font-semibold text-charcoal-blue group-hover:text-muted-teal transition-colors line-clamp-1 leading-snug">
                                                        {event.title}
                                                    </h4>
                                                    <p className="text-[11px] text-steel-gray mt-0.5">{event.category}</p>
                                                </div>
                                                <svg className="h-3.5 w-3.5 text-gray-300 group-hover:text-muted-teal transition-colors mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="px-5 py-5 text-[13px] text-steel-gray">No recommendations yet.</p>
                                )}

                                <div className="px-5 py-3.5 border-t-2 border-gray-100 bg-gray-50">
                                    <Link
                                        href="/events"
                                        className="flex w-full items-center justify-center bg-charcoal-blue px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-muted-teal"
                                    >
                                        Explore All Events
                                    </Link>
                                </div>
                            </div>

                            {/* INVITE PROMO */}
                            <div className="bg-charcoal-blue px-5 py-6 text-white relative overflow-hidden rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]">
                                {/* Subtle dot pattern */}
                                <div className="absolute inset-0 opacity-[0.04]" style={{
                                    backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                                    backgroundSize: '16px 16px'
                                }} />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">Referral</p>
                                    <h3 className="text-[15px] font-bold text-white leading-snug mb-1.5">Invite Friends</h3>
                                    <p className="text-[12px] text-white/50 leading-relaxed mb-4">
                                        Earn $20 credit for every friend who registers for an event.
                                    </p>
                                    <button className="w-full bg-white px-4 py-2.5 text-[12px] font-semibold text-charcoal-blue transition-colors hover:bg-muted-teal hover:text-white">
                                        Copy Invite Link
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
