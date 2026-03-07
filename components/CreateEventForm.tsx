"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, POPULAR_TAGS } from '@/lib/data';
import Link from 'next/link';

import dynamic from 'next/dynamic';

// Dynamically import Leaflet component to avoid SSR issues
const LocationPicker = dynamic(() => import('./LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-off-white animate-pulse flex items-center justify-center text-steel-gray">Loading Map...</div>
});

import EventCard from './EventCard';
import { packEventDescription, unpackEventDescription, AgendaItem, Speaker, FormatMeta } from '@/lib/event-details';

// Which lineup sections each format should show by default
const FORMAT_CONFIG: Record<string, { showAgenda: boolean; showSpeakers: boolean; lineupLabel: string }> = {
    Conference: { showAgenda: true, showSpeakers: true, lineupLabel: 'Agenda & Speakers' },
    Hackathon: { showAgenda: true, showSpeakers: false, lineupLabel: 'Schedule' },
    Workshop: { showAgenda: false, showSpeakers: false, lineupLabel: 'Lineup' },
    Meetup: { showAgenda: false, showSpeakers: false, lineupLabel: 'Lineup' },
    Webinar: { showAgenda: false, showSpeakers: true, lineupLabel: 'Presenters' },
    Competition: { showAgenda: true, showSpeakers: false, lineupLabel: 'Schedule' },
    Expo: { showAgenda: false, showSpeakers: true, lineupLabel: 'Exhibitors & Speakers' },
    Bootcamp: { showAgenda: true, showSpeakers: false, lineupLabel: 'Curriculum' },
};

// Detailed steps for the form wizard
const STEPS = [
    { number: 1, title: 'Basics', description: 'Title, tagline & category' },
    { number: 2, title: 'When & Where', description: 'Date, time & location' },
    { number: 3, title: 'Details', description: 'Description & Policies' },
    { number: 4, title: 'Lineup', description: 'Agenda & Speakers' },
    { number: 5, title: 'Ticketing', description: 'Price & final review' },
];

interface EventFormData {
    title: string;
    tagline: string;
    category: string;
    tags: string[];
    date: string;
    time: string;
    location: string;
    venueName?: string;
    city?: string;
    country?: string;
    coordinates?: string;
    description: string;
    image: string;
    capacity: number;
    price: string;
    isFree: boolean;
    policies: string;
    agenda: AgendaItem[];
    speakers: Speaker[];
    // Format-specific extra fields
    formatMeta: FormatMeta;
}

interface CreateEventFormProps {
    initialData?: Partial<EventFormData>;
    isEditMode?: boolean;
    eventId?: string;
}

export default function CreateEventForm({ initialData, isEditMode = false, eventId }: CreateEventFormProps) {
    const [step, setStep] = useState(1);
    const defaultFormData: EventFormData = {
        title: '',
        tagline: '',
        category: 'Conference',
        tags: [],
        date: '',
        time: '',
        location: '',
        venueName: '',
        city: '',
        country: '',
        description: '',
        image: '/placeholder-1.jpg',
        capacity: 100,
        price: '',
        isFree: false,
        policies: '',
        agenda: [],
        speakers: [],
        formatMeta: {},
    };

    const [formData, setFormData] = useState<EventFormData>(() => {
        const initialLocationStr = initialData?.location || '';
        const isRemoteInit = initialData?.formatMeta?.isRemote || false;
        let initVenue = '', initCity = '', initCountry = '';
        if (!isRemoteInit && initialLocationStr && initialLocationStr !== 'Online') {
            const parts = initialLocationStr.split(', ').map(s => s.trim());
            if (parts.length >= 3) {
                initVenue = parts.slice(0, parts.length - 2).join(', ');
                initCity = parts[parts.length - 2];
                initCountry = parts[parts.length - 1];
            } else {
                initVenue = initialLocationStr;
            }
        }

        return {
            ...defaultFormData,
            ...initialData,
            venueName: initVenue,
            city: initCity,
            country: initCountry,
            agenda: initialData?.agenda ?? [],
            speakers: initialData?.speakers ?? [],
            tags: initialData?.tags ?? [],
            formatMeta: initialData?.formatMeta ?? {},
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field: string) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
    };

    const handleMetaChange = (key: keyof FormatMeta, value: string | boolean) => {
        setFormData(prev => ({ ...prev, formatMeta: { ...prev.formatMeta, [key]: value } }));
    };

    // Derived format config (falls back to conference defaults)
    const fmtConfig = FORMAT_CONFIG[formData.category] ?? FORMAT_CONFIG['Conference'];

    const nextStep = () => setStep(prev => Math.min(prev + 1, STEPS.length));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState('');

    const handleImageUpload = async (file: File) => {
        setImageUploading(true);
        setImageUploadError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (err) {
            setImageUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation if strictly needed, otherwise trust backend
        if (step !== STEPS.length) {
            // Just in case they somehow triggered submit early
            return;
        }

        setIsSubmitting(true);
        // Optimistically set to success to immediately update button UI
        setIsSuccess(true);

        try {
            // Pack details into description field
            const descriptionPacked = packEventDescription({
                overview: formData.description,
                agenda: formData.agenda,
                speakers: formData.speakers,
                policies: formData.policies,
                formatMeta: formData.formatMeta,
            });

            const finalLocation = formData.formatMeta.isRemote
                ? formData.location
                : [formData.venueName, formData.city, formData.country].filter(Boolean).join(', ');

            const { venueName, city, country, ...restFormData } = formData;
            // Prepare payload - if coordinates exist, append them to location string using a delimiter
            // This is a workaround since we don't have a migration for coordinates column yet
            const payload = {
                ...restFormData,
                description: descriptionPacked, // Packed JSON
                location: formData.coordinates
                    ? `${finalLocation}|${formData.coordinates}`
                    : finalLocation
            };

            const url = isEditMode && eventId ? `/api/events/${eventId}` : '/api/events/create';
            const method = isEditMode && eventId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Redirect to the new event page or dashboard
            router.push(`/organizer/dashboard`); // Or `/events/${data.eventId}`
            router.refresh();

        } catch (error) {
            setIsSuccess(false);
            console.error("Submission error:", error);
            alert(error instanceof Error ? error.message : "Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate progress percentage
    const progress = (step / STEPS.length) * 100;
    const currentStepInfo = STEPS[step - 1];

    return (
        <div className="flex flex-col h-screen pt-[72px] overflow-hidden bg-off-white font-sans">
            {/* Progress Line - Fixed to top of content area */}
            <div className="w-full bg-soft-slate h-1 shrink-0">
                <div
                    className="h-full bg-signal-orange transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDE - NAVIGATION & CONTEXT (35%) */}
                <div className="hidden lg:flex w-[35%] flex-col h-full bg-white border-r-2 border-soft-slate overflow-y-auto">
                    <div className="p-10 flex flex-col min-h-full">

                        {/* Current Step Focus Header */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-10 h-10 bg-signal-orange/10 text-signal-orange font-bold text-lg">
                                    {step}
                                </span>
                                <span className="text-sm font-bold tracking-wider text-signal-orange ">Current Step</span>
                            </div>
                            <h1 className="text-4xl font-bold text-charcoal-blue tracking-tight leading-tight ">
                                {currentStepInfo.title}
                            </h1>
                            <p className="mt-4 text-lg text-steel-gray">
                                {currentStepInfo.description}
                            </p>
                        </div>

                        {/* Vertical Stepper Navigation */}
                        <div className="flex-1 space-y-2 mb-10">
                            {STEPS.map((s) => (
                                <div
                                    key={s.number}
                                    className={`flex items-center p-3 border-l-4 transition-all ${s.number === step
                                        ? 'bg-signal-orange/5 border-signal-orange'
                                        : s.number < step
                                            ? 'text-signal-orange border-signal-orange'
                                            : 'text-steel-gray border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon/Number */}
                                        <div className={`
                                            w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-colors
                                            ${s.number === step ? 'border-signal-orange bg-signal-orange text-white' :
                                                s.number < step ? 'border-signal-orange bg-signal-orange text-white' :
                                                    'border-soft-slate text-steel-gray'}
                                        `}>
                                            {s.number < step ? '✓' : s.number}
                                        </div>
                                        {/* Text */}
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold  tracking-wide ${s.number === step ? 'text-charcoal-blue' : ''}`}>
                                                {s.title}
                                            </span>
                                        </div>
                                    </div>
                                    {s.number === step && (
                                        <div className="ml-auto w-2 h-2 bg-signal-orange animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Formatting Tip Box */}
                        <div className="bg-off-white p-5 border-2 border-soft-slate mt-auto">
                            <div className="flex gap-3">
                                <span className="text-xl">💡</span>
                                <p className="text-sm text-steel-gray leading-relaxed font-medium">
                                    {step === 1 && "Catchy titles get 40% more clicks. Keep it short!"}
                                    {step === 2 && "70% of attendees check the map first."}
                                    {step === 3 && "High-quality images drive sales."}
                                    {step === 4 && "Early bird pricing boosts signs-ups."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - FORM (65%) */}
                <div className="w-full lg:w-[65%] flex flex-col h-full bg-off-white/50 relative">

                    {/* Mobile Header */}
                    <div className="lg:hidden p-6 border-b-2 border-soft-slate bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold bg-signal-orange/10 text-signal-orange px-2 py-1  tracking-wider">Step {step} of 4</span>
                        </div>
                        <h2 className="text-xl font-bold text-charcoal-blue  tracking-tight">{currentStepInfo.title}</h2>
                    </div>

                    {/* SCROLLABLE FORM AREA */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="w-full h-full p-6 lg:p-12">
                            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Form fields rendered here */}
                                {/* STEP 1: BASICS */}
                                {step === 1 && (
                                    <>
                                        <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Event Title</label>
                                                <input
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Global Developer Summit 2026"
                                                    className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all placeholder:text-steel-gray/50 font-medium bg-white text-charcoal-blue"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Tagline</label>
                                                <input
                                                    type="text"
                                                    name="tagline"
                                                    value={formData.tagline}
                                                    onChange={handleChange}
                                                    placeholder="Short & sweet description"
                                                    className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all placeholder:text-steel-gray/50 bg-white text-charcoal-blue"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-charcoal-blue tracking-wider mb-3">Event Format</label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {CATEGORIES.filter(c => c !== "All Events").map(c => (
                                                        <div
                                                            key={c}
                                                            onClick={() => setFormData(prev => ({ ...prev, category: c }))}
                                                            className={`cursor-pointer px-4 py-3 border-2 text-sm font-bold tracking-wider transition-all text-center
                                                                ${formData.category === c
                                                                    ? 'border-charcoal-blue bg-charcoal-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                                                                    : 'border-soft-slate text-steel-gray hover:border-charcoal-blue hover:text-charcoal-blue'
                                                                }`}
                                                        >
                                                            {c}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t-2 border-soft-slate">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Tags <span className="text-steel-gray font-normal normal-case tracking-normal">(pick all that apply)</span></label>
                                                    {formData.tags.length > 0 && (
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: [] }))} className="text-xs text-steel-gray hover:text-signal-orange font-bold transition-colors">
                                                            Clear all
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {POPULAR_TAGS.map(tag => {
                                                        const isSelected = formData.tags.includes(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({
                                                                    ...prev,
                                                                    tags: isSelected
                                                                        ? prev.tags.filter(t => t !== tag)
                                                                        : [...prev.tags, tag]
                                                                }))}
                                                                className={`px-3 py-1.5 text-xs font-bold tracking-wide border-2 transition-all
                                                                    ${isSelected
                                                                        ? 'bg-muted-teal border-muted-teal text-white shadow-[2px_2px_0px_0px_rgba(15,118,110,0.4)]'
                                                                        : 'border-soft-slate text-steel-gray hover:border-muted-teal hover:text-muted-teal bg-white'
                                                                    }`}
                                                            >
                                                                {isSelected ? '✓ ' : ''}{tag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {formData.tags.length > 0 && (
                                                    <p className="mt-2 text-xs text-muted-teal font-bold">{formData.tags.length} tag{formData.tags.length > 1 ? 's' : ''} selected</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* STEP 2: TIME & PLACE */}
                                {step === 2 && (
                                    <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Date</label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all bg-white text-charcoal-blue"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Starts At</label>
                                                <input
                                                    type="text"
                                                    name="time"
                                                    value={formData.time}
                                                    onChange={handleChange}
                                                    placeholder="09:00 AM"
                                                    className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all bg-white text-charcoal-blue placeholder:text-steel-gray/50"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b-2 border-soft-slate mb-4">
                                            <div>
                                                <span className="block text-sm font-bold text-charcoal-blue">Online / Remote Event</span>
                                                <span className="text-xs text-steel-gray">This event is held virtually</span>
                                            </div>
                                            <div onClick={() => {
                                                handleMetaChange('isRemote', !formData.formatMeta.isRemote);
                                                if (!formData.formatMeta.isRemote) {
                                                    setFormData(prev => ({ ...prev, location: 'Online', coordinates: '' }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, location: '' }));
                                                }
                                            }} className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.formatMeta.isRemote ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}>
                                                <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.formatMeta.isRemote ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">{formData.formatMeta.isRemote ? 'Platform / Link (Optional)' : 'Venue Name'}</label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        name={formData.formatMeta.isRemote ? "location" : "venueName"}
                                                        value={formData.formatMeta.isRemote ? formData.location : formData.venueName}
                                                        onChange={handleChange}
                                                        placeholder={formData.formatMeta.isRemote ? "e.g. Zoom, Discord, Google Meet" : "Venue name or address"}
                                                        className="w-full pl-11 pr-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all placeholder:text-steel-gray/50 bg-white text-charcoal-blue"
                                                        required={!formData.formatMeta.isRemote}
                                                    />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-signal-orange text-lg">{formData.formatMeta.isRemote ? '🌐' : '📍'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!formData.formatMeta.isRemote && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">City</label>
                                                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="e.g. San Francisco" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all bg-white text-charcoal-blue" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Country</label>
                                                    <input type="text" name="country" value={formData.country || ''} onChange={handleChange} placeholder="e.g. United States" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all bg-white text-charcoal-blue" required />
                                                </div>
                                            </div>
                                        )}

                                        {!formData.formatMeta.isRemote && (
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const query = [formData.venueName, formData.city, formData.country].filter(Boolean).join(', ');
                                                        if (!query) return;
                                                        try {
                                                            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                                            const data = await res.json();
                                                            if (data && data[0]) {
                                                                const coords = `${data[0].lat},${data[0].lon}`;
                                                                setFormData(prev => ({ ...prev, coordinates: coords }));
                                                            } else {
                                                                alert('Location not found');
                                                            }
                                                        } catch (e) {
                                                            console.error(e);
                                                            alert('Failed to fetch coordinates');
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-charcoal-blue text-white font-bold tracking-wider text-sm border-2 border-charcoal-blue hover:bg-white hover:text-charcoal-blue transition-colors"
                                                >
                                                    Find Coordinates on Map
                                                </button>
                                            </div>
                                        )}

                                        {!formData.formatMeta.isRemote && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Pin on Map</label>
                                                    <span className="text-xs text-steel-gray">Optional</span>
                                                </div>
                                                <div className="overflow-hidden border-2 border-soft-slate">
                                                    <LocationPicker
                                                        value={formData.coordinates || ''}
                                                        onChange={(coords) => setFormData(prev => ({ ...prev, coordinates: coords }))}
                                                    />
                                                </div>
                                                <p className="text-xs text-steel-gray">Click on the map to set precise location.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 3: DETAILS */}
                                {step === 3 && (
                                    <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Description</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={8}
                                                placeholder="Tell attendees what makes this event unmissable..."
                                                className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all resize-none placeholder:text-steel-gray/50 bg-white text-charcoal-blue"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Cover Image</label>
                                                {formData.image && formData.image !== '/placeholder-1.jpg' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, image: '/placeholder-1.jpg' }))}
                                                        className="text-xs text-steel-gray hover:text-red-500 transition-colors font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            {/* Upload zone */}
                                            {(!formData.image || formData.image === '/placeholder-1.jpg') ? (
                                                <label
                                                    htmlFor="cover-image-upload"
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const file = e.dataTransfer.files[0];
                                                        if (file) handleImageUpload(file);
                                                    }}
                                                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed cursor-pointer transition-all
                                                        ${imageUploading
                                                            ? 'border-signal-orange bg-signal-orange/5'
                                                            : 'border-soft-slate bg-off-white hover:border-charcoal-blue hover:bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        id="cover-image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="sr-only"
                                                        disabled={imageUploading}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleImageUpload(file);
                                                        }}
                                                    />
                                                    {imageUploading ? (
                                                        <>
                                                            <svg className="animate-spin h-8 w-8 text-signal-orange mb-3" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            <p className="text-sm font-bold text-signal-orange tracking-wide">Uploading...</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="h-10 w-10 text-steel-gray/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="text-sm font-bold text-charcoal-blue">Drop image here or <span className="text-signal-orange">browse</span></p>
                                                            <p className="text-xs text-steel-gray/60 mt-1">PNG, JPG, WEBP up to 10MB · Auto-cropped to 1200×630</p>
                                                        </>
                                                    )}
                                                </label>
                                            ) : (
                                                /* Preview */
                                                <div className="relative w-full h-48 border-2 border-soft-slate overflow-hidden group">
                                                    <img
                                                        src={formData.image}
                                                        alt="Cover preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <label htmlFor="cover-image-replace" className="cursor-pointer px-4 py-2 bg-white text-charcoal-blue text-xs font-bold tracking-wider hover:bg-off-white transition-colors">
                                                            Replace Image
                                                        </label>
                                                        <input
                                                            id="cover-image-replace"
                                                            type="file"
                                                            accept="image/*"
                                                            className="sr-only"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(file);
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Uploaded badge */}
                                                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 text-white">
                                                        <svg className="h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-[10px] font-bold tracking-wider text-green-400">Uploaded to Cloudinary</span>
                                                    </div>
                                                </div>
                                            )}

                                            {imageUploadError && (
                                                <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {imageUploadError}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Total Capacity</label>
                                            <input
                                                type="number"
                                                name="capacity"
                                                value={formData.capacity}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all bg-white text-charcoal-blue"
                                            />
                                        </div>

                                        {/* FORMAT-SPECIFIC FIELDS */}
                                        {(['Hackathon', 'Competition'].includes(formData.category)) && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-5">
                                                <div className="border-b-2 border-soft-slate pb-4 flex items-center gap-3">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-3 py-1.5">{formData.category} Details</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Min Team Size</label>
                                                        <input type="number" min={1} value={formData.formatMeta.teamSizeMin || ''} onChange={e => handleMetaChange('teamSizeMin', e.target.value)} placeholder="1" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Max Team Size</label>
                                                        <input type="number" min={1} value={formData.formatMeta.teamSizeMax || ''} onChange={e => handleMetaChange('teamSizeMax', e.target.value)} placeholder="5" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-t border-b border-soft-slate my-2">
                                                    <div>
                                                        <span className="block text-sm font-bold text-charcoal-blue">Allow Solo Participants</span>
                                                        <span className="text-xs text-steel-gray">Users can register without a team</span>
                                                    </div>
                                                    <div onClick={() => handleMetaChange('allowSolo', !formData.formatMeta.allowSolo)} className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.formatMeta.allowSolo ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}>
                                                        <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.formatMeta.allowSolo ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Prize Pool</label>
                                                    <input type="text" value={formData.formatMeta.prizePool || ''} onChange={e => handleMetaChange('prizePool', e.target.value)} placeholder="e.g. $10,000 in prizes — 1st: $5k, 2nd: $3k, 3rd: $2k" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue placeholder:text-steel-gray/50" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Submission Deadline</label>
                                                    <input type="datetime-local" value={formData.formatMeta.submissionDeadline || ''} onChange={e => handleMetaChange('submissionDeadline', e.target.value)} className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Judging Criteria</label>
                                                    <textarea rows={3} value={formData.formatMeta.judgingCriteria || ''} onChange={e => handleMetaChange('judgingCriteria', e.target.value)} placeholder="e.g. Innovation (30%), Technical execution (40%), Presentation (30%)" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none resize-none bg-white text-charcoal-blue placeholder:text-steel-gray/50" />
                                                </div>
                                            </div>
                                        )}

                                        {(['Workshop', 'Bootcamp'].includes(formData.category)) && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-5">
                                                <div className="border-b-2 border-soft-slate pb-4">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-3 py-1.5">{formData.category} Details</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Skill Level</label>
                                                    <div className="flex gap-3">
                                                        {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                                                            <button key={level} type="button" onClick={() => handleMetaChange('skillLevel', level)}
                                                                className={`flex-1 py-3 text-sm font-bold border-2 tracking-wide transition-all ${formData.formatMeta.skillLevel === level
                                                                    ? 'bg-charcoal-blue border-charcoal-blue text-white'
                                                                    : 'border-soft-slate text-steel-gray hover:border-charcoal-blue'
                                                                    }`}>
                                                                {level}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Prerequisites</label>
                                                    <textarea rows={3} value={formData.formatMeta.prerequisites || ''} onChange={e => handleMetaChange('prerequisites', e.target.value)} placeholder="e.g. Basic knowledge of Python, GitHub account" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none resize-none bg-white text-charcoal-blue placeholder:text-steel-gray/50" />
                                                </div>
                                                {formData.category === 'Bootcamp' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Duration (weeks)</label>
                                                        <input type="number" min={1} value={formData.formatMeta.durationWeeks || ''} onChange={e => handleMetaChange('durationWeeks', e.target.value)} placeholder="8" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue" />
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between py-3 border-t-2 border-soft-slate">
                                                    <div>
                                                        <span className="block text-sm font-bold text-charcoal-blue">Materials Provided</span>
                                                        <span className="text-xs text-steel-gray">Slides, worksheets, or kits included</span>
                                                    </div>
                                                    <div onClick={() => handleMetaChange('materialsProvided', !formData.formatMeta.materialsProvided)} className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.formatMeta.materialsProvided ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}>
                                                        <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.formatMeta.materialsProvided ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                                    </div>
                                                </div>
                                                {formData.category === 'Bootcamp' && (
                                                    <div className="flex items-center justify-between py-3 border-t-2 border-soft-slate">
                                                        <div>
                                                            <span className="block text-sm font-bold text-charcoal-blue">Certificate of Completion</span>
                                                            <span className="text-xs text-steel-gray">Participants receive a certificate</span>
                                                        </div>
                                                        <div onClick={() => handleMetaChange('hasCertificate', !formData.formatMeta.hasCertificate)} className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.formatMeta.hasCertificate ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}>
                                                            <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.formatMeta.hasCertificate ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {formData.category === 'Webinar' && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-5">
                                                <div className="border-b-2 border-soft-slate pb-4">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-3 py-1.5">Webinar Details</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Meeting / Stream Link</label>
                                                    <input type="url" value={formData.formatMeta.meetingLink || ''} onChange={e => handleMetaChange('meetingLink', e.target.value)} placeholder="https://zoom.us/j/... or https://meet.google.com/..." className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue placeholder:text-steel-gray/50" />
                                                    <p className="text-xs text-steel-gray">Shared with registered attendees only.</p>
                                                </div>
                                                <div className="flex items-center justify-between py-3 border-t-2 border-soft-slate">
                                                    <div>
                                                        <span className="block text-sm font-bold text-charcoal-blue">Recording Available</span>
                                                        <span className="text-xs text-steel-gray">Attendees can watch back after the session</span>
                                                    </div>
                                                    <div onClick={() => handleMetaChange('recordingAvailable', !formData.formatMeta.recordingAvailable)} className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.formatMeta.recordingAvailable ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}>
                                                        <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.formatMeta.recordingAvailable ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {formData.category === 'Meetup' && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-5">
                                                <div className="border-b-2 border-soft-slate pb-4">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-3 py-1.5">Meetup Details</span>
                                                </div>
                                                <div className="flex items-center justify-between py-3">
                                                    <div>
                                                        <span className="block text-sm font-bold text-charcoal-blue">Recurring Meetup</span>
                                                        <span className="text-xs text-steel-gray">This meetup repeats on a schedule</span>
                                                    </div>
                                                    <div onClick={() => handleMetaChange('isRecurring', !formData.formatMeta.isRecurring)} className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.formatMeta.isRecurring ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}>
                                                        <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.formatMeta.isRecurring ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                                    </div>
                                                </div>
                                                {formData.formatMeta.isRecurring && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <label className="block text-sm font-bold text-charcoal-blue tracking-wider">Recurrence Schedule</label>
                                                        <input type="text" value={formData.formatMeta.recurringSchedule || ''} onChange={e => handleMetaChange('recurringSchedule', e.target.value)} placeholder="e.g. Every 1st Thursday of the month" className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none bg-white text-charcoal-blue placeholder:text-steel-gray/50" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Event Policies</label>
                                                <textarea
                                                    name="policies"
                                                    value={formData.policies}
                                                    onChange={handleChange}
                                                    rows={4}
                                                    placeholder="e.g. Non-refundable, Code of Conduct..."
                                                    className="w-full px-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all resize-none placeholder:text-steel-gray/50 bg-white text-charcoal-blue"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: LINEUP — gated by format */}
                                {step === 4 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                                        {/* Format context header */}
                                        <div className="flex items-center gap-3 px-1">
                                            <span className="text-xs font-bold uppercase tracking-widest text-signal-orange bg-signal-orange/10 px-3 py-1.5">{formData.category}</span>
                                            <span className="text-sm text-steel-gray font-medium">{fmtConfig.lineupLabel}</span>
                                        </div>

                                        {/* AGENDA — shown for Conference, Hackathon, Competition, Bootcamp */}
                                        {fmtConfig.showAgenda && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                                <div className="flex items-center justify-between border-b-2 border-soft-slate pb-4">
                                                    <h3 className="text-lg font-bold text-charcoal-blue tracking-wide">
                                                        {formData.category === 'Bootcamp' ? 'Curriculum / Schedule' : 'Agenda'}
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            agenda: [...prev.agenda, { time: '', title: '', description: '' }]
                                                        }))}
                                                        className="px-4 py-2 bg-charcoal-blue text-white text-xs font-bold tracking-wider hover:bg-muted-teal transition-colors"
                                                    >
                                                        + Add Item
                                                    </button>
                                                </div>

                                                {formData.agenda.length === 0 ? (
                                                    <div className="text-center py-8 text-steel-gray italic">No items added yet.</div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {formData.agenda.map((item, index) => (
                                                            <div key={index} className="flex gap-4 items-start bg-off-white p-4 border border-soft-slate relative group">
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex gap-4">
                                                                        <div className="w-1/3">
                                                                            <label className="text-xs font-bold text-steel-gray">Time / Phase</label>
                                                                            <input
                                                                                type="text"
                                                                                value={item.time}
                                                                                onChange={(e) => {
                                                                                    const n = [...formData.agenda]; n[index].time = e.target.value;
                                                                                    setFormData(prev => ({ ...prev, agenda: n }));
                                                                                }}
                                                                                placeholder="10:00 AM"
                                                                                className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="w-2/3">
                                                                            <label className="text-xs font-bold text-steel-gray">Title</label>
                                                                            <input
                                                                                type="text"
                                                                                value={item.title}
                                                                                onChange={(e) => {
                                                                                    const n = [...formData.agenda]; n[index].title = e.target.value;
                                                                                    setFormData(prev => ({ ...prev, agenda: n }));
                                                                                }}
                                                                                placeholder="Opening Keynote"
                                                                                className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm font-bold text-charcoal-blue"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-bold text-steel-gray">Description (Optional)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.description}
                                                                            onChange={(e) => {
                                                                                const n = [...formData.agenda]; n[index].description = e.target.value;
                                                                                setFormData(prev => ({ ...prev, agenda: n }));
                                                                            }}
                                                                            placeholder="Brief details..."
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, agenda: prev.agenda.filter((_, i) => i !== index) }))} className="text-red-500 hover:text-red-700 font-bold p-1 self-start">×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SPEAKERS — shown for Conference, Webinar, Expo */}
                                        {fmtConfig.showSpeakers && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                                <div className="flex items-center justify-between border-b-2 border-soft-slate pb-4">
                                                    <h3 className="text-lg font-bold text-charcoal-blue tracking-wide">
                                                        {formData.category === 'Webinar' ? 'Presenters' : formData.category === 'Expo' ? 'Featured Speakers' : 'Speakers'}
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            speakers: [...prev.speakers, { name: '', role: '', company: '', avatar: '' }]
                                                        }))}
                                                        className="px-4 py-2 bg-charcoal-blue text-white text-xs font-bold tracking-wider hover:bg-muted-teal transition-colors"
                                                    >
                                                        + Add Speaker
                                                    </button>
                                                </div>

                                                {formData.speakers.length === 0 ? (
                                                    <div className="text-center py-8 text-steel-gray italic">No speakers added yet.</div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {formData.speakers.map((speaker, index) => (
                                                            <div key={index} className="flex gap-4 items-start bg-off-white p-4 border border-soft-slate relative">
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex gap-4">
                                                                        <div className="w-1/2">
                                                                            <label className="text-xs font-bold text-steel-gray">Name</label>
                                                                            <input type="text" value={speaker.name} onChange={(e) => { const n = [...formData.speakers]; n[index].name = e.target.value; setFormData(prev => ({ ...prev, speakers: n })); }} className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm font-bold" />
                                                                        </div>
                                                                        <div className="w-1/2">
                                                                            <label className="text-xs font-bold text-steel-gray">Company</label>
                                                                            <input type="text" value={speaker.company} onChange={(e) => { const n = [...formData.speakers]; n[index].company = e.target.value; setFormData(prev => ({ ...prev, speakers: n })); }} className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="w-1/2">
                                                                            <label className="text-xs font-bold text-steel-gray">Role / Title</label>
                                                                            <input type="text" value={speaker.role} onChange={(e) => { const n = [...formData.speakers]; n[index].role = e.target.value; setFormData(prev => ({ ...prev, speakers: n })); }} className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm" />
                                                                        </div>
                                                                        <div className="w-1/2">
                                                                            <label className="text-xs font-bold text-steel-gray">Photo URL</label>
                                                                            <input type="text" value={speaker.avatar} onChange={(e) => { const n = [...formData.speakers]; n[index].avatar = e.target.value; setFormData(prev => ({ ...prev, speakers: n })); }} placeholder="https://..." className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, speakers: prev.speakers.filter((_, i) => i !== index) }))} className="text-red-500 hover:text-red-700 font-bold p-1 self-start">×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Formats with no agenda or speakers — Meetup, Workshop */}
                                        {!fmtConfig.showAgenda && !fmtConfig.showSpeakers && (
                                            <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate">
                                                <div className="flex items-center gap-3 text-steel-gray py-8 justify-center">
                                                    <svg className="h-8 w-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                    <p className="text-sm font-medium italic">No schedule or speakers needed for a {formData.category}. Move on to ticketing!</p>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}

                                {/* STEP 5: TICKETS */}
                                {step === 5 && (
                                    <>
                                        <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="block font-bold text-charcoal-blue text-lg  tracking-wide">Free Event</span>
                                                    <span className="text-steel-gray text-sm">Tickets will be free for everyone</span>
                                                </div>
                                                <div
                                                    onClick={() => handleToggle('isFree')}
                                                    className={`w-14 h-8 flex items-center p-1 cursor-pointer transition-colors border-2 ${formData.isFree ? 'bg-signal-orange border-signal-orange' : 'bg-transparent border-soft-slate'}`}
                                                >
                                                    <div className={`w-5 h-5 shadow-sm transform transition-transform ${formData.isFree ? 'translate-x-6 bg-white' : 'translate-x-0 bg-charcoal-blue'}`} />
                                                </div>
                                            </div>

                                            {!formData.isFree && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-6 border-t-2 border-soft-slate">
                                                    <label className="block text-sm font-bold text-charcoal-blue  tracking-wider mb-2">Ticket Price</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-steel-gray font-bold text-lg">$</span>
                                                        <input
                                                            type="text"
                                                            name="price"
                                                            value={formData.price}
                                                            onChange={handleChange}
                                                            placeholder="0.00"
                                                            className="w-full pl-8 pr-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all bg-white font-bold text-xl text-charcoal-blue placeholder:text-steel-gray/50"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-transparent pt-6">
                                            <h3 className="text-sm font-bold text-steel-gray  tracking-wider mb-6">Event Card Preview</h3>
                                            <div className="max-w-md mx-auto transform transition-all hover:scale-105 duration-300">
                                                <EventCard
                                                    event={{
                                                        title: formData.title,
                                                        category: formData.category,
                                                        date: formData.date ? new Date(formData.date) : new Date(),
                                                        image: formData.image,
                                                        isFree: formData.isFree,
                                                        price: formData.price,
                                                        location: formData.location,
                                                        displayLocation: formData.location ? formData.location.split('|')[0] : 'TBD',
                                                        attendees: 0,
                                                        spotsLeft: formData.capacity,
                                                        capacity: formData.capacity,
                                                        participants: []
                                                    }}
                                                    href="#"
                                                />
                                            </div>
                                            <p className="text-center text-xs text-steel-gray mt-4">
                                                This is how your event will appear in the events list.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Footer / Controls */}
                    <div className="p-6 lg:px-10 border-t-2 border-soft-slate bg-white shrink-0">
                        <div className="w-full flex items-center justify-between">
                            <button
                                type="button"
                                onClick={step > 1 ? prevStep : undefined}
                                className={`text-steel-gray font-bold  tracking-wider hover:text-charcoal-blue px-4 py-2 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                            >
                                Back
                            </button>

                            {step < STEPS.length ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-signal-orange hover:bg-signal-orange/90 text-white px-8 py-3 font-bold  tracking-wider transition-all border-2 border-signal-orange hover:shadow-[4px_4px_0px_0px_rgba(194,65,12,0.5)]"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="bg-signal-orange hover:bg-signal-orange/90 text-white px-8 py-3 font-bold  tracking-wider transition-all border-2 border-signal-orange hover:shadow-[4px_4px_0px_0px_rgba(194,65,12,0.5)]"
                                >
                                    {isSuccess ? (isEditMode ? 'Saved! Redirecting...' : 'Published! Redirecting...') : (isSubmitting ? 'Creating...' : (isEditMode ? 'Save Changes' : 'Publish Event'))}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
