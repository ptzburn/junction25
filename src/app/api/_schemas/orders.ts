import { z } from "zod";

const OrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().regex(/^ord-\d+$/),
  restaurant: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["preparing", "delivering", "delivered"]),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  etaMinutes: z.tuple([z.number().int().min(0), z.number().int().min(0)]).refine(
    ([min, max]) => min <= max,
    { message: "etaMinutes min must be <= max" },
  ),
  courier: z.string().min(1),
  courierEta: z.number().int().min(0),
  items: z.array(OrderItemSchema).min(1),
  image: z.string().min(1, "Image URL is required"),
  total: z.number().positive(),
  placedAt: z.iso.datetime({ offset: true }),
});

export type Order = z.infer<typeof OrderSchema>;

export const DishAnalysisSchema = z.object({
  ingredients: z.array(z.string()).min(1),
  instructions: z.array(z.string()).min(1),
});

export type DishAnalysis = z.infer<typeof DishAnalysisSchema>;
