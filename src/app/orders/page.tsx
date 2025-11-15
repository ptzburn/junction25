"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { OrderCard } from "@/_components/order-card";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";

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
            return (
              <OrderCard key={order.id} orderId={order.id} />
            );
          })}
        </div>
      </div>
    </main>
  );
}
