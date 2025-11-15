"use client";
import { formatInTimeZone } from "date-fns-tz";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Receipt,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

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
import { Separator } from "@/components/ui/separator";
import { useDish } from "@/hooks/use-dishes";
import { useOrder } from "@/hooks/use-orders";
import { useRestaurant } from "@/hooks/use-restaurants";

import { CookYourselfDialog } from "./_components/cook-yourself-dialog";

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
    case "en-route":
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

  const id = params.orderId;

  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(id);

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

  const isLoading = orderLoading || dishLoading || restaurantLoading;
  const hasError = orderError || dishError || restaurantError;

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

  if (!order || hasError) {
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
                  {restaurant?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={dish?.image ?? ""}
                      alt={dish?.name ?? ""}
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
                          {dish?.name}
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
                    {((dish?.price ?? 0) * order.items[0]?.quantity).toFixed(2)}
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
                        order.status === "en-route" || isDelivered
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      3
                    </div>
                    <div>
                      <p className="font-medium">Out for Delivery</p>
                      {order.status === "en-route" && (
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
              <CookYourselfDialog dishName={dish?.name ?? ""} dishImage={dish?.image ?? ""} />
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
