import { zValidator } from "@hono/zod-validator";
import orders from "@orders.json";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { analyzeDishWithGemini } from "@/lib/gemini";

import { OrderSchema } from "../_schemas/orders";

const parsedOrders = z.array(OrderSchema).parse(orders);

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
  );
