import orders from "@orders.json";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { handle } from "hono/vercel";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import env from "@/env";

import notFound from "../_middlewares/not-found-middleware";
import onError from "../_middlewares/on-error-middleware";

type DishAnalysis = {
  ingredients: string[];
  totalPrice: number;
  deliveryETA: string;
};

const analysisCache = new Map<string, DishAnalysis>();

type GeminiContentPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiContentPart[] };
  }>;
};

const app = new Hono().basePath("/api").onError(onError).notFound(notFound);

app.get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono!",
  });
});

app.get("/orders", c => c.json({ orders }));

app.get("/orders/:id", (c) => {
  const orderId = c.req.param("id");
  const order = orders.find(order => order.id === orderId);

  if (!order)
    throw new HTTPException(404, { message: "Order not found" });

  return c.json(order);
});

app.post("/analyze-dish", async (c) => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey)
    throw new HTTPException(500, { message: "Missing GEMINI_API_KEY" });

  const body = await c.req.json();
  const dishName = body?.dishName;
  const imageUrl = body?.imageUrl;

  if (!dishName || typeof dishName !== "string")
    throw new HTTPException(400, { message: "dishName is required" });
  if (!imageUrl || typeof imageUrl !== "string")
    throw new HTTPException(400, { message: "imageUrl is required" });

  // Cache key: dishName + imageUrl (URL is stable)
  const cacheKey = createHash("sha256")
    .update(`${dishName}:${imageUrl}`)
    .digest("hex");

  const cached = analysisCache.get(cacheKey);
  if (cached)
    return c.json({ ...cached, cached: true });

  // Fetch image from URL
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok)
    throw new HTTPException(502, { message: `Failed to fetch image: ${imageRes.status}` });

  const contentType = imageRes.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/"))
    throw new HTTPException(400, { message: "URL must point to an image" });

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const imageData = buffer.toString("base64");
  const mimeType = contentType;

  const geminiURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const response = await fetch(`${geminiURL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze the dish named "${dishName}". Extract up to 8 concise ingredients, estimate total price in USD (number), and provide ISO-8601 delivery ETA (10–90 min from now). Respond ONLY as JSON.`,
            },
            {
              inlineData: { mimeType, data: imageData },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ingredients: { type: "array", items: { type: "string" } },
            totalPrice: { type: "number" },
            deliveryETA: { type: "string" },
          },
          required: ["ingredients", "totalPrice", "deliveryETA"],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new HTTPException(502, { message: `Gemini failed: ${errorText}` });
  }

  const data = (await response.json()) as GeminiResponse;
  const textResponse
    = data.candidates?.[0]?.content?.parts?.find(
      (part): part is { text: string } => !!part.text,
    )?.text ?? "";

  if (!textResponse)
    throw new HTTPException(502, { message: "Gemini returned empty response" });

  const parsed = JSON.parse(textResponse) as DishAnalysis;
  analysisCache.set(cacheKey, parsed);

  return c.json(parsed);
});

export const GET = handle(app);
export const POST = handle(app);
