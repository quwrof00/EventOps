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
        <div className="min-h-screen bg-[#F0FDFA] font-sans text-steel-gray pt-16">

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
                    <div className="lg:col-span-3">

                        {/* Single unified bordered panel */}
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                            {/* Teal top accent */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />

                            {/* Toolbar — acts as panel header */}
                            <div className="flex items-center justify-between bg-gray-50 border-b-2 border-gray-100 px-5 py-3.5 mt-[3px] mb-5">
                                <span className="text-sm text-steel-gray">
                                    Showing <strong className="font-semibold text-charcoal-blue">{filteredEvents.length}</strong> results
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-steel-gray">Sort by:</label>
                                    <select className="bg-transparent text-sm font-medium text-charcoal-blue border-b border-gray-300 py-0.5 pl-1 pr-6 focus:border-muted-teal focus:outline-none cursor-pointer">
                                        <option>Most Popular</option>
                                        <option>Date: Soonest</option>
                                        <option>Newest Added</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cards — separate bordered cards inside the panel */}
                            {filteredEvents.length > 0 ? (
                                <div className="px-5 pb-5 space-y-3">
                                    {filteredEvents.map((event: any) => (
                                        <div
                                            key={event.id}
                                            className="group flex flex-row overflow-hidden bg-white border-2 border-gray-200 transition-all duration-200 hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            {/* Teal left accent bar */}
                                            <div className="w-1 shrink-0 bg-muted-teal transition-all group-hover:w-[5px]" />

                                            {/* Event Image */}
                                            <div className="h-48 w-full sm:h-auto sm:w-44 shrink-0 relative overflow-hidden bg-gray-100">
                                                {event.image && event.image !== '/placeholder-1.jpg' ? (
                                                    <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-medium tracking-wider text-gray-300 uppercase">
                                                        No Image
                                                    </div>
                                                )}

                                                {/* Featured Tag or Date Badge */}
                                                <div className="absolute top-0 left-0 border-b-2 border-muted-teal bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-charcoal-blue">
                                                    {event.category}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-1 flex-col justify-between p-5">
                                                <div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <h3 className="text-[17px] font-semibold text-charcoal-blue group-hover:text-muted-teal transition-colors line-clamp-1 leading-snug">
                                                            <Link href={`/event/${event.id}`}>{event.title}</Link>
                                                        </h3>
                                                        <span className="shrink-0 text-base font-bold text-charcoal-blue">
                                                            {event.isFree ? 'Free' : `$${event.price}`}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[13px] text-steel-gray">
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="h-3.5 w-3.5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="h-3.5 w-3.5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            {event.displayLocation}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                    <div className="text-[13px]">
                                                        {event.capacity > 0 && event.spotsLeft < 20 ? (
                                                            <span className="text-signal-orange font-medium flex items-center gap-1">
                                                                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Only {event.spotsLeft > 0 ? event.spotsLeft : 0} spots left
                                                            </span>
                                                        ) : (
                                                            <span className="text-steel-gray">{event.participants.length} attendees</span>
                                                        )}
                                                    </div>

                                                    <Link
                                                        href={`/event/${event.id}`}
                                                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-teal hover:text-charcoal-blue transition-colors"
                                                    >
                                                        View Details
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-16 text-center">
                                    <h3 className="text-base font-semibold text-charcoal-blue">No events found</h3>
                                    <p className="mt-1.5 text-sm text-steel-gray">Try adjusting your search or filters.</p>
                                    <Link href="/events" className="mt-4 inline-block text-sm font-semibold text-muted-teal hover:underline underline-offset-2">
                                        Clear all filters
                                    </Link>
                                </div>
                            )}

                            {/* Pagination (Simplified) */}
                            {filteredEvents.length > 5 && (
                                <div className="flex justify-center pt-6">
                                    <nav className="inline-flex items-center gap-1" aria-label="Pagination">
                                        <a href="#" className="flex items-center justify-center w-9 h-9 text-steel-gray hover:text-charcoal-blue hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                        <a href="#" aria-current="page" className="flex items-center justify-center w-9 h-9 bg-charcoal-blue text-sm font-semibold text-white">1</a>
                                        {/* <a href="#" className="flex items-center justify-center w-9 h-9 text-sm font-medium text-charcoal-blue hover:bg-white border border-transparent hover:border-gray-200 transition-all">2</a> */}
                                        <a href="#" className="flex items-center justify-center w-9 h-9 text-steel-gray hover:text-charcoal-blue hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                                            <span className="sr-only">Next</span>
                                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                            </svg>
                                        </a>
                                    </nav>
                                </div>
                            )}
                        </div>{/* end unified panel */}

                    </div>{/* end center column */}

                    {/* RIGHT COLUMN (Sidebar/Trending) - Span 1 */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Trending Widget */}
                            <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                                {/* Teal top accent */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                <div className="p-5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-charcoal-blue">Trending Now</p>
                                </div>
                                <ul className="space-y-0 divide-y divide-gray-100 p-0">
                                    {trendingEvents.length > 0 ? trendingEvents.map((item: any, i: number) => (
                                        <li key={i} className="group flex items-start gap-2.5 px-5 py-3.5 hover:bg-muted-teal/[0.03] transition-colors">
                                            <span className="text-[11px] font-bold text-muted-teal mt-0.5 w-3 shrink-0">{i + 1}</span>
                                            <div className="min-w-0">
                                                <div className="text-[13px] font-medium text-charcoal-blue group-hover:text-muted-teal truncate transition-colors leading-snug">
                                                    <Link href={`/event/${item.id}`}>{item.title}</Link>
                                                </div>
                                                <div className="text-[11px] text-steel-gray mt-0.5">{item.attendees} attendees</div>
                                            </div>
                                        </li>
                                    )) : (
                                        <li className="px-5 py-4 text-xs text-steel-gray">No trending events yet.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Newsletter / Promo */}
                            <div className="bg-charcoal-blue px-5 py-6 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] rounded-2xl">
                                <h3 className="text-[15px] font-semibold leading-snug">Stay Updated</h3>
                                <p className="mt-1.5 text-[13px] text-white/60 leading-relaxed">Get the latest tech events delivered to your inbox weekly.</p>
                                <div className="mt-4 space-y-2">
                                    <input
                                        type="email"
                                        placeholder="you@email.com"
                                        className="w-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-muted-teal focus:outline-none transition-colors"
                                    />
                                    <button className="w-full bg-muted-teal px-3 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-muted-teal border border-transparent hover:border-muted-teal">
                                        Subscribe
                                    </button>
                                </div>
                            </div>

                            {/* Featured Organizer */}
                            <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                                {/* Teal top accent */}
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                <div className="p-5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-charcoal-blue">Featured Organizer</p>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-charcoal-blue shrink-0 flex items-center justify-center text-[10px] font-bold text-white">SD</div>
                                        <div>
                                            <div className="text-[13px] font-semibold text-charcoal-blue">System Design Co.</div>
                                            <div className="text-[11px] text-steel-gray">12 events hosted</div>
                                        </div>
                                    </div>
                                    <button className="mt-3 w-full border-2 border-gray-200 bg-white py-2 text-[12px] font-semibold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all">
                                        Follow
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