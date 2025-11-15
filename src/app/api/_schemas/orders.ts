import { z } from "zod";

export const OrderItemSchema = z.object({
  id: z.uuid("Dish ID must be a valid UUID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.uuid("Order ID must be a valid UUID"),
  status: z.enum(["preparing", "en-route", "delivered", "cancelled"]),
  city: z.enum(["Helsinki", "Espoo", "Vantaa"]),
  neighborhood: z.string().min(1, "Neighborhood is required"),
  etaMinutes: z
    .tuple([z.number().int().min(1), z.number().int().min(1)]),
  courier: z.string().min(1, "Courier name is required"),
  courierEta: z.number().int(),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  placedAt: z.iso.datetime({ offset: true }),
});

export type Order = z.infer<typeof OrderSchema>;

export const DishAnalysisSchema = z.object({
  ingredients: z.array(z.string()).min(1),
  instructions: z.array(z.string()).min(1),
});

export type DishAnalysis = z.infer<typeof DishAnalysisSchema>;
