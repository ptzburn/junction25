import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import fs from "node:fs/promises"; // For local file reads
import path from "node:path";

import type { Dish } from "@/app/api/_schemas/dishes";

import { DishAnalysisSchema, OrderSchema } from "@/app/api/_schemas/orders";
import env from "@/env";
import z from "zod";

import { searchStock } from "./stock-search";
import orders from "../../data/orders.json" assert { type: "json" };
import dishesFile from "../../data/dishes.json" assert { type: "json" };

const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
/**
 * Fetch today's Google Calendar events from the app's calendar API.
 * Returns an array of events or an empty array on error. (No-op for now.)
 */
export async function fetchCalendarEvents(): Promise<any[]> {
  try {
    const base = (env as any).NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
    const url = `${String(base).replace(/\/$/, "")}/api/calendar?debug=1`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("fetchCalendarEvents: calendar API returned status", res.status);
      return [];
    }
    const json = await res.json().catch(() => null);
    if (!json) return [];
    // The calendar endpoint returns { items, count }
    return json.items ?? [];
  }
  catch (err) {
    console.warn("fetchCalendarEvents error:", err);
    return [];
  }
}


/**
 * Fetch today's calendar events and orders, ask Gemini to suggest
 * a single delivery time and a single dish. Returns exact JSON shape
 * requested by the client: { deliveryTime, dish: { name, quantity } }.
 */
export async function suggestOrderTimeAndDishesForToday(): Promise<{
  deliveryTime: string;
  dish: { name: string; quantity: number };
  amountOfTime: number; // minutes of free time available in the suggested window
  fromTime: string; // ISO-8601 start of free window
  tillTime: string; // ISO-8601 end of free window
}> {
  // Build a lookup of dish id -> dish data (name, image, ...)
  const dishesRaw: any = dishesFile ?? {};
  const dishesArray: any[] = Array.isArray(dishesRaw)
    ? dishesRaw
    : Array.isArray(dishesRaw.dishes)
    ? dishesRaw.dishes
    : Array.isArray(dishesRaw.restaurantDishes)
    ? dishesRaw.restaurantDishes
    : [];
  const dishById = new Map<string, any>();
  for (const d of dishesArray) {
    if (d?.id) dishById.set(String(d.id), d);
  }

  const normalizeId = (it: any) => {
    if (typeof it === "string") return it;
    if (it == null) return String(it);
    if (typeof it === "object") return String(it.id ?? it.dishId ?? it.itemId ?? JSON.stringify(it));
    return String(it);
  };

  try {
    const calendarItems = await fetchCalendarEvents();

    // Validate orders.json if possible
    let parsedOrders: any[] = [];
    try {
      parsedOrders = z.array(OrderSchema).parse(orders as any[]);
    } catch {
      parsedOrders = orders as any[];
    }

    // Orders now contain arrays of item IDs. Normalize to IDs (strings) and map to dish names when available.
    const recentItemIds = parsedOrders.flatMap(o => (o.items ?? [])).slice(-20).reverse();
    const recentItems = recentItemIds.map((it: any) => normalizeId(it));

    const calendarSummary = calendarItems.map((it: any) => {
      const start = it.start?.dateTime ?? it.start?.date ?? "(no start)";
      const end = it.end?.dateTime ?? it.end?.date ?? "(no end)";
      return `${start} - ${end}: ${it.summary ?? it.title ?? "(no title)"}`;
    }).join("\n") || "(no events)";

    // Map recent item IDs to readable names using dishes.json when possible
    const recentNames = recentItems.map((idOrObj: any) => {
      const id = normalizeId(idOrObj);
      const d = dishById.get(id);
      return d?.name ?? id;
    });
    const ordersSummary = recentNames.length ? recentNames.join(", ") : "(no previous orders)";

    const prompt = `You are given two pieces of information for today:\n\n1) Calendar busy times (each line: start - end: title):\n${calendarSummary}\n\n2) Recent ordered items by the user (most recent first): ${ordersSummary}\n\nTask: Identify a contiguous free time window for lunch today when the user is available to receive a delivery and eat. Then pick the single best ISO-8601 delivery time (with timezone) inside that window when delivery should be scheduled, and recommend one dish the user is likely to enjoy.\n\nReturn ONLY valid JSON with the exact shape: { "deliveryTime": "<ISO-8601 datetime with timezone>", "dish": { "name": "<string>", "quantity": <integer> }, "amountOfTime": <integer minutes available in the free window>, "fromTime": "<ISO-8601 datetime start of free window>", "tillTime": "<ISO-8601 datetime end of free window>" }. The delivery time must be for today and inside the returned window. No extra text.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as const,
          properties: {
            deliveryTime: { type: "string" as const },
            dish: {
              type: "object" as const,
              properties: {
                name: { type: "string" as const },
                quantity: { type: "integer" as const },
              },
              required: ["name", "quantity"] as const,
            },
            amountOfTime: { type: "integer" as const },
            fromTime: { type: "string" as const },
            tillTime: { type: "string" as const },
          },
          required: ["deliveryTime", "dish", "amountOfTime", "fromTime", "tillTime"] as const,
        },
      },
    });

    const candidate = result.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;
    if (!textPart) throw new Error("Gemini returned no content");

    let parsed: any;
    try { parsed = JSON.parse(textPart); } catch { throw new Error("Gemini returned invalid JSON"); }

    if (
      !parsed ||
      typeof parsed.deliveryTime !== "string" ||
      !parsed.dish ||
      typeof parsed.dish.name !== "string" ||
      typeof parsed.amountOfTime !== "number" ||
      typeof parsed.fromTime !== "string" ||
      typeof parsed.tillTime !== "string"
    ) {
      throw new Error("Gemini returned unexpected shape");
    }

    // Ensure quantity is integer
    parsed.dish.quantity = Number(parsed.dish.quantity) || 1;

    return {
      deliveryTime: parsed.deliveryTime,
      dish: { name: parsed.dish.name, quantity: Math.max(1, Math.floor(parsed.dish.quantity)) },
      amountOfTime: Math.max(0, Math.floor(Number(parsed.amountOfTime) || 0)),
      fromTime: parsed.fromTime,
      tillTime: parsed.tillTime,
    };
  } catch (err: any) {
    console.warn("suggestOrderTimeAndDishesForToday failed:", err?.message ?? err);
    // Fallback: choose now+30min and a recent ordered item
    const fallbackFrom = new Date();
    const fallbackTill = new Date(fallbackFrom.getTime() + 30 * 60000);
    const fallbackTime = new Date(fallbackFrom.getTime() + 15 * 60000).toISOString();
    const lastRaw = (orders as any[]).flatMap(o => (o.items ?? [])).slice(-1)[0];
    const lastId = normalizeId(lastRaw);
    const lastDish = dishById.get(lastId) ?? { name: "Chef's Choice", quantity: 1 };
    return {
      deliveryTime: fallbackTime,
      dish: { name: lastDish.name ?? "Chef's Choice", quantity: lastDish.quantity ?? 1 },
      amountOfTime: Math.round((fallbackTill.getTime() - fallbackFrom.getTime()) / 60000),
      fromTime: fallbackFrom.toISOString(),
      tillTime: fallbackTill.toISOString(),
    };
  }
}
