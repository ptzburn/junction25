"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRange(start: Date, end: Date) {
  return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

export default function PlacedOrderPage() {
  const params = useParams() as { orderId?: string };
  const router = useRouter();
  const orderId = params.orderId ?? "";

  const [dishName, setDishName] = useState<string>();

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

  // Slide-in time card state
  const [showSlide, setShowSlide] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [displayTime, setDisplayTime] = useState<Date>(new Date());
  const baseTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      // show the slide and capture a single timestamp snapshot
      const snap = new Date();
      setCurrentTime(snap);
      setDisplayTime(snap);
      baseTimeRef.current = snap;
      setShowSlide(true);
    }, 2000);

    return () => clearTimeout(t);
  }, []);

  // Compute a friendly ETA range (20 - 40 minutes from now)
  const now = new Date();
  const start = new Date(now.getTime() + 20 * 60_000);
  const end = new Date(now.getTime() + 40 * 60_000);
  const etaText = formatRange(start, end);

  const circumference = 2 * Math.PI * 88; // r = 88
  // progress state: will animate from 0 -> 0.75 over 15 minutes after the slide appears
  const [progress, setProgress] = useState<number>(0);
  const dash = circumference * progress;

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
        const addedMs = t * 15 * 60 * 1000; // 15 minutes in ms scaled by t
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

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-md px-6 pt-10">
        <Card className="p-4">
          <CardContent>
            <p className="text-center text-sm text-muted-foreground mb-4">Tracking is not available for this order 😕</p>

            <Card className="mb-4">
              <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">🍕</div>
                <div className="flex-1">
                  <div className="font-semibold">{dishName} Ingridients</div>
                  <div className="text-xs text-muted-foreground">Distance 2.7 km</div>
                </div>
                <div className="text-sm text-muted-foreground">📞 📍</div>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center">
              <div className="w-56 h-56 relative mb-6">
                <svg className="w-full h-full" viewBox="0 0 220 220">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <g transform="translate(110,110)">
                    <circle r="88" fill="none" stroke="var(--muted)" strokeWidth="12" opacity="0.12" />
                    <circle r="88" fill="none" stroke="url(#g1)" strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={0} transform="rotate(-90)" />
                    <circle r="70" fill="var(--background)" />
                  </g>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-lg font-semibold">{etaText}</div>
                  <div className="text-xs text-muted-foreground">Estimated delivery time</div>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="font-semibold">Miia's Home Delivery</div>
                <div className="text-sm text-muted-foreground mt-2">Order in progress! Your order is being prepared now.</div>
                <div className="text-sm text-muted-foreground mt-1">Estimated delivery window: {etaText}.</div>
              </div>

              <div className="w-full">
                <Button className="w-full" variant="default" onClick={() => router.back()}>
                  Hide tracking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
