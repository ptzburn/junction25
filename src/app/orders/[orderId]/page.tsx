"use client";
import { formatInTimeZone } from "date-fns-tz";
import {
  AlertCircle,
  ArrowLeft,
  ChefHat,
  ChevronRight,
  Clock,
  Euro,
  Loader2,
  MapPin,
  Package,
  Receipt,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import type { Order } from "@/app/api/_schemas/orders";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAnalyzeDish, useOrder } from "@/hooks/use-orders";

import { IngredientsCard } from "./_components/ingridient-card";
import { PriceSummaryCard } from "./_components/price-card";

function getStatusConfig(status: Order["status"]) {
  switch (status) {
    case "preparing":
      return {
        label: "Being prepared",
        variant: "secondary" as const,
        icon: Package,
        color: "text-amber-600",
        bg: "bg-amber-50",
      };
    case "delivering":
      return {
        label: "Courier en route",
        variant: "default" as const,
        icon: Truck,
        color: "text-blue-600",
        bg: "bg-blue-50",
      };
    case "delivered":
      return {
        label: "Delivered",
        variant: "outline" as const,
        icon: null,
        color: "text-green-600",
        bg: "bg-green-50",
      };
    default:
      return {
        label: status,
        variant: "secondary" as const,
        icon: null,
        color: "text-muted-foreground",
        bg: "bg-muted",
      };
  }
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [isPrepDialogOpen, setIsPrepDialogOpen] = useState(false);

  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const id = params.orderId;
  const { data: order, isLoading, error } = useOrder(id);
  const analyzeMutation = useAnalyzeDish(order?.items[0]?.name ?? "", order?.image ?? "");

  const handleOpen = () => {
    setIsPrepDialogOpen(true);
    analyzeMutation.mutate();
  };

  // Keep track of whether we've already triggered analysis
  const hasAnalyzed = useRef(false);

  useEffect(() => {
    if (
      order?.items?.[0]?.name
      && order?.image
      && !isLoading
      && !hasAnalyzed.current
    ) {
      hasAnalyzed.current = true; // Prevent future calls
      analyzeMutation.mutate();
    }
  }, [order, isLoading, analyzeMutation]);

  // Reset flag when order changes (e.g., new ID)
  useEffect(() => {
    hasAnalyzed.current = false;
  }, [id]);

  if (isLoading) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading order details...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!order || error) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <CardTitle>Order not found</CardTitle>
              <CardDescription>
                We couldn't find an order with ID
                {" "}
                <code className="font-mono">{id}</code>
              </CardDescription>
              <Button onClick={() => router.push("/orders")}>View all orders</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const placedAt = new Date(order.placedAt);
  const isDelivered = order.status === "delivered";
  const isPreparing = order.status === "preparing";

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              Order
              {order.id}
            </h1>
            <p className="text-xs text-muted-foreground">
              Placed on
              {" "}
              {formatInTimeZone(placedAt, "Europe/Helsinki", "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero Status Card */}
        <Card className="mb-6 overflow-hidden border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {StatusIcon && (
                  <div
                    className={`
              flex h-9 w-9 items-center justify-center rounded-full
              ${statusConfig.bg} ${statusConfig.bg}
            `}
                  >
                    <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                  </div>
                )}

                <div>
                  <CardTitle className="text-2xl">{statusConfig.label}</CardTitle>
                  <CardDescription className="text-base">
                    {isDelivered
                      ? `Delivered at ${formatInTimeZone(
                        placedAt,
                        "Europe/Helsinki",
                        "h:mm a",
                      )}`
                      : isPreparing
                        ? "Your food is being prepared with care"
                        : `Courier ${order.courier} is on the way`}
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant={statusConfig.variant}
                className={`
          px-4 py-1 text-base font-medium
          ${statusConfig.bg} ${statusConfig.color}
        `}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </CardHeader>

          {/* ETA bar – only for live orders */}
          {!isDelivered && (
            <CardContent className="bg-muted/30">
              <div className="flex items-center justify-between rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">
                    Estimated arrival:
                    {" "}
                    {order.etaMinutes[0]}
                    –
                    {order.etaMinutes[1]}
                    {" "}
                    min
                  </span>
                </div>

                {order.courierEta && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>
                      Courier
                      {order.courierEta}
                      {" "}
                      min away
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Order from
                  {" "}
                  {order.restaurant}
                  <Badge variant="outline">{order.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={order.image}
                      alt={order.restaurant}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-medium">
                          {item.quantity}
                          ×
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    €
                    {order.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.neighborhood}</p>
                <p className="text-sm text-muted-foreground">
                  {order.city}
                  , Finland
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {formatInTimeZone(placedAt, "Europe/Helsinki", "h:mm a")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isPreparing || isDelivered ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      2
                    </div>
                    <div>
                      <p className="font-medium">Restaurant Preparing</p>
                      {isPreparing && (
                        <p className="text-sm text-muted-foreground">In progress</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        order.status === "delivering" || isDelivered
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      3
                    </div>
                    <div>
                      <p className="font-medium">Out for Delivery</p>
                      {order.status === "delivering" && (
                        <p className="text-sm text-muted-foreground">
                          Courier
                          {" "}
                          {order.courierEta}
                          {" "}
                          min away
                        </p>
                      )}
                    </div>
                  </div>

                  {isDelivered && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-sm text-muted-foreground">
                          {formatInTimeZone(placedAt, "Europe/Helsinki", "h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full justify-between" size="lg">
                <span>Reorder Items</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Dialog open={isPrepDialogOpen} onOpenChange={setIsPrepDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-between" size="lg" variant="secondary" onClick={handleOpen}>
                    <span>Want to prepare it yourself?</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ChefHat className="h-6 w-6" />
                      Prepare
                      {" "}
                      {order.items[0]!.name}
                    </DialogTitle>
                    <DialogDescription>
                      Here's everything you need to make it at home.
                    </DialogDescription>
                  </DialogHeader>

                  {analyzeMutation.isPending && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Analyzing dish...</p>
                    </div>
                  )}

                  {analyzeMutation.isError && (
                    <div className="text-center py-8 text-destructive">
                      Failed to analyze dish. Please try again.
                    </div>
                  )}

                  {analyzeMutation.data && (
                    <div className="space-y-6 py-4">
                      {/* Ingredients */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Package className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Ingredients</h3>
                            <Badge variant="secondary" className="ml-auto">
                              {analyzeMutation.data?.matchedStockItems.length}
                              {" "}
                              items
                            </Badge>
                          </div>
                          <ul className="space-y-2">
                            {analyzeMutation.data && (
                              <div className="space-y-6 py-4">
                                <IngredientsCard items={analyzeMutation.data.matchedStockItems} onQuantityChange={setQuantities} />
                                {/* Other cards... */}
                              </div>
                            )}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Instructions */}
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              1
                            </span>
                            Instructions
                          </h3>
                          <ol className="space-y-3">
                            {analyzeMutation.data?.instructions.map((step, i) => (
                              <li key={i} className="flex gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                  {i + 1}
                                </span>
                                <span className="text-sm text-muted-foreground pt-0.5">
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>

                      <Separator />

                      {/* Price Summary */}
                      <PriceSummaryCard
                        items={analyzeMutation.data.matchedStockItems}
                        quantities={quantities}
                      />
                    </div>
                  )}

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsPrepDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Close
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      disabled={analyzeMutation.isPending || !analyzeMutation.data}
                      onClick={() => {
                        try {
                          // store the analysis for this order so the placedOrder page can read it
                          const dishName = order?.items?.[0]?.name ?? undefined;
                          const payload = dishName
                            ? { ...analyzeMutation.data, dishName }
                            : analyzeMutation.data;
                          sessionStorage.setItem(`analysis:${id}`, JSON.stringify(payload));
                        } catch (e) {
                          // ignore storage errors
                        }
                        // navigate to the placedOrder page for this order
                        router.push(`/placedOrder/${id}`);
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Order Ingredients
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="w-full" size="lg">
                <Receipt className="mr-2 h-5 w-5" />
                Download Receipt
              </Button>
              <Button variant="ghost" className="w-full" size="lg">
                Need Help?
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
