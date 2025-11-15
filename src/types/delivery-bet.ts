import type { DeliveryBucket } from "@/lib/time-window";

export type DeliveryBetSummary = {
  outcomeKey: DeliveryBucket;
  outcomeLabel: string;
  stake: number;
  won: boolean;
  creditsAwarded: number;
  actualMinutes: number;
  createdAt: string;
};
