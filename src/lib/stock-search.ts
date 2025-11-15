import z from "zod";

import type { StockItemWithEmbedding } from "@/app/api/_schemas/stock";

import { StockItemWithEmbeddingSchema } from "@/app/api/_schemas/stock";

import stock from "../../data/stock-with-embeddings.json" assert { type: "json" };

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Find top-k matches for a query embedding */
export function searchStock(
  queryEmbedding: Float32Array,
  topK = 3,
  minScore = 0.7,
): { item: StockItemWithEmbedding; score: number }[] {
  const parsedStock = z.array(StockItemWithEmbeddingSchema).parse(stock);
  const results = parsedStock
    .map((item) => {
      const itemVec = new Float32Array(item.embedding); // ← Convert here, not in load
      const score = cosineSimilarity(queryEmbedding, itemVec);
      return { item, score };
    })
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}
