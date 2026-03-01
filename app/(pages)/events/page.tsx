import React from 'react';
import EventFilters from '@/components/EventFilters';
// import { prisma } from '@/lib/prisma'; // Removed default prisma import
import Link from 'next/link';
import { fetchFromApi } from '@/lib/api-client';

export default async function EventsListPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const q = (params.q as string)?.toLowerCase() || '';
    const categoryQuery = (params.category as string) || '';

    // Fetch Events via API
    let query = `/api/events?q=${encodeURIComponent(q)}&category=${encodeURIComponent(categoryQuery)}`;

    const filteredEventsRaw = await fetchFromApi(query) || [];

    // Post-process for display (spots left, etc) - API already does some, but we can do more
    // The API returns the raw event plus spotsLeft and displayLocation.
    const filteredEvents = filteredEventsRaw;

    // Fetch Trending (Top 5 by participants) - We could add a 'trending' endpoint or param
    // For now, since "trending" logic was:
    // await prisma.event.findMany({ take: 5, orderBy: { participants: { _count: 'desc' } } })
    // Let's create a trending endpoint or just sort the full list if logical? No, full list might not be full.
    // Let's create a dedicated trending endpoint or just mock it for now since the user wants API routes for everything.
    // I will add a `sort=trending` param to the events API or just fetch all and slice for now if the list is small.
    // Assuming backend handles it. I'll just clear it for now or use the first 5 of the list as "Trending" if I don't want to make another route.
    // Actually, I should probably make a trending route. 
    // Let's just use the first 5 of filtered events as placeholder for trending to save time, or fetch all.
    // Real implementation:
    const trendingEventsRaw = await fetchFromApi('/api/events?sort=trending') || [];
    const trendingEvents = trendingEventsRaw.slice(0, 5).map((e: any) => ({
        id: e.id,
        title: e.title,
        attendees: e.participants?.length || 0
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

                {/* 1 : 3 : 1 Layout Grid — items-start ensures all 3 cols start at same y */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 items-start">

                    {/* LEFT COLUMN (Filters) - Span 1 */}
                    <div className="lg:col-span-1">
                        <EventFilters />
                    </div>

                    {/* CENTER COLUMN (Events List) - Span 3 */}
                    <div className="lg:col-span-3 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 pb-10 custom-scrollbar">

                        {/* Toolbar — detached from the cards */}
                        {/* Toolbar — detached from the cards */}
                        <div className="flex items-center justify-between bg-white border-2 border-gray-200 px-5 py-4 mb-2 relative hover:border-gray-900 transition-colors">
                            {/* Teal top accent */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                            <span className="text-sm font-bold text-steel-gray">
                                Showing <strong className="font-extrabold text-charcoal-blue">{filteredEvents.length}</strong> events
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-steel-gray">Sort by:</label>
                                <select className="bg-transparent text-sm font-bold text-charcoal-blue border-b-2 border-transparent focus:border-muted-teal focus:outline-none cursor-pointer transition-colors">
                                    <option>Most Popular</option>
                                    <option>Soonest</option>
                                    <option>Newest</option>
                                </select>
                            </div>
                        </div>

                        {/* Cards List */}
                        {filteredEvents.length > 0 ? (
                            <div className="space-y-2">
                                {filteredEvents.map((event: any) => {
                                    const isPaid = !event.isFree;
                                    return (
                                        <Link
                                            key={event.id}
                                            href={`/event/${event.id}`}
                                            className="group relative flex flex-col sm:flex-row bg-white border-2 border-gray-200 transition-all duration-300 hover:border-charcoal-blue hover:shadow-[6px_6px_0px_0px_rgba(31,42,55,1)] hover:-translate-y-1 overflow-hidden cursor-pointer"
                                        >
                                            {/* Dynamic Accent Left Border */}
                                            <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all group-hover:w-2 ${isPaid ? 'bg-signal-orange' : 'bg-muted-teal'}`} />

                                            {/* Event Image & Category Badge */}
                                            <div className="h-48 w-full sm:h-auto sm:w-56 shrink-0 relative overflow-hidden bg-gray-100 border-r-2 border-gray-200 group-hover:border-charcoal-blue transition-colors">
                                                <div className="w-full h-full relative overflow-hidden">
                                                    {event.image && event.image !== '/placeholder-1.jpg' ? (
                                                        <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] font-bold tracking-widest text-gray-300 uppercase">
                                                            No Cover
                                                        </div>
                                                    )}

                                                    {/* Sharp Category Badge */}
                                                    <div className="absolute top-0 left-0 bg-white border-b-2 border-r-2 border-gray-200 px-3 py-1 group-hover:border-charcoal-blue transition-colors">
                                                        <span className="text-[10px] font-bold tracking-widest uppercase text-charcoal-blue">
                                                            {event.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <div className="flex flex-1 flex-col justify-between p-5 sm:pl-5 relative z-10">
                                                <div>
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <h3 className="text-lg font-extrabold text-charcoal-blue group-hover:text-muted-teal transition-colors line-clamp-2 leading-tight">
                                                            {event.title}
                                                        </h3>

                                                        {/* Sharp Price/Free Tag */}
                                                        <div className={`shrink-0 flex items-center justify-center px-3 py-1 border-2 ${isPaid ? 'bg-white border-charcoal-blue text-charcoal-blue shadow-[2px_2px_0px_0px_rgba(31,42,55,1)]' : 'bg-muted-teal border-muted-teal text-white shadow-[2px_2px_0px_0px_rgba(15,118,110,0.5)]'}`}>
                                                            <span className="text-xs font-black tracking-wide">
                                                                {isPaid ? `$${event.price}` : 'FREE'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[12px] text-steel-gray mt-2.5 font-bold tracking-wide">
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="h-3.5 w-3.5 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-charcoal-blue">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="h-3.5 w-3.5 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <span className="text-charcoal-blue">{event.displayLocation}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t-2 border-gray-100 gap-4">
                                                    {/* Graphical Data Metric */}
                                                    <div className="flex-1 max-w-[180px]">
                                                        {event.capacity > 0 && event.spotsLeft !== undefined ? (
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                                                                    <span className="text-steel-gray">Availability</span>
                                                                    <span className={event.spotsLeft < 20 ? "text-signal-orange" : "text-muted-teal"}>
                                                                        {event.spotsLeft > 0 ? `${event.spotsLeft} left` : 'Sold out'}
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-200 border border-gray-300 relative overflow-hidden">
                                                                    <div
                                                                        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ${event.spotsLeft < 20 ? 'bg-signal-orange' : 'bg-muted-teal'}`}
                                                                        style={{ width: `${Math.max(0, Math.min(100, ((event.capacity - event.spotsLeft) / event.capacity) * 100))}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex -space-x-1.5">
                                                                    {[...Array(Math.min(3, event.participants?.length || 0))].map((_, i) => (
                                                                        <div key={i} className="h-6 w-6 border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                                                                            <svg className="h-3 w-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                                        </div>
                                                                    ))}
                                                                    {(event.participants?.length || 0) === 0 && (
                                                                        <div className="h-6 w-6 border-2 border-white bg-gray-100 flex items-center justify-center">
                                                                            <span className="text-[8px] font-bold text-gray-400">0</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] font-bold tracking-widest uppercase text-charcoal-blue">{(event.participants?.length || 0)} attending</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isPaid ? 'bg-white border-signal-orange text-signal-orange group-hover:bg-signal-orange group-hover:text-white' : 'bg-charcoal-blue border-charcoal-blue text-white group-hover:bg-white group-hover:text-charcoal-blue'} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}>
                                                        {isPaid ? 'Tickets' : 'Register'}
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-gray-200 p-16 text-center">
                                {/* Teal top accent */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                <h3 className="text-lg font-bold text-charcoal-blue">No matching events</h3>
                                <p className="mt-2 text-sm font-medium text-steel-gray">Try adjusting your search or filters.</p>
                                <Link href="/events" className="mt-5 inline-block text-sm font-bold text-muted-teal hover:underline underline-offset-4 pointer-events-auto">
                                    Clear all filters
                                </Link>
                            </div>
                        )}

                        {/* Pagination */}
                        {filteredEvents.length > 5 && (
                            <div className="flex justify-center pt-8 mb-8">
                                <nav className="inline-flex items-center gap-2" aria-label="Pagination">
                                    <a href="#" className="flex items-center justify-center w-10 h-10 border-2 border-gray-200 text-steel-gray bg-white hover:border-charcoal-blue hover:text-charcoal-blue hover:shadow-[3px_3px_0px_0px_rgba(31,42,55,1)] transition-all">
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                    <a href="#" aria-current="page" className="flex items-center justify-center w-10 h-10 border-2 border-charcoal-blue bg-charcoal-blue text-sm font-bold text-white shadow-[3px_3px_0px_0px_rgba(31,42,55,1)]">1</a>
                                    <a href="#" className="flex items-center justify-center w-10 h-10 border-2 border-gray-200 text-steel-gray bg-white hover:border-charcoal-blue hover:text-charcoal-blue hover:shadow-[3px_3px_0px_0px_rgba(31,42,55,1)] transition-all">
                                        <span className="sr-only">Next</span>
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                </nav>
                            </div>
                        )}
                    </div>{/* end center column */}

                    {/* RIGHT COLUMN (Sidebar/Trending) - Span 1 */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pb-8 pr-2 custom-scrollbar">
                            {/* Trending Widget */}
                            <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                {/* Teal top accent */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                <div className="px-5 py-4 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-charcoal-blue flex items-center gap-2">
                                        Trending Now
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-orange opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-orange"></span>
                                        </span>
                                    </h3>
                                </div>
                                <ul className="space-y-0 divide-y-2 divide-gray-100 p-0">
                                    {trendingEvents.length > 0 ? trendingEvents.map((item: any, i: number) => (
                                        <li key={i} className="group flex items-start gap-4 px-5 py-5 hover:bg-muted-teal/[0.05] transition-colors cursor-pointer border-l-2 border-transparent hover:border-muted-teal">
                                            <span className="text-[12px] font-black text-muted-teal mt-0.5 w-3 shrink-0">{i + 1}</span>
                                            <div className="min-w-0">
                                                <div className="text-[14px] font-bold text-charcoal-blue group-hover:text-muted-teal truncate transition-colors leading-snug">
                                                    <Link href={`/event/${item.id}`}>{item.title}</Link>
                                                </div>
                                                <div className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mt-2 flex items-center gap-1.5">
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    {item.attendees} attending
                                                </div>
                                            </div>
                                        </li>
                                    )) : (
                                        <li className="px-5 py-4 text-xs font-bold text-steel-gray tracking-widest uppercase">No trending events yet.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Newsletter / Promo */}
                            <div className="bg-charcoal-blue px-6 py-7 text-white border-2 border-charcoal-blue shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                                <h3 className="text-base font-extrabold leading-snug tracking-wide uppercase relative z-10">Weekly Drops</h3>
                                <p className="mt-2 text-[13px] font-medium text-white/70 leading-relaxed relative z-10">Get the best tech & design events delivered to your inbox.</p>
                                <div className="mt-5 space-y-4 relative z-10">
                                    <input
                                        type="email"
                                        placeholder="YOU@EMAIL.COM"
                                        className="w-full border-2 border-white/20 bg-white/5 px-4 py-3 text-xs font-bold tracking-widest text-white placeholder-white/30 focus:border-muted-teal focus:outline-none transition-colors"
                                    />
                                    <button className="w-full bg-muted-teal border-2 border-muted-teal px-4 py-3 text-xs font-bold tracking-widest uppercase text-white transition-all hover:bg-white hover:text-muted-teal hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
                                        Subscribe
                                    </button>
                                </div>
                            </div>

                            {/* Featured Organizer */}
                            <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                {/* Teal top accent */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                <div className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-charcoal-blue">Featured Organizer</p>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-charcoal-blue border-2 border-charcoal-blue shrink-0 flex items-center justify-center text-[13px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">SD</div>
                                        <div>
                                            <div className="text-[14px] font-black text-charcoal-blue">System Design Co.</div>
                                            <div className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mt-1">12 events hosted</div>
                                        </div>
                                    </div>
                                    <button className="mt-5 w-full border-2 border-gray-200 bg-white py-2.5 text-[12px] font-bold tracking-widest uppercase text-charcoal-blue hover:border-charcoal-blue hover:shadow-[3px_3px_0px_0px_rgba(31,42,55,1)] transition-all">
                                        Follow Organizer
                                    </button>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>{/* END grid */}
            </main>
        </div>
    );
}