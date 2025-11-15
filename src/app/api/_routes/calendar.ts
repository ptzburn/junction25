import { Hono } from "hono";
import { google } from "googleapis";
import { Buffer } from "node:buffer";

export const calendarRoute = new Hono().get("/calendar", async (c) => {
	// Accept an optional `calendarId` query param, default to 'primary'.
	const calendarId = "9344d5e093d582a6f8bc926ae34bd3ca01f732d927a4319633ee6e739af26a98@group.calendar.google.com";

	// Robust parsing for service account JSON: raw JSON, escaped-newlines JSON, or base64-encoded JSON
	const tryParseJson = (txt?: string) => {
		if (!txt) return null;
		try {
			return JSON.parse(txt);
		} catch (_) {
			try {
				return JSON.parse(txt.replace(/\\n/g, "\n"));
			} catch (_) {
				return null;
			}
		}
	};

	let serviceAccount: any = null;
	try {
		const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
		if (raw) {
			serviceAccount = tryParseJson(raw) ?? ((): any => {
				try {
					return tryParseJson(Buffer.from(raw, "base64").toString("utf8"));
				} catch (_) {
					return null;
				}
			})();
		}

		if (!serviceAccount && process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
			const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf8");
			serviceAccount = tryParseJson(decoded);
		}
	} catch (err) {
		console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:", err);
	}

	if (!serviceAccount) {
		return c.json({ error: "Missing or invalid GOOGLE_SERVICE_ACCOUNT_KEY (also tried _BASE64)" }, 500);
	}

	try {
		const auth = new google.auth.GoogleAuth({
			credentials: serviceAccount,
			scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
		});

		const calendar = google.calendar({ version: "v3", auth });

		const now = new Date();
		const startOfDay = new Date(now);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(now);
		endOfDay.setHours(23, 59, 59, 999);

		const resp = await calendar.events.list({
			calendarId,
			timeMin: startOfDay.toISOString(),
			timeMax: endOfDay.toISOString(),
			singleEvents: true,
			orderBy: "startTime",
			maxResults: 250,
		});

		const items = resp.data.items ?? [];
		return c.json({ items, count: items.length });
	} catch (err: any) {
		console.error("calendarRoute error:", err?.message ?? err);
		return c.json({ error: String(err?.message ?? err) }, 500);
	}
});

