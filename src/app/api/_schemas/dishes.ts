import { z } from "zod";

export const DishSchema = z.object({
  id: z.uuid(),
  restaurantId: z.uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  image: z.string().min(1, "Image URL is required"),
  ingredients: z.array(z.string()).min(1),
});

export type Dish = z.infer<typeof DishSchema>;
