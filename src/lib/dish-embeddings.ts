import { z } from "zod";

import { DishSchema } from "@/app/api/_schemas/dishes";

import dishesWithEmbeddings from "../../data/dishes.json" assert { type: "json" };

const ParsedDishes = z
  .array(
    DishSchema.extend({
      embedding: z.array(z.number()).length(768),
    }),
  )
  .parse(dishesWithEmbeddings);

export function searchDishesByEmbedding(
  queryEmbedding: Float32Array,
  topK = 3,
  minScore = 0.7,
) {
  const dishEmbeddings = ParsedDishes.map(item => ({
    dish: {
      id: item.id,
      name: item.name,
      description: item.description,
      ingredients: item.ingredients,
      image: item.image,
      restaurantId: item.restaurantId,
      price: item.price,
    },
    embedding: new Float32Array(item.embedding), // number[] → Float32Array
  }));

  return dishEmbeddings
    .map(({ dish, embedding }) => {
      const score = cosineSimilarity(queryEmbedding, embedding);
      return { dish, score };
    })
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}
