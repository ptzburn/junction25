import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import fs from "node:fs/promises"; // For local file reads
import path from "node:path";

import type { Dish } from "@/app/api/_schemas/dishes";

import { DishAnalysisSchema } from "@/app/api/_schemas/orders";
import env from "@/env";
import z from "zod";

import { searchStock } from "./stock-search";
import orders from "../../data/orders.json" assert { type: "json" };
import dishesFile from "../../data/dishes.json" assert { type: "json" };

const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
  if (texts.length === 0) {
    throw new Error("No texts provided for embedding");
  }

  const response = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts, // Batch: array of strings
    config: {
      taskType: "SEMANTIC_SIMILARITY",
      outputDimensionality: 768,
    },
  });

  const embeddings = response?.embeddings?.map((e) => {
    const vector = new Float32Array(e.values ?? []); // Convert to typed array for efficiency

    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  });

  return embeddings ?? [];
}

/**
 * Calls Gemini with an image + text prompt and forces JSON output.
 */
export async function analyzeDishWithGemini(dish: Dish): Promise<{
  matchedStockItems: {
    id: number;
    name: string;
    price: number;
    unit: string;
    category: string;
    image: string;
    score: number;
  }[];
  instructions: string[];
}> {
  const { mimeType, base64 } = await loadImage(dish.image);

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze the dish named "${dish.name}" from the provided image. Use the official description "${dish.description}" and listed ingredients [${dish.ingredients.join(", ")}] as reference to ensure accuracy.

Return a JSON object with:
- "ingredients": array of strings (exact ingredients needed, refined from official list and image [provided list of ingridients might be incomplete!])
- "instructions": array of strings (step-by-step preparation guide inferred from image and description)

Respond ONLY with valid JSON. No extra text.`,
          },
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      // The schema tells Gemini exactly what shape we expect (enforces JSON structure)
      responseSchema: {
        type: "object" as const,
        properties: {
          ingredients: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          instructions: {
            type: "array" as const,
            items: { type: "string" as const },
          },
        },
        required: ["ingredients", "instructions"] as const,
      },
      // Optional: Tune safety (e.g., block harmful content; defaults are fine for dish analysis)
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    },
  });

  const candidate = result.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini returned no candidates");
  }

  const textPart = candidate.content?.parts?.[0]?.text;
  if (!textPart) {
    throw new Error("Gemini returned no response text");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textPart);
  }
  catch {
    throw new Error("Gemini returned invalid JSON");
  }

  if (!parsed) {
    throw new Error("Gemini returned no JSON payload");
  }

  const validation = DishAnalysisSchema.safeParse(parsed);

  if (!validation.success) {
    throw new Error("Gemini response failed validation");
  }

  const { ingredients, instructions } = validation.data;

  console.log("ingredients", ingredients);

  const queryEmbeddings = await generateEmbeddings(ingredients); // ← live Gemini (or cache later)

  const matchedStockItems = ingredients.flatMap((ing, i) => {
    const matches = searchStock(queryEmbeddings[i], 1, 0.75); // top-1, high threshold
    return matches.map(({ item, score }) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      category: item.category,
      image: item.image,
      score: Number(score.toFixed(4)),
      ingredient: ing, // optional: know which ingredient matched
    }));
  });

  return { matchedStockItems, instructions };
}

async function loadImage(relativePath: string): Promise<{ mimeType: string; base64: string }> {
  // Resolve the absolute path in the public folder
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.join(publicDir, relativePath.replace(/^\/+/, "")); // Strip leading slashes
  // Read the file
  const buffer = await fs.readFile(filePath);

  // Guess MIME type from file extension
  const mimeType = guessMime(relativePath);

  return {
    mimeType,
    base64: buffer.toString("base64"),
  };
}

function guessMime(path: string): string {
  const ext = path.toLowerCase().split(".").pop();
  if (ext === "png")
    return "image/png";
  if (ext === "jpg" || ext === "jpeg")
    return "image/jpeg";
  if (ext === "gif")
    return "image/gif";
  if (ext === "webp")
    return "image/webp";
  return "image/jpeg";
}

export type MatchedIngredientStockItem = {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  score: number;
  ingredient: string;
};


export async function matchIngredientsToStock(
  ingredients: string[],
  options?: { topK?: number; minScore?: number },
): Promise<MatchedIngredientStockItem[]> {
  if (!ingredients.length) {
    return [];
  }

  const { topK = 1, minScore = 0.75 } = options ?? {};

  const queryEmbeddings = await generateEmbeddings(ingredients);

  return ingredients.flatMap((ingredient, index) => {
    const embedding = queryEmbeddings[index];
    if (!embedding)
      return [];

    const matches = searchStock(embedding, topK, minScore);
    return matches.map(({ item, score }) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      category: item.category,
      image: item.image,
      score: Number(score.toFixed(4)),
      ingredient,
    }));
  });
}

