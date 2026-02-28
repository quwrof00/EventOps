import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import RegisterButton from '@/components/RegisterButton';
import EventMap from '@/components/EventMap';
import { fetchFromApi } from '@/lib/api-client';
import { unpackEventDescription } from '@/lib/event-details';

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;
    const session = await getServerSession(getAuthOptions());

    const event = await fetchFromApi(`/api/events/${eventId}`);

    if (!event) {
        notFound();
    }

    const details = unpackEventDescription(event.description);
    // Use unpacked overview for the main description display if available
    const descriptionText = details.overview || event.description || '';

    // Process data
    const locationParts = event.location ? event.location.split('|') : [];
    const displayLocation = locationParts[0] || 'TBD';
    const coordinates = locationParts[1] || ''; // "lat,lng"

    const soldCount = event.participants.length;
    const spotsLeft = event.capacity - soldCount;
    const isFree = event.isFree;
    const priceDisplay = isFree ? 'Free' : `$${event.price}`;

    // Check if registered
    const isRegistered = session?.user?.id ? event.participants.some(p => p.id === session.user.id) : false;

    // Date Formatting
    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const organizerName = event.organizers[0]?.name || 'EventOps Organizer';

    return (
        <div className="min-h-screen bg-[#F0FDFA] font-sans text-steel-gray selection:bg-muted-teal selection:text-white pt-16">

            {/* PAGE HEADER */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-[#ccf0ea]">
                <div className="mx-auto max-w-7xl px-6 py-8">

                    <Link href="/events" className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-steel-gray/50 hover:text-charcoal-blue transition-colors mb-5">
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Events
                    </Link>

                    {/* Category + urgency */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block border border-muted-teal/40 bg-muted-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-teal">
                            {event.category}
                        </span>
                        {spotsLeft < 20 && spotsLeft > 0 && (
                            <span className="inline-block bg-signal-orange/10 border border-signal-orange/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-signal-orange">
                                Only {spotsLeft} spots left
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-charcoal-blue leading-tight lg:text-4xl">
                        {event.title}
                    </h1>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 items-start">

                    {/* MAIN CONTENT*/}
                    <div className="lg:col-span-2">

                        {/* Hero Image */}
                        <div className="mb-8 aspect-video w-full overflow-hidden border-2 border-gray-200 bg-soft-slate relative">
                            {event.image && event.image !== '/placeholder-1.jpg' ? (
                                <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase tracking-widest text-steel-gray/40">
                                    Event Cover Image
                                </div>
                            )}
                        </div>

                        {/* Sticky Tab Nav */}
                        <div className="sticky top-16 z-10 -mx-6 mb-10 border-b-2 border-soft-slate bg-off-white/95 px-6 backdrop-blur-md">
                            <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                                <a href="#overview" className="border-b-4 border-muted-teal py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-muted-teal whitespace-nowrap">
                                    Overview
                                </a>
                                {details.agenda.length > 0 && (
                                    <a href="#agenda" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                        Agenda
                                    </a>
                                )}
                                {details.speakers.length > 0 && (
                                    <a href="#speakers" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                        Speakers
                                    </a>
                                )}
                                <a href="#venue" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                    Venue & Info
                                </a>
                            </nav>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-16">

                            {/* OVERVIEW */}
                            <section id="overview" className="scroll-mt-36">
                                <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                    <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">About this Event</h3>
                                    </div>
                                    <div className="px-6 py-6">
                                        <p className="text-base leading-relaxed text-steel-gray whitespace-pre-line">
                                            {descriptionText}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {details.agenda.length > 0 && (
                                <section id="agenda" className="scroll-mt-36">
                                    <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                        <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">Event Agenda</h3>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {details.agenda.map((item, idx) => (
                                                <div key={idx} className="group flex gap-5 p-5 hover:bg-muted-teal/[0.03] transition-colors">
                                                    <div className="w-1 shrink-0 bg-muted-teal" />
                                                    <div className="w-20 shrink-0 pt-0.5">
                                                        <span className="text-xs font-bold text-muted-teal">{item.time}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-base font-bold text-charcoal-blue">{item.title}</h4>
                                                        {item.description && (
                                                            <p className="mt-1.5 text-sm text-steel-gray">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {details.speakers.length > 0 && (
                                <section id="speakers" className="scroll-mt-36">
                                    <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                        <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">Speakers</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                            {details.speakers.map((speaker, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-5 hover:bg-muted-teal/[0.03] transition-colors">
                                                    <div className="w-14 h-14 bg-soft-slate border-2 border-gray-200 overflow-hidden shrink-0">
                                                        {speaker.avatar ? (
                                                            <img src={speaker.avatar} alt={speaker.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-steel-gray/30">
                                                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-charcoal-blue">{speaker.name}</h4>
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-teal mt-0.5">{speaker.role}</p>
                                                        {speaker.company && (
                                                            <p className="text-sm text-steel-gray">{speaker.company}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* VENUE */}
                            <section id="venue" className="scroll-mt-36">
                                <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-steel-gray border-l-4 border-muted-teal pl-4">
                                    Venue & Location
                                </h3>

                                <div className="bg-white border-2 border-gray-200 relative overflow-hidden mb-6">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                    <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">Venue &amp; Location</h3>
                                    </div>
                                    <div className="w-full bg-soft-slate/50 border-b-2 border-gray-100">
                                        {coordinates ? (
                                            <EventMap value={coordinates} readOnly={true} />
                                        ) : (
                                            <div className="aspect-video flex items-center justify-center text-sm text-steel-gray/40 font-medium">
                                                No map coordinates available
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-6 py-4">
                                        <h4 className="font-bold text-charcoal-blue">{displayLocation}</h4>
                                    </div>
                                </div>

                                {details.policies && (
                                    <div className="bg-white border-2 border-gray-200 border-l-4 border-l-muted-teal px-6 py-5">
                                        <p className="text-xs font-bold uppercase tracking-widest text-charcoal-blue mb-3">Policies &amp; Additional Info</p>
                                        <p className="text-sm text-steel-gray leading-relaxed whitespace-pre-line">{details.policies}</p>
                                    </div>
                                )}
                            </section>

                        </div>
                    </div>

                    {/* SIDEBAR  */}
                    <div className="sticky top-28 space-y-6 self-start">

                        {/* REGISTRATION CARD */}
                        <div className="border-2 border-gray-200 bg-white relative overflow-hidden transition hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.08)]">
                            {/* Teal top accent */}
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />

                            {/* Price header */}
                            <div className="border-b-2 border-gray-100 bg-gray-50 px-7 py-6 mt-[3px]">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-4xl font-black text-charcoal-blue">{priceDisplay}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-steel-gray">per attendee</span>
                                </div>
                                <p className={`mt-2 text-xs font-semibold ${spotsLeft <= 0 ? 'text-signal-orange' : spotsLeft < 20 ? 'text-signal-orange' : 'text-muted-teal'}`}>
                                    {spotsLeft > 0
                                        ? spotsLeft < 20
                                            ? `⚠ Only ${spotsLeft} spots remaining`
                                            : `${spotsLeft} spots available`
                                        : 'This event is full'
                                    }
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="px-7 py-5 border-b-2 border-gray-100">
                                <RegisterButton
                                    eventId={event.id}
                                    isFull={spotsLeft <= 0}
                                    isRegistered={isRegistered}
                                />
                            </div>

                            {/* Info rows */}
                            <div className="divide-y divide-gray-100">

                                <div className="flex items-start gap-3 px-7 py-5">
                                    <svg className="mt-0.5 h-5 w-5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-charcoal-blue">Date & Time</h4>
                                        <p className="text-sm text-steel-gray mt-1">{dateStr}</p>
                                        <p className="text-sm text-steel-gray">{timeStr}</p>
                                        <a href="#" className="mt-1.5 block text-sm font-semibold text-muted-teal hover:text-charcoal-blue transition-colors">
                                            Add to Calendar
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-7 py-5">
                                    <svg className="mt-0.5 h-5 w-5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-charcoal-blue">Location</h4>
                                        <p className="text-sm text-steel-gray mt-1">{displayLocation}</p>
                                        <a href="#venue" className="mt-1.5 block text-sm font-semibold text-muted-teal hover:text-charcoal-blue transition-colors">
                                            View Map
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-7 py-5">
                                    <svg className="mt-0.5 h-5 w-5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-charcoal-blue">Organizer</h4>
                                        <p className="text-sm text-steel-gray mt-1">{organizerName}</p>
                                        <a href="#" className="mt-1.5 block text-sm font-semibold text-muted-teal hover:text-charcoal-blue transition-colors">
                                            Contact
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* POLICIES CARD */}
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                            <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">Event Policies</h4>
                            </div>
                            <ul className="space-y-2.5 px-6 py-5">
                                <li className="flex items-center gap-2.5 text-sm text-steel-gray">
                                    <span className="h-1.5 w-1.5 bg-muted-teal shrink-0" />
                                    Non-refundable tickets
                                </li>
                                <li className="flex items-center gap-2.5 text-sm text-steel-gray">
                                    <span className="h-1.5 w-1.5 bg-muted-teal shrink-0" />
                                    Code of Conduct applies
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}