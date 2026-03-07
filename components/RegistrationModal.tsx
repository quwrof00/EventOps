'use client';

import { useSession } from "next-auth/react";
import { useState, useOptimistic, startTransition } from "react";
import { useRouter } from "next/navigation";
import { registerForEvent, RegistrationMeta } from "@/app/actions/event";

interface RegistrationModalProps {
    eventId: string;
    isFull: boolean;
    isRegistered: boolean;
    hasTeam?: boolean;
    eventCategory: string;
    eventTitle: string;
    isFree: boolean;
    price?: string | null;
    teamSizeMax?: number | null;
    allowSolo?: boolean;
}

// Which formats need team logic
const TEAM_FORMATS = ['Hackathon', 'Competition'];

// Which formats need extra registration fields
const FORMAT_FIELDS: Record<string, string[]> = {
    Hackathon: [],       // team flow handled separately
    Competition: [],     // team flow handled separately
    Workshop: ['experienceLevel', 'expectations', 'dietaryRestrictions'],
    Bootcamp: ['experienceLevel', 'expectations', 'dietaryRestrictions'],
    Webinar: ['timezone', 'notifyOnRecording'],
    Conference: ['dietaryRestrictions', 'specialRequirements'],
    Meetup: ['heardAboutUs'],
    Expo: ['heardAboutUs', 'specialRequirements'],
};

const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata',
    'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

type TeamInfo = {
    id: string;
    code: string;
    name: string;
    leaderId: string;
    members: { user: { id: string; name: string | null } }[];
};

type ModalStep = 'form' | 'team-choice' | 'team-create' | 'team-join' | 'confirm' | 'done';

export default function RegistrationModal({
    eventId, isFull, isRegistered, hasTeam, eventCategory, eventTitle, isFree, price, teamSizeMax, allowSolo
}: RegistrationModalProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<ModalStep>('form');

    const [meta, setMeta] = useState<RegistrationMeta>({
        soloEntry: false,
        notifyOnRecording: true,
        experienceLevel: '',
        teamName: '',
        teamMembers: '',
        expectations: '',
        dietaryRestrictions: '',
        timezone: 'UTC',
        heardAboutUs: '',
        specialRequirements: '',
    });

    // Team-specific state
    const [teamName, setTeamName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [teamError, setTeamError] = useState('');
    const [teamResult, setTeamResult] = useState<TeamInfo | null>(null);
    const [teamLoading, setTeamLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const [optRegistered, addOptRegistered] = useOptimistic(
        isRegistered,
        (_: boolean, next: boolean) => next
    );

    const [optHasTeam, addOptHasTeam] = useOptimistic(
        hasTeam,
        (_: boolean | undefined, next: boolean) => next
    );

    const isTeamFormat = TEAM_FORMATS.includes(eventCategory);
    const fields = FORMAT_FIELDS[eventCategory] ?? [];
    const hasFields = fields.length > 0;

    const setField = (key: keyof RegistrationMeta, value: string | boolean) =>
        setMeta(prev => ({ ...prev, [key]: value }));

    const handleOpen = () => {
        if (!session) {
            router.push(`/login?error=${encodeURIComponent("You must be logged in to register for an event.")}`);
            return;
        }

        if (optRegistered && !optHasTeam && isTeamFormat) {
            setStep('team-choice');
            setOpen(true);
            return;
        }

        if (isTeamFormat) {
            setStep('team-choice');
        } else {
            setStep(hasFields ? 'form' : 'confirm');
        }
        setOpen(true);
    };

    // Helper to abstract creation/join API calls
    const checkTeamResult = async (res: Response, resultOrErrorMsg: string) => {
        const data = await res.json();
        if (!res.ok) {
            setTeamError(data.error || resultOrErrorMsg);
            return false;
        } else {
            setTeamResult(data.team);
            return true;
        }
    };

    const handleRegistrationAndTeam = async (teamAction: 'create' | 'join' | 'solo') => {
        if (teamAction === 'create' && !teamName.trim()) {
            setTeamError('Team name is required.');
            return;
        }
        if (teamAction === 'join' && !joinCode.trim()) {
            setTeamError('Please enter a team code.');
            return;
        }

        setTeamLoading(true);
        setTeamError('');

        try {
            // STEP 1: Registration (if not registered)
            if (!optRegistered) {
                const regRes = await registerForEvent(eventId, meta);
                if (!regRes.success) {
                    setTeamError(regRes.message);
                    setTeamLoading(false);
                    return;
                }
                startTransition(() => addOptRegistered(true));
            }

            // STEP 2: Team Action (if not solo)
            if (teamAction === 'create') {
                const res = await fetch('/api/teams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId, teamName: teamName.trim() })
                });
                const ok = await checkTeamResult(res, 'Failed to create team.');
                if (!ok) { setTeamLoading(false); return; }
                startTransition(() => addOptHasTeam(true));
            } else if (teamAction === 'join') {
                const res = await fetch('/api/teams/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId, code: joinCode.trim().toUpperCase() })
                });
                const ok = await checkTeamResult(res, 'Failed to join team.');
                if (!ok) { setTeamLoading(false); return; }
                startTransition(() => addOptHasTeam(true));
            }

            setStep('done');
            router.refresh();

        } catch {
            setTeamError('Something went wrong. Please try again.');
        } finally {
            setTeamLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        startTransition(() => addOptRegistered(true));
        try {
            const res = await registerForEvent(eventId, meta);
            if (res.success) {
                setStep('done');
                router.refresh();
            } else {
                alert(res.message);
                setOpen(false);
            }
        } catch {
            alert("An error occurred. Please try again.");
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        });
    };

    // --- Static Button Rendering ---
    if (optRegistered && (!isTeamFormat || optHasTeam)) {
        return (
            <button disabled className="w-full border-2 border-gray-300 bg-gray-100 px-8 py-4 text-sm font-bold tracking-widest text-gray-500 cursor-not-allowed opacity-75 transition-all">
                ✓ Already Registered
            </button>
        );
    }

    if (!optRegistered && isFull) {
        return (
            <button disabled className="w-full border-2 border-gray-300 bg-gray-100 px-8 py-4 text-sm font-bold tracking-widest text-gray-500 cursor-not-allowed opacity-75">
                Sold Out
            </button>
        );
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className="w-full border-2 border-muted-teal bg-muted-teal px-8 py-4 text-sm font-bold tracking-widest text-white transition hover:bg-white hover:text-muted-teal"
            >
                {optRegistered && !optHasTeam ? 'Set up a Team' : 'Register Now'}
            </button>

            {/* Modal Overlay */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-charcoal-blue/60 backdrop-blur-sm"
                        onClick={() => !loading && !teamLoading && setOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl border-2 border-charcoal-blue mx-4 mb-0 sm:mb-4 animate-in slide-in-from-bottom-4 duration-300">

                        {/* Top accent */}
                        <div className="h-[4px] bg-muted-teal w-full" />

                        {/* Header */}
                        <div className="flex items-start justify-between px-7 py-5 border-b-2 border-soft-slate">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-teal">{eventCategory}</span>
                                <h2 className="text-lg font-bold text-charcoal-blue mt-0.5 leading-tight">
                                    {step === 'done'
                                        ? isTeamFormat ? (teamResult ? (teamResult.leaderId === session?.user?.id ? "Team Created! 🎉" : "Joined Team! 🎉") : "You're registered! 🎉") : "You're in! 🎉"
                                        : step === 'team-choice' ? 'Set Up Your Team'
                                            : step === 'team-create' ? 'Create a Team'
                                                : step === 'team-join' ? 'Join a Team'
                                                    : 'Complete Registration'}
                                </h2>
                                <p className="text-xs text-steel-gray mt-1 truncate max-w-[280px]">{eventTitle}</p>
                            </div>
                            <button onClick={() => !loading && !teamLoading && setOpen(false)} className="text-steel-gray hover:text-charcoal-blue transition-colors ml-4 p-1 shrink-0">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* --- DONE STATE --- */}
                        {step === 'done' && (
                            <div className="px-7 py-8 text-center">
                                <div className="w-16 h-16 bg-muted-teal/10 border-2 border-muted-teal flex items-center justify-center mx-auto mb-5">
                                    <svg className="h-8 w-8 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-charcoal-blue font-bold text-lg">
                                    {isTeamFormat && teamResult ? (teamResult.leaderId === session?.user?.id ? 'Team created!' : 'Joined team!') : 'Registration confirmed!'}
                                </p>

                                {/* Team Code Display for leader */}
                                {teamResult && teamResult.leaderId === session?.user?.id && (
                                    <div className="mt-5 bg-charcoal-blue text-white rounded-none border-2 border-charcoal-blue px-5 py-5 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Your Team Code</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-3xl font-black tracking-[0.25em] text-white">{teamResult.code}</span>
                                            <button
                                                onClick={() => copyCode(teamResult.code)}
                                                className="flex items-center gap-1.5 bg-muted-teal border-2 border-muted-teal text-white px-3 py-2 text-xs font-bold tracking-wider hover:bg-white hover:text-muted-teal transition-all"
                                            >
                                                {copiedCode ? (
                                                    <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied!</>
                                                ) : (
                                                    <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-white/50 mt-2">
                                            Share this code with teammates so they can join your team.
                                            {teamSizeMax ? ` Team capacity: ${teamSizeMax} members.` : ''}
                                        </p>
                                        <p className="text-[11px] text-muted-teal mt-2 font-bold">This code is visible on your ticket at all times.</p>
                                    </div>
                                )}

                                {/* Team info for members (non-leader) */}
                                {teamResult && teamResult.leaderId !== session?.user?.id && (
                                    <div className="mt-5 bg-soft-slate/30 border-2 border-soft-slate px-5 py-4 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-steel-gray mb-2">Your Team</p>
                                        <p className="text-lg font-black text-charcoal-blue">{teamResult.name}</p>
                                        <p className="text-sm text-steel-gray mt-1">{teamResult.members.length} member{teamResult.members.length !== 1 ? 's' : ''}</p>
                                    </div>
                                )}

                                {/* No team chosen */}
                                {!teamResult && (
                                    <p className="text-steel-gray text-sm mt-2">Check your dashboard for your ticket.</p>
                                )}

                                <button onClick={() => { setOpen(false); router.push('/attendee/dashboard'); }}
                                    className="mt-6 w-full bg-muted-teal border-2 border-muted-teal text-white font-bold tracking-widest py-3 text-sm hover:bg-white hover:text-muted-teal transition-all">
                                    View My Ticket
                                </button>
                            </div>
                        )}

                        {/* --- TEAM CHOICE --- */}
                        {step === 'team-choice' && (
                            <div className="px-7 py-6 space-y-4">
                                {!optRegistered && (
                                    <div className="bg-soft-slate/30 border-2 border-soft-slate p-3 mb-2 flex justify-between text-sm">
                                        <span className="font-bold text-charcoal-blue">Registration fee</span>
                                        <span className="font-black text-charcoal-blue">{isFree ? 'Free' : `$${price}`}</span>
                                    </div>
                                )}
                                <p className="text-sm text-steel-gray">
                                    {optRegistered ? `You're registered for this event! Build your team below.` : `Choose how you want to enter this ${eventCategory.toLowerCase()}. You'll be registered automatically.`}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setStep('team-create'); setTeamError(''); setTeamName(''); }}
                                        className="flex flex-col items-center gap-3 border-2 border-soft-slate py-6 px-4 text-center hover:border-charcoal-blue hover:bg-soft-slate/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-signal-orange/10 flex items-center justify-center group-hover:bg-signal-orange/20 transition-colors">
                                            <svg className="h-5 w-5 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-charcoal-blue">Create Team</p>
                                            <p className="text-xs text-steel-gray mt-0.5">Start a new team & get a code</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setStep('team-join'); setTeamError(''); setJoinCode(''); }}
                                        className="flex flex-col items-center gap-3 border-2 border-soft-slate py-6 px-4 text-center hover:border-charcoal-blue hover:bg-soft-slate/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-muted-teal/10 flex items-center justify-center group-hover:bg-muted-teal/20 transition-colors">
                                            <svg className="h-5 w-5 text-muted-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-charcoal-blue">Join Team</p>
                                            <p className="text-xs text-steel-gray mt-0.5">Enter a 6-digit team code</p>
                                        </div>
                                    </button>
                                </div>
                                {!optRegistered && (
                                    <button
                                        onClick={() => handleRegistrationAndTeam('solo')}
                                        disabled={teamLoading}
                                        className="w-full border-2 border-soft-slate py-2.5 text-xs font-bold text-steel-gray hover:text-charcoal-blue transition-all disabled:opacity-50"
                                    >
                                        {teamLoading ? 'Registering...' : (allowSolo ? "Register solo — No team needed" : "Register solo — I'll decide later")}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* --- TEAM CREATE --- */}
                        {step === 'team-create' && (
                            <div className="px-7 py-6 space-y-4">
                                <button onClick={() => setStep('team-choice')} className="flex items-center gap-1.5 text-xs font-bold text-steel-gray hover:text-charcoal-blue transition-colors">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    Back
                                </button>
                                <div>
                                    <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">Team Name <span className="text-signal-orange">*</span></label>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={e => setTeamName(e.target.value)}
                                        placeholder="e.g. Code Wizards"
                                        className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue text-sm"
                                        onKeyDown={e => e.key === 'Enter' && handleRegistrationAndTeam('create')}
                                    />
                                </div>
                                {teamSizeMax && (
                                    <div className="flex items-center gap-2 bg-soft-slate/30 border-2 border-soft-slate px-4 py-2.5">
                                        <svg className="h-4 w-4 text-steel-gray shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-xs text-steel-gray">Max <span className="font-bold text-charcoal-blue">{teamSizeMax}</span> members per team</span>
                                    </div>
                                )}
                                {teamError && (
                                    <p className="text-xs font-bold text-signal-orange">{teamError}</p>
                                )}
                                <p className="text-xs text-steel-gray">A unique 6-character code will be generated for your team. Share it with teammates so they can join.</p>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => setStep('team-choice')} className="flex-1 border-2 border-soft-slate py-3 text-sm font-bold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={() => handleRegistrationAndTeam('create')} disabled={teamLoading}
                                        className="flex-1 bg-signal-orange border-2 border-signal-orange text-white py-3 text-sm font-bold tracking-wider hover:bg-white hover:text-signal-orange transition-all disabled:opacity-50">
                                        {teamLoading ? (!optRegistered ? 'Registering...' : 'Creating...') : (!optRegistered ? 'Register & Create →' : 'Create Team →')}
                                    </button>
                                </div>
                                {!optRegistered && (
                                    <p className="text-center text-[11px] text-steel-gray">By confirming, you will also be registered for this event.</p>
                                )}
                            </div>
                        )}

                        {/* --- TEAM JOIN --- */}
                        {step === 'team-join' && (
                            <div className="px-7 py-6 space-y-4">
                                <button onClick={() => setStep('team-choice')} className="flex items-center gap-1.5 text-xs font-bold text-steel-gray hover:text-charcoal-blue transition-colors">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    Back
                                </button>
                                <div>
                                    <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">Team Code <span className="text-signal-orange">*</span></label>
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                        placeholder="e.g. AB3X7K"
                                        maxLength={6}
                                        className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue text-2xl font-black tracking-[0.25em] text-center uppercase"
                                        onKeyDown={e => e.key === 'Enter' && handleRegistrationAndTeam('join')}
                                    />
                                    <p className="text-xs text-steel-gray mt-1.5 text-center">6-character code from your team leader</p>
                                </div>
                                {teamSizeMax && (
                                    <div className="flex items-center gap-2 bg-soft-slate/30 border-2 border-soft-slate px-4 py-2.5">
                                        <svg className="h-4 w-4 text-steel-gray shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="text-xs text-steel-gray">Max <span className="font-bold text-charcoal-blue">{teamSizeMax}</span> members per team</span>
                                    </div>
                                )}
                                {teamError && (
                                    <p className="text-xs font-bold text-signal-orange">{teamError}</p>
                                )}
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => setStep('team-choice')} className="flex-1 border-2 border-soft-slate py-3 text-sm font-bold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={() => handleRegistrationAndTeam('join')} disabled={teamLoading || joinCode.length < 6}
                                        className="flex-1 bg-muted-teal border-2 border-muted-teal text-white py-3 text-sm font-bold tracking-wider hover:bg-white hover:text-muted-teal transition-all disabled:opacity-50">
                                        {teamLoading ? (!optRegistered ? 'Registering...' : 'Joining...') : (!optRegistered ? 'Register & Join →' : 'Join Team →')}
                                    </button>
                                </div>
                                {!optRegistered && (
                                    <p className="text-center text-[11px] text-steel-gray">By confirming, you will also be registered for this event.</p>
                                )}
                            </div>
                        )}

                        {/* --- CONFIRM STATE (for non-team formats) --- */}
                        {step === 'confirm' && (
                            <div className="px-7 py-6 space-y-5">
                                <div className="bg-soft-slate/30 border-2 border-soft-slate p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-charcoal-blue">Format</span>
                                        <span className="text-steel-gray font-medium">{eventCategory}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-soft-slate pt-2">
                                        <span className="font-bold text-charcoal-blue">Price</span>
                                        <span className="font-black text-charcoal-blue">{isFree ? 'Free' : `$${price}`}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-steel-gray leading-relaxed">By registering, you agree to the event's policies and code of conduct.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setOpen(false)} className="flex-1 border-2 border-soft-slate py-3 text-sm font-bold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSubmit} disabled={loading}
                                        className="flex-1 bg-muted-teal border-2 border-muted-teal text-white py-3 text-sm font-bold tracking-wider hover:bg-white hover:text-muted-teal transition-all disabled:opacity-50">
                                        {loading ? 'Confirming...' : 'Confirm →'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- FORM STATE (format-specific fields, non-team formats) --- */}
                        {step === 'form' && (
                            <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">

                                {/* Workshop / Bootcamp */}
                                {fields.includes('experienceLevel') && (
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-2.5 py-1 inline-block">Skill & Preferences</span>
                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-2">Your Experience Level</label>
                                            <div className="flex gap-2">
                                                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                                                    <button key={level} type="button" onClick={() => setField('experienceLevel', level)}
                                                        className={`flex-1 py-2.5 text-xs font-bold border-2 tracking-wide transition-all ${meta.experienceLevel === level ? 'bg-charcoal-blue border-charcoal-blue text-white' : 'border-soft-slate text-steel-gray hover:border-charcoal-blue'}`}>
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">What do you hope to learn?</label>
                                            <textarea rows={2} value={meta.expectations || ''} onChange={e => setField('expectations', e.target.value)}
                                                placeholder="Share your goals or what you're hoping to get out of this..."
                                                className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none resize-none bg-white text-charcoal-blue text-sm placeholder:text-steel-gray/50" />
                                        </div>
                                    </div>
                                )}

                                {/* Webinar */}
                                {fields.includes('timezone') && (
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-2.5 py-1 inline-block">Webinar Preferences</span>
                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">Your Timezone</label>
                                            <select value={meta.timezone || 'UTC'} onChange={e => setField('timezone', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue text-sm">
                                                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-soft-slate/30 border-2 border-soft-slate">
                                            <div>
                                                <span className="text-sm font-bold text-charcoal-blue">Notify when recording is available</span>
                                                <p className="text-xs text-steel-gray">Get an email when the recording is posted</p>
                                            </div>
                                            <div onClick={() => setField('notifyOnRecording', !meta.notifyOnRecording)}
                                                className={`w-12 h-7 flex items-center p-1 cursor-pointer border-2 transition-colors ${meta.notifyOnRecording ? 'bg-signal-orange border-signal-orange' : 'bg-white border-soft-slate'}`}>
                                                <div className={`w-4 h-4 transition-transform ${meta.notifyOnRecording ? 'translate-x-5 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Dietary */}
                                {fields.includes('dietaryRestrictions') && (
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">Dietary Restrictions / Allergies</label>
                                        <input type="text" value={meta.dietaryRestrictions || ''} onChange={e => setField('dietaryRestrictions', e.target.value)}
                                            placeholder="e.g. Vegetarian, Nut allergy — leave blank if none"
                                            className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue text-sm placeholder:text-steel-gray/50" />
                                    </div>
                                )}

                                {/* Heard about us */}
                                {fields.includes('heardAboutUs') && (
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">How did you hear about this event?</label>
                                        <select value={meta.heardAboutUs || ''} onChange={e => setField('heardAboutUs', e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue text-sm">
                                            <option value="">Select one...</option>
                                            <option value="social">Social media</option>
                                            <option value="friend">Friend or colleague</option>
                                            <option value="email">Email newsletter</option>
                                            <option value="search">Search engine</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                )}

                                {/* Special requirements */}
                                {fields.includes('specialRequirements') && (
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal-blue tracking-wider mb-1.5">Special Requirements</label>
                                        <textarea rows={2} value={meta.specialRequirements || ''} onChange={e => setField('specialRequirements', e.target.value)}
                                            placeholder="Accessibility needs, special seating, etc."
                                            className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none resize-none bg-white text-charcoal-blue text-sm placeholder:text-steel-gray/50" />
                                    </div>
                                )}

                                {/* Summary row */}
                                <div className="bg-soft-slate/30 border-2 border-soft-slate p-3 flex justify-between text-sm">
                                    <span className="font-bold text-charcoal-blue">Registration fee</span>
                                    <span className="font-black text-charcoal-blue">{isFree ? 'Free' : `$${price}`}</span>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button onClick={() => setOpen(false)} className="flex-1 border-2 border-soft-slate py-3 text-sm font-bold text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSubmit} disabled={loading}
                                        className="flex-1 bg-muted-teal border-2 border-muted-teal text-white py-3 text-sm font-bold tracking-wider hover:bg-white hover:text-muted-teal transition-all disabled:opacity-50">
                                        {loading ? 'Confirming...' : 'Confirm Registration →'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
}
