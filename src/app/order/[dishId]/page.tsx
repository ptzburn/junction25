"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

type Props = {
  params: { dishId: string };
};

type DishAnalysis = {
  ingredients: string[];
  totalPrice?: number;
  deliveryETA?: string;
  cached?: boolean;
};

export default function OrderDishPage({ params }: Props) {
  const { dishId } = params;
  const [analysis, setAnalysis] = useState<DishAnalysis | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`analysis:${dishId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as DishAnalysis;
        setAnalysis(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, [dishId]);

  const ingredients = analysis?.ingredients ?? [];

  const prices = useMemo(() => {
    if (!ingredients.length) return [] as number[];
    const total = (analysis?.totalPrice ?? 0) || 0;
    const n = ingredients.length;

    // if no total provided, pick a random total between 5 and 30
    const targetTotal = total > 0 ? total : Number((Math.random() * 25 + 5).toFixed(2));

    // generate random weights
    const weights = Array.from({ length: n }, () => Math.random());
    const weightSum = weights.reduce((s, w) => s + w, 0);
    const rawPrices = weights.map(w => (w / weightSum) * targetTotal);

    // round to cents, adjust last item to ensure sum equals targetTotal
    const rounded = rawPrices.map(p => Math.round(p * 100) / 100);
    const roundedSum = rounded.reduce((s, p) => s + p, 0);
    const diff = Math.round((targetTotal - roundedSum) * 100) / 100;
    rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 100) / 100;

    return rounded;
  }, [analysis]);

  function formatCurrency(v: number) {
    return `€${v.toFixed(2)}`;
  }

  function parseEstimatedTime(input?: string) {
    if (!input) return null;
    // find first HH:MM or HH.MM or H:MM pattern
    const m = input.match(/(\d{1,2}[:.]\d{2})/);
    if (!m) return null;
    const t = m[1].replace(".", ":");
    const [hh, mm] = t.split(":").map(Number);
    const now = new Date();
    now.setHours(hh, mm, 0, 0);
    return now;
  }

  function etaRangeText(input?: string) {
    const est = parseEstimatedTime(input);
    if (!est) return null;
    const start = new Date(est.getTime() - 5 * 60_000);
    const end = new Date(est.getTime() + 5 * 60_000);
    const fmt = (d: Date) => d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
    return `${fmt(start)} - ${fmt(end)}`;
  }

  const etaRange = etaRangeText(analysis?.deliveryETA ?? undefined);

  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<null | { orderId: string; etaHuman?: string }>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirmError(null);
    setConfirming(true);
    setConfirmResult(null);
    try {
      const res = await fetch('/api/buy-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setConfirmResult({ orderId: json.orderId, etaHuman: json.eta?.human });
      // optionally clear sessionStorage for this dish
      try { sessionStorage.removeItem(`analysis:${dishId}`); } catch {}
    } catch (err: any) {
      setConfirmError(err?.message ?? 'Failed to place order');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Order ingredients</h1>
          <Button asChild>
            <Link href="/">Back</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">Ingredients for</div>
              <div className="font-medium text-lg">{dishId}</div>
            </div>

            {analysis ? (
              <div className="grid gap-2">
                {analysis.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border px-4 py-2">
                    <div className="text-sm">{ing}</div>
                    <div className="font-medium text-sm">{formatCurrency(prices[i] ?? 0)}</div>
                  </div>
                ))}

                <div className="pt-4 border-t mt-2 flex flex-col items-center">
                  <div className="text-sm text-muted-foreground">Estimated total</div>
                  <div className="font-semibold text-2xl">{formatCurrency(prices.reduce((s, p) => s + p, 0))}</div>

                  {etaRange && (
                    <div className="mt-3 text-sm text-muted-foreground">Delivery window</div>
                  )}
                  {etaRange && (
                    <div className="mt-1 text-white font-semibold text-xl">{etaRange}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">No analysis available — open the restaurant and click "Order ingredients" to analyze the dish first.</div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div>
              {confirmError && <div className="text-destructive text-sm">{confirmError}</div>}
              {confirmResult && (
                <div className="text-sm">
                  Order placed: <span className="font-medium">{confirmResult.orderId}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/">Back</Link>
              </Button>
              <Button onClick={handleConfirm} disabled={!analysis || confirming}>
                {confirming ? <Spinner /> : "Confirm order"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
