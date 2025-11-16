"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Dish, Restaurant } from "@/types/restaurant";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getOrderIdForDish } from "@/lib/order-routing";

type StoredGroupEntry = {
  dish: Dish;
  restaurant: Restaurant | null;
  quantity: number;
  matchScore: number;
};

type StoredGroupPlan = {
  plan?: StoredGroupEntry[];
  partySize?: number | null;
};

export default function GroupPlanReviewPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<StoredGroupEntry[]>([]);
  const [partySize, setPartySize] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("group-order-plan");
      if (raw) {
        const parsed = JSON.parse(raw) as StoredGroupPlan;
        setPlan(parsed.plan?.filter(entry => entry.quantity > 0) ?? []);
        setPartySize(parsed.partySize ?? null);
      }
    }
    catch {
      setPlan([]);
    }
    finally {
      setIsHydrated(true);
    }
  }, []);

  const totalServings = useMemo(
    () => plan.reduce((sum, entry) => sum + entry.quantity, 0),
    [plan],
  );

  const handleOrderDish = (dish: Dish) => {
    const orderId = getOrderIdForDish(dish);
    if (orderId) {
      router.push(`/orders/${orderId}`);
      return;
    }

    if (dish.restaurantSlug) {
      router.push(`/restaurants/${dish.restaurantSlug}`);
      return;
    }

    router.push("/orders");
  };

  const handleResetPlan = () => {
    sessionStorage.removeItem("group-order-plan");
    setPlan([]);
  };

  if (!isHydrated) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-12">
          <Spinner className="h-6 w-6" />
        </div>
      </main>
    );
  }

  if (!plan.length) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No dishes queued</CardTitle>
              <CardDescription>
                Start a fresh group search to curate a new plan before heading to checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/image_text_order">Return to AI ordering</Link>
              </Button>
              <Button variant="outline" onClick={() => router.push("/orders")}>View all orders</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Group order</p>
            <h1 className="text-3xl font-semibold tracking-tight">Review your plan</h1>
            <p className="text-muted-foreground">
              Serving
              {" "}
              {partySize ?? totalServings}
              {" "}
              guest
              {(partySize ?? totalServings) === 1 ? "" : "s"}
              {" "}
              •
              {" "}
              {totalServings}
              {" "}
              portion
              {totalServings === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link href="/image_text_order">Edit in AI flow</Link>
            </Button>
            <Button variant="ghost" onClick={handleResetPlan}>Reset plan</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <Badge variant="outline">
              {plan.length}
              {" "}
              dish
              {plan.length === 1 ? "" : "es"}
            </Badge>
            <CardTitle>Hand-picked for the group</CardTitle>
            <CardDescription>The dishes below were matched to your prompt. Adjust quantities back in the AI flow if needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {plan.map(entry => (
              <div key={entry.dish.id} className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row">
                <div className="relative h-32 w-full overflow-hidden rounded-xl bg-muted md:h-28 md:w-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.dish.image}
                    alt={entry.dish.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">{entry.dish.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.restaurant?.name ?? "Restaurant info unavailable"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      ×
                      {entry.quantity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{entry.dish.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Match confidence
                      {" "}
                      {Math.round(Math.min(Math.max(entry.matchScore, 0), 1) * 100)}
                      %
                    </span>
                    <span>•</span>
                    <span>
                      {entry.dish.price}
                      {" "}
                      each
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" onClick={() => handleOrderDish(entry.dish)}>
                      Go to restaurant
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push("/orders")}>Track existing orders</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Need these delivered?</p>
            <p className="text-sm text-muted-foreground">
              Jump into each restaurant to finalize checkout, or keep the plan handy while coordinating with friends.
            </p>
          </div>
          <Button onClick={() => handleOrderDish(plan[0]!.dish)}>Start ordering</Button>
        </div>
      </div>
    </main>
  );
}
