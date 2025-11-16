"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import type { DeliveryBucket } from "@/lib/time-window";
import type { DeliveryBetSummary } from "@/types/delivery-bet";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { computeEtaWindow } from "@/lib/time-window";

export default function MinigamePage() {
  const params = useParams() as { orderId?: string };
  const router = useRouter();
  const search = useSearchParams();
  const timeOfDeliveryParam = search?.get("timeOfDelivery");

  const { hasDeliveryParam, minutesUntilDelivery, bucket } = computeEtaWindow(timeOfDeliveryParam);
  const [selectedOutcome, setSelectedOutcome] = useState<DeliveryBucket | null>(null);
  const [stake, setStake] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const orderId = params.orderId ?? "";
  const orderViewPath = useMemo(() => {
    const query = timeOfDeliveryParam ? `?timeOfDelivery=${encodeURIComponent(timeOfDeliveryParam)}` : "";
    return `/placedOrder/${orderId}${query}`;
  }, [orderId, timeOfDeliveryParam]);

  const outcomeOptions: Array<{ key: DeliveryBucket; label: string; description: string }> = [
    { key: "under-30", label: "Less than 30 min", description: "Courier flying through shortcuts" },
    { key: "30-60", label: "30–60 min", description: "Peak dinner hour pace" },
    { key: "over-60", label: "Over an hour", description: "Busy routes or traffic" },
  ];

  const handlePlaceBet = () => {
    setError(null);
    setFeedback(null);
    const parsedStake = Number(stake);
    if (!selectedOutcome) {
      setError("Choose a delivery window prediction before placing your bet.");
      return;
    }
    if (Number.isNaN(parsedStake) || parsedStake < 1 || parsedStake > 1000) {
      setError("Stake must be between €1 and €1000.");
      return;
    }

    const actualMinutes = minutesUntilDelivery ?? 45;
    const actualBucket = bucket;
    const won = selectedOutcome === actualBucket;
    const creditsAwarded = won ? parsedStake : 0;
    const payload = {
      outcomeKey: selectedOutcome,
      outcomeLabel: outcomeOptions.find(option => option.key === selectedOutcome)?.label ?? "",
      stake: parsedStake,
      won,
      creditsAwarded,
      actualMinutes,
      createdAt: new Date().toISOString(),
    } satisfies DeliveryBetSummary;

    try {
      if (orderId) {
        sessionStorage.setItem(`delivery-bet:${orderId}`, JSON.stringify(payload));
      }
    }
    catch {
      // ignore storage errors
    }

    setSubmitting(true);

    window.setTimeout(() => {
      router.push(orderViewPath);
    }, 1400);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-2xl px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">OnlyFood courier quest</p>
          <h1 className="text-4xl font-semibold">Delivery Window Minigame</h1>
          <p className="text-sm text-muted-foreground">
            Guess when your rider knocks, lock in a prediction, then jump back to your tracker.
          </p>
        </div>

        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Secret delivery window</span>
              <Badge variant="secondary" className="flex items-center gap-1 font-mono">
                <span>Order #</span>
                <span>{orderId.slice(0, 6) || "???"}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prediction bet</p>
                <p className="text-sm text-muted-foreground">Pick the window your courier arrives in.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {outcomeOptions.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedOutcome(option.key)}
                    className={`rounded-2xl border p-4 text-left transition ${selectedOutcome === option.key ? "border-primary bg-primary/10 shadow-lg" : "border-border/70 bg-card/60"}`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="stake-input">Stake amount (€)</label>
                <Input
                  id="stake-input"
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={stake}
                  onChange={event => setStake(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">If you win, the stake becomes Wolt credits. If you miss, the courier keeps it.</p>
              </div>

              <Button
                className="w-full py-5 text-base font-semibold bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 text-white shadow-lg hover:opacity-90"
                onClick={handlePlaceBet}
                disabled={submitting}
              >
                {submitting ? "Placing bet..." : "Place prediction bet"}
              </Button>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {feedback && <p className="text-sm font-semibold text-center text-primary">{feedback}</p>}
            </div>

            <Button
              className="w-full py-5 text-base font-semibold"
              variant="outline"
              onClick={() => router.push(orderViewPath)}
            >
              Back to tracking
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
