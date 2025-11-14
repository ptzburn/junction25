import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { handle } from "hono/vercel";
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

function parseImagePayload(imageBase64: string) {
  const dataUrlPattern = /^data:(.+);base64,(.*)$/;
  const match = dataUrlPattern.exec(imageBase64.trim());

  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  return {
    mimeType: "image/png",
    data: imageBase64,
  };
}

const app = new Hono().basePath("/api").onError(onError).notFound(notFound);

app.get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono!",
  });
});

app.get("/orders", (c) => {
  const orders = [
    {
      id: "ord_001",
      dishName: "Spicy Tuna Bowl",
      restaurant: "Pacific Poke House",
      imageUrl: "https://example.com/images/spicy-tuna-bowl.jpg",
      orderedAt: "2024-10-12T18:45:00.000Z",
    },
    {
      id: "ord_002",
      dishName: "Margherita Pizza",
      restaurant: "Trattoria Napoli",
      imageUrl: "https://example.com/images/margherita-pizza.jpg",
      orderedAt: "2024-11-02T20:10:00.000Z",
    },
  ];

  return c.json({ orders });
});

app.post("/analyze-dish", async (c) => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HTTPException(500, { message: "Missing GEMINI_API_KEY" });
  }

  const body = await c.req.json();
  const dishName = body?.dishName;
  const imageBase64 = body?.imageBase64;

  if (!dishName || typeof dishName !== "string") {
    throw new HTTPException(400, { message: "dishName is required" });
  }

  if (!imageBase64 || typeof imageBase64 !== "string") {
    throw new HTTPException(400, { message: "imageBase64 is required" });
  }

  const cacheKey = createHash("sha256")
    .update(`${dishName}:${imageBase64}`)
    .digest("hex");

  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return c.json({ ...cached, cached: true });
  }

  const { mimeType, data: imageData } = parseImagePayload(imageBase64);
  const geminiURL
    = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  const response = await fetch(`${geminiURL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze the dish named "${dishName}". Extract up to 8 concise ingredients, estimate the total price in USD (number), and provide an ISO-8601 delivery ETA timestamp that is 10-90 minutes from now. Respond ONLY as JSON following the schema.`,
            },
            {
              inlineData: {
                mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            ingredients: {
              type: "array",
              items: { type: "string" },
            },
            totalPrice: {
              type: "number",
            },
            deliveryETA: {
              type: "string",
            },
          },
          required: ["ingredients", "totalPrice", "deliveryETA"],
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new HTTPException(502, {
      message: `Gemini request failed: ${errorText}`,
    });
  }

  const data = (await response.json()) as GeminiResponse;

  const primaryCandidate = data.candidates?.at(0);
  const parts = primaryCandidate?.content?.parts ?? [];
  const textResponse
    = parts.find(
      (part): part is GeminiContentPart & { text: string } =>
        typeof part.text === "string" && part.text.length > 0,
    )?.text ?? "";

  if (!textResponse) {
    throw new HTTPException(502, {
      message: "Gemini returned an empty response",
    });
  }

  const parsed = JSON.parse(textResponse) as DishAnalysis;

  analysisCache.set(cacheKey, parsed);

  return c.json(parsed);
});

export const GET = handle(app);
export const POST = handle(app);
