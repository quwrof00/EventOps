import CursorHighlight from '@/components/CursorHighlight';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const featuredEvents = await prisma.event.findMany({
    take: 3,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      participants: true
    }
  });

  return (
    <div className="bg-linear-to-b from-[#F4F7F9] to-[#EDF1F5] font-sans text-gray-700">
      <CursorHighlight />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col lg:block overflow-hidden border-b-2 border-charcoal-blue bg-attendee-surface">

        {/* Attendee Side (Primary Focus - 2/3 Width) */}
        <div className="w-full min-h-[60vh] lg:min-h-[90vh] bg-attendee-surface text-charcoal-blue flex flex-col justify-center px-8 py-20 lg:py-32 lg:pl-20 lg:pr-[45%] relative group cursor-default">
          {/* Subtle pattern for texture */}
          <div className="absolute inset-0 opacity-[0.03] transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `radial-gradient(circle, #0F766E 2px, transparent 2px)`, backgroundSize: '32px 32px' }} />

          <div className="relative z-10 w-full max-w-2xl mx-auto lg:mr-auto lg:ml-0 flex flex-col items-start lg:pl-4">

            <h1 className="text-6xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-6 drop-shadow-sm">
              Find Your<br />
              <span className="text-muted-teal">Next Vibe.</span>
            </h1>

            <p className="text-xl text-steel-gray font-medium mb-12 leading-relaxed max-w-lg">
              Discover local meetups, epic conferences, and exclusive shows. Secure your spot in seconds and let the experience begin.
            </p>

            <Link
              href="/events"
              className="inline-flex items-center gap-4 border-2 border-charcoal-blue bg-muted-teal text-white px-10 py-5 text-base font-bold tracking-widest uppercase hover:bg-charcoal-blue hover:text-white transition-all shadow-[8px_8px_0px_0px_rgba(31,42,55,1)] hover:shadow-none hover:translate-x-[8px] hover:translate-y-[8px] group/btn"
            >
              Browse Events
              <svg className="h-5 w-5 transition-transform group-hover/btn:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            <div className="mt-16 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-muted-teal bg-white backdrop-blur-sm shadow-sm flex items-center justify-center`}>
                    <svg className="h-5 w-5 text-muted-teal/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-muted-teal bg-muted-teal flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  +
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-charcoal-blue leading-none">2M+</p>
                <p className="text-xs font-bold text-steel-gray uppercase tracking-widest mt-1">Tickets Sold</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizer Side (Secondary Focus - 1/3 Width) */}
        <div className="w-full lg:absolute lg:top-0 lg:right-0 lg:w-[45%] lg:h-full bg-organizer-surface text-charcoal-blue flex flex-col justify-center px-8 py-20 lg:px-12 relative group overflow-hidden cursor-default lg:[clip-path:polygon(15%_0,100%_0,100%_100%,0%_100%)] border-t-2 lg:border-t-0 border-charcoal-blue">
          {/* Intense pattern for contrast */}
          <div className="absolute inset-0 opacity-[0.03] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `repeating-linear-gradient(45deg, #C2410C 0, #C2410C 3px, transparent 0, transparent 50%)`, backgroundSize: '40px 40px' }} />

          <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-start lg:items-center lg:text-center text-left lg:pl-10">

            <h2 className="text-4xl lg:text-[2.75rem] font-black tracking-tight leading-[1.05] mb-6 drop-shadow-sm">
              Hosting<br className="hidden lg:block" />an Event?
            </h2>

            <p className="text-lg text-steel-gray font-medium mb-10 leading-relaxed max-w-xs mx-auto">
              Launch events instantly. Track live sales, manage check-ins, and scale effortlessly.
            </p>

            <Link
              href="/organizer/create-event"
              className="inline-flex items-center gap-3 border-2 border-charcoal-blue bg-signal-orange text-white px-6 py-4 text-xs font-bold tracking-widest uppercase hover:bg-charcoal-blue hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(31,42,55,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
            >
              Start Creating
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        </div>

      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-gray-900 text-white flex items-center">
        <div className="mx-auto max-w-7xl px-6 py-24 w-full">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
              Built for Organizers &amp; Attendees
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">
              One platform. End-to-end event management.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Easy Ticketing',
                description: 'Sell tickets, generate QR codes, simulate payments — all in one place.'
              },
              {
                title: 'Real-time Analytics',
                description: 'Live dashboard with attendee count, revenue, and check-in stats via WebSockets.'
              },
              {
                title: 'Secure Check-in',
                description: 'Mobile-friendly QR scanner for staff. Instant validation & entry updates.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden border-l-4 border-signal-orange bg-white/5 p-8 transition-all hover:border-signal-orange hover:bg-white/10"
              >
                <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-white/20" />
                <h3 className="mb-4 font-sans text-2xl font-bold tracking-tight text-signal-orange">{feature.title}</h3>
                <p className="text-gray-300 font-sans border-l border-white/10 pl-4">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING & FEATURED ──────────────────────────────────────── */}
      <section className="min-h-screen flex items-center">
        <div className="mx-auto max-w-7xl px-6 py-24 w-full">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-black md:text-5xl">
              Trending &amp; Featured Events
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Discover what's happening near you right now
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event, index) => {
              const locationParts = event.location ? event.location.split('|') : ['TBD'];
              const displayLocation = locationParts[0];

              return (
                <div
                  key={event.id}
                  className="group relative border-2 border-gray-200 bg-white transition-all duration-300 hover:border-gray-900 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-video overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                    {event.image && event.image !== '/placeholder-1.jpg' && (
                      <img src={event.image} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white/90">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-sm font-medium truncate">{displayLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold tracking-wider text-teal-900">
                        {event.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        {event.participants.length}
                      </div>
                    </div>

                    <h3 className="mb-3 text-xl font-bold text-gray-900 transition group-hover:text-teal-700 line-clamp-1">
                      {event.title}
                    </h3>

                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        <div className="text-xs text-gray-500">Starting from</div>
                        <div className="text-2xl font-bold text-gray-900">{event.isFree ? 'Free' : `$${event.price}`}</div>
                      </div>
                      <Link
                        href={`/event/${event.id}`}
                        className="inline-flex items-center gap-1 border-2 border-gray-900 bg-gray-900 px-4 py-2 text-sm font-bold tracking-wider text-white transition hover:bg-white hover:text-gray-900"
                      >
                        View Details
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/events"
              className="group inline-flex items-center gap-2 border-b-2 border-teal-600 pb-1 font-sans text-lg font-bold text-teal-700 tracking-widest transition-all hover:bg-teal-50 hover:px-4"
            >
              Explore All Events
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t-2 border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <span className="text-xl font-extrabold tracking-tighter text-gray-900">EventOps</span>
            <p className="text-sm font-medium text-gray-500 tracking-wider">
              © 2026 EventOps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}