'use client';

import React, { useState } from 'react';

interface InviteOrganizerPanelProps {
    eventId: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function InviteOrganizerPanel({ eventId }: InviteOrganizerPanelProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        const currentEmail = email.trim().toLowerCase();

        // Optimistic UI update
        setStatus('success');
        setMessage(`Invitation sent to ${currentEmail}`);
        setEmail('');

        try {
            const res = await fetch('/api/organizer/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, email: currentEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || `Invitation sent to ${currentEmail}`);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to send invitation');
                setEmail(currentEmail);
            }
        } catch {
            setStatus('error');
            setMessage('A network error occurred. Please try again.');
            setEmail(currentEmail);
        }
    };

    const reset = () => {
        setStatus('idle');
        setMessage('');
    };

    return (
        <div className="bg-white border-2 border-gray-200 relative overflow-hidden">
            {/* Orange top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-signal-orange" />

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-4 border-b-2 border-gray-100 bg-gray-50 mt-[3px]">
                <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-signal-orange">Team</p>
                    <h3 className="text-sm font-bold text-charcoal-blue mt-0.5">Invite Co-organizer</h3>
                </div>
                {/* Icon */}
                <div className="w-8 h-8 flex items-center justify-center bg-signal-orange/10 border border-signal-orange/20">
                    <svg className="w-4 h-4 text-signal-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
            </div>

            {/* Body */}
            <div className="px-7 py-6">
                <p className="text-[13px] text-steel-gray mb-5 leading-relaxed">
                    Enter the email address of someone you'd like to grant organizer access to this event.
                    They'll receive an email with a link to accept — the invitation expires in <strong className="text-charcoal-blue">48 hours</strong>.
                </p>

                {/* Success state */}
                {status === 'success' && (
                    <div className="flex items-start gap-3 bg-muted-teal/10 border-2 border-muted-teal/30 border-l-4 border-l-muted-teal px-4 py-3.5 mb-5">
                        <svg className="w-4 h-4 text-muted-teal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-charcoal-blue">Invitation sent!</p>
                            <p className="text-[12px] text-steel-gray mt-0.5">{message}</p>
                        </div>
                        <button onClick={reset} className="ml-auto text-steel-gray hover:text-charcoal-blue text-lg leading-none shrink-0">×</button>
                    </div>
                )}

                {/* Error state */}
                {status === 'error' && (
                    <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 border-l-4 border-l-red-400 px-4 py-3.5 mb-5">
                        <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-red-600">Failed to send invite</p>
                            <p className="text-[12px] text-red-500 mt-0.5">{message}</p>
                        </div>
                        <button onClick={reset} className="ml-auto text-red-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleInvite} className="flex gap-3">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="co-organizer@email.com"
                            required
                            disabled={status === 'loading'}
                            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 bg-white text-sm text-charcoal-blue placeholder-gray-400 focus:border-signal-orange focus:outline-none transition disabled:opacity-60"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'loading' || !email.trim()}
                        className="px-5 py-2.5 border-2 border-signal-orange bg-signal-orange text-[12px] font-bold tracking-widest text-white hover:bg-white hover:text-signal-orange transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                        {status === 'loading' ? (
                            <>
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending…
                            </>
                        ) : (
                            'Send Invite'
                        )}
                    </button>
                </form>

                <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                    The invitee must have an EventOps account. They'll be added as a co-organizer the moment they click the link.
                </p>
            </div>
        </div>
    );
}
