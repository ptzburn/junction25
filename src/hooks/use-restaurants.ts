import { useQuery } from "@tanstack/react-query";

import { routesClient } from "@/lib/rpc-client";

export function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const response = await routesClient.restaurants.$get();
      return response.json();
    },
    staleTime: 30_000,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const response = await routesClient.restaurants[":id"].$get({ param: { id } });
      return response.json();
    },
    enabled: !!id,
  });
}
