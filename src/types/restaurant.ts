export type Dish = {
  name: string;
  description: string;
  price: string;
  badge?: string;
  vegetarian?: boolean;
  vegan?: boolean;
};

export type Restaurant = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  rating: number;
  eta: string;
  image: string;
  location: string;
  address: string;
  hours: string;
  deliveryFee: string;
  minOrder: string;
  promoTag: string;
  highlights: string[];
  featuredDishes: Dish[];
};
