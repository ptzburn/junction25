// components/IngredientsCard.tsx
"use client";

import { Minus, Package, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type MatchedStockItem = {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  score: number;
  ingredient?: string;
};

type Props = {
  items: MatchedStockItem[];
  onQuantityChange?: (quantities: Record<number, number>) => void;
};

export function IngredientsCard({
  items,
  onQuantityChange,
}: Props) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(items.map(i => [i.id, 1])),
  );

  useEffect(() => {
    onQuantityChange?.(quantities);
  }, [quantities, items, onQuantityChange]);

  const updateQty = (id: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 1) + delta),
    }));
  };

  const setQty = (id: number, raw: string) => {
    const num = Number.parseInt(raw, 10);
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, Number.isNaN(num) ? 0 : num),
    }));
  };

  const itemTotal = (item: MatchedStockItem) => {
    const qty = quantities[item.id] ?? 1;
    return (item.price * qty).toFixed(2);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Matched Ingredients</h3>
          <Badge variant="secondary" className="ml-auto">
            {items.length}
            {" "}
            {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const qty = quantities[item.id] ?? 1;
            const total = itemTotal(item);

            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                {/* Image */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm line-clamp-2">
                    {item.name}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{item.category}</Badge>
                    <span className="text-muted-foreground">
                      €
                      {item.price.toFixed(2)}
                      {" "}
                      /
                      {" "}
                      {item.unit}
                    </span>
                  </div>

                  {/* Quantity controls + line total */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.id, -1)}
                      disabled={qty <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <Input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={e => setQty(item.id, e.target.value)}
                      className="w-16 h-8 text-center"
                    />

                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>

                    <span className="ml-auto font-semibold text-sm">
                      €
                      {total}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live total inside the card */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-green-600">
              €
              {items
                .reduce(
                  (s, i) => s + i.price * (quantities[i.id] ?? 1),
                  0,
                )
                .toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
