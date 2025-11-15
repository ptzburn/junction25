import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { analyzeDishWithGemini, matchIngredientsToStock, type MatchedIngredientStockItem } from "@/lib/gemini";
import type { Dish, Restaurant } from "@/types/restaurant";

import { OrderSchema } from "../_schemas/orders";
import dishesJson from "../../../../data/dishes.json" assert { type: "json" };
import orders from "../../../../data/orders.json" assert { type: "json" };
import restaurantsJson from "../../../../data/restaurants.json" assert { type: "json" };

const parsedOrders = z.array(OrderSchema).parse(orders);
type RestaurantDishData = {
  restaurantDishes: Dish[];
};

const dishCatalog = (dishesJson as RestaurantDishData).restaurantDishes;
const restaurantsCatalog = restaurantsJson as Restaurant[];
const restaurantsBySlug = new Map(restaurantsCatalog.map(restaurant => [restaurant.slug, restaurant] as const));

const MARKET_KEYWORDS = [
  "beer",
  "beers",
  "wine",
  "cider",
  "ale",
  "lager",
  "stout",
  "drink",
  "drinks",
  "beverage",
  "beverages",
  "soda",
  "cola",
  "juice",
  "water",
  "tonic",
  "gin",
  "vodka",
  "whiskey",
  "tequila",
  "chips",
  "snack",
  "snacks",
];

export const ordersRoute = new Hono()
  .get("/orders", c => c.json({ orders: parsedOrders }))
  .get("/orders/:id", zValidator(
    "param",
    z.object({
      id: z.string().regex(/^ord-\d+$/, "Invalid order ID format"),
    }),
  ), (c) => {
    const { id } = c.req.valid("param");

    // Find order
    const order = parsedOrders.find(o => o.id === id);

    if (!order) {
      throw new HTTPException(404, { message: "Order not found" });
    }

    // TS knows `order` is `Order` — full type safety!
    return c.json(order);
  })
  .post(
    "/analyze-dish",
    zValidator(
      "json",
      z.object({
        dishName: z.string().min(1, "Dish name is required"),
        imageUrl: z.string().min(1, "Image URL is required"),
      }),
    ),
    async (c) => {
      const { dishName, imageUrl } = c.req.valid("json");

      console.log("dishName", dishName);

      const result = await analyzeDishWithGemini({
        dishName,
        imagePath: imageUrl, // Relative path to public/
      });
      return c.json(result);
    },
  )
  .post(
    "/ai-image-order",
    zValidator(
      "json",
      z.object({
        imageBase64: z.string().min(1, "Image data is required"),
        mimeType: z.string().min(1, "MIME type is required"),
        notes: z.string().optional(),
      }),
    ),
    async (c) => {
      const { imageBase64, mimeType, notes } = c.req.valid("json");

      const upload = await persistUpload(imageBase64, mimeType);

      try {
        const analysis = await analyzeDishWithGemini({
          dishName: (notes?.trim() || "Uploaded dish").slice(0, 80),
          imagePath: `/${upload.relativePath}`,
        });

        const match = findBestDishMatch(analysis.ingredients ?? [], notes);
        const restaurant = match ? restaurantsBySlug.get(match.dish.restaurantSlug) ?? null : null;
        const marketFallback = !match
          ? await recommendMarketItemsFromText({ ingredients: analysis.ingredients, notes }, 4)
          : undefined;

        return c.json({
          analysis,
          dish: match?.dish ?? null,
          restaurant,
          matchScore: match?.matchScore ?? 0,
          marketFallback,
        });
      }
      finally {
        await fs.unlink(upload.absolutePath).catch(() => {});
      }
    },
  )
  .post(
    "/ai-text-order",
    zValidator(
      "json",
      z.object({
        notes: z.string().min(10, "Describe what you're craving so we can help"),
        limit: z.number().int().min(1).max(5).optional(),
      }),
    ),
    async (c) => {
      const { notes, limit = 3 } = c.req.valid("json");

      const ranked = rankDishesFromText(notes, limit);
      const suggestions = ranked.map(({ dish, matchScore }) => ({
        dish,
        restaurant: restaurantsBySlug.get(dish.restaurantSlug) ?? null,
        matchScore,
      }));

      const marketFallback = await maybeRecommendMarket(notes, suggestions);

      return c.json({ suggestions, marketFallback });
    },
  )
  .post(
    "/buy-ingredients",
    zValidator(
      "json",
      z.object({
        dishId: z.string().min(1, "Dish ID is required"),
      }),
    ),
    async (c) => {
      const { dishId } = c.req.valid("json");
      const dish = dishCatalog.find(d => d.id === dishId);
      if (!dish) {
        throw new HTTPException(404, { message: "Dish not found" });
      }

      const matchedStockItems = await matchIngredientsToStock(dish.ingredients);
      const instructions = buildInstructionsForDish(dish);

      return c.json({
        analysis: {
          ingredients: dish.ingredients,
          instructions,
          matchedStockItems,
        },
      });
    },
  );

async function maybeRecommendMarket(
  notes: string,
  suggestions: { matchScore: number }[],
): Promise<MatchedIngredientStockItem[] | undefined> {
  if (!shouldShowMarketFallback(notes, suggestions)) {
    return undefined;
  }

  const matches = await recommendMarketItemsFromText({ notes }, 5);
  return matches.length ? matches : undefined;
}

function shouldShowMarketFallback(notes: string, suggestions: { matchScore: number }[]): boolean {
  if (!suggestions.length) {
    return true;
  }

  const topScore = suggestions[0]?.matchScore ?? 0;
  if (topScore < 0.15) {
    return true;
  }

  if (!notes.trim()) {
    return false;
  }

  const normalizedNotes = notes.toLowerCase();
  return MARKET_KEYWORDS.some(keyword => normalizedNotes.includes(keyword));
}

async function recommendMarketItemsFromText(
  source: { notes?: string; ingredients?: string[] },
  limit = 5,
): Promise<MatchedIngredientStockItem[]> {
  const keywords = collectKeywords(source);
  if (!keywords.length) {
    return [];
  }

  const matches = await matchIngredientsToStock(keywords, { topK: 1, minScore: 0.5 });
  const deduped = new Map<number, MatchedIngredientStockItem>();

  for (const match of matches) {
    const current = deduped.get(match.id);
    if (!current || current.score < match.score) {
      deduped.set(match.id, match);
    }
  }

  return Array.from(deduped.values()).slice(0, Math.max(1, limit));
}

function collectKeywords(source: { notes?: string; ingredients?: string[] }): string[] {
  const keywords = new Set<string>();
  source.ingredients?.forEach((ingredient) => {
    if (ingredient.trim().length > 0) {
      keywords.add(ingredient.trim());
    }
  });

  tokenize(source.notes).forEach((token) => {
    if (token.length > 2) {
      keywords.add(token);
    }
  });

  return Array.from(keywords);
}

async function persistUpload(imageBase64: string, mimeType: string): Promise<{ relativePath: string; absolutePath: string }> {
  const payload = imageBase64.includes(",") ? imageBase64.split(",", 2)[1] ?? "" : imageBase64;
  if (!payload) {
    throw new HTTPException(400, { message: "Invalid image data" });
  }
  const buffer = Buffer.from(payload, "base64");

  const extension = extractExtension(mimeType);
  const fileName = `ai-upload-${Date.now()}-${randomUUID()}.${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const absolutePath = path.join(uploadsDir, fileName);
  await fs.writeFile(absolutePath, buffer);

  const relativePath = path.join("uploads", fileName).replace(/\\/g, "/");
  return { relativePath, absolutePath };
}

function extractExtension(mimeType: string): string {
  const ext = mimeType.split("/").pop()?.toLowerCase();
  if (!ext) {
    return "png";
  }
  if (ext === "jpeg") {
    return "jpg";
  }
  return ext;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(value: string | undefined): string[] {
  if (!value) return [];
  return normalize(value).split(/\s+/).filter(Boolean);
}

function rankDishMatches(
  ingredients: string[],
  notes: string | undefined,
  limit = dishCatalog.length,
): { dish: Dish; matchScore: number }[] {
  if (!dishCatalog.length) {
    return [];
  }

  const ingredientTokens = new Set(ingredients.flatMap(tokenize));
  const noteTokens = tokenize(notes);
  noteTokens.forEach(token => ingredientTokens.add(token));

  const candidates = dishCatalog.map((dish) => {
    const dishTokens = new Set([
      ...dish.ingredients.flatMap(tokenize),
      ...tokenize(dish.name),
      ...tokenize(dish.description),
    ]);

    let overlap = 0;
    ingredientTokens.forEach((token) => {
      if (dishTokens.has(token)) {
        overlap += 1;
      }
    });

    const directIngredientMatches = ingredients.filter((ingredient) =>
      dish.ingredients.some(dishIngredient => normalize(dishIngredient) === normalize(ingredient)),
    ).length;

    const denom = Math.max(ingredientTokens.size + ingredients.length, 1);
    const score = (directIngredientMatches * 2 + overlap) / denom;

    return { dish, matchScore: score };
  });

  return candidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, Math.max(1, limit));
}

function findBestDishMatch(ingredients: string[], notes?: string): { dish: Dish; matchScore: number } | null {
  return rankDishMatches(ingredients, notes, 1)[0] ?? null;
}

function rankDishesFromText(notes: string, limit: number) {
  return rankDishMatches([], notes, limit);
}

function buildInstructionsForDish(dish: Dish): string[] {
  const prepLine = `Prep ${dish.ingredients.slice(0, 3).join(", ")}${dish.ingredients.length > 3 ? " and more" : ""}.`;
  const cookLine = `Cook inspired by ${dish.description.toLowerCase()}.`;
  const plateLine = "Plate with the restaurant-style finish and enjoy while hot.";
  return [prepLine, cookLine, plateLine];
}
