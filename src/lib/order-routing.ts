import type { Order } from "@/app/api/_schemas/orders";
import type { Dish } from "@/types/restaurant";

import ordersJson from "../../data/orders.json" assert { type: "json" };
import restaurantsJson from "../../data/restaurants.json" assert { type: "json" };

const restaurantSlugToName = new Map(
  (restaurantsJson as { restaurants: { id: string; name: string }[] }).restaurants.map(restaurant => [restaurant.id, restaurant.name] as const),
);

const restaurantNameToOrderId = new Map(
  (ordersJson as { restaurant?: string; id: string }[]).map(order => [order.restaurant, order.id] as const),
);

export function getOrderIdForDish(dish: Dish | null | undefined): string | null {
  if (!dish?.restaurantSlug) {
    return null;
  }

  const restaurantName = restaurantSlugToName.get(dish.restaurantSlug);
  if (!restaurantName) {
    return null;
  }

  return restaurantNameToOrderId.get(restaurantName) ?? null;
}
