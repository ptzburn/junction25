import { z } from "zod";

// Shape of Google Calendar event time objects (either dateTime or all-day date)
export const GoogleCalendarDateTimeSchema = z.object({
  dateTime: z.string().optional(),
  date: z.string().optional(),
});

// Minimal Google event shape we rely on from the Calendar API
export const GoogleEventSchema = z.object({
  id: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: GoogleCalendarDateTimeSchema.optional(),
  end: GoogleCalendarDateTimeSchema.optional(),
  status: z.string().optional(),
  htmlLink: z.string().optional(),
});

export type GoogleEvent = z.infer<typeof GoogleEventSchema>;

// The calendar route returns a simple object: { items, count }
export const CalendarListSchema = z.object({
  items: z.array(GoogleEventSchema),
  count: z.number(),
  // Optionally include raw API response when debug is requested
  raw: z.any().optional(),
});

export type CalendarList = z.infer<typeof CalendarListSchema>;
