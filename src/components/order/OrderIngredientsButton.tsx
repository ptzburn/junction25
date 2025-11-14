"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAnalyzeDish } from "@/hooks/use-orders";

type Props = {
  dishId: string;
  dishName: string;
  imageUrl?: string;
};

export default function OrderIngredientsButton({ dishId, dishName, imageUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const analyze = useAnalyzeDish();

  async function handleClick() {
    setLoading(true);
    try {
      const payload = { dishName, imageUrl };
      const result = await analyze.mutateAsync(payload as any);

      // store analysis in sessionStorage keyed by dishId
      try {
        sessionStorage.setItem(`analysis:${dishId}`, JSON.stringify(result));
      } catch (e) {
        // ignore storage errors
      }

      // navigate to order page
      router.push(`/order/${dishId}`);
    } catch (err) {
      // keep simple: log and navigate anyway
      // eslint-disable-next-line no-console
      console.error(err);
      router.push(`/order/${dishId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={loading}>
      {loading ? <Spinner /> : "Order ingredients"}
    </Button>
  );
}
