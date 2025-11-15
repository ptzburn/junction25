import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import { RestaurantSchema } from "../_schemas/restaurant";
import restaurantsJson from "../../../../data/restaurants.json" assert { type: "json" };

export const restaurantsRoute = new Hono()
  .get("/restaurants", (c) => {
    const parsedRestaurants = z.array(RestaurantSchema).parse(restaurantsJson.restaurants);
    return c.json({ restaurants: parsedRestaurants }, 200);
  })
  .get("/restaurants/:id", zValidator("param", z.object({ id: z.uuid() })), (c) => {
    const { id } = c.req.valid("param");

    const parsedRestaurants = z.array(RestaurantSchema).parse(restaurantsJson.restaurants);

    const restaurant = parsedRestaurants.find(restaurant => restaurant.id === id);

    if (!restaurant) {
      throw new HTTPException(404, { message: "Restaurant not found" });
    }

    return c.json(restaurant, 200);
  });
