"use client";
import Link from 'next/link';
import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/');
        setIsSidebarOpen(false);
    };

    return (
        <>
            <nav className="fixed top-0 z-50 w-full border-b border-white/[0.08] bg-[#0D0F14]/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-2xl font-extrabold tracking-tighter text-white border-2 border-transparent hover:border-white/20 px-2 -mx-2 transition-all">
                        EventOps
                    </Link>
                    <div className="flex items-center gap-8">
                        <Link href="/events" className="hidden md:block text-xs font-bold tracking-wider text-[#8896AD] transition hover:text-white hover:underline decoration-2 underline-offset-4">
                            Browse Events
                        </Link>

                        {/* Profile Trigger */}
                        <button
                            onClick={toggleSidebar}
                            className="w-10 h-10 bg-[#13151C] border border-white/[0.08] hover:border-white/30 transition-all flex items-center justify-center overflow-hidden hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)]"
                        >
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-5 h-5 text-[#8896AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                />
            )}

            {/* Right Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-[24rem] bg-[#13151C] z-[70] shadow-2xl transform transition-transform duration-300 ease-out border-l border-white/[0.08] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
                        <span className="text-sm font-bold text-white tracking-wide">Account</span>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {session ? (
                            <div className="px-3 py-6 space-y-8">
                                {/* Profile Card */}
                                <div className="px-3 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-muted-teal">{session.user?.name?.[0] || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate text-lg leading-tight">{session.user?.name || 'Guest User'}</h3>
                                        <p className="text-sm text-[#8896AD] truncate">{session.user?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* General Links */}
                                    <div className="space-y-1">
                                        <Link href="/profile" onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all group">
                                            <svg className="w-5 h-5 group-hover:text-muted-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="font-medium">Profile</span>
                                        </Link>
                                        <Link href="/settings" onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all group">
                                            <svg className="w-5 h-5 group-hover:text-muted-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="font-medium">Settings</span>
                                        </Link>
                                    </div>

                                    {/* ATTENDEE SECTION */}
                                    <div className="space-y-1">
                                        <div className="px-3 pb-2">
                                            <h4 className="text-xs font-bold tracking-widest text-muted-teal">Attendee</h4>
                                        </div>
                                        <Link href="/attendee/dashboard" onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all group">
                                            <svg className="w-5 h-5 group-hover:text-muted-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            <span className="font-medium">My Tickets</span>
                                        </Link>
                                        <Link href="/favorites" onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all group">
                                            <svg className="w-5 h-5 group-hover:text-muted-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            <span className="font-medium">Favorites</span>
                                        </Link>
                                    </div>

                                    {/* ORGANIZER SECTION */}
                                    <div className="space-y-1">
                                        <div className="px-3 pb-2">
                                            <h4 className="text-xs font-bold tracking-widest text-signal-orange">Organizer</h4>
                                        </div>
                                        <Link href="/organizer/dashboard" onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all group">
                                            <svg className="w-5 h-5 group-hover:text-signal-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span className="font-medium">Dashboard</span>
                                        </Link>
                                        <Link href="/organizer/create-event" onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-[#8896AD] hover:text-white hover:bg-white/5 transition-all group">
                                            <svg className="w-5 h-5 group-hover:text-signal-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="font-medium">Create Event</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white tracking-tight">Welcome</h3>
                                    <p className="text-sm text-[#8896AD]">Sign in to manage your tickets and events.</p>
                                </div>
                                <div className="space-y-3">
                                    <Link href="/login" onClick={() => setIsSidebarOpen(false)}
                                        className="block w-full py-3 bg-muted-teal text-sm font-bold text-[#0D0F14] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] transition-all">
                                        Log In
                                    </Link>
                                    <Link href="/signup" onClick={() => setIsSidebarOpen(false)}
                                        className="block w-full py-3 border border-white/10 bg-transparent text-sm font-bold text-[#8896AD] hover:border-white/30 hover:text-white transition-all">
                                        Sign Up
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {session && (
                        <div className="p-6 border-t border-white/[0.08]">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-[#8896AD] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
