'use client';

import { useState } from 'react';

export default function TeamCodeDisplay({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-2xl font-black tracking-[0.25em] text-white">{code}</span>
            <button
                onClick={copy}
                className="flex items-center gap-1.5 bg-muted-teal border-2 border-muted-teal text-white px-3 py-1.5 text-[11px] font-bold tracking-wider hover:bg-white hover:text-muted-teal transition-all"
            >
                {copied ? (
                    <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                    </>
                ) : (
                    <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                    </>
                )}
            </button>
        </div>
    );
}
