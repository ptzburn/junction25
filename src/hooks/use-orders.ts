import { useMutation, useQuery } from "@tanstack/react-query";

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

export function useAnalyzeDish(dishName: string, imageUrl: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await routesClient["analyze-dish"].$post({ json: { dishName, imageUrl } });
      return response.json();
    },
  });
}

export function useImageDishOrder() {
  return useMutation({
    mutationFn: async (payload: { imageBase64: string; mimeType: string; notes?: string }) => {
      const response = await routesClient["ai-image-order"].$post({ json: payload });
      return response.json();
    },
  });
}

export function useTextDishOrder() {
  return useMutation({
    mutationFn: async (payload: { notes: string; limit?: number }) => {
      const response = await routesClient["ai-text-order"].$post({ json: payload });
      return response.json();
    },
  });
}

export function useBuyIngredients() {
  return useMutation({
    mutationFn: async (payload: { dishId: string }) => {
      const response = await routesClient["buy-ingredients"].$post({ json: payload });
      return response.json();
    },
  });
}
