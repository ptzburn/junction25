"use client";

import type { Order } from "@/hooks/use-orders";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type OrderDetailViewProps = {
  orderId?: string | null;
  order?: Order | null;
  isLoading: boolean;
  error?: Error | null;
  onClose: () => void;
  formatItems: (items: Order["items"]) => string;
  statusUi?: { label: string; pillClass: string };
};

export function OrderDetailView({
  orderId,
  order,
  isLoading,
  error,
  onClose,
  formatItems,
  statusUi,
}: OrderDetailViewProps) {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Order detail</p>
            {orderId && (
              <h1 className="text-2xl font-semibold">{orderId}</h1>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            ← Back to dashboard
          </Button>
        </div>

        {isLoading && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading order details...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">
              {`Unable to load order: ${error.message}`}
            </CardContent>
          </Card>
        )}

        {order && (
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden">
              <div
                className="h-64 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${order.image})` }}
                aria-hidden
              />
              <CardHeader className="gap-2">
                <Badge variant="secondary" className="w-fit">
                  {order.category}
                </Badge>
                <CardTitle>{order.restaurant}</CardTitle>
                <CardDescription>
                  {`${order.neighborhood}, ${order.city}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-4 text-foreground">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">ETA</p>
                    <p className="text-lg font-semibold">
                      {`${order.etaMinutes[0]}–${order.etaMinutes[1]} min`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Courier</p>
                    <p className="text-lg font-semibold">
                      {`${order.courier}${order.courierEta ? ` · ${order.courierEta} min away` : ""}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">
                      {`${order.total.toFixed(2)} €`}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Items</p>
                  <p>{formatItems(order.items)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <Badge className={statusUi?.pillClass ?? ""}>
                    {statusUi?.label ?? order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Placed</p>
                  <p>{new Date(order.placedAt).toLocaleString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-muted/40 p-6">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button>Track courier</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

