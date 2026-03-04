"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

interface UserData {
    id: string;
    name: string;
    email: string;
    image: string | null;
    isOAuthLinked: boolean;
    organizedCount: number;
    attendedCount: number;
    createdAt: string;
}

export default function ProfileClient({ user }: { user: UserData }) {
    const { showToast } = useToast();
    const router = useRouter();
    const [name, setName] = useState(user.name);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast("Name cannot be empty", "error");
            return;
        }

        setIsSaving(true);
        setIsSuccess(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                showToast("Profile updated successfully", "success");
                router.refresh(); // refresh server component
                setTimeout(() => setIsSuccess(false), 2000);
            } else {
                setIsSuccess(false);
                const data = await res.json();
                showToast(data.error || "Failed to update profile", "error");
            }
        } catch (error) {
            setIsSuccess(false);
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF4E8] font-sans text-steel-gray pt-16">
            <main className="mx-auto max-w-5xl px-6 py-14">

                {/* HEADER */}
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight text-charcoal-blue">
                        My Profile
                    </h1>
                    <p className="mt-3 text-lg text-steel-gray">
                        Manage your account settings and view your platform activity.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Profile Card & Connections */}
                    <div className="space-y-8">
                        {/* Profile Card */}
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:shadow-[6px_6px_0px_0px_rgba(31,42,55,1)]">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-signal-orange" />
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="h-32 w-32 rounded-full border-4 border-white bg-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden mb-6">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-5xl font-black text-signal-orange uppercase">{user.name[0] || "U"}</span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-charcoal-blue mb-1">{user.name}</h2>
                                <p className="text-sm font-medium text-steel-gray mb-6">
                                    Member since {new Date(user.createdAt).getFullYear()}
                                </p>

                                <div className="w-full grid grid-cols-2 gap-4 border-t-2 border-gray-100 pt-6">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-steel-gray mb-1">Organized</p>
                                        <p className="text-2xl font-black text-charcoal-blue">{user.organizedCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-steel-gray mb-1">Attended</p>
                                        <p className="text-2xl font-black text-charcoal-blue">{user.attendedCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connections */}
                        <div className="bg-white border-2 border-gray-200 p-6 relative transition hover:shadow-[4px_4px_0px_0px_rgba(31,42,55,1)]">
                            <h3 className="text-[11px] font-bold tracking-widest uppercase text-charcoal-blue mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                </svg>
                                Connected Accounts
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-100 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-charcoal-blue" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-charcoal-blue">Google</span>
                                </div>
                                <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 border-2 ${user.isOAuthLinked ? 'border-signal-orange bg-signal-orange/10 text-signal-orange' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                    {user.isOAuthLinked ? "Linked" : "No"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border-2 border-gray-200 relative overflow-hidden transition hover:shadow-[6px_6px_0px_0px_rgba(31,42,55,1)] p-8 md:p-10">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-charcoal-blue" />

                            <h2 className="text-xl font-extrabold text-charcoal-blue mb-8">Personal Details</h2>

                            <form onSubmit={handleSave} className="space-y-8">
                                <div>
                                    <label htmlFor="email" className="block text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-2">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full bg-gray-50 border-2 border-gray-200 px-4 py-3.5 text-sm font-bold text-gray-500 tracking-wide cursor-not-allowed focus:outline-none"
                                    />
                                    <p className="mt-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Email is managed by your provider
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="displayName" className="block text-[11px] font-bold tracking-widest uppercase text-steel-gray mb-2">Display Name</label>
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white border-2 border-gray-300 px-4 py-3.5 text-sm font-bold text-charcoal-blue tracking-wide focus:border-signal-orange focus:outline-none transition-colors"
                                        placeholder="Enter your name"
                                    />
                                    <p className="mt-2 text-[11px] font-bold text-steel-gray uppercase tracking-widest">
                                        This name will be visible to event organizers and other attendees.
                                    </p>
                                </div>

                                <div className="pt-6 mt-6 border-t-2 border-gray-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving || name === user.name}
                                        className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-signal-orange text-[13px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-charcoal-blue shadow-[4px_4px_0px_0px_rgba(31,42,55,1)] disabled:shadow-none"
                                    >
                                        {isSuccess ? "Saved!" : (isSaving ? "Saving..." : "Save Changes")}
                                        {!isSaving && !isSuccess && (
                                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

