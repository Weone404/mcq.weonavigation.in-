import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();

        const { title, description, date, startTime, time, duration } = body;
        const finalTime = startTime || time;

        console.log('Received:', { title, date, finalTime, duration });

        // ── Validate required fields ──────────────────────────────────────────
        if (!title || !date || !finalTime) {
            return NextResponse.json(
                { success: false, error: 'Title, date and startTime are required' },
                { status: 400 }
            );
        }

        // ── Validate env vars ─────────────────────────────────────────────────
        if (
            !process.env.GOOGLE_CLIENT_EMAIL ||
            !process.env.GOOGLE_PRIVATE_KEY ||
            !process.env.GOOGLE_CALENDAR_ID
        ) {
            console.error('Missing environment variables');
            return NextResponse.json(
                { success: false, error: 'Server misconfiguration — missing env vars' },
                { status: 500 }
            );
        }

        // ── Build start/end times ─────────────────────────────────────────────
        const startDateTime = new Date(`${date}T${finalTime}:00+05:30`);

        if (isNaN(startDateTime.getTime())) {
            return NextResponse.json(
                { success: false, error: `Invalid date/time: date="${date}" time="${finalTime}"` },
                { status: 400 }
            );
        }

        const durationMins = parseInt(duration) || 60;
        const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);

        // ── Authenticate ──────────────────────────────────────────────────────
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // ── Create event WITHOUT conferenceData (avoids type errors) ──────────
        // After creation, Google Calendar will let you add Meet manually,
        // OR we patch it below to add Meet link.
        const event = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            conferenceDataVersion: 1,
            requestBody: {
                summary: title,
                description: description || '',
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
                conferenceData: {
                    createRequest: {
                        requestId: `dgca-meet-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet',
                        },
                    },
                },
            },
        });

        // ── Extract Meet link if generated ────────────────────────────────────
        const meetLink =
            event.data.conferenceData?.entryPoints?.find(
                (e) => e.entryPointType === 'video'
            )?.uri ||
            event.data.hangoutLink ||
            null;

        console.log('Event created successfully!');
        console.log('Event ID  :', event.data.id);
        console.log('Meet link :', meetLink);
        console.log('Calendar  :', event.data.htmlLink);

        return NextResponse.json({
            success: true,
            eventId: event.data.id,
            meetLink,
            htmlLink: event.data.htmlLink,
        });

    } catch (err) {
        console.error('Schedule meeting error:', err.message);

        // ── Friendly error for conference type issue ───────────────────────────
        if (err.message?.includes('Invalid conference type')) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Google Meet auto-generation failed. Please open the event in Google Calendar and add Meet manually.',
                    fallback: true,
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}