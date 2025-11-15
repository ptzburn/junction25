"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderIdForDish } from "@/lib/order-routing";
import { computeEtaWindow } from "@/lib/time-window";
import type { Dish, Restaurant } from "@/types/restaurant";
import type { DeliveryBetSummary } from "@/types/delivery-bet";

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

export default function PlacedOrderPage() {
  const params = useParams() as { orderId?: string };
  const router = useRouter();
  const orderId = params.orderId ?? "";

  const [dishName, setDishName] = useState<string>();
  const [groupPlan, setGroupPlan] = useState<StoredGroupEntry[]>([]);
  const [partySize, setPartySize] = useState<number | null>(null);
  const [showEta, setShowEta] = useState(false);
  const [betSummary, setBetSummary] = useState<DeliveryBetSummary | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`analysis:${orderId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        // support multiple possible shapes
        const name = parsed.dishName ?? parsed.dish?.name ?? parsed.title ?? parsed.name;
        if (typeof name === "string" && name.length > 0) setDishName(name);
      }
    } catch (e) {
      // ignore
    }
  }, [orderId]);

  useEffect(() => {
    try {
      const rawPlan = sessionStorage.getItem("group-order-plan");
      if (rawPlan) {
        const parsed = JSON.parse(rawPlan) as StoredGroupPlan;
        setGroupPlan(parsed.plan?.filter(entry => entry.quantity > 0) ?? []);
        setPartySize(parsed.partySize ?? null);
      }
      else {
        setGroupPlan([]);
      }
    }
    catch {
      setGroupPlan([]);
    }
  }, []);

  useEffect(() => {
    try {
      const storedBet = orderId ? sessionStorage.getItem(`delivery-bet:${orderId}`) : null;
      if (storedBet) {
        setBetSummary(JSON.parse(storedBet) as DeliveryBetSummary);
      }
      else {
        setBetSummary(null);
      }
    }
    catch {
      setBetSummary(null);
    }
  }, [orderId]);

  // Slide-in time card state
  const [showSlide, setShowSlide] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [displayTime, setDisplayTime] = useState<Date>(new Date());
  const baseTimeRef = useRef<Date | null>(null);

  const search = useSearchParams();
  const timeOfDeliveryParam = search?.get("timeOfDelivery");
  const { etaText, parsedDelivery, hasDeliveryParam } = computeEtaWindow(timeOfDeliveryParam);

  useEffect(() => {
    const t = window.setTimeout(() => {
      // show the slide and capture a single timestamp snapshot
      // If a delivery time was provided, set the snapshot to 3 hours before the delivery time
      const snap = hasDeliveryParam && parsedDelivery
        ? new Date(parsedDelivery.getTime() - 3 * 60 * 60 * 1000)
        : new Date();
      setCurrentTime(snap);
      setDisplayTime(snap);
      baseTimeRef.current = snap;
      setShowSlide(true);
    }, 2000);

    return () => clearTimeout(t);
  }, [timeOfDeliveryParam]);

  const circumference = 2 * Math.PI * 88; // r = 88
  // progress state: will animate from 0 -> 0.75 over 15 minutes after the slide appears
  const [progress, setProgress] = useState<number>(0);
  const dash = circumference * progress;
  const totalServings = groupPlan.reduce((sum, entry) => sum + entry.quantity, 0);
  const guestEstimate = partySize ?? (totalServings || 0);

  const handleGoToRestaurant = (dish: Dish) => {
    const lookup = getOrderIdForDish(dish);
    if (lookup) {
      router.push(`/orders/${lookup}`);
      return;
    }

    if (dish.restaurantSlug) {
      router.push(`/restaurants/${dish.restaurantSlug}`);
      return;
    }

    router.push("/orders");
  };

  useEffect(() => {
    if (!showSlide) return;

    // After 1s delay, animate progress from 0 -> 0.75 over 2 seconds (fast animation)
    const delayTimer = window.setTimeout(() => {
      const duration = 2000; // 2 seconds total animation
      let rafId: number | null = null;
      let startTime: number | null = null;

      const tick = (ts: number) => {
        if (startTime === null) startTime = ts;
        const elapsed = ts - startTime;
        const t = Math.min(1, elapsed / duration);
        setProgress(0.75 * t);
        // animate displayed time from snapshot -> snapshot + 15 minutes over the same t
        const base = baseTimeRef.current ?? new Date();
        // If a delivery time param was provided, fast-forward by a larger amount (135 minutes) to simulate time progress
        const targetAdvanceMinutes = hasDeliveryParam ? 135 : 15;
        const addedMs = t * targetAdvanceMinutes * 60 * 1000; // minutes -> ms scaled by t
        setDisplayTime(new Date(base.getTime() + addedMs));
        if (elapsed < duration) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);

      // cleanup function for animation
      const cleanup = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
      };

      // ensure cleanup on effect re-run/unmount
      return cleanup;
    }, 1000);

    return () => clearTimeout(delayTimer);
  }, [showSlide]);

  const handleReturnHome = () => router.push("/");
  const handleRevealEta = () => setShowEta(true);
  const handleOpenMinigame = () => {
    const params = new URLSearchParams();
    if (timeOfDeliveryParam) {
      params.set("timeOfDelivery", timeOfDeliveryParam);
    }
    const query = params.toString();
    router.push(`/placedOrder/${orderId}/minigame${query ? `?${query}` : ""}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full px-6 pt-10 flex flex-col items-center gap-6">
        <div className="w-full max-w-md">
          <Card className="p-4">
            <CardContent className="space-y-6">
              <p className="text-center text-sm text-muted-foreground">Tracking is not available for this order 😕</p>

              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <div className="font-semibold">{dishName} Ingridients</div>
                    <div className="text-xs text-muted-foreground">Distance 2.7 km</div>
                  </div>
                  <div className="text-sm text-muted-foreground">📞 📍</div>
                </CardContent>
              </Card>

              <div className="flex w-full flex-col items-center gap-6">
              {betSummary ? (
                <div className="w-full space-y-4 rounded-[28px] border border-primary/20 bg-primary/5 p-5 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Prediction bet locked</p>
                  <p className="text-2xl font-semibold">{betSummary.outcomeLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    Stake locked: €
                    {betSummary.stake.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll notify you once the courier arrives so you know whether the bet hits.
                  </p>
                  <Button
                    className="w-full py-4 text-base font-semibold"
                    variant="secondary"
                    onClick={handleReturnHome}
                  >
                    Return to main page
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-full space-y-4">
                    <div className="flex flex-col gap-3">
                      <Button
                        className="w-full py-5 text-base font-semibold"
                        variant="secondary"
                        onClick={handleRevealEta}
                        disabled={showEta}
                      >
                        {showEta ? "Arrival window revealed" : "Reveal estimated arrival time"}
                      </Button>
                      {!showEta && (
                        <Button
                          className="w-full py-5 text-base font-semibold bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 text-white shadow-lg hover:opacity-90"
                          variant="default"
                          onClick={handleOpenMinigame}
                        >
                          Guess delivery time
                        </Button>
                      )}
                    </div>
                    {!showEta && (
                      <p className="text-center text-xs text-muted-foreground">
                        Choose reveal to check the official window or guess to place a prediction bet.
                      </p>
                    )}
                  </div>

                  {showEta && (
                    <>
                      <div className="relative mb-4 h-56 w-56">
                        <svg className="h-full w-full" viewBox="0 0 220 220">
                          <defs>
                            <linearGradient id="g1" x1="0" x2="1">
                              <stop offset="0%" stopColor="#34d399" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          <g transform="translate(110,110)">
                            <circle r="88" fill="none" stroke="var(--muted)" strokeWidth="12" strokeOpacity="1" />
                            <circle
                              r="88"
                              fill="none"
                              stroke="url(#g1)"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${dash} ${circumference - dash}`}
                              strokeDashoffset={0}
                              transform="rotate(-90)"
                            />
                            <circle r="70" fill="var(--background)" />
                          </g>
                        </svg>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-lg font-semibold">{etaText}</div>
                          <div className="text-xs text-muted-foreground">Estimated delivery time</div>
                        </div>
                      </div>

                      <div className="mb-2 text-center">
                        <div className="font-semibold">Your order will be delivered soon</div>
                        <div className="mt-2 text-sm text-muted-foreground">Order in progress! Your order is being prepared now.</div>
                        <div className="mt-1 text-sm text-muted-foreground">Estimated delivery window: {etaText}.</div>
                      </div>

                     
                    </>
                  )}

                  <Button
                    className="w-full py-5 text-base font-semibold"
                    variant="ghost"
                    onClick={handleReturnHome}
                  >
                    Return to main page
                  </Button>
                </>
              )}
              </div>
            </CardContent>
          </Card>
        </div>

        {groupPlan.length > 0 && (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <Badge variant="outline">Group plan</Badge>
              <CardTitle>Curated dishes</CardTitle>
              <CardDescription>
                Serving approximately
                {" "}
                {guestEstimate}
                {" "}
                guest{guestEstimate === 1 ? "" : "s"}
                {totalServings > 0 && (
                  <>
                    {" "}·
                    {" "}
                    {totalServings}
                    {" "}
                    portion
                    {totalServings === 1 ? "" : "s"}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupPlan.map((entry) => (
                <div
                  key={entry.dish.id}
                  className="rounded-2xl border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold leading-tight">{entry.dish.name}</h3>
                      <Badge variant="secondary">×{entry.quantity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.restaurant?.name ?? "Restaurant info unavailable"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Match confidence
                      {" "}
                      {Math.round(Math.min(Math.max(entry.matchScore, 0), 1) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.dish.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button size="sm" variant="outline" onClick={() => handleGoToRestaurant(entry.dish)}>
                      Go to restaurant
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      {/* Slide-in time card (appears after 2s) */}
      <div
        className="fixed top-1/3 z-50"
        style={{
          right: "15%", // end position: more to the left (closer to center)
          transform: showSlide ? "translateX(0)" : "translateX(250%)", // start: further to the right when hidden
          transition: "transform 500ms ease",
        }}
      >
        <Card className="w-64 shadow-lg">
          <CardContent>
            <div className="text-sm text-muted-foreground">Current time</div>
            <div className="font-semibold">{displayTime.toLocaleTimeString()}</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
