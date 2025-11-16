"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { OrderCard } from "@/_components/order-card";
import { MacroSetting } from "@/components/macro-setting";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { useOrders } from "@/hooks/use-orders";
import { useRestaurants } from "@/hooks/use-restaurants";

import randomJson from "../../data/random.json";

export default function Home() {
  const router = useRouter();

  const { data: ordersData } = useOrders();
  const { data: restaurantsData } = useRestaurants();

  const orders = ordersData?.orders ?? [];
  const hero = randomJson.hero;
  const liveOrders = orders.filter(order => order.status !== "delivered");
  const liveOrdersCount = liveOrders.length;
  const neighborhoods = Array.from(new Set(liveOrders.map(order => order.neighborhood)));
  const fastestEta = liveOrders.length
    ? Math.min(...liveOrders.map(order => order.etaMinutes[0]))
    : null;
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 3);
  const primaryCity = orders[0]?.city ?? "Helsinki";

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
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
            <Badge variant="secondary" className="rounded-md px-3">
              {liveOrdersCount ? `Live orders · ${liveOrdersCount}` : "Create first order"}
            </Badge>
            <ThemeToggle />
            <MacroSetting />
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
              <Button variant="default" size="lg" asChild>
                <Link href="/image-order">Image or text AI order</Link>
              </Button>
              <Button variant="default" size="lg" asChild>
                <Link href="/googlecalendar">"I'm busy" order</Link>
              </Button>
              {hero.actions.map(action => (
                action.label === "OnlyFood Feed"
                  ? (
                      <Button key={action.label} variant="outline" size="lg" asChild>
                        <Link href="/onlyfood-feed">{action.label}</Link>
                      </Button>
                    )
                  : (
                      <Button key={action.label} variant="outline" size="lg">
                        {action.label}
                      </Button>
                    )
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

          <Card className="overflow-hidden rounded-3xl border-none bg-linear-to-br from-primary/10 via-primary/5 to-secondary/20 shadow-lg">
            <CardHeader>
              <CardTitle>Trending delivery areas</CardTitle>
              <CardDescription>Fastest drop-offs right now.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {randomJson.featuredCities.map(city => (
                <div key={city.name} className="flex items-center gap-4 rounded-2xl bg-background/70 p-3">
                  <div className="p-1 rounded-xl bg-card">
                    <div
                      className="h-14 w-14 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${city.image})` }}
                      aria-hidden
                    />
                  </div>
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/orders")} className="hover:cursor-pointer">
              View order history
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentOrders.map(order => (
              <OrderCard key={order.id} orderId={order.id} />
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
            {randomJson.categories.map((category, index) => (
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
          {randomJson.collections.map(collection => (
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
              <div className="min-h-[180px] flex-1">
                <div className="h-full w-full rounded-2xl overflow-hidden px-3 bg-card">
                  <div
                    className="min-h-[180px] w-full bg-cover bg-center rounded-lg"
                    style={{ backgroundImage: `url(${collection.image})` }}
                    aria-hidden
                  />
                </div>
              </div>
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
            {restaurantsData?.restaurants.map(restaurant => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="group block focus-visible:outline-none"
                aria-label={`View ${restaurant.name}`}
              >
                <Card className="overflow-hidden transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-primary">
                  <div className="w-full">
                    <div className="h-40 w-full rounded-2xl overflow-hidden px-3 bg-card">
                      <div
                        className="h-full w-full bg-cover bg-center rounded-lg"
                        style={{ backgroundImage: `url(${restaurant.image})` }}
                        aria-hidden
                      />
                    </div>
                  </div>
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
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
