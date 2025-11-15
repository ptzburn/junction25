import { z } from "zod";

export const StockItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).trim(),
  price: z.number().positive(),
  unit: z.string().min(1).trim(),
  category: z.string().min(1).trim(),
});

export type StockItem = z.infer<typeof StockItemSchema>;

export const StockSchema = z.array(StockItemSchema);

export type Stock = z.infer<typeof StockSchema>;

export const StockItemWithEmbeddingSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).trim(),
  price: z.number().positive(),
  unit: z.string().min(1).trim(),
  category: z.string().min(1).trim(),
  embedding: z.array(z.number()).min(1),
});

export type StockItemWithEmbedding = z.infer<typeof StockItemWithEmbeddingSchema>;

export const StockWithEmbeddingSchema = z.array(StockItemWithEmbeddingSchema);

export type StockWithEmbedding = z.infer<typeof StockWithEmbeddingSchema>;
