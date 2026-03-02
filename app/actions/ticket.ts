'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from 'crypto';

export async function addManualAttendee({
  eventId,
  email,
}: {
  eventId: string;
  email: string;
}) {
  const session = await getServerSession(getAuthOptions());

  if (!session?.user?.id) {
    return { success: false, message: "You must be logged in as organizer" };
  }

  try {
    //Verify organizer permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizers: true },
    });

    if (!event) {
      return { success: false, message: "Event not found" };
    }

    const isOrganizer = event.organizers.some(o => o.id === session.user.id);
    if (!isOrganizer) {
      return { success: false, message: "Not authorized" };
    }

    //Optional: capacity check
    const currentTickets = await prisma.ticket.count({
      where: { eventId },
    });

    if (event.capacity > 0 && currentTickets >= event.capacity) {
      return { success: false, message: "Event capacity reached" };
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, noAccount: true, message: "User does not have an account" };
    }

    //Prevent duplicate ticket
    const existing = await prisma.ticket.findFirst({
      where: {
        eventId,
        userId: user.id,
      },
    });

    if (existing) {
      return { success: false, message: "This person already has a ticket for this event" };
    }

    //Create ticket
    await prisma.ticket.create({
      data: {
        userId: user.id,
        eventId,
        status: "VALID",
      },
    });

    //Connect to participants relation (backward compatibility)
    await prisma.event.update({
      where: { id: eventId },
      data: {
        participants: {
          connect: { id: user.id },
        },
      },
    });

    //Refresh organizer page
    revalidatePath(`/organizer/event/${eventId}`);

    return { success: true, message: "Attendee added successfully" };
  } catch (err: any) {
    console.error("addManualAttendee error:", err);
    return {
      success: false,
      message: err.message?.includes("Unique")
        ? "Email might already exist or duplicate entry"
        : "Failed to add attendee – check server logs"
    };
  }
}