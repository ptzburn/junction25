"use client";

import { Heart, MessageCircle, Share2, Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import dishesJson from "../../../data/dishes.json";
import restaurantsJson from "../../../data/restaurants.json";

type DishRecord = (typeof dishesJson)["dishes"][number];
type RestaurantRecord = (typeof restaurantsJson)["restaurants"][number];

const euroFormatter = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

const dishesData: DishRecord[] = dishesJson.dishes;
const restaurantsData: RestaurantRecord[] = restaurantsJson.restaurants;

const restaurantsById = new Map(
  restaurantsData.map(restaurant => [restaurant.id, restaurant]),
);

const dishesById = new Map(
  dishesData.map(dish => [dish.id, dish]),
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
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const currentClip = feedItems[currentIndex];

  const dismissIntro = () => setIntroVisible(false);

  const goToNextClip = () => {
    if (introVisible) {
      return;
    }
    setCurrentIndex(prev => (prev + 1) % feedItems.length);
  };

  const handleOrderNow = () => {
    if (introVisible) {
      return;
    }
    router.push(currentClip.href);
  };

  const evaluateSwipe = (deltaX: number) => {
    if (deltaX <= -60) {
      goToNextClip();
    }
    else if (deltaX >= 60) {
      handleOrderNow();
    }
  };

  const registerStart = (clientX: number | undefined) => {
    if (introVisible) {
      return;
    }
    if (typeof clientX === "number") {
      setStartX(clientX);
    }
  };

  const registerEnd = (clientX: number | undefined) => {
    if (introVisible) {
      setStartX(null);
      return;
    }
    if (startX === null || typeof clientX !== "number") {
      setStartX(null);
      return;
    }
    evaluateSwipe(clientX - startX);
    setStartX(null);
  };

  if (!currentClip) {
    return null;
  }

  return (
    <main className="bg-black text-white">
      <div
        className="relative h-screen w-full overflow-hidden"
        onPointerDown={event => registerStart(event.clientX)}
        onPointerUp={event => registerEnd(event.clientX)}
        onTouchStart={event => registerStart(event.touches[0]?.clientX)}
        onTouchEnd={event => registerEnd(event.changedTouches[0]?.clientX)}
      >
        <video
          key={currentClip.id}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={currentClip.poster}
          className="h-full w-full object-cover"
          src={currentClip.videoSrc}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">OnlyFood Feed</p>
            <p className="text-lg font-semibold leading-tight">{currentClip.restaurantName}</p>
          </div>
          <Button variant="ghost" className="bg-black/30 text-white hover:bg-black/50" asChild>
            <Link href="/">← Home</Link>
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute bottom-6 left-4 right-24 space-y-4 rounded-3xl bg-black/45 p-4 backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-white/75">{currentClip.restaurantHandle}</p>
            <p className="text-3xl font-semibold leading-tight">{currentClip.name}</p>
            <p className="text-sm text-white/80">{currentClip.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <span>{currentClip.deliveryEta}</span>
            <span className="text-white/50">•</span>
            <span>{euroFormatter.format(currentClip.price)}</span>
            <span className="text-white/50">•</span>
            <span>Courier-ready in minutes</span>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleOrderNow} disabled={introVisible}>
              Order now
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={goToNextClip} disabled={introVisible}>
              Next
            </Button>
          </div>
        </div>

        <div className="absolute inset-y-0 right-4 flex flex-col items-center justify-center gap-4 text-white">
          <div className="flex flex-col items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
            <Volume2 className="size-5" />
            <span>Sound</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
            <Heart className="size-5" />
            <span>{currentClip.likes}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
            <MessageCircle className="size-5" />
            <span>Live</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
            <Share2 className="size-5" />
            <span>{currentClip.loops}</span>
          </div>
        </div>

        {introVisible && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 px-6 text-center text-white backdrop-blur">
            <div className="max-w-md space-y-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Welcome to OnlyFood Feed</p>
                <h1 className="text-3xl font-semibold">Know the gestures</h1>
                <p className="text-sm text-white/80">Swipe to explore hero dishes. Left to preview the next one, right to jump straight into ordering.</p>
              </div>
              <div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/15 bg-white/5 text-left">
                <div className="px-5 py-4">
                  <p className="text-lg font-semibold text-white">Swipe left</p>
                  <p className="text-sm text-white/80">See the next dish in the lineup.</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-lg font-semibold text-white">Swipe right</p>
                  <p className="text-sm text-white/80">Open the restaurant page and order immediately.</p>
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={dismissIntro}>
                Understood
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
