
export interface AgendaItem {
    time: string;
    title: string;
    description: string;
}

export interface Speaker {
    name: string;
    role: string;
    company: string;
    avatar: string;
}

// Format-specific metadata — different fields per event format
export interface FormatMeta {
    // General
    isRemote?: boolean;

    // Hackathon / Competition
    teamSizeMin?: string;
    teamSizeMax?: string;
    allowSolo?: boolean;
    prizePool?: string;
    submissionDeadline?: string;
    judgingCriteria?: string;

    // Workshop / Bootcamp
    skillLevel?: string;        // 'Beginner' | 'Intermediate' | 'Advanced'
    prerequisites?: string;
    materialsProvided?: boolean;
    hasCertificate?: boolean;
    durationWeeks?: string;

    // Webinar
    meetingLink?: string;
    recordingAvailable?: boolean;

    // Meetup
    isRecurring?: boolean;
    recurringSchedule?: string;
}

export interface EventDetails {
    overview: string;
    agenda: AgendaItem[];
    speakers: Speaker[];
    policies: string;
    formatMeta?: FormatMeta;
}

export function packEventDescription(details: EventDetails): string {
    return JSON.stringify(details);
}

export function unpackEventDescription(description?: string | null): EventDetails {
    if (!description) {
        return { overview: '', agenda: [], speakers: [], policies: '' };
    }

    try {
        const parsed = JSON.parse(description);
        if (parsed && typeof parsed === 'object' && 'overview' in parsed) {
            return {
                overview: parsed.overview || '',
                agenda: Array.isArray(parsed.agenda) ? parsed.agenda : [],
                speakers: Array.isArray(parsed.speakers) ? parsed.speakers : [],
                policies: parsed.policies || '',
                formatMeta: parsed.formatMeta || {},
            };
        }
    } catch (e) {
        // Not JSON — legacy plain text description
    }

    return { overview: description, agenda: [], speakers: [], policies: '' };
}
