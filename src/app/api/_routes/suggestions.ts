/* eslint-disable ts/no-explicit-any */
import { Hono } from "hono";

import { suggestOrderTimeAndDishesForToday } from "@/lib/calendar-gemini";

export const suggestionsRoute = new Hono().get("/suggest-order", async (c) => {
  try {
    const suggestion = await suggestOrderTimeAndDishesForToday();
    return c.json(suggestion);
  }
  catch (err: any) {
    console.error("suggestionsRoute error:", err?.message ?? err);
    return c.json({ error: String(err?.message ?? err) }, 500);
  }
});
