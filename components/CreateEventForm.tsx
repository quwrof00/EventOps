"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/data';
import Link from 'next/link';

import dynamic from 'next/dynamic';

// Dynamically import Leaflet component to avoid SSR issues
const LocationPicker = dynamic(() => import('./LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-off-white animate-pulse flex items-center justify-center text-steel-gray">Loading Map...</div>
});

import EventCard from './EventCard';
import { packEventDescription, unpackEventDescription, AgendaItem, Speaker } from '@/lib/event-details';

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
    date: string;
    time: string;
    location: string;
    coordinates?: string; // New field for lat,lng
    description: string; // This will hold the "Overview" text in the form state
    image: string;
    capacity: number;
    price: string;
    isFree: boolean;
    // New fields for form state (packed into description on submit)
    policies: string;
    agenda: AgendaItem[];
    speakers: Speaker[];
}

interface CreateEventFormProps {
    initialData?: EventFormData;
    isEditMode?: boolean;
    eventId?: string;
}

export default function CreateEventForm({ initialData, isEditMode = false, eventId }: CreateEventFormProps) {
    const [step, setStep] = useState(1);
    const defaultFormData: EventFormData = {
        title: '',
        tagline: '',
        category: CATEGORIES[0] || 'Technology',
        date: '',
        time: '',
        location: '',
        description: '',
        image: '/placeholder-1.jpg',
        capacity: 100,
        price: '',
        isFree: false,
        policies: '',
        agenda: [],
        speakers: [],
    };

    const [formData, setFormData] = useState<EventFormData>({
        ...defaultFormData,
        ...initialData,
        // Always guarantee arrays are never undefined even if initialData omits them
        agenda: initialData?.agenda ?? [],
        speakers: initialData?.speakers ?? [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field: string) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
    };

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
                policies: formData.policies
            });

            // Prepare payload - if coordinates exist, append them to location string using a delimiter
            // This is a workaround since we don't have a migration for coordinates column yet
            const payload = {
                ...formData,
                description: descriptionPacked, // Packed JSON
                location: formData.coordinates
                    ? `${formData.location}|${formData.coordinates}`
                    : formData.location
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
                                            <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Category</label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {CATEGORIES.filter(c => c !== "All Events").map(c => (
                                                    <div
                                                        key={c}
                                                        onClick={() => setFormData(prev => ({ ...prev, category: c }))}
                                                        className={`cursor-pointer px-4 py-3 border-2 text-sm font-bold  tracking-wider transition-all text-center
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
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-charcoal-blue  tracking-wider">Location / Venue Name</label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleChange}
                                                        placeholder="Venue name or address"
                                                        className="w-full pl-11 pr-4 py-3 border-2 border-soft-slate focus:border-charcoal-blue focus:ring-0 outline-none transition-all placeholder:text-steel-gray/50 bg-white text-charcoal-blue"
                                                        required
                                                    />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-signal-orange text-lg">📍</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!formData.location) return;
                                                        try {
                                                            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}`);
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
                                                    className="px-4 py-3 bg-charcoal-blue text-white font-bold  tracking-wider text-sm border-2 border-charcoal-blue hover:bg-white hover:text-charcoal-blue transition-colors"
                                                >
                                                    Find
                                                </button>
                                            </div>
                                        </div>

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

                                {/* STEP 4: LINEUP (AGENDA & SPEAKERS) */}
                                {step === 4 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                                        {/* AGENDA SECTION */}
                                        <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                            <div className="flex items-center justify-between border-b-2 border-soft-slate pb-4">
                                                <h3 className="text-lg font-bold text-charcoal-blue  tracking-wide">Agenda</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        agenda: [...prev.agenda, { time: '', title: '', description: '' }]
                                                    }))}
                                                    className="px-4 py-2 bg-charcoal-blue text-white text-xs font-bold  tracking-wider hover:bg-muted-teal transition-colors"
                                                >
                                                    + Add Item
                                                </button>
                                            </div>

                                            {formData.agenda.length === 0 ? (
                                                <div className="text-center py-8 text-steel-gray italic">No agenda items added yet.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {formData.agenda.map((item, index) => (
                                                        <div key={index} className="flex gap-4 items-start bg-off-white p-4 border border-soft-slate relative group">
                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex gap-4">
                                                                    <div className="w-1/3">
                                                                        <label className="text-xs font-bold text-steel-gray ">Time</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.time}
                                                                            onChange={(e) => {
                                                                                const newAgenda = [...formData.agenda];
                                                                                newAgenda[index].time = e.target.value;
                                                                                setFormData(prev => ({ ...prev, agenda: newAgenda }));
                                                                            }}
                                                                            placeholder="10:00 AM"
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="w-2/3">
                                                                        <label className="text-xs font-bold text-steel-gray ">Session Title</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.title}
                                                                            onChange={(e) => {
                                                                                const newAgenda = [...formData.agenda];
                                                                                newAgenda[index].title = e.target.value;
                                                                                setFormData(prev => ({ ...prev, agenda: newAgenda }));
                                                                            }}
                                                                            placeholder="Opening Keynote"
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm font-bold text-charcoal-blue"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-steel-gray ">Description (Optional)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.description}
                                                                        onChange={(e) => {
                                                                            const newAgenda = [...formData.agenda];
                                                                            newAgenda[index].description = e.target.value;
                                                                            setFormData(prev => ({ ...prev, agenda: newAgenda }));
                                                                        }}
                                                                        placeholder="Brief details..."
                                                                        className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newAgenda = formData.agenda.filter((_, i) => i !== index);
                                                                    setFormData(prev => ({ ...prev, agenda: newAgenda }));
                                                                }}
                                                                className="text-red-500 hover:text-red-700 font-bold p-1 self-start"
                                                                title="Remove"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* SPEAKERS SECTION */}
                                        <div className="bg-white p-6 lg:p-8 shadow-sm border-2 border-soft-slate space-y-6">
                                            <div className="flex items-center justify-between border-b-2 border-soft-slate pb-4">
                                                <h3 className="text-lg font-bold text-charcoal-blue  tracking-wide">Speakers</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        speakers: [...prev.speakers, { name: '', role: '', company: '', avatar: '' }]
                                                    }))}
                                                    className="px-4 py-2 bg-charcoal-blue text-white text-xs font-bold  tracking-wider hover:bg-muted-teal transition-colors"
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
                                                                        <label className="text-xs font-bold text-steel-gray ">Name</label>
                                                                        <input
                                                                            type="text"
                                                                            value={speaker.name}
                                                                            onChange={(e) => {
                                                                                const newSpeakers = [...formData.speakers];
                                                                                newSpeakers[index].name = e.target.value;
                                                                                setFormData(prev => ({ ...prev, speakers: newSpeakers }));
                                                                            }}
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm font-bold"
                                                                        />
                                                                    </div>
                                                                    <div className="w-1/2">
                                                                        <label className="text-xs font-bold text-steel-gray ">Company</label>
                                                                        <input
                                                                            type="text"
                                                                            value={speaker.company}
                                                                            onChange={(e) => {
                                                                                const newSpeakers = [...formData.speakers];
                                                                                newSpeakers[index].company = e.target.value;
                                                                                setFormData(prev => ({ ...prev, speakers: newSpeakers }));
                                                                            }}
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-4">
                                                                    <div className="w-1/2">
                                                                        <label className="text-xs font-bold text-steel-gray ">Role</label>
                                                                        <input
                                                                            type="text"
                                                                            value={speaker.role}
                                                                            onChange={(e) => {
                                                                                const newSpeakers = [...formData.speakers];
                                                                                newSpeakers[index].role = e.target.value;
                                                                                setFormData(prev => ({ ...prev, speakers: newSpeakers }));
                                                                            }}
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="w-1/2">
                                                                        <label className="text-xs font-bold text-steel-gray ">Photo URL</label>
                                                                        <input
                                                                            type="text"
                                                                            value={speaker.avatar}
                                                                            onChange={(e) => {
                                                                                const newSpeakers = [...formData.speakers];
                                                                                newSpeakers[index].avatar = e.target.value;
                                                                                setFormData(prev => ({ ...prev, speakers: newSpeakers }));
                                                                            }}
                                                                            placeholder="https://..."
                                                                            className="w-full mt-1 px-3 py-2 border border-soft-slate text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSpeakers = formData.speakers.filter((_, i) => i !== index);
                                                                    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
                                                                }}
                                                                className="text-red-500 hover:text-red-700 font-bold p-1 self-start"
                                                                title="Remove"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
            </div>
        </div>
    );
}
