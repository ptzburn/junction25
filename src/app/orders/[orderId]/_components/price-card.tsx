"use client";

import { Calculator, Euro } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type MatchedStockItem = {
  id: number;
  name: string;
  price: number;
  unit: string;
  image: string;
  score: number;
};

type Props = {
  items: MatchedStockItem[];
  quantities: Record<number, number>; // from IngredientsCard
};

export function PriceSummaryCard({ items, quantities }: Props) {
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    const total = items.reduce((sum, item) => {
      const qty = quantities[item.id] ?? 1;
      return sum + item.price * qty;
    }, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks-extra/no-direct-set-state-in-use-effect
    setCalculatedTotal(Number(total.toFixed(2)));
  }, [items, quantities]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Price Summary</h3>
          </div>
          <Badge variant="outline">
            {items.length}
            {" "}
            {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        {/* Main Total */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Calculated Total</span>
          </div>
          <span className="text-2xl font-bold text-green-600">
            €
            {calculatedTotal.toFixed(2)}
          </span>
        </div>

        {/* Per-item breakdown with quantity */}
        <div className="space-y-2 pt-2 border-t">
          {items.map((item) => {
            const qty = quantities[item.id] ?? 1;
            const lineTotal = (item.price * qty).toFixed(2);

            return (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {item.name}
                  {qty > 1 && (
                    <span className="ml-1 text-xs text-muted-foreground/70">
                      ×
                      {qty}
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  €
                  {lineTotal}
                  {" "}
                  /
                  {" "}
                  {item.unit}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
