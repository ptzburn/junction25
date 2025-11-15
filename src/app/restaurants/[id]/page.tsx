import Link from "next/link";
import { notFound } from "next/navigation";

import type { Dish, Restaurant } from "@/types/restaurant";

import { CookYourselfDialog } from "@/app/orders/[orderId]/_components/cook-yourself-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import dishesJson from "../../../../data/dishes.json";
import restaurantsJson from "../../../../data/restaurants.json";

type RestaurantDishData = {
  restaurantDishes: Dish[];
};

const restaurantsData = restaurantsJson as Restaurant[];
const dishesData = dishesJson as RestaurantDishData;
const dishCatalog = dishesData.restaurantDishes;

export function generateStaticParams() {
  return restaurantsData.map(restaurant => ({ slug: restaurant.slug }));
}

type RestaurantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = restaurantsData.find(entry => entry.slug === slug);
  if (!restaurant) {
    notFound();
  }

  const restaurantDishes = dishCatalog.filter(dish => dish.restaurantSlug === restaurant.slug);
  const featuredDishes = restaurant.featuredDishIds
    .map(id => restaurantDishes.find(dish => dish.id === id))
    .filter((dish): dish is Dish => Boolean(dish));
  const heroDishes = (featuredDishes.length ? featuredDishes : restaurantDishes).slice(0, 2);
  const menuDishes = restaurantDishes;

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="relative h-[420px] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.image})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end gap-6 px-4 pb-10 pt-24">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-foreground hover:underline">
              ← Back to discovery
            </Link>
            <span>•</span>
            <span>{restaurant.location}</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{restaurant.promoTag}</Badge>
              <Badge variant="secondary">{`${restaurant.eta} delivery`}</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {restaurant.name}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                {restaurant.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{restaurant.tags.join(" • ")}</span>
              <span>•</span>
              <span>{`★ ${restaurant.rating}`}</span>
              <span>•</span>
              <span>{restaurant.hours}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {restaurant.highlights.map(highlight => (
                <Badge key={highlight} variant="outline" className="rounded-full">
                  {highlight}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg">Start order</Button>
              <Button size="lg" variant="outline">
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pickup location</CardTitle>
              <CardDescription>{restaurant.address}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery ETA</CardTitle>
              <CardDescription>{restaurant.eta}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery fee</CardTitle>
              <CardDescription>{restaurant.deliveryFee}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Minimum order</CardTitle>
              <CardDescription>{restaurant.minOrder}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Featured dishes</h2>
              <p className="text-sm text-muted-foreground">
                Hand-picked plates regulars can’t stop reordering.
              </p>
            </div>
            <Button variant="ghost">View all</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {heroDishes.map(dish => (
              <Card key={dish.id} className="flex h-full flex-col overflow-hidden">
                <div
                  className="h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${dish.image})` }}
                  aria-hidden
                />
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg">{dish.name}</CardTitle>
                    {dish.badge
                      ? (
                          <Badge variant="secondary">{dish.badge}</Badge>
                        )
                      : null}
                  </div>
                  <CardDescription>{dish.description}</CardDescription>
                  <p className="text-xs text-muted-foreground">
                    {dish.ingredients.join(", ")}
                  </p>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
                  <span>{dish.price}</span>
                  <Button size="sm">Add</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold">Menu</h2>
            <p className="text-sm text-muted-foreground">
              Seasonal sections curated by the kitchen.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Chef's picks</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y">
                {menuDishes.map(dish => (
                  <div key={dish.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-4">
                      <div
                        className="h-20 w-20 flex-none rounded-2xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${dish.image})` }}
                        aria-hidden
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{dish.name}</p>
                          <span className="text-sm text-muted-foreground">{dish.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{dish.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {dish.ingredients.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dish.vegetarian ? (
                        <Badge variant="outline" className="text-xs">
                          Vegetarian
                        </Badge>
                      ) : null}
                      {dish.vegan ? (
                        <Badge variant="outline" className="text-xs">
                          Vegan
                        </Badge>
                      ) : null}
                      {dish.badge ? (
                        <Badge variant="secondary" className="text-xs">
                          {dish.badge}
                        </Badge>
                      ) : null}
                      {dish.vegetarian
                        ? (
                            <Badge variant="outline" className="text-xs">
                              Vegetarian
                            </Badge>
                          )
                        : null}
                      {dish.vegan
                        ? (
                            <Badge variant="outline" className="text-xs">
                              Vegan
                            </Badge>
                          )
                        : null}
                      {dish.badge
                        ? (
                            <Badge variant="secondary" className="text-xs">
                              {dish.badge}
                            </Badge>
                          )
                        : null}
                      <CookYourselfDialog dishName={dish.name} dishImage={dish.image} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground">
            Need help?
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="justify-start">
              Contact support
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Browse other restaurants</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
