import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OrganizerDashboard() {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
        redirect(`/login?error=${encodeURIComponent("You must be logged in to view the organizer dashboard.")}`);
    }

    // Fetch events for the logged-in organizer
    const events = await prisma.event.findMany({
        where: {
            organizers: {
                some: {
                    id: session.user.id
                }
            }
        },
        include: {
            participants: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Helper to calculate stats
    const organizedEvents = events.map(event => {
        const sold = event.participants.length;
        const priceVal = event.isFree ? 0 : parseFloat(event.price || "0");
        const revenue = sold * (isNaN(priceVal) ? 0 : priceVal);
        const isPast = new Date(event.date) < new Date();
        const status = isPast ? "ENDED" : "PUBLISHED";

        return {
            ...event,
            sold,
            revenue,
            status,
            formattedDate: new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        };
    });

    // Stats calculation
    const totalEvents = organizedEvents.length;
    const totalRevenue = organizedEvents.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalTicketsSold = organizedEvents.reduce((acc, curr) => acc + curr.sold, 0);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-[#FFF7ED] font-sans text-steel-gray pt-16">
            <main className="mx-auto max-w-7xl px-6 py-14">

                {/* HEADER */}
                <div className="mb-16">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl font-extrabold tracking-tight text-charcoal-blue">
                                Organizer Dashboard
                            </h1>
                            <p className="mt-4 text-xl leading-relaxed text-steel-gray">
                                Monitor your event performance, manage attendees, and track revenue.
                            </p>
                        </div>

                        <Link
                            href="/organizer/create-event"
                            className="group inline-flex items-center gap-2 border-2 border-signal-orange bg-signal-orange px-8 py-4 text-sm font-bold tracking-widest text-white transition hover:bg-white hover:text-signal-orange"
                        >
                            Create New Event
                            <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* STATS GRID */}
                <section className="mb-20">
                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* TOTAL REVENUE - FEATURED */}
                        <div className="group relative overflow-hidden bg-charcoal-blue px-10 py-12 rounded-2xl transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
                            <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
                            <div className="relative z-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-widest text-white/70">Total Revenue</span>
                                    <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="mb-4 text-5xl font-extrabold tracking-tight text-white">
                                    {formatCurrency(totalRevenue)}
                                </div>
                                <div className="h-1 w-20 bg-signal-orange" />
                                <p className="mt-4 text-sm leading-relaxed text-white/80">Gross revenue across all events</p>
                            </div>
                        </div>

                        {/* TICKETS SOLD */}
                        <div className="group relative overflow-hidden border-2 border-signal-orange bg-white transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                            <div className="absolute inset-0 bg-linear-to-br from-signal-orange/5 to-transparent" />
                            <div className="absolute bottom-0 left-0 h-2 w-full bg-signal-orange" />
                            <div className="relative z-10 px-8 py-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-widest text-signal-orange">Tickets Sold</span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-signal-orange/10">
                                        <svg className="h-5 w-5 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mb-3 text-5xl font-extrabold text-charcoal-blue">{totalTicketsSold}</div>
                                <p className="text-sm font-medium text-steel-gray">Across {totalEvents} events</p>
                            </div>
                        </div>

                        {/* TOTAL EVENTS */}
                        <div className="group relative overflow-hidden border-2 border-gray-200 bg-white transition hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)]">
                            <div className="absolute inset-0 bg-linear-to-br from-gray-100/50 to-transparent" />
                            <div className="absolute bottom-0 left-0 h-2 w-full bg-gray-400" />
                            <div className="relative z-10 px-8 py-10">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-widest text-gray-600">Events</span>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="mb-3 text-5xl font-extrabold text-charcoal-blue">{totalEvents}</div>
                                <p className="text-sm font-medium text-steel-gray">
                                    {organizedEvents.filter(e => e.status === 'PUBLISHED').length} Published,{' '}
                                    {organizedEvents.filter(e => e.status === 'ENDED').length} Ended
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* EVENTS LIST */}
                <section>
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight text-charcoal-blue">My Events</h2>
                        <select className="border-b-2 border-gray-200 bg-transparent py-1 pl-3 pr-8 text-sm font-bold tracking-wide text-charcoal-blue focus:border-charcoal-blue focus:ring-0">
                            <option>All Events</option>
                            <option>Published</option>
                            <option>Ended</option>
                        </select>
                    </div>

                    {organizedEvents.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-300">
                            <p className="text-lg text-steel-gray mb-4">You haven't created any events yet.</p>
                            <Link href="/organizer/create-event" className="text-signal-orange font-bold hover:underline">
                                Create your first event
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.07)]">
                            {/* Orange accent top bar */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-signal-orange" />

                            {/* Column header */}
                            <div className="hidden sm:flex items-center pl-9 pr-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                <div className="w-11 shrink-0 mr-4" />
                                <div className="flex-1 min-w-0 text-[10px] font-bold tracking-widest uppercase text-steel-gray">Event</div>
                                <div className="flex items-center gap-6 mr-4 text-[10px] font-bold tracking-widest uppercase text-steel-gray">
                                    <span className="w-20 text-right">Sold</span>
                                    <span className="w-24 text-right">Revenue</span>
                                    <span className="w-12 text-right">Fill</span>
                                </div>
                                <div className="w-[130px] shrink-0" />
                            </div>

                            <div className="divide-y divide-gray-100">
                                {organizedEvents.map((event) => {
                                    const isPublished = event.status === "PUBLISHED";
                                    const percentSold = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;
                                    const eventDate = new Date(event.date);

                                    return (
                                        <div key={event.id} className={`group flex items-stretch transition-all hover:bg-signal-orange/[0.03] hover:shadow-[inset_3px_0_0_0] hover:shadow-signal-orange/40`}>

                                            {/* Status bar */}
                                            <div className={`w-1 shrink-0 ${isPublished ? 'bg-signal-orange' : 'bg-gray-200'}`} />

                                            <div className="flex flex-1 items-center px-5 py-4 gap-4 min-w-0">

                                                {/* Date badge */}
                                                <div className={`shrink-0 flex flex-col items-center justify-center w-11 h-11 ${isPublished ? 'bg-signal-orange/10' : 'bg-gray-100'}`}>
                                                    <span className={`text-[9px] font-bold tracking-widest uppercase leading-none ${isPublished ? 'text-signal-orange' : 'text-gray-400'}`}>
                                                        {eventDate.toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <span className={`text-base font-black leading-tight ${isPublished ? 'text-signal-orange' : 'text-gray-400'}`}>
                                                        {eventDate.getDate()}
                                                    </span>
                                                </div>

                                                {/* Event info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 ${isPublished ? 'bg-signal-orange/10 text-signal-orange' : 'bg-gray-100 text-gray-400'}`}>
                                                            {event.status}
                                                        </span>
                                                        <span className="text-[11px] text-gray-300">{event.category}</span>
                                                    </div>
                                                    <h3 className="text-[14px] font-semibold text-charcoal-blue group-hover:text-signal-orange transition-colors line-clamp-1 leading-snug">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[12px] text-steel-gray">
                                                        <svg className="h-3 w-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="truncate">{event.location?.split('|')[0] || 'TBD'}</span>
                                                    </div>
                                                </div>

                                                {/* Inline stats */}
                                                <div className="hidden sm:flex items-center gap-6 shrink-0 mr-4">
                                                    <div className="w-20 text-right">
                                                        <div className="text-[10px] font-bold tracking-wider uppercase text-steel-gray">Sold</div>
                                                        <div className="text-sm font-bold text-charcoal-blue">
                                                            {event.sold} <span className="text-gray-300 font-normal text-xs">/ {event.capacity}</span>
                                                        </div>
                                                        <div className="mt-1 h-1 w-full bg-gray-100 overflow-hidden">
                                                            <div className="h-full bg-signal-orange transition-all duration-500" style={{ width: `${percentSold}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="w-24 text-right">
                                                        <div className="text-[10px] font-bold tracking-wider uppercase text-steel-gray">Revenue</div>
                                                        <div className="text-sm font-bold text-charcoal-blue">{formatCurrency(event.revenue)}</div>
                                                    </div>
                                                    <div className="w-12 text-right">
                                                        <div className="text-[10px] font-bold tracking-wider uppercase text-steel-gray">Fill</div>
                                                        <div className={`text-sm font-bold ${percentSold >= 90 ? 'text-signal-orange' : 'text-charcoal-blue'}`}>{percentSold}%</div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="shrink-0 flex items-center gap-2">
                                                    <Link
                                                        href={`/organizer/event/${event.id}`}
                                                        className="inline-flex items-center gap-1 bg-charcoal-blue px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-muted-teal"
                                                    >
                                                        Manage
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                    <Link
                                                        href={`/organizer/event/${event.id}/edit`}
                                                        className="inline-flex items-center border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-steel-gray transition-colors hover:border-signal-orange hover:text-signal-orange"
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer stats bar */}
                            <div className="flex items-center gap-6 px-5 py-3.5 border-t-2 border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-signal-orange" />
                                    <span className="text-[11px] text-steel-gray">{organizedEvents.filter(e => e.status === 'PUBLISHED').length} published</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-gray-300" />
                                    <span className="text-[11px] text-steel-gray">{organizedEvents.filter(e => e.status === 'ENDED').length} ended</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-charcoal-blue" />
                                    <span className="text-[11px] text-steel-gray">{totalTicketsSold} total tickets sold</span>
                                </div>
                            </div>

                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
