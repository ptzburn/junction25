"use client";

import React, { useEffect, useState } from "react";

type CalendarPayload = {
	items: any[];
	count: number;
	raw?: any;
};

export default function GoogleCalendarPage() {
	const [data, setData] = useState<CalendarPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		(async () => {
			const endpoints = ["/api/_calendar?debug=1", "/api/calendar?debug=1"];
			let lastError: any = null;

			for (const ep of endpoints) {
				try {
					const res = await fetch(ep);
					const ct = res.headers.get("content-type") || "";
					if (!res.ok) {
						const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => null);
						lastError = { endpoint: ep, status: res.status, body };
						continue;
					}

					const json = ct.includes("application/json") ? await res.json() : { raw: await res.text() };
					if (!mounted) return;

					// New endpoint returns { items, count, raw? }
					const items = json.items ?? json.raw?.items ?? [];
					const count = typeof json.count === "number" ? json.count : items.length;

					const payload: CalendarPayload = {
						items,
						count,
						raw: json.raw ?? json,
					};

					setData(payload);
					setError(null);
					setLoading(false);
					return;
				} catch (err) {
					lastError = { endpoint: ep, message: String((err as any)?.message ?? err) };
					continue;
				}
			}

			if (mounted) {
				setError(JSON.stringify(lastError, null, 2));
				setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	if (loading) return <div>Loading calendar events…</div>;
	if (error)
		return (
			<div>
				<h2>Error loading calendar</h2>
				<pre style={{ whiteSpace: "pre-wrap", background: "#f8f8f8", padding: 10, borderRadius: 6 }}>{error}</pre>
				<div style={{ marginTop: 12 }}>
					Try checking <code>.env.local</code> for <code>GOOGLE_SERVICE_ACCOUNT_KEY</code> or use the shim endpoint <code>/api/_calendar</code>.
				</div>
			</div>
		);
	if (!data) return <div>No data returned from calendar API.</div>;

	return (
		<div style={{ padding: 20 }}>
			<h1>Calendar Events</h1>
			<p>
				<strong>Google events (today):</strong> {data.count}
			</p>

			<section>
				<h2>Google Calendar Events</h2>
				{data.items.length === 0 ? (
					<p>No Google Calendar events for today.</p>
				) : (
					<ul>
						{data.items.map((it: any, idx: number) => (
							<li key={it.id ?? idx}>
								<strong>{it.summary ?? it.title ?? "(no title)"}</strong>
								<div>
									{it.start?.dateTime ?? it.start?.date ?? "(no start)"} — {it.end?.dateTime ?? it.end?.date ?? "(no end)"}
								</div>
								{it.description ? <div>{it.description}</div> : null}
								{it.location ? <div>Location: {it.location}</div> : null}
								{it.htmlLink ? (
									<div>
										<a href={it.htmlLink} target="_blank" rel="noreferrer">
											Open in Google Calendar
										</a>
									</div>
								) : null}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

