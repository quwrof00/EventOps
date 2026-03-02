import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        event: true
      }
    });

    // ticket doesn't exist
    if (!ticket) {
      return NextResponse.json({
        valid: false,
        message: "Invalid Ticket"
      }, { status: 404 });
    }

    // already used
    if (ticket.status === "USED") {
      return NextResponse.json({
        valid: false,
        message: "Ticket already used"
      });
    }

    // mark ticket used
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "USED"
      }
    });

    return NextResponse.json({
      valid: true,
      attendee: ticket.user.name,
      event: ticket.event.title
    });

  } catch (err) {
    return NextResponse.json({
      valid: false,
      message: "Verification failed"
    }, { status: 500 });
  }
}
