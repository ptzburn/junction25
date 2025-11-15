import { Hono } from "hono";
import z from "zod";

import { StockItemWithEmbeddingSchema } from "../_schemas/stock";
import stock from "../../../../data/stock-with-embeddings.json" assert { type: "json" };

const parsedStock = z.array(StockItemWithEmbeddingSchema).parse(stock);

export const stockRoute = new Hono()
  .get("/stock", c => c.json({ stock: parsedStock }));
