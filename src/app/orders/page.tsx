"use client";
import { format } from "date-fns";
import { ArrowLeft, Clock, MapPin, Package, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Order } from "@/app/api/_schemas/orders";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";

function formatItems(items: Order["items"]) {
  return items.map(item => `${item.quantity}× ${item.name}`).join(", ");
}

function getStatusConfig(status: Order["status"]) {
  switch (status) {
    case "preparing":
      return { label: "Being prepared", variant: "secondary" as const, icon: Package };
    case "delivering":
      return { label: "Courier en route", variant: "default" as const, icon: Truck };
    case "delivered":
      return { label: "Delivered", variant: "outline" as const, icon: null };
    default:
      return { label: status, variant: "secondary" as const, icon: null };
  }
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const { data: ordersData, isLoading, error } = useOrders();
  const orders = (ordersData?.orders ?? []).sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );

  if (isLoading) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading orders...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !orders.length) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="text-2xl font-semibold">No orders yet</div>
            <p className="text-muted-foreground">Your order history will appear here once you place an order.</p>
            <Button onClick={() => router.push("/")}>Start ordering</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Order History</h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">All Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length}
            {" "}
            {orders.length === 1 ? "order" : "orders"}
            {" "}
            total
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const placedDate = new Date(order.placedAt);
            const isDelivered = order.status === "delivered";

            return (
              <Card
                key={order.id}
                className="overflow-hidden cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                role="button"
                tabIndex={0}
                aria-label={`View details for order ${order.id}`}
                onClick={() => router.push(`/orders/${order.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/orders/${order.id}`);
                  }
                }}
              >
                <div className="flex">
                  <div className="relative h-32 w-32 flex-shrink-0 md:h-40 md:w-40">
                    <Image
                      src={order.image}
                      alt={`Order from ${order.restaurant}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 128px, 160px"
                    />
                  </div>

                  <CardContent className="flex flex-1 flex-col justify-between p-5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{order.restaurant}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(placedDate, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                          {StatusIcon && <StatusIcon className="h-3 w-3" />}
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">{formatItems(order.items)}</p>

                        <div className="flex flex-wrap gap-3 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{order.neighborhood}</span>
                          </div>

                          {!isDelivered && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {order.etaMinutes[0]}
                                –
                                {order.etaMinutes[1]}
                                {" "}
                                min
                              </span>
                            </div>
                          )}

                          {order.courier && !isDelivered && (
                            <div className="flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5" />
                              <span>
                                {order.courierEta}
                                {" "}
                                min away
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-lg font-semibold">
                        €
                        {order.total.toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Reorder logic would go here
                          }}
                        >
                          Reorder
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
