import CursorHighlight from '@/components/CursorHighlight';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 font-sans text-gray-700">
      {/* Navbar*/}
      <CursorHighlight />


      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-30 md:pb-32">
        <div className="absolute inset-0">
          <div className="absolute -left-40 top-0 h-125 w-125 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -right-40 top-40 h-150 w-150 rounded-full bg-blue-900/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-3">

            {/* LEFT — Content (2/3) */}
            <div className="lg:col-span-2">
              <h1 className="mb-6 bg-linear-to-r from-gray-900 via-blue-900 to-teal-700 bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-5xl">
                Discover & Manage<br />Events Effortlessly
              </h1>

              <p className="mb-10 max-w-2xl text-xl leading-relaxed text-gray-600">
                From local meetups to large conferences — browse, book tickets, or
                create your own event with real-time analytics, QR check-in, and
                seamless ticketing.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/events"
                  className="relative overflow-hidden border-2 border-gray-900 bg-transparent px-8 py-4 font-sans text-lg font-bold  tracking-wider text-gray-900 transition-all hover:bg-gray-900 hover:text-white"
                >
                  <span className="relative z-10">Browse Events</span>
                </Link>
                <Link
                  href="/organizer/create-event"
                  className="relative overflow-hidden border-2 border-signal-orange bg-signal-orange px-8 py-4 font-sans text-lg font-bold  tracking-wider text-white transition-all hover:bg-transparent hover:text-signal-orange"
                >
                  <span className="relative z-10">Create Event</span>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-14 grid max-w-xl grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Events</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">2M+</div>
                  <div className="text-sm text-gray-600">Tickets</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* RIGHT — Visual (1/3) */}
            <div className="relative hidden lg:block">

              {/* Brand label */}
              <span className="mb-4 inline-block border-2 border-gray-900 px-4 py-1 text-sm font-bold  tracking-wider text-gray-900 bg-white">
                EventOps
              </span>


              <div className="relative border-2 border-gray-900 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {/* Fake dashboard header */}
                <div className="flex items-center gap-2 border-b-2 border-gray-100 p-4 bg-gray-50">
                  <div className="h-3 w-3 border border-gray-900 bg-gray-900" />
                  <div className="h-3 w-3 border border-gray-900 bg-transparent" />
                  <div className="h-3 w-3 border border-gray-900 bg-transparent" />
                </div>

                {/* Fake dashboard body */}
                <div className="space-y-4 p-6">
                  <div className="h-4 w-3/4 border border-gray-200 bg-gray-100" />
                  <div className="h-24 border-2 border-teal-500/20 bg-teal-50" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 border border-gray-200 bg-gray-50" />
                    <div className="h-20 border border-gray-200 bg-gray-50" />
                  </div>
                </div>
              </div>

              {/* Floating stat card */}
              <div className="absolute -bottom-10 -left-10 border-2 border-gray-900 bg-gray-900 px-6 py-4 text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="text-xs font-bold  tracking-wider opacity-80">Live Attendees</div>
                <div className="text-2xl font-bold font-mono">1,248</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/*Organizer section*/}
      <section className="bg-gray-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Built for Organizers & Attendees
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">
              One platform. End-to-end event management.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: 'Ticket',
                title: 'Easy Ticketing',
                description: 'Sell tickets, generate QR codes, simulate payments — all in one place.'
              },
              {
                icon: 'Chart',
                title: 'Real-time Analytics',
                description: 'Live dashboard with attendee count, revenue, and check-in stats via WebSockets.'
              },
              {
                icon: 'Check',
                title: 'Secure Check-in',
                description: 'Mobile-friendly QR scanner for staff. Instant validation & entry updates.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden border-l-4 border-signal-orange bg-white/5 p-8 transition-all hover:border-signal-orange hover:bg-white/10"
              >
                <div className="absolute top-0 right-0 h-4 w-4 border-t border-r border-white/20" />
                <h3 className="mb-4 font-sans text-2xl font-bold tracking-tight  text-signal-orange">{feature.title}</h3>
                <p className="text-gray-300 font-sans border-l border-white/10 pl-4">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending & Featured Events*/}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Trending & Featured Events
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
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
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
                      <span className="inline-flex items-center gap-1.5 border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold  tracking-wider text-teal-900">
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
                        className="inline-flex items-center gap-1 border-2 border-gray-900 bg-gray-900 px-4 py-2 text-sm font-bold  tracking-wider text-white transition hover:bg-white hover:text-gray-900"
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
              className="group inline-flex items-center gap-2 border-b-2 border-teal-600 pb-1 font-sans text-lg font-bold text-teal-700  tracking-widest transition-all hover:bg-teal-50 hover:px-4"
            >
              Explore All Operations
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <span className="text-xl font-extrabold  tracking-tighter text-gray-900">EventOps</span>
            <p className="text-sm font-medium text-gray-500  tracking-wider">
              © 2026 EventOps. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}