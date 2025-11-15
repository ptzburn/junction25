import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { analyzeDishWithGemini } from "@/lib/gemini";

import { DishSchema } from "../_schemas/dishes";
import { OrderSchema } from "../_schemas/orders";
import orders from "../../../../data/orders.json" assert { type: "json" };

const parsedOrders = z.array(OrderSchema).parse(orders);

export const ordersRoute = new Hono()
  .get("/orders", c => c.json({ orders: parsedOrders }))
  .get("/orders/:id", zValidator(
    "param",
    z.object({
      id: z.uuid("Invalid order ID format"),
    }),
  ), (c) => {
    const { id } = c.req.valid("param");

    const order = parsedOrders.find(o => o.id === id);

    if (!order) {
      throw new HTTPException(404, { message: "Order not found" });
    }

    return c.json(order);
  })
  .post(
    "/analyze-dish",
    zValidator(
      "json",
      DishSchema,
    ),
    async (c) => {
      const dish = c.req.valid("json");

      const result = await analyzeDishWithGemini(dish);
      return c.json(result);
    },
  );
