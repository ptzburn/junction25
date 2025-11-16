import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";

import { genAI } from "@/lib/gemini";

import { DishSchema } from "../_schemas/dishes";
import dishes from "../../../../data/dishes-2.json" assert { type: "json" };

const parsedDishes = z.array(DishSchema).parse(dishes.dishes);

const SuggestionSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
  note: z.string().optional(),
});

export type SuggestedItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  dietary?: string[];
};

export type GroupOrderSuggestion = {
  items: SuggestedItem[];
  total: number;
  note?: string;
};

export const groupOrderRoute = new Hono()
  .post(
    "/group-order",
    zValidator(
      "json",
      z.object({
        prompt: z.string().min(1, "Prompt is required"),
      }),
    ),
    async (c) => {
      const { prompt } = c.req.valid("json");

      const menuText = parsedDishes.map(
        d => `${d.id}: ${d.name} (€${d.price}) - ${d.description} [${d.ingredients.join(", ")}]`,
      ).join("\n");

      const systemPrompt = `
You are a smart pizza order assistant for a group.

**Available dishes** (use ONLY these IDs):
${menuText}

User request: "${prompt}"

Return **valid JSON only** with:
- "items": array of { "id": string, "quantity": number }
- "note": optional string

Rules:
- Respect dietary needs (vegan, gluten-free, etc.)
- Use only dish IDs from the list above
- Round up to whole pizzas
- Prefer variety
`.trim();

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash", // or "gemini-2.5-flash" when available
        contents: [
          {
            role: "user",
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as const,
            properties: {
              items: {
                type: "array" as const,
                items: {
                  type: "object" as const,
                  properties: {
                    id: { type: "string" as const },
                    quantity: { type: "number" as const },
                  },
                  required: ["id", "quantity"] as const,
                },
              },
              note: { type: "string" as const, nullable: true },
            },
            required: ["items"] as const,
          },
        },
      });

      const text = result?.text?.trim() ?? "";
      // eslint-disable-next-line regexp/no-super-linear-backtracking
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch)
        throw new Error("No JSON found in Gemini response");

      const geminiOutput = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      // ---------------------------------------------------------------
      // 4. Validate with Zod
      // ---------------------------------------------------------------
      const validated = SuggestionSchema.parse(geminiOutput);

      // ---------------------------------------------------------------
      // 5. Resolve real menu items + calculate total
      // ---------------------------------------------------------------
      const resolvedItems: SuggestedItem[] = [];
      let total = 0;

      for (const { id, quantity } of validated.items) {
        const dish = parsedDishes.find(d => d.id === id);
        if (!dish)
          continue;

        const dietary: string[] = [];
        const lowerName = dish.name.toLowerCase();
        const lowerIngredients = dish.ingredients.map(i => i.toLowerCase());

        if (lowerName.includes("vegan") || lowerIngredients.some(i => i.includes("vegan"))) {
          dietary.push("vegan");
        }
        if (lowerIngredients.some(i => i.includes("gluten"))) {
          dietary.push("contains gluten");
        }

        resolvedItems.push({
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity,
          dietary: dietary.length ? dietary : undefined,
        });
        total += dish.price * quantity;
      }

      const response: GroupOrderSuggestion = {
        items: resolvedItems,
        total: Number(total.toFixed(2)),
        note: validated.note,
      };

      return c.json(response);
    },
  );
