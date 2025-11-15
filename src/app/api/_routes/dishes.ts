import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Buffer } from "node:buffer";
import z from "zod";

import { searchDishesByEmbedding } from "@/lib/dish-embeddings";
import { genAI } from "@/lib/gemini";

import { DishSchema } from "../_schemas/dishes";
import dishesJson from "../../../../data/dishes-2.json" assert { type: "json" };

export const dishesRoute = new Hono()
  .get("/dishes", (c) => {
    const parsedDishes = z.array(DishSchema).parse(dishesJson.dishes);
    return c.json({ dishes: parsedDishes }, 200);
  })
  .get("/dishes/:id", zValidator("param", z.object({ id: z.uuid() })), (c) => {
    const { id } = c.req.valid("param");

    const parsedDishes = z.array(DishSchema).parse(dishesJson.dishes);

    const dish = parsedDishes.find(dish => dish.id === id);

    if (!dish) {
      throw new HTTPException(404, { message: "Dish not found" });
    }

    return c.json(dish, 200);
  })
  .get("/restaurants/:restaurantId/dishes", zValidator("param", z.object({ restaurantId: z.uuid() })), (c) => {
    const { restaurantId } = c.req.valid("param");

    const parsedDishes = z.array(DishSchema).parse(dishesJson.dishes);

    const dishes = parsedDishes.filter(dish => dish.restaurantId === restaurantId);

    return c.json({ dishes }, 200);
  })
  .post(
    "/dishes/search-by-image",
    zValidator(
      "form",
      z.object({
        image: z.instanceof(File), // File from multipart/form-data
      }),
    ),
    async (c) => {
      const { image } = c.req.valid("form");

      // Read image as base64
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Generate embedding from uploaded image
      const response1 = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64,
            },
          },
          { text: "Describe this image." },
        ],
      });

      const response2 = await genAI.models.embedContent({
        model: "gemini-embedding-001",
        contents: [
          {
            text: response1.text,
          },
        ],
        config: {
          taskType: "SEMANTIC_SIMILARITY",
          outputDimensionality: 768,
        },
      });

      const embeddings = response2?.embeddings?.map((e) => {
        const vector = new Float32Array(e.values ?? []); // Convert to typed array for efficiency

        const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (norm > 0) {
          for (let i = 0; i < vector.length; i++) {
            vector[i] /= norm;
          }
        }

        return vector;
      });

      if (!embeddings) {
        throw new HTTPException(500, { message: "Failed to embed image" });
      }

      // Search precomputed dish embeddings
      const matches = searchDishesByEmbedding(embeddings[0], 3, 0.65);

      return c.json({
        matches: matches.map(({ dish, score }) => ({
          dish,
          similarity: Number(score.toFixed(4)),
        })),
      });
    },
  );
