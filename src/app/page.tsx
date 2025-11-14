import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import dishesJson from "../../data/dishes.json";
import ordersJson from "../../data/orders.json";
import restaurantsJson from "../../data/restaurants.json";

type HeroActionVariant = "default" | "secondary" | "outline" | "ghost";

type DishesData = {
  hero: {
    tag: string;
    title: string;
    description: string;
    highlights: { label: string; value: string }[];
    actions: { label: string; variant: HeroActionVariant }[];
  };
  featuredCities: { name: string; eta: string; image: string }[];
  categories: string[];
  collections: {
    title: string;
    badge: string;
    description: string;
    image: string;
  }[];
  shortcuts: { label: string; eta: string }[];
  couriers: {
    name: string;
    status: string;
    initials: string;
    avatar: string;
  }[];
};

type OrderStatus = "preparing" | "delivering" | "delivered";

type Order = {
  id: string;
  restaurant: string;
  category: string;
  status: OrderStatus;
  city: string;
  neighborhood: string;
  etaMinutes: [number, number];
  courier: string;
  courierEta: number;
  items: { name: string; quantity: number }[];
  image: string;
  total: number;
  placedAt: string;
};

type Restaurant = {
  name: string;
  tags: string[];
  rating: number;
  eta: string;
  image: string;
};
const dishesData = dishesJson as DishesData;
const ordersData = ordersJson as Order[];
const restaurantsData = restaurantsJson as Restaurant[];

function formatItems(items: Order["items"]) {
  return items.map(item => `${item.quantity}× ${item.name}`).join(", ");
}

export default function Home() {
  const hero = dishesData.hero;
  const liveOrders = ordersData.filter(order => order.status !== "delivered");
  const liveOrdersCount = liveOrders.length;
  const neighborhoods = Array.from(new Set(liveOrders.map(order => order.neighborhood)));
  const fastestEta = liveOrders.length
    ? Math.min(...liveOrders.map(order => order.etaMinutes[0]))
    : null;
  const nextCourierEta = liveOrders.length
    ? Math.min(...liveOrders.map(order => order.courierEta))
    : null;
  const recentOrders = [...ordersData]
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 3);
  const primaryCity = ordersData[0]?.city ?? "Helsinki";

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-lg font-semibold">
              J
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Delivering to</p>
              <button className="text-sm font-semibold" type="button">
                {`${primaryCity}, Finland ▾`}
              </button>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm">Sign up</Button>
            <Badge variant="secondary" className="rounded-md px-3">
              {liveOrdersCount ? `Live orders · ${liveOrdersCount}` : "Create first order"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <section className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              {hero.tag}
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {hero.title}
            </h1>
            <p className="text-muted-foreground text-base">{hero.description}</p>
            <div className="flex flex-wrap gap-3">
              {hero.actions.map(action => (
                <Button key={action.label} variant={action.variant} size="lg">
                  {action.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground md:text-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              {fastestEta
                ? `Fastest courier ${fastestEta} min away`
                : "24/7 delivery coverage"}
              {neighborhoods.length > 0 && (
                <span className="hidden sm:inline">
                  {`· ${neighborhoods.slice(0, 3).join(", ")}`}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {hero.highlights.map(highlight => (
                <Card key={highlight.label} className="gap-2 rounded-2xl border-dashed p-4">
                  <CardTitle className="text-2xl font-semibold">
                    {highlight.value}
                  </CardTitle>
                  <CardDescription>{highlight.label}</CardDescription>
                </Card>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden rounded-3xl border-none bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/20 shadow-lg">
            <CardHeader>
              <CardTitle>Trending delivery areas</CardTitle>
              <CardDescription>Fastest drop-offs right now.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {dishesData.featuredCities.map(city => (
                <div key={city.name} className="flex items-center gap-4 rounded-2xl bg-background/70 p-3">
                  <div
                    className="h-14 w-14 rounded-2xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${city.image})` }}
                    aria-hidden
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">{city.name}</span>
                    <span className="text-sm text-muted-foreground">{city.eta}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Continue from your latest orders</h2>
              <p className="text-sm text-muted-foreground">
                Quick reorders from Kamppi, Kallio, and beyond.
              </p>
            </div>
            <Button variant="ghost" size="sm">
              View order history
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentOrders.map(order => (
              <Card key={order.id} className="overflow-hidden">
                <div
                  className="h-32 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${order.image})` }}
                  aria-hidden
                />
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.restaurant}</p>
                      <p className="text-sm text-muted-foreground">{order.category}</p>
                    </div>
                    <Badge variant={order.status === "delivered" ? "outline" : order.status === "delivering" ? "default" : "secondary"}>
                      {order.status === "delivered"
                        ? "Delivered"
                        : order.status === "delivering"
                          ? "Courier en route"
                          : "Being prepared"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatItems(order.items)}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {`${order.etaMinutes[0]}–${order.etaMinutes[1]} min`}
                    </span>
                    <Button variant="outline" size="sm">
                      Reorder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Categories</h2>
              <p className="text-sm text-muted-foreground">Explore by craving, grocery aisle, or lifestyle.</p>
            </div>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dishesData.categories.map((category, index) => (
              <Badge
                key={category}
                variant={index === 0 ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
              >
                {category}
              </Badge>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {dishesData.collections.map(collection => (
            <Card key={collection.title} className="flex flex-col overflow-hidden md:flex-row">
              <div className="flex flex-1 flex-col gap-3 p-6">
                <Badge variant="secondary" className="w-fit">
                  {collection.badge}
                </Badge>
                <CardTitle>{collection.title}</CardTitle>
                <CardDescription>{collection.description}</CardDescription>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm">Open collection</Button>
                  <Button variant="outline" size="sm">
                    Share
                  </Button>
                </div>
              </div>
              <div
                className="min-h-[180px] flex-1 bg-cover bg-center"
                style={{ backgroundImage: `url(${collection.image})` }}
                aria-hidden
              />
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Popular near you</h2>
              <p className="text-sm text-muted-foreground">Hand-picked spots trending today.</p>
            </div>
            <Button variant="ghost" size="sm">
              See more
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {restaurantsData.map(restaurant => (
              <Card key={restaurant.name} className="overflow-hidden">
                <div
                  className="h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${restaurant.image})` }}
                  aria-hidden
                />
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{restaurant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {restaurant.tags.join(" • ")}
                      </p>
                    </div>
                    <Badge variant="secondary">{`★ ${restaurant.rating}`}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{restaurant.eta}</span>
                    <Button variant="outline" size="sm">
                      See menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Instant grocery runs</CardTitle>
              <CardDescription>
                Pantry heroes and wellness picks delivered while you prep.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {dishesData.shortcuts.map(shortcut => (
                <div key={shortcut.label} className="rounded-2xl border p-4">
                  <p className="font-medium">{shortcut.label}</p>
                  <p className="text-sm text-muted-foreground">{shortcut.eta}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button size="sm">Browse grocery partners</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Courier availability</CardTitle>
                <CardDescription>
                  Track who’s on the move across the city.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Manage fleet
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {dishesData.couriers.map(rider => (
                <div key={rider.name} className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage src={rider.avatar} alt={rider.name} />
                      <AvatarFallback>{rider.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-sm text-muted-foreground">{rider.status}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </CardContent>
            {nextCourierEta && (
              <CardFooter className="text-sm text-muted-foreground">
                {`Fastest courier ${nextCourierEta} min away · ${primaryCity}`}
              </CardFooter>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
