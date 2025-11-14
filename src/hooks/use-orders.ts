import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type OrderStatus = "preparing" | "delivering" | "delivered";

export type OrderItem = {
  name: string;
  quantity: number;
};

export type Order = {
  id: string;
  restaurant: string;
  category: string;
  status: OrderStatus;
  city: string;
  neighborhood: string;
  etaMinutes: [number, number];
  courier: string;
  courierEta: number;
  items: OrderItem[];
  image: string;
  total: number;
  placedAt: string;
};

export type DishAnalysis = {
  ingredients: string[];
  totalPrice: number;
  deliveryETA: string;
  cached?: boolean;
};

export type AnalyzeDishPayload = {
  dishName: string;
  imageUrl: string;
};

const API_BASE = "/api";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message)
        message = body.message;
    }
    catch {
      // ignore JSON parsing issues for error responses
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function fetchOrders(): Promise<Order[]> {
  const data = await fetchJson<{ orders: Order[] }>(`${API_BASE}/orders`, {
    cache: "no-store",
  });
  return data.orders;
}

async function fetchOrderById(id: string): Promise<Order> {
  return fetchJson<Order>(`${API_BASE}/orders/${id}`, { cache: "no-store" });
}

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  analysis: (dishName?: string, imageUrl?: string) =>
    [...orderKeys.all, "analysis", dishName ?? "unknown", imageUrl ?? "unknown"] as const,
} as const;

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: fetchOrders,
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: orderKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const fromCache = queryClient.getQueryData<Order[]>(orderKeys.lists());
      if (fromCache) {
        const cachedOrder = fromCache.find(order => order.id === id);
        if (cachedOrder)
          return cachedOrder;
      }

      const order = await fetchOrderById(id);
      queryClient.setQueryData(orderKeys.detail(id), order);
      return order;
    },
  });
}

export function useAnalyzeDish() {
  return useMutation({
    mutationKey: orderKeys.analysis(),
    mutationFn: async (payload: AnalyzeDishPayload) => {
      return fetchJson<DishAnalysis>(`${API_BASE}/analyze-dish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
  });
}
