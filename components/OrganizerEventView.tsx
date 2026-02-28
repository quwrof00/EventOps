"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import InviteOrganizerPanel from './InviteOrganizerPanel';

// Types matching what we expect from the server
interface Attendee {
    id: string;
    name: string;
    email: string;
    ticket: string; // "General Admission" etc
    status: string; // "Confirmed", "Refunded"
    purchaseDate: string;
    checkedIn: boolean;
}

interface EventStats {
    revenue: number;
    sold: number;
    capacity: number;
    views: number;
    conversionRate: string;
}

interface OrganizerEventViewProps {
    event: {
        id: string;
        title: string;
        status: string;
        date: string; // Formatted date string
        time: string;
        location: string;
    };
    attendees: Attendee[];
    stats: EventStats;
}

export default function OrganizerEventView({ event, attendees, stats }: OrganizerEventViewProps) {
    const [activeTab, setActiveTab] = useState("Overview");

    const TABS = ["Overview", "Attendees", "Marketing", "Settings"];

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const isPublished = event.status === 'PUBLISHED';
    const percentSold = stats.capacity > 0 ? Math.round((stats.sold / stats.capacity) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#FFF7ED] font-sans text-steel-gray pt-16">

            {/*PAGE HEADER*/}
            <div className="bg-white/70 backdrop-blur-sm border-b border-[#f5dcbf]">
                <div className="mx-auto max-w-7xl px-6 py-8">

                    {/* Back + status */}
                    <div className="flex items-center gap-3 mb-5">
                        <Link
                            href="/organizer/dashboard"
                            className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-steel-gray hover:text-signal-orange transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </Link>
                        <span className="text-gray-200">·</span>
                        <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 border ${isPublished
                            ? 'border-signal-orange/30 bg-signal-orange/10 text-signal-orange'
                            : 'border-gray-200 bg-gray-100 text-gray-400'
                            }`}>
                            {event.status}
                        </span>
                    </div>

                    {/* Title + actions */}
                    <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                            <p className="text-[11px] font-bold tracking-widest uppercase text-signal-orange mb-1.5">Managing Event</p>
                            <h1 className="text-2xl font-extrabold tracking-tight text-charcoal-blue leading-snug">
                                {event.title}
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-steel-gray">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-signal-orange shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {event.date}{event.time ? ` · ${event.time}` : ''}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-signal-orange shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.location}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Link
                                href={`/organizer/event/${event.id}/edit`}
                                className="px-5 py-2.5 border-2 border-soft-slate bg-white text-[12px] font-bold tracking-widest text-charcoal-blue hover:border-signal-orange hover:text-signal-orange transition"
                            >
                                Edit Event
                            </Link>
                            <Link
                                href={`/event/${event.id}`}
                                className="px-5 py-2.5 border-2 border-signal-orange bg-signal-orange text-[12px] font-bold tracking-widest text-white hover:bg-white hover:text-signal-orange transition"
                            >
                                View Public Page
                            </Link>
                        </div>
                    </div>

                    {/* TABS */}
                    <nav className="flex gap-0 mt-8 border-b-2 border-soft-slate -mb-px">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-1 mr-8 pb-3.5 text-xs font-bold tracking-widest uppercase border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-signal-orange text-signal-orange'
                                    : 'border-transparent text-steel-gray hover:text-charcoal-blue'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8">

                {/* OVERVIEW TAB  */}
                {activeTab === "Overview" && (
                    <div className="space-y-6">

                        {/* Stats row — same hero pattern as dashboards */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                            {/* Revenue — hero */}
                            <div className="lg:col-span-2 bg-charcoal-blue relative overflow-hidden rounded-2xl">
                                <div className="absolute inset-0 opacity-[0.04]" style={{
                                    backgroundImage: `repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)`,
                                    backgroundSize: '20px 20px'
                                }} />
                                <div className="relative z-10 px-8 py-7">
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-2">Total Revenue</p>
                                    <p className="text-5xl font-black tracking-tight text-white">{formatCurrency(stats.revenue)}</p>
                                    <div className="mt-3 h-0.5 w-10 bg-signal-orange" />
                                    <p className="mt-2 text-[12px] text-white/40">Gross from ticket sales</p>
                                </div>
                            </div>

                            {/* Tickets sold */}
                            <div className="bg-white border-2 border-soft-slate relative overflow-hidden px-7 py-6">
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal-orange" />
                                <p className="text-[11px] font-bold tracking-widest uppercase text-signal-orange mb-2">Tickets Sold</p>
                                <p className="text-4xl font-black text-charcoal-blue">
                                    {stats.sold}
                                    <span className="text-lg font-medium text-gray-300 ml-1">/ {stats.capacity}</span>
                                </p>
                                {/* Capacity bar */}
                                <div className="mt-3">
                                    <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${percentSold >= 90 ? 'bg-signal-orange' : 'bg-muted-teal'}`}
                                            style={{ width: `${percentSold}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-steel-gray mt-1">{percentSold}% capacity filled</p>
                                </div>
                            </div>

                            {/* Views + Conversion stacked */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white border-2 border-soft-slate flex-1 px-6 py-5 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-teal" />
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-1">Page Views</p>
                                    <p className="text-3xl font-black text-charcoal-blue">{stats.views.toLocaleString()}</p>
                                </div>
                                <div className="bg-white border-2 border-soft-slate flex-1 px-6 py-5 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300" />
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-1">Conversion</p>
                                    <p className="text-3xl font-black text-charcoal-blue">{stats.conversionRate}</p>
                                </div>
                            </div>

                        </div>

                        {/* Chart + Activity */}
                        <div className="grid lg:grid-cols-3 gap-6">

                            {/* Sales chart */}
                            <div className="lg:col-span-2 bg-white border-2 border-soft-slate">
                                <div className="flex items-center justify-between px-7 py-5 border-b-2 border-soft-slate">
                                    <h3 className="text-sm font-bold tracking-tight text-charcoal-blue">Sales Over Time</h3>
                                    <select className="border-b-2 border-gray-200 bg-transparent text-[12px] font-bold tracking-wide text-charcoal-blue py-0.5 pl-1 pr-6 focus:border-signal-orange focus:outline-none cursor-pointer">
                                        <option>Last 30 Days</option>
                                        <option>Last 7 Days</option>
                                        <option>All Time</option>
                                    </select>
                                </div>
                                <div className="p-7">
                                    <div className="h-52 flex items-end gap-1.5">
                                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-signal-orange/20 hover:bg-signal-orange transition-colors duration-200 cursor-pointer group relative"
                                                style={{ height: `${h}%` }}
                                            >
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-charcoal-blue opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {h}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-3 text-[10px] font-medium text-gray-300">
                                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                                        <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                                    </div>
                                </div>
                            </div>

                            {/* Activity feed */}
                            <div className="bg-white border-2 border-soft-slate">
                                <div className="px-6 py-5 border-b-2 border-soft-slate">
                                    <h3 className="text-sm font-bold tracking-tight text-charcoal-blue">Recent Activity</h3>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {[
                                        { user: "Sarah M.", action: "bought 1 VIP Ticket", time: "2 mins ago", type: "sale" },
                                        { user: "John D.", action: "bought 2 General Tickets", time: "15 mins ago", type: "sale" },
                                        { user: "System", action: "Capacity alert: 80% full", time: "1 hour ago", type: "alert" },
                                        { user: "Mike R.", action: "requested a refund", time: "2 hours ago", type: "refund" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3.5 px-6 py-4">
                                            <div className={`mt-1.5 w-1.5 h-1.5 shrink-0 ${item.type === 'sale' ? 'bg-muted-teal' : item.type === 'alert' ? 'bg-signal-orange' : 'bg-gray-300'}`} />
                                            <div className="min-w-0">
                                                <p className="text-[13px] text-charcoal-blue">
                                                    <span className="font-bold">{item.user}</span>
                                                    {' '}<span className="text-steel-gray">{item.action}</span>
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-6 py-4 border-t-2 border-soft-slate">
                                    <button className="w-full text-[12px] font-bold tracking-widest text-steel-gray hover:text-charcoal-blue transition-colors">
                                        View All Activity
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/*ATTENDEES TAB */}
                {activeTab === "Attendees" && (
                    <div className="bg-white border-2 border-soft-slate">

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b-2 border-soft-slate">
                            <div className="relative max-w-sm w-full">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search attendees..."
                                    className="w-full pl-9 pr-4 py-2 border-2 border-soft-slate bg-off-white text-sm focus:border-signal-orange focus:outline-none transition"
                                />
                            </div>
                            <div className="flex gap-2.5">
                                <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-soft-slate bg-white text-[12px] font-bold tracking-widest text-steel-gray hover:border-signal-orange hover:text-signal-orange transition">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export CSV
                                </button>
                                <button className="px-4 py-2 border-2 border-charcoal-blue bg-charcoal-blue text-[12px] font-bold tracking-widest text-white hover:bg-white hover:text-charcoal-blue transition">
                                    + Add Attendee
                                </button>
                            </div>
                        </div>

                        {/* Summary bar */}
                        <div className="flex items-center gap-6 px-6 py-3 bg-gray-50/60 border-b border-soft-slate/60">
                            <span className="text-[11px] font-bold text-steel-gray">
                                {attendees.length} attendees
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-muted-teal" />
                                <span className="text-[11px] text-steel-gray">
                                    {attendees.filter(a => a.status === 'Confirmed').length} confirmed
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-gray-300" />
                                <span className="text-[11px] text-steel-gray">
                                    {attendees.filter(a => a.status !== 'Confirmed').length} other
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-soft-slate bg-off-white">
                                        {["Name", "Ticket Type", "Purchase Date", "Status", "Actions"].map((h) => (
                                            <th key={h} className="px-6 py-3.5 text-[10px] font-bold tracking-widest uppercase text-steel-gray">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {attendees.length > 0 ? attendees.map((attendee) => (
                                        <tr key={attendee.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-[14px] font-semibold text-charcoal-blue">{attendee.name}</p>
                                                <p className="text-[12px] text-steel-gray mt-0.5">{attendee.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-semibold text-steel-gray bg-gray-100 px-2.5 py-1">
                                                    {attendee.ticket}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-steel-gray">
                                                {attendee.purchaseDate}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 ${attendee.status === 'Confirmed'
                                                    ? 'bg-muted-teal/10 text-muted-teal'
                                                    : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 ${attendee.status === 'Confirmed' ? 'bg-muted-teal' : 'bg-gray-300'}`} />
                                                    {attendee.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {!attendee.checkedIn ? (
                                                        <button className="text-[12px] font-bold tracking-wider text-signal-orange hover:text-charcoal-blue transition-colors">
                                                            Check In
                                                        </button>
                                                    ) : (
                                                        <span className="text-[12px] font-bold tracking-wider text-muted-teal">
                                                            ✓ Checked In
                                                        </span>
                                                    )}
                                                    <button className="text-[13px] text-gray-300 hover:text-charcoal-blue transition-colors">
                                                        •••
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-steel-gray text-sm">
                                                No attendees yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {attendees.length > 5 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-soft-slate bg-gray-50/40">
                                <span className="text-[11px] font-bold tracking-wider text-steel-gray">
                                    Showing {attendees.length} attendees
                                </span>
                                <div className="flex gap-1">
                                    <button className="w-8 h-8 flex items-center justify-center border-2 border-soft-slate text-[12px] font-bold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue transition">‹</button>
                                    <button className="w-8 h-8 flex items-center justify-center border-2 border-charcoal-blue bg-charcoal-blue text-[12px] font-bold text-white">1</button>
                                    <button className="w-8 h-8 flex items-center justify-center border-2 border-soft-slate text-[12px] font-bold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue transition">›</button>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* MARKETING TAB  */}
                {activeTab === "Marketing" && (
                    <div className="bg-white border-2 border-soft-slate p-8">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-1.5">Marketing Tools</p>
                        <h3 className="text-lg font-bold text-charcoal-blue mb-6">Promote Your Event</h3>
                        <p className="text-sm text-steel-gray">Marketing tools coming soon.</p>
                    </div>
                )}

                {/*SETTINGS TAB  */}
                {activeTab === "Settings" && (
                    <div className="space-y-4">

                        <div className="bg-white border-2 border-soft-slate p-7">
                            <p className="text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-1.5">Event Settings</p>
                            <h3 className="text-base font-bold text-charcoal-blue mb-1">General</h3>
                            <p className="text-[13px] text-steel-gray">
                                Manage event details, visibility, and configuration from the{' '}
                                <Link href={`/organizer/event/${event.id}/edit`} className="font-semibold text-signal-orange hover:underline underline-offset-2">
                                    edit page
                                </Link>.
                            </p>
                        </div>

                        {/* Invite co-organizers */}
                        <InviteOrganizerPanel eventId={event.id} />

                        {/* Danger zone */}
                        <div className="bg-white border-2 border-red-200">
                            <div className="px-7 py-4 border-b-2 border-red-100">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-red-400">Danger Zone</p>
                            </div>
                            <div className="px-7 py-6">
                                <h4 className="text-sm font-bold text-charcoal-blue mb-1">Delete this Event</h4>
                                <p className="text-[13px] text-steel-gray mb-5">
                                    This will permanently remove the event and cancel all tickets. This action cannot be undone.
                                </p>
                                <button
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                                            try {
                                                const res = await fetch(`/api/events/${event.id}`, {
                                                    method: 'DELETE'
                                                });
                                                if (res.ok) {
                                                    window.location.href = "/organizer/dashboard";
                                                } else {
                                                    alert("Failed to delete event");
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert("An error occurred");
                                            }
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 border-2 border-red-500 bg-red-500 px-5 py-2.5 text-[12px] font-bold tracking-widest text-white hover:bg-white hover:text-red-500 transition"
                                >
                                    Delete Event
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
}