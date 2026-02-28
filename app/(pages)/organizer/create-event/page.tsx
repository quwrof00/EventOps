import React from 'react';
import CreateEventForm from '@/components/CreateEventForm';
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CreateEventPage() {
    const session = await getServerSession(getAuthOptions());

    if (!session || !session.user) {
        redirect(`/login?error=${encodeURIComponent("You must be logged in to create an event.")}`);
    }

    return (
        <div className="min-h-screen bg-[#FFF7ED]">
            <CreateEventForm />
        </div>
    );
}
