import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import RegistrationModal from '@/components/RegistrationModal';
import TeamCodeDisplay from '@/components/TeamCodeDisplay';
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
    const fm = details.formatMeta ?? {};
    // Only use overview — never fall back to raw event.description (it may be JSON)
    const descriptionText = details.overview || '';

    const locationParts = event.location ? event.location.split('|') : [];
    const displayLocation = locationParts[0] || 'TBD';
    const coordinates = locationParts[1] || '';

    const soldCount = event.participants.length;
    const spotsLeft = event.capacity - soldCount;
    const isFree = event.isFree;
    const priceDisplay = isFree ? 'Free' : `$${event.price}`;

    const isRegistered = session?.user?.id
        ? event.participants.some((p: any) => p.id === session.user.id)
        : false;

    // Fetch user's team for this event (if registered + team format)
    const TEAM_FORMATS = ['Hackathon', 'Competition'];
    let userTeam: any = null;
    if (isRegistered && session?.user?.id && TEAM_FORMATS.includes(event.category)) {
        try {
            const ticket = await (await import('@/lib/prisma')).prisma.ticket.findFirst({
                where: { eventId: event.id, userId: session.user.id },
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
            } as any);
            userTeam = (ticket as any)?.teamMembership ?? null;
        } catch { /* ignore if model not yet available */ }
    }

    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = event.time || eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const organizerName = event.organizers[0]?.name || 'EventOps Organizer';
    const tags: string[] = event.tags ?? [];

    // Determine agenda/speakers tab labels based on category  
    const agendaLabel = event.category === 'Bootcamp' ? 'Curriculum' : 'Agenda';
    const speakersLabel = event.category === 'Webinar' ? 'Presenters' : event.category === 'Expo' ? 'Speakers' : 'Speakers';

    // Check if this format has extra details to show
    const hasFormatDetails = !!(
        fm.teamSizeMin || fm.prizePool || fm.submissionDeadline || fm.judgingCriteria ||
        fm.skillLevel || fm.prerequisites || fm.durationWeeks || fm.hasCertificate ||
        fm.meetingLink || fm.recordingAvailable !== undefined ||
        fm.isRecurring || fm.recurringSchedule
    );

    const teamSizeMax = fm.teamSizeMax ? parseInt(fm.teamSizeMax) : null;
    const allowSolo = fm.allowSolo || false;

    return (
        <div className="min-h-screen bg-[#E8F8F5] font-sans text-steel-gray selection:bg-muted-teal selection:text-white pt-16">

            {/* PAGE HEADER */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-[#ccf0ea]">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <Link href="/events" className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-steel-gray/50 hover:text-charcoal-blue transition-colors mb-5">
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Events
                    </Link>

                    <h1 className="text-3xl font-extrabold tracking-tight text-charcoal-blue leading-tight lg:text-4xl">
                        {event.title}
                    </h1>
                    {event.tagline && (
                        <p className="mt-2 text-lg text-steel-gray font-medium">{event.tagline}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 my-3">
                        <span className="inline-block border border-muted-teal/40 bg-muted-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-teal">
                            {event.category}
                        </span>
                        {spotsLeft < 20 && spotsLeft > 0 && (
                            <span className="inline-block bg-signal-orange/10 border border-signal-orange/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-signal-orange">
                                Only {spotsLeft} spots left
                            </span>
                        )}
                        {tags.map((tag: string) => (
                            <span key={tag} className="inline-block border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-steel-gray">
                                {tag}
                            </span>
                        ))}
                    </div>


                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 items-start">

                    {/* MAIN CONTENT */}
                    <div className="lg:col-span-2 lg:pr-2 pb-10">

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
                        <div className="sticky top-0 z-20 -mx-6 mb-10 border-b-2 border-soft-slate bg-[#E8F8F5]/95 px-6 backdrop-blur-md">
                            <nav className="-mb-px flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                                <a href="#overview" className="border-b-4 border-muted-teal py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-muted-teal whitespace-nowrap">Overview</a>
                                {hasFormatDetails && (
                                    <a href="#format-details" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                        {event.category} Info
                                    </a>
                                )}
                                {details.agenda.length > 0 && (
                                    <a href="#agenda" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                        {agendaLabel}
                                    </a>
                                )}
                                {details.speakers.length > 0 && (
                                    <a href="#speakers" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                        {speakersLabel}
                                    </a>
                                )}
                                <a href="#venue" className="border-b-4 border-transparent py-4 px-1 mr-8 text-xs font-bold uppercase tracking-widest text-steel-gray hover:border-gray-300 hover:text-charcoal-blue whitespace-nowrap transition-colors">
                                    Venue & Info
                                </a>
                            </nav>
                        </div>

                        <div className="space-y-16">

                            {/* OVERVIEW — always shown; placeholder if organiser left it blank */}
                            <section id="overview" className="scroll-mt-36">
                                <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                    <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">About this Event</h3>
                                    </div>
                                    <div className="px-6 py-6">
                                        {descriptionText ? (
                                            <p className="text-base leading-relaxed text-steel-gray whitespace-pre-line">{descriptionText}</p>
                                        ) : (
                                            <p className="text-sm italic text-steel-gray/50">No description provided by the organizer.</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* FORMAT-SPECIFIC DETAILS SECTION */}
                            {hasFormatDetails && (
                                <section id="format-details" className="scroll-mt-36">
                                    <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-signal-orange" />
                                        <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px] flex items-center gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">{event.category} Details</h3>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-2.5 py-1">{event.category}</span>
                                        </div>
                                        <div className="divide-y divide-gray-100">

                                            {/* Hackathon / Competition */}
                                            {(fm.teamSizeMin || fm.teamSizeMax) && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-signal-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Team Size</h4>
                                                        <p className="text-sm text-steel-gray mt-0.5">
                                                            {fm.teamSizeMin && fm.teamSizeMax
                                                                ? `${fm.teamSizeMin}–${fm.teamSizeMax} members per team`
                                                                : fm.teamSizeMin ? `Min ${fm.teamSizeMin} members` : `Max ${fm.teamSizeMax} members`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {fm.prizePool && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-signal-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Prize Pool</h4>
                                                        <p className="text-sm text-steel-gray mt-0.5">{fm.prizePool}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {fm.submissionDeadline && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-signal-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Submission Deadline</h4>
                                                        <p className="text-sm text-steel-gray mt-0.5">
                                                            {new Date(fm.submissionDeadline).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {fm.judgingCriteria && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-signal-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Judging Criteria</h4>
                                                        <p className="text-sm text-steel-gray mt-0.5 whitespace-pre-line">{fm.judgingCriteria}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Workshop / Bootcamp */}
                                            {fm.skillLevel && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-muted-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Skill Level</h4>
                                                        <span className="inline-block mt-1 px-3 py-1 bg-muted-teal/10 border border-muted-teal/30 text-xs font-bold text-muted-teal">{fm.skillLevel}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {fm.prerequisites && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-muted-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Prerequisites</h4>
                                                        <p className="text-sm text-steel-gray mt-0.5 whitespace-pre-line">{fm.prerequisites}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {fm.durationWeeks && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-muted-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Duration</h4>
                                                        <p className="text-sm text-steel-gray mt-0.5">{fm.durationWeeks} week{Number(fm.durationWeeks) !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {(fm.materialsProvided !== undefined || fm.hasCertificate !== undefined) && (
                                                <div className="px-6 py-4 flex flex-wrap gap-3">
                                                    {fm.materialsProvided && (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-muted-teal/10 border border-muted-teal/30 text-muted-teal px-3 py-2">
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                            Materials Included
                                                        </span>
                                                    )}
                                                    {fm.hasCertificate && (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-muted-teal/10 border border-muted-teal/30 text-muted-teal px-3 py-2">
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                                            Certificate of Completion
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Webinar */}
                                            {fm.meetingLink && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-charcoal-blue/5 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-charcoal-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Meeting Link</h4>
                                                        <p className="text-xs text-steel-gray mt-0.5">Shared with registered attendees only</p>
                                                        {isRegistered && (
                                                            <a href={fm.meetingLink} target="_blank" rel="noopener noreferrer"
                                                                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-muted-teal hover:text-charcoal-blue transition-colors">
                                                                Join Meeting →
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {fm.recordingAvailable && (
                                                <div className="px-6 py-4 flex items-center gap-3">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold bg-muted-teal/10 border border-muted-teal/30 text-muted-teal px-3 py-2">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                        Recording Will Be Available
                                                    </span>
                                                </div>
                                            )}

                                            {/* Meetup */}
                                            {fm.isRecurring && (
                                                <div className="px-6 py-4 flex items-start gap-4">
                                                    <div className="w-8 h-8 bg-charcoal-blue/5 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="h-4 w-4 text-charcoal-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-charcoal-blue">Recurring Meetup</h4>
                                                        {fm.recurringSchedule && <p className="text-sm text-steel-gray mt-0.5">{fm.recurringSchedule}</p>}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* AGENDA */}
                            {details.agenda.length > 0 && (
                                <section id="agenda" className="scroll-mt-36">
                                    <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                        <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">{agendaLabel}</h3>
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
                                                        {item.description && <p className="mt-1.5 text-sm text-steel-gray">{item.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SPEAKERS */}
                            {details.speakers.length > 0 && (
                                <section id="speakers" className="scroll-mt-36">
                                    <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                        <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">{speakersLabel}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                            {details.speakers.map((speaker, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-5 hover:bg-muted-teal/[0.03] transition-colors">
                                                    <div className="w-14 h-14 bg-soft-slate border-2 border-gray-200 overflow-hidden shrink-0">
                                                        {speaker.avatar ? (
                                                            <img src={speaker.avatar} alt={speaker.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-steel-gray/30">
                                                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-charcoal-blue">{speaker.name}</h4>
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-teal mt-0.5">{speaker.role}</p>
                                                        {speaker.company && <p className="text-sm text-steel-gray">{speaker.company}</p>}
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
                                <div className="bg-white border-2 border-gray-200 relative overflow-hidden mb-6 transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />
                                    <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">Venue & Location</h3>
                                    </div>
                                    <div className="w-full bg-soft-slate/50 border-b-2 border-gray-100">
                                        {fm.isRemote ? (
                                            <div className="aspect-video flex flex-col items-center justify-center text-steel-gray bg-[#E8F8F5] border-b-2 border-gray-100">
                                                <svg className="h-12 w-12 text-muted-teal mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                                <span className="font-bold tracking-wider text-charcoal-blue">Online Event</span>
                                                <span className="text-xs text-steel-gray/60 mt-1">Links shared with attendees</span>
                                            </div>
                                        ) : coordinates ? (
                                            <EventMap value={coordinates} readOnly={true} />
                                        ) : (
                                            <div className="aspect-video flex items-center justify-center text-sm text-steel-gray/40 font-medium">
                                                No map coordinates available
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-6 py-4">
                                        <h4 className="font-bold text-charcoal-blue">{fm.isRemote ? 'Remote / Online' : displayLocation}</h4>
                                    </div>
                                </div>

                                {/* Capacity stats */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-white border-2 border-gray-200 px-4 py-4 text-center">
                                        <span className="block text-2xl font-black text-charcoal-blue">{event.capacity}</span>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-steel-gray mt-1">Capacity</span>
                                    </div>
                                    <div className="bg-white border-2 border-gray-200 px-4 py-4 text-center">
                                        <span className="block text-2xl font-black text-muted-teal">{soldCount}</span>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-steel-gray mt-1">Registered</span>
                                    </div>
                                    <div className={`border-2 px-4 py-4 text-center ${spotsLeft <= 0 ? 'bg-signal-orange/10 border-signal-orange/30' : spotsLeft < 20 ? 'bg-signal-orange/10 border-signal-orange/30' : 'bg-white border-gray-200'}`}>
                                        <span className={`block text-2xl font-black ${spotsLeft <= 0 || spotsLeft < 20 ? 'text-signal-orange' : 'text-charcoal-blue'}`}>{Math.max(0, spotsLeft)}</span>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-steel-gray mt-1">Remaining</span>
                                    </div>
                                </div>

                                {details.policies && (
                                    <div className="bg-white border-2 border-gray-200 border-l-4 border-l-muted-teal px-6 py-5">
                                        <p className="text-xs font-bold uppercase tracking-widest text-charcoal-blue mb-3">Policies & Additional Info</p>
                                        <p className="text-sm text-steel-gray leading-relaxed whitespace-pre-line">{details.policies}</p>
                                    </div>
                                )}
                            </section>

                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="lg:sticky lg:top-24 space-y-6 self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 pb-8 custom-scrollbar">

                        {/* REGISTRATION CARD */}
                        <div className="border-2 border-gray-200 bg-white relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[6px_6px_0px_0px_rgba(31,42,55,1)]">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-teal" />

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

                            <div className="px-7 py-5 border-b-2 border-gray-100">
                                <RegistrationModal
                                    eventId={event.id}
                                    isFull={spotsLeft <= 0}
                                    isRegistered={isRegistered}
                                    hasTeam={!!userTeam}
                                    eventCategory={event.category}
                                    eventTitle={event.title}
                                    isFree={isFree}
                                    price={event.price}
                                    teamSizeMax={teamSizeMax}
                                    allowSolo={allowSolo}
                                />
                            </div>

                            <div className="divide-y divide-gray-100">
                                <div className="flex items-start gap-3 px-7 py-5">
                                    <svg className="mt-0.5 h-5 w-5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-charcoal-blue">Date & Time</h4>
                                        <p className="text-sm text-steel-gray mt-1">{dateStr}</p>
                                        <p className="text-sm text-steel-gray">{timeStr}</p>
                                        <a href="#" className="mt-1.5 block text-sm font-semibold text-muted-teal hover:text-charcoal-blue transition-colors">Add to Calendar</a>
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
                                        <a href="#venue" className="mt-1.5 block text-sm font-semibold text-muted-teal hover:text-charcoal-blue transition-colors">View Map</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 px-7 py-5">
                                    <svg className="mt-0.5 h-5 w-5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-bold text-charcoal-blue">Organizer</h4>
                                        <p className="text-sm text-steel-gray mt-1">{organizerName}</p>
                                        <a href="#" className="mt-1.5 block text-sm font-semibold text-muted-teal hover:text-charcoal-blue transition-colors">Contact</a>
                                    </div>
                                </div>

                                {/* Tags in sidebar */}
                                {tags.length > 0 && (
                                    <div className="px-7 py-5">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue mb-3">Topics</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {tags.map((tag: string) => (
                                                <span key={tag} className="px-2.5 py-1 border-2 border-gray-100 text-[11px] font-bold text-steel-gray bg-gray-50">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FORMAT-SPECIFIC QUICK FACTS in sidebar */}
                        {(fm.skillLevel || fm.prizePool || fm.teamSizeMin || fm.meetingLink || fm.isRecurring || fm.hasCertificate) && (
                            <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-signal-orange" />
                                <div className="px-5 py-3.5 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal-blue">Quick Facts</h4>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    {fm.skillLevel && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-steel-gray font-medium">Level</span>
                                            <span className="font-bold text-charcoal-blue">{fm.skillLevel}</span>
                                        </div>
                                    )}
                                    {(fm.teamSizeMin || fm.teamSizeMax) && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-steel-gray font-medium">Team Size</span>
                                            <span className="font-bold text-charcoal-blue text-right">
                                                {fm.teamSizeMin && fm.teamSizeMax ? `${fm.teamSizeMin}–${fm.teamSizeMax}` : fm.teamSizeMin || fm.teamSizeMax}
                                                {fm.allowSolo && <span className="block text-[10px] text-muted-teal/80">Solo allowed</span>}
                                            </span>
                                        </div>
                                    )}
                                    {fm.prizePool && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-steel-gray font-medium">Prizes</span>
                                            <span className="font-bold text-signal-orange">{fm.prizePool.split('—')[0].trim()}</span>
                                        </div>
                                    )}
                                    {fm.durationWeeks && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-steel-gray font-medium">Duration</span>
                                            <span className="font-bold text-charcoal-blue">{fm.durationWeeks} weeks</span>
                                        </div>
                                    )}
                                    {fm.hasCertificate && (
                                        <div className="flex items-center gap-2 text-sm text-muted-teal font-bold">
                                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Certificate of Completion
                                        </div>
                                    )}
                                    {fm.recordingAvailable && (
                                        <div className="flex items-center gap-2 text-sm text-muted-teal font-bold">
                                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Recording Available
                                        </div>
                                    )}
                                    {fm.isRecurring && (
                                        <div className="flex items-center gap-2 text-sm text-charcoal-blue font-bold">
                                            <svg className="h-4 w-4 shrink-0 text-steel-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Recurring Event
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TEAM CODE CARD — shown to leader at all times */}
                        {userTeam && (
                            <div className="border-2 border-charcoal-blue bg-charcoal-blue relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-signal-orange" />
                                <div className="px-5 py-3.5 border-b-2 border-white/10 mt-[3px]">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">Your Team</h4>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    <div>
                                        <p className="text-[11px] text-white/50 mb-0.5">Team Name</p>
                                        <p className="text-base font-black text-white">{userTeam.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-white/50 mb-1">Members ({userTeam.members.length}{teamSizeMax ? `/${teamSizeMax}` : ''})</p>
                                        <div className="space-y-1">
                                            {userTeam.members.map((m: any) => (
                                                <div key={m.user.id} className="flex items-center gap-2 text-xs text-white/80">
                                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.user.id === userTeam.leaderId ? 'bg-signal-orange' : 'bg-muted-teal'}`} />
                                                    {m.user.name || 'Anonymous'}
                                                    {m.user.id === userTeam.leaderId && <span className="text-[9px] font-bold text-signal-orange ml-1">LEADER</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {session?.user?.id === userTeam.leaderId && (
                                        <div className="bg-white/5 border-2 border-white/10 px-4 py-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Team Code — Share to invite</p>
                                            <TeamCodeDisplay code={userTeam.code} />
                                        </div>
                                    )}
                                    {session?.user?.id !== userTeam.leaderId && (
                                        <p className="text-xs text-white/50 bg-white/5 border border-white/10 px-3 py-2">
                                            Ask your team leader for the join code.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* POLICIES CARD */}
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:border-charcoal-blue hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
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