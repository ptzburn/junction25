"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Import local dishes data to show recommended dish image
import dishesJson from "../../../data/dishes.json";

const dishesData = dishesJson as any;

type CalendarPayload = {
	items: any[];
	count: number;
	raw?: any;
};

export default function GoogleCalendarPage() {
	const router = useRouter();
	const [data, setData] = useState<CalendarPayload | null>(null);
	const [suggestion, setSuggestion] = useState<any | null>(null);
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

					// Trigger suggestion call after calendar data is available
					try {
						const sres = await fetch("/api/suggest-order");
						if (sres.ok) {
							const sj = await sres.json().catch(() => null);
							if (mounted) setSuggestion(sj);
						} else {
							const sb = await sres.text().catch(() => null);
							if (mounted) setSuggestion({ error: `status ${sres.status}`, body: sb });
						}
					} catch (err) {
						if (mounted) setSuggestion({ error: String((err as any)?.message ?? err) });
					}

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
		<div className="mx-auto max-w-3xl px-4 py-12">
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl text-center">Delivery suggestion</CardTitle>
					<CardDescription className="text-center">We looked at your calendar and order history and suggested the best time and dish for today.</CardDescription>
				</CardHeader>
				<CardContent>
					{suggestion === null ? (
						<div>Loading suggestion…</div>
					) : suggestion.error ? (
						<div>
							<strong>Error getting suggestion</strong>
							<pre className="mt-3 rounded-md bg-destructive/10 p-3 text-sm">{JSON.stringify(suggestion, null, 2)}</pre>
						</div>
					) : (
						(() => {
							const deliveryTime = suggestion.deliveryTime ?? suggestion.bestOrderTimeISO ?? null;
							const dishName = suggestion.dish?.name ?? null;
							// try to find matching dish image
							const allDishes: any[] = (() => {
								if (Array.isArray(dishesData?.restaurantDishes)) return dishesData.restaurantDishes;
								if (Array.isArray(dishesData?.dishes)) return dishesData.dishes;
								if (Array.isArray(dishesData)) return dishesData;
								if (Array.isArray(dishesData?.items)) return dishesData.items;
								return [];
							})();

							// If the suggestion included an explicit image or id, prefer those
							const suggestedImage = suggestion.dish?.image ?? null;
							const suggestedId = suggestion.dish?.id ?? null;
							let matched: any = null;
							if (suggestedImage) {
								// We have a direct image URL from the suggestion
								matched = { image: suggestedImage };
							} else if (suggestedId) {
								matched = allDishes.find((d: any) => String(d?.id ?? "") === String(suggestedId));
							} else if (dishName) {
								matched = allDishes.find((d: any) => String(d?.name ?? "").toLowerCase() === String(dishName).toLowerCase());
							}
							const image = matched?.image ?? matched?.img ?? matched?.picture ?? matched?.imgUrl ?? null;

							// format time without date and seconds
							const formattedTime = deliveryTime
								? new Date(deliveryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
								: null;

							return (
								<div className="flex flex-col gap-6">
									<div className="text-center">
										<div className="text-lg font-semibold">You seem to have a busy day but we found some time in your schedule for you to eat!</div>
										{/* Show suggested free window and amount of free time (if provided) */}
										{(suggestion.fromTime || suggestion.tillTime || suggestion.amountOfTime) && (
											<div className="mt-3 text-m text-muted-foreground">
												{suggestion.fromTime && suggestion.tillTime ? (
													<span>
														Free time window: {new Date(suggestion.fromTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(suggestion.tillTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
													</span>
												) : null}
												{typeof suggestion.amountOfTime !== "undefined" && (
													<span className="block">Available time: {Number(suggestion.amountOfTime)} min</span>
												)}
											</div>
										)}
									</div>

									{/* Two-column area: order (left) and ETA (right) */}
									<div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
										<div className="flex items-center gap-4">
											{image ? (
												<div className="relative h-24 w-32 rounded-md overflow-hidden bg-muted">
													<Image src={image} alt={dishName ?? "recommended"} fill sizes="(max-width: 720px) 100px" style={{ objectFit: "cover" }} />
												</div>
											) : (
												<div className="h-24 w-32 rounded-md bg-muted flex items-center justify-center text-muted-foreground">No image</div>
											)}

											<div>
												<div className="text-lg font-semibold">{dishName ?? "(no dish returned)"}</div>
												<div className="text-sm text-muted-foreground">{suggestion.dish?.quantity ? `Quantity: ${suggestion.dish.quantity}` : "Quantity: 1"}</div>
											</div>
										</div>

										<div className="ml-auto flex flex-col items-center sm:items-end">
											<div className="text-sm font-semibold">Estimated time of delivery</div>
											<div className="mt-2 text-3xl font-bold">{formattedTime ?? "(no time returned)"}</div>
										</div>
									</div>
								</div>
							);
						})()
					)}
				</CardContent>
				<CardFooter className="flex justify-end gap-2">
					<Button variant="outline">Cancel</Button>
					<Button
						variant="default"
						onClick={() => {
							if (!suggestion || suggestion.error) return;
							const baseId = suggestion.dish?.id ?? suggestion.dish?.name ?? "suggestion";
							const safe = String(baseId).replace(/[^a-zA-Z0-9-_]/g, "_");
							const orderId = `${safe}-${Date.now()}`;
							try {
								sessionStorage.setItem(`analysis:${orderId}`, JSON.stringify(suggestion));
							} catch (e) {
								console.warn("failed to write suggestion to sessionStorage", e);
							}
							// If the suggestion included a delivery time, pass it as a query parameter
							const tParam = suggestion?.deliveryTime ?? suggestion?.bestOrderTimeISO ?? null;
							const url = tParam
								? `/placedOrder/${orderId}?timeOfDelivery=${encodeURIComponent(String(tParam))}`
								: `/placedOrder/${orderId}`;
							router.push(url);
						}}
						disabled={!suggestion || !!suggestion?.error}
					>
						Place order
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

