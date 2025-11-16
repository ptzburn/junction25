/* eslint-disable ts/no-explicit-any */
"use client";

import { AlertCircle, Send, ShoppingCart, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useGroupOrder } from "@/hooks/use-dishes";

export default function GroupOrderForm() {
  const [prompt, setPrompt] = useState("");

  const router = useRouter();

  const {
    mutate,
    data: suggestion,
    isPending,
    isError,
    error,
    reset,
  } = useGroupOrder();

  /* --------------------------------------------------------------- */
  /* Reset only when the textarea is emptied (user clears it)       */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (prompt === "" && (suggestion || isError)) {
      const timeout = setTimeout(reset, 300);
      return () => clearTimeout(timeout);
    }
  }, [prompt, suggestion, isError, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isPending)
      return;
    mutate(prompt);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {/* ---------- Input Form ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Group Order Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder='e.g. "Meeting for 10, 2 vegans, 1 gluten-free"'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isPending}
            />
            <Button
              type="submit"
              disabled={isPending || !prompt.trim()}
              className="w-full"
            >
              {isPending
                ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Thinking…
                    </>
                  )
                : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Get Suggestion
                    </>
                  )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ---------- Error State ---------- */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>
              {(error as any)?.message
                || "Failed to generate suggestion. Try again."}
            </span>
          </CardContent>
        </Card>
      )}

      {/* ---------- Loading Skeleton ---------- */}
      {isPending && <SuggestionSkeleton />}

      {/* ---------- Success: Suggestion Result ---------- */}
      {suggestion && !isPending && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>AI Suggested Order</span>
              <Badge variant="secondary" className="font-mono">
                €
                {suggestion.total.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestion.note && (
              <p className="text-sm italic text-muted-foreground">
                {suggestion.note}
              </p>
            )}

            <div className="space-y-2">
              {suggestion.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.dietary?.map(d => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-muted-foreground">
                    <span>
                      {item.quantity}
                      {" "}
                      × €
                      {item.price.toFixed(2)}
                    </span>
                    <span className="font-semibold text-foreground">
                      €
                      {(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => router.push(`/placedOrder/${suggestion.items.map(item => item.id)}`)} className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Place Order (€
              {suggestion.total.toFixed(2)}
              )
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */
function SuggestionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
        <Skeleton className="mt-4 h-10 w-full" />
      </CardContent>
    </Card>
  );
}
