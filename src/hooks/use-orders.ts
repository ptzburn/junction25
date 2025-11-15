import { useMutation, useQuery } from "@tanstack/react-query";

import type { Dish } from "@/app/api/_schemas/dishes";

import { routesClient } from "@/lib/rpc-client";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await routesClient.orders.$get();
      return response.json();
    },
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await routesClient.orders[":id"].$get({ param: { id } });
      return response.json();
    },
    enabled: !!id,
  });
}

export function useAnalyzeDish(dish: Dish) {
  return useMutation({
    mutationFn: async () => {
      const response = await routesClient["analyze-dish"].$post({ json: dish });
      return response.json();
    },
  });
}
