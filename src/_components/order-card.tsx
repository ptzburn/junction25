"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDish } from "@/hooks/use-dishes";
import { useOrder } from "@/hooks/use-orders";
import { useRestaurant } from "@/hooks/use-restaurants";

import { OrderCardSkeleton } from "./order-card-skeleton";

export function OrderCard({ orderId }: { orderId: string }) {
  const router = useRouter();

  // 1. Fetch order
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId);

  // 2. Fetch first dish (only if we have an item ID)
  const firstItemId = order?.items[0]?.id;
  const {
    data: dish,
    isLoading: dishLoading,
    error: dishError,
  } = useDish(firstItemId ?? "");

  // 3. Fetch restaurant (only if we have restaurant ID from dish)
  const restaurantId = dish?.restaurantId; // assuming field is `restaurant` (string ID)
  const {
    data: restaurant,
    isLoading: restaurantLoading,
    error: restaurantError,
  } = useRestaurant(restaurantId ?? "");

  // 4. Loading state: show skeleton until ALL data is ready
  const isLoading = orderLoading || dishLoading || restaurantLoading;
  const hasError = orderError || dishError || restaurantError;

  if (isLoading) {
    return <OrderCardSkeleton />;
  }

  if (hasError || !order || !dish || !restaurant) {
    return (
      <Card className="overflow-hidden">
        <div className="h-32 bg-muted" />
        <CardContent className="p-5">
          <p className="text-sm text-destructive">Failed to load order</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      key={order.id}
      className="overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      role="button"
      tabIndex={0}
      aria-label={`View order ${order.id}`}
      onClick={() => router.push(`/orders/${order.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/orders/${order.id}`);
        }
      }}
    >
      <div className="h-32 w-full rounded-2xl overflow-hidden px-3 bg-card">
        <div
          className="h-full w-full bg-cover bg-center rounded-lg"
          style={{ backgroundImage: `url(${dish?.image})` }}
          aria-hidden
        />
      </div>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{restaurant?.name}</p>
          </div>
          <Badge variant={order.status === "delivered" ? "outline" : order.status === "en-route" ? "default" : "secondary"}>
            {order.status === "delivered"
              ? "Delivered"
              : order.status === "en-route"
                ? "Courier en route"
                : "Being prepared"}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {`${order.etaMinutes[0]}–${order.etaMinutes[1]} min`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              try {
                const analysis = {
                  dishName: dish?.name ?? null,
                  dishImage: dish?.image ?? null,
                };
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(`analysis:${order.id}`, JSON.stringify(analysis));
                }
              } catch {}
              router.push(`/placedOrder/${order.id}`);
            }}
          >
            Reorder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
