"use client";

import { ChefHat, ChevronRight, Loader2, Package } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { Dish } from "@/app/api/_schemas/dishes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAnalyzeDish } from "@/hooks/use-orders";

import { IngredientsCard } from "./ingridient-card";
import { PriceSummaryCard } from "./price-card";

export function CookYourselfDialog({ dish }: { dish: Dish }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const analyzeMutation = useAnalyzeDish(dish);
  const router = useRouter();

  const handleOpen = () => {
    setIsOpen(true);
    analyzeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            {dish.name}
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Ingredients</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {analyzeMutation.data?.matchedStockItems.length }
                    {" "}
                    items
                  </Badge>
                </div>
                <ul className="space-y-2">
                  <div className="space-y-6 py-4">
                    <IngredientsCard
                      items={analyzeMutation.data.matchedStockItems}
                      onQuantityChange={setQuantities}
                    />
                  </div>
                </ul>
              </CardContent>
            </Card>

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

            <PriceSummaryCard
              items={analyzeMutation.data.matchedStockItems}
              quantities={quantities}
            />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={analyzeMutation.isPending || !analyzeMutation.data}
            onClick={() => {
              // create a temporary order id and store analysis in sessionStorage
              const orderId = `ord-${Date.now()}`;
              try {
                const payload = {
                  name: dish.name,
                  matchedStockItems: analyzeMutation.data?.matchedStockItems ?? [],
                  instructions: analyzeMutation.data?.instructions ?? [],
                  quantities,
                };
                sessionStorage.setItem(`analysis:${orderId}`, JSON.stringify(payload));
              } catch (e) {
                // ignore storage errors
              }
              // navigate to placed order page for the generated id
              router.push(`/placedOrder/${orderId}`);
            }}
          >
            <Package className="h-4 w-4 mr-2" />
            Order Ingredients
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
