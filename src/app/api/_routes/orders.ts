import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { analyzeDishWithGemini } from "@/lib/gemini";
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

        const match = findBestDishMatch(analysis.ingredients, notes);

        if (!match) {
          return c.json({ analysis, dish: null, restaurant: null, matchScore: 0 });
        }

        const restaurant = restaurantsBySlug.get(match.dish.restaurantSlug) ?? null;

        return c.json({
          analysis,
          dish: match.dish,
          restaurant,
          matchScore: match.matchScore,
        });
      }
      finally {
        await fs.unlink(upload.absolutePath).catch(() => {});
      }
    },
  );

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

function findBestDishMatch(ingredients: string[], notes?: string): { dish: Dish; matchScore: number } | null {
  if (!dishCatalog.length) {
    return null;
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

  return candidates.sort((a, b) => b.matchScore - a.matchScore)[0] ?? null;
}
