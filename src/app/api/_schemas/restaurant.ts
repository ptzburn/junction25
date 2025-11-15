import { z } from "zod";

export const RestaurantSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  rating: z.number().min(0).max(5).multipleOf(0.1),
  eta: z
    .string()
    .regex(/^\d{1,2}–\d{1,2} min$/, "ETA must be in format '15–25 min'"),
  image: z.url("Image must be a valid URL"),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  hours: z
    .string()
    .regex(/^\d{2}:\d{2}–\d{2}:\d{2}$/, "Hours must be in format '11:00–22:00'"),
  deliveryFee: z.number().positive(),
  minOrder: z.number().positive(),
  promoTag: z.string().min(1, "Promo tag is required"),
  highlights: z.array(z.string()).min(1, "At least one highlight is required"),
  featuredDishIds: z
    .array(z.uuid("Featured dish ID must be a valid UUID"))
    .min(1, "At least one featured dish is required"),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
