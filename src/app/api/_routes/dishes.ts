import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { DishSchema } from "../_schemas/dishes";
import dishesJson from "../../../../data/dishes.json" assert { type: "json" };

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
  });
