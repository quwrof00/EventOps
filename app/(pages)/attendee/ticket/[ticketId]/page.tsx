import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export default async function MyTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: {
        include: {
          organizers: true
        }
      },
      user: true
    }
  });

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8F8F5]">
        <div className="text-center bg-white border border-gray-100 p-14 max-w-sm w-full mx-4">
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-charcoal-blue mb-1.5">Ticket Not Found</h2>
          <p className="text-sm text-steel-gray mb-6">This ticket doesn't exist or may have been removed.</p>
          <Link href="/attendee/dashboard" className="inline-flex items-center gap-2 bg-charcoal-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-muted-teal">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isActive = ticket.status === "VALID";
  const event = ticket.event;
  const organizerName = event.organizers[0]?.name || "EventOps Organizer";

  //QR CODE GENERATION 
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const qrCodeDataUrl = await QRCode.toDataURL(
    `${baseUrl}/api/tickets/verify/${ticket.id}`
  );

  // Date Formatting
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const purchaseDateStr = new Date(ticket.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const locationParts = event.location ? event.location.split("|") : [];
  const displayLocation = locationParts[0] || "TBD";

  return (
    <div className="min-h-screen bg-[#E8F8F5] font-sans text-steel-gray pt-16">

      {/* PAGE HEADER */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-[#ccf0ea]">
        <div className="mx-auto max-w-5xl px-6 py-8">

          <Link href="/attendee/dashboard" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-teal hover:text-charcoal-blue transition mb-6">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Tickets
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-teal mb-1.5">{event.category || 'Event'}</p>
              <h1 className="text-2xl font-bold text-charcoal-blue leading-snug">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-steel-gray">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {timeStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-muted-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {displayLocation}
                </span>
              </div>
            </div>

            {/* Status badge */}
            <div className={`px-4 py-2.5 ${isActive ? "bg-muted-teal/10" : "bg-gray-100"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-steel-gray mb-0.5">Status</p>
              <p className={`text-lg font-bold ${isActive ? "text-muted-teal" : "text-gray-500"}`}>
                {isActive ? "Valid" : "Used"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* QR COLUMN */}
          <div className="lg:col-span-2 space-y-4">

            {/* QR CODE CARD */}
            <div className="bg-white border border-gray-100 overflow-hidden">

              {/* Dark QR section */}
              <div className="bg-charcoal-blue px-6 py-10">
                <div className="mx-auto max-w-xs">
                  <div className="bg-white p-5 mx-auto w-fit">
                    <img
                      src={qrCodeDataUrl}
                      alt="Ticket QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="mt-5 text-center text-[13px] text-white/60 leading-relaxed">
                    {isActive
                      ? "Present this QR code at the venue for entry verification"
                      : "This ticket has already been scanned and used"}
                  </p>
                </div>
              </div>

              {/* Ticket details */}
              <div className="px-7 py-6">
                <p className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-5">Ticket Details</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border-l-2 border-muted-teal pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-gray">Ticket ID</p>
                    <p className="mt-1 font-sans text-base font-bold text-charcoal-blue">
                      {ticket.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="border-l-2 border-gray-200 pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-gray">Purchase Date</p>
                    <p className="mt-1 text-base font-bold text-charcoal-blue">
                      {purchaseDateStr}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* EVENT INFO SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Venue info */}
              <div className="bg-white border border-gray-100">
                <div className="px-5 py-3 border-b border-gray-50">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-steel-gray">Venue Information</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] text-steel-gray mb-0.5">Location</p>
                    <p className="text-[14px] font-semibold text-charcoal-blue">{displayLocation}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-steel-gray mb-0.5">Organizer</p>
                    <p className="text-[14px] font-semibold text-charcoal-blue">{organizerName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-steel-gray mb-0.5">Date & Time</p>
                    <p className="text-[14px] font-semibold text-charcoal-blue">{dateStr}</p>
                    <p className="text-[13px] text-steel-gray">{timeStr}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <Link
                  href={`/event/${event.id}`}
                  className="flex w-full items-center justify-center gap-2 bg-charcoal-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal"
                >
                  View Event Details
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/attendee/dashboard"
                  className="flex w-full items-center justify-center gap-2 border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-steel-gray transition hover:border-charcoal-blue hover:text-charcoal-blue"
                >
                  All My Tickets
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}