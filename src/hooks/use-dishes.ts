import { useQuery } from "@tanstack/react-query";

import { routesClient } from "@/lib/rpc-client";

export function useDishes() {
  return useQuery({
    queryKey: ["dishes"],
    queryFn: async () => {
      const response = await routesClient.dishes.$get();
      return response.json();
    },
    staleTime: 30_000,
  });
}

export function useDish(id: string) {
  return useQuery({
    queryKey: ["dish", id],
    queryFn: async () => {
      const response = await routesClient.dishes[":id"].$get({ param: { id } });
      return response.json();
    },
    enabled: !!id,
  });
}

export function useRestaurantDishes(restaurantId: string) {
  return useQuery({
    queryKey: ["restaurant-dishes", restaurantId],
    queryFn: async () => {
      const response = await routesClient.restaurants[":restaurantId"].dishes.$get({ param: { restaurantId } });
      return response.json();
    },
    enabled: !!restaurantId,
  });
}
