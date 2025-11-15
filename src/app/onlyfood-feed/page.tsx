import { Heart, MessageCircle, Share2, Volume2 } from "lucide-react";
import Link from "next/link";

import type { Dish, RestaurantCollection } from "@/types/restaurant";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import dishesJson from "../../../data/dishes.json";
import restaurantsJson from "../../../data/restaurants.json";

type DishCatalog = {
  dishes: Dish[];
};

const euroFormatter = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

const dishesData = dishesJson as DishCatalog;
const restaurantsData = (restaurantsJson as RestaurantCollection).restaurants;

const restaurantsById = new Map(
  restaurantsData.map(restaurant => [restaurant.id, restaurant]),
);

const dishesById = new Map(
  dishesData.dishes.map(dish => [dish.id, dish]),
);

const videoClips = [
  {
    dishId: "9aa3224b-f285-4911-9ea5-ac83dc28a8a5",
    src: "/videos/Smoky_Pepperoni_9aa3224b-f285-4911-9ea5-ac83dc28a8a5.mp4",
    likes: "12.4K",
    loops: "312 reorders",
  },
  {
    dishId: "866043ae-b759-4c39-974f-7daec4934f68",
    src: "/videos/Butter_chicken_deluxe_866043ae-b759-4c39-974f-7daec4934f68.mp4",
    likes: "9.1K",
    loops: "204 watchlisted",
  },
  {
    dishId: "04753132-782f-4479-ac65-5ce699a668c8",
    src: "/videos/Pho_Brisket_Deluxe_04753132-782f-4479-ac65-5ce699a668c8.mp4",
    likes: "7.8K",
    loops: "189 cravings",
  },
  {
    dishId: "089c21a5-b77e-4848-a2f6-66e9af67b312",
    src: "/videos/Salmon_Lover_Set_089c21a5-b77e-4848-a2f6-66e9af67b312.mp4",
    likes: "5.6K",
    loops: "132 chef notes",
  },
  {
    dishId: "55653eaf-67ed-4b3b-bb4a-9e5bd39fee5b",
    src: "/videos/Smash_burger_55653eaf-67ed-4b3b-bb4a-9e5bd39fee5b.mp4",
    likes: "14.9K",
    loops: "442 late bites",
  },
] as const;

const feedItems = videoClips
  .map((clip) => {
    const dish = dishesById.get(clip.dishId);
    if (!dish) {
      return null;
    }

    const restaurant = dish.restaurantId ? restaurantsById.get(dish.restaurantId) : undefined;

    return {
      id: clip.dishId,
      videoSrc: clip.src,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      restaurantName: restaurant?.name ?? "Featured kitchen",
      restaurantHandle: restaurant ? `@${restaurant.name.replace(/\s+/g, "").toLowerCase()}` : "@onlyfoodlabs",
      deliveryEta: restaurant?.eta ?? "30–40 min",
      href: restaurant ? `/restaurants/${restaurant.id}` : "/restaurants",
      likes: clip.likes,
      loops: clip.loops,
      poster: dish.image,
    };
  })
  .filter((item): item is NonNullable<typeof item> => Boolean(item));

export default function OnlyFoodFeedPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              OnlyFood Labs
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                OnlyFood Feed
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Scroll through cinematic previews of dishes ready to dispatch. Add from the feed and we
                route it straight to your courier.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <span className="inline-flex size-2 rounded-full bg-emerald-400" />
                Live drops in Helsinki
              </div>
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                120+ creators testing
              </div>
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                Fresh loops every 5 min
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" asChild>
              <Link href="/">← Back to home</Link>
            </Button>
            <Button asChild>
              <Link href="/image_text_order">Image or text AI order</Link>
            </Button>
          </div>
        </div>

        <Separator />

        <section className="flex flex-col items-center gap-12">
          {feedItems.map(item => (
            <Card key={item.id} className="w-full max-w-sm border-none bg-transparent shadow-none">
              <div className="relative overflow-hidden rounded-[36px] bg-black shadow-[0_25px_60px_rgba(15,23,42,0.4)]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  poster={item.poster}
                  className="aspect-[9/16] w-full object-cover"
                  src={item.videoSrc}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="pointer-events-none absolute bottom-4 left-4 right-20 text-white">
                  <p className="text-xs uppercase tracking-wide text-white/80">{item.restaurantHandle}</p>
                  <p className="text-lg font-semibold leading-tight">{item.name}</p>
                </div>
                <div className="pointer-events-none absolute bottom-6 right-4 flex flex-col items-center gap-4 text-white">
                  <div className="flex flex-col items-center gap-1 rounded-full bg-white/10 px-3 py-2">
                    <Volume2 className="size-5" />
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-full bg-white/10 px-3 py-2">
                    <Heart className="size-5" />
                    <span className="text-xs font-semibold">{item.likes}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-full bg-white/10 px-3 py-2">
                    <MessageCircle className="size-5" />
                    <span className="text-xs font-semibold">Live</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-full bg-white/10 px-3 py-2">
                    <Share2 className="size-5" />
                    <span className="text-xs font-semibold">Share</span>
                  </div>
                </div>
                <div className="pointer-events-none absolute top-4 left-4 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
                  {item.loops}
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-[28px] border border-border/60 bg-card/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{item.restaurantName}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant="outline">{item.deliveryEta}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold leading-tight">{euroFormatter.format(item.price)}</p>
                    <p className="text-xs text-muted-foreground">Courier-ready in minutes</p>
                  </div>
                  <Button size="lg" asChild>
                    <Link href={item.href}>Order now</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
