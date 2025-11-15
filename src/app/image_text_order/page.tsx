"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { IngredientsCard, type MatchedStockItem } from "@/app/orders/[orderId]/_components/ingridient-card";
import { PriceSummaryCard } from "@/app/orders/[orderId]/_components/price-card";
import type { Order } from "@/app/api/_schemas/orders";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBuyIngredients, useImageDishOrder, useTextDishOrder } from "@/hooks/use-orders";
import type { Dish, Restaurant } from "@/types/restaurant";

import ordersJson from "../../../data/orders.json" assert { type: "json" };
import restaurantsJson from "../../../data/restaurants.json" assert { type: "json" };

type DishAnalysis = {
  ingredients: string[];
  instructions: string[];
  matchedStockItems: MatchedStockItem[];
};

type ImageOrderResponse = {
  analysis: DishAnalysis;
  dish: Dish | null;
  restaurant: Restaurant | null;
  matchScore: number;
  marketFallback?: MatchedStockItem[];
};

type TextSuggestion = {
  dish: Dish;
  restaurant: Restaurant | null;
  matchScore: number;
};

type TextOrderResponse = {
  suggestions: TextSuggestion[];
  marketFallback?: MatchedStockItem[];
};

const euroFormatter = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

const restaurantSlugToName = new Map(
  (restaurantsJson as Restaurant[]).map(restaurant => [restaurant.slug, restaurant.name] as const),
);

const restaurantNameToOrderId = new Map(
  (ordersJson as Order[]).map(order => [order.restaurant, order.id] as const),
);

export default function ImageTextOrderPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [imageResult, setImageResult] = useState<ImageOrderResponse | null>(null);
  const [textSuggestions, setTextSuggestions] = useState<TextSuggestion[]>([]);
  const [textMarketFallback, setTextMarketFallback] = useState<MatchedStockItem[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [textSearchPerformed, setTextSearchPerformed] = useState(false);
  const [imageKitVisible, setImageKitVisible] = useState(false);
  const [textKits, setTextKits] = useState<Record<string, DishAnalysis>>({});
  const [expandedTextKits, setExpandedTextKits] = useState<Record<string, boolean>>({});
  const [loadingDishId, setLoadingDishId] = useState<string | null>(null);

  const analyzeMutation = useImageDishOrder();
  const textOrderMutation = useTextDishOrder();
  const buyIngredientsMutation = useBuyIngredients();
  const partySize = useMemo(() => extractPartySize(notes), [notes]);
  const showGroupOrder = partySize !== null && partySize > 1 && textSuggestions.length > 0;
  const groupPlan = useMemo(
    () => (showGroupOrder && partySize
      ? buildGroupPlan(textSuggestions, partySize)
      : []),
    [showGroupOrder, textSuggestions, partySize],
  );

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    if (!file) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageResult(null);
    setImageError(null);
    setImageKitVisible(false);
  };

  const handleOrderDish = (dish: Dish) => {
    const orderId = getOrderIdForDish(dish);
    if (orderId) {
      router.push(`/orders/${orderId}`);
      return;
    }

    if (dish.restaurantSlug) {
      router.push(`/restaurants/${dish.restaurantSlug}`);
      return;
    }

    router.push("/orders");
  };

  const handleAnalyzeDish = async () => {
    if (!selectedFile) {
      setImageError("Upload a dish photo to analyze.");
      return;
    }

    setImageError(null);
    setImageResult(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      const response = await analyzeMutation.mutateAsync({
        imageBase64: base64,
        mimeType: selectedFile.type || "image/jpeg",
        notes: notes.trim() || undefined,
      });
      setImageResult(response as ImageOrderResponse);
      setImageKitVisible(false);
    }
    catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to analyze dish.");
    }
  };

  const handleTextSearch = async () => {
    if (!notes.trim()) {
      setTextError("Describe your craving so we can suggest dishes.");
      return;
    }

    setTextSearchPerformed(true);
    setTextError(null);

    try {
      const response = await textOrderMutation.mutateAsync({
        notes: notes.trim(),
        limit: 3,
      });
      const typed = response as TextOrderResponse;
      setTextSuggestions(typed.suggestions ?? []);
      setTextMarketFallback(typed.marketFallback ?? []);
      setTextKits({});
      setExpandedTextKits({});
      setLoadingDishId(null);
    }
    catch (err) {
      setTextSuggestions([]);
      setTextMarketFallback([]);
      setTextError(err instanceof Error ? err.message : "Failed to find matching dishes.");
    }
  };

  const handleOrderGroup = () => {
    if (!groupPlan.length) return;
    try {
      sessionStorage.setItem("group-order-plan", JSON.stringify({ plan: groupPlan, partySize }));
    }
    catch {
      // ignore storage errors
    }
    handleOrderDish(groupPlan[0]!.dish);
  };

  const handleToggleTextKit = async (dish: Dish) => {
    const dishId = dish.id;
    const currentlyExpanded = expandedTextKits[dishId] ?? false;

    if (currentlyExpanded) {
      setExpandedTextKits(prev => ({ ...prev, [dishId]: false }));
      return;
    }

    setExpandedTextKits(prev => ({ ...prev, [dishId]: true }));

    if (textKits[dishId]) {
      return;
    }

    try {
      setLoadingDishId(dishId);
      const response = await buyIngredientsMutation.mutateAsync({ dishId });
      const analysis = (response as { analysis: DishAnalysis }).analysis;
      setTextKits(prev => ({ ...prev, [dishId]: analysis }));
    }
    catch (err) {
      setTextError(err instanceof Error ? err.message : "Failed to generate ingredients.");
      setExpandedTextKits(prev => ({ ...prev, [dishId]: false }));
    }
    finally {
      setLoadingDishId(null);
    }
  };

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Smart ordering</p>
            <h1 className="text-3xl font-semibold tracking-tight">Image or text AI order</h1>
            <p className="text-muted-foreground text-base">
              Drop in a photo or describe your craving. We will match it with the closest dishes
              from nearby restaurants.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/">← Back to discovery</Link>
          </Button>
        </div>

        <Card>
          <Tabs defaultValue="image" className="w-full">
            <CardHeader className="flex flex-col gap-2">
              <Badge variant="secondary" className="w-fit">Experimental</Badge>
              <CardTitle>Choose how you want to order</CardTitle>
              <CardDescription>
                Upload a dish photo or write a prompt describing what you&apos;d like. Our AI will
                analyze ingredients and recommend matching restaurants.
              </CardDescription>
              <TabsList className="w-full">
                <TabsTrigger value="image" className="flex-1">Upload image</TabsTrigger>
                <TabsTrigger value="text" className="flex-1">Describe with text</TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="image">
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dish-image">Dish photo</Label>
                  <Input id="dish-image" type="file" accept="image/*" onChange={handleFileChange} />
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG, up to 5 MB. Clear photos of plated dishes work best.
                  </p>
                </div>
                <div
                  className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed"
                  aria-live="polite"
                >
                  {imagePreview
                    ? (
                        <img
                          src={imagePreview}
                          alt="Selected dish"
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      )
                    : (
                        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                          <span>Preview will appear here after you upload an image.</span>
                          <span>No ideas yet? Snap your favorite dish or menu photo.</span>
                        </div>
                      )}
                </div>
                <Button
                  size="lg"
                  className="self-start"
                  onClick={handleAnalyzeDish}
                  disabled={!selectedFile || analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending && <Spinner className="mr-2" />}
                  Analyze dish
                </Button>
              </CardContent>
            </TabsContent>
            <TabsContent value="text">
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dish-notes">Describe your craving</Label>
                  <Textarea
                    id="dish-notes"
                    rows={6}
                    placeholder="Example: Looking for a spicy vegan ramen with sesame broth and crunchy toppings"
                    value={notes}
                    onChange={event => setNotes(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mention ingredients, cuisine, dietary needs, or mood to help us find the best match.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="self-start"
                  variant="outline"
                  onClick={handleTextSearch}
                  disabled={textOrderMutation.isPending}
                >
                  {textOrderMutation.isPending && <Spinner className="mr-2" />}
                  Find suggestions
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>
          <Separator className="my-4" />
          <CardFooter className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">What happens next?</p>
              <p className="text-sm text-muted-foreground">
                We analyze your input with our menu catalog and highlight matching dishes from restaurants
                nearby. You can jump straight into checkout or keep browsing.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Privacy</p>
              <p className="text-sm text-muted-foreground">
                Uploaded photos are processed securely and deleted after your recommendation is created.
              </p>
            </div>
          </CardFooter>
        </Card>

        {imageError && (
          <Alert variant="destructive">
            <AlertTitle>Image analysis failed</AlertTitle>
            <AlertDescription>{imageError}</AlertDescription>
          </Alert>
        )}

        {textError && (
          <Alert variant="destructive">
            <AlertTitle>Text search failed</AlertTitle>
            <AlertDescription>{textError}</AlertDescription>
          </Alert>
        )}

        {imageResult && !imageResult.dish && !imageError && (
          <Alert>
            <AlertTitle>No close matches found</AlertTitle>
            <AlertDescription>
              Try a brighter photo or add a short note so we can refine suggestions.
            </AlertDescription>
          </Alert>
        )}

        {imageResult?.dish && (
          <DishOfferCard
            badgeLabel="Image match"
            dish={imageResult.dish}
            restaurant={imageResult.restaurant}
            matchScore={imageResult.matchScore}
            buyIngredientsLabel={imageKitVisible ? "Hide ingredient kit" : "Buy ingredients instead"}
            buyIngredientsDisabled={analyzeMutation.isPending}
            onBuyIngredients={() => setImageKitVisible(prev => !prev)}
            onReset={() => {
              setImageResult(null);
              setImageKitVisible(false);
            }}
            onOrderDish={() => handleOrderDish(imageResult.dish!)}
          >
            {imageKitVisible && (
              <DishKitPanel
                dish={imageResult.dish}
                restaurant={imageResult.restaurant}
                analysis={imageResult.analysis}
              />
            )}
          </DishOfferCard>
        )}

        {!imageResult?.dish && imageResult?.marketFallback?.length && (
          <MarketFallbackPanel
            title="Shop it from Wolt Market"
            subtitle="We didn’t find a ready-made dish, but these market picks match what you showed us."
            items={imageResult.marketFallback}
          />
        )}

        {textSearchPerformed
          && !textSuggestions.length
          && !textError
          && !textOrderMutation.isPending
          && textMarketFallback.length === 0 && (
            <Alert>
              <AlertTitle>No dishes matched that description</AlertTitle>
              <AlertDescription>
                Tweak your prompt with specific ingredients, cuisine, or dietary cues for better matches.
              </AlertDescription>
            </Alert>
        )}

        {textSuggestions.length > 0 && (
          showGroupOrder ? (
            <GroupOrderCard
              plan={groupPlan}
              partySize={partySize ?? 1}
              expandedKits={expandedTextKits}
              kits={textKits}
              loadingDishId={loadingDishId}
              onToggleKit={handleToggleTextKit}
              onOrderDish={handleOrderDish}
              onOrderGroup={handleOrderGroup}
            />
          ) : (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Text search</p>
                  <h2 className="text-2xl font-semibold">Ready-to-order dishes</h2>
                </div>
                <Badge variant="outline">{textSuggestions.length} suggestion{textSuggestions.length > 1 ? "s" : ""}</Badge>
              </div>
              <div className="space-y-8">
                {textSuggestions.map((suggestion, index) => {
                  const dishId = suggestion.dish.id;
                  const expanded = expandedTextKits[dishId] ?? false;
                  const kit = textKits[dishId];
                  const isLoadingKit = loadingDishId === dishId && !kit;

                  return (
                    <DishOfferCard
                      key={dishId}
                      badgeLabel={`Text suggestion #${index + 1}`}
                      dish={suggestion.dish}
                      restaurant={suggestion.restaurant}
                      matchScore={suggestion.matchScore}
                      buyIngredientsLabel={expanded ? "Hide ingredient kit" : "Buy ingredients instead"}
                      buyIngredientsDisabled={isLoadingKit}
                      buyIngredientsLoading={isLoadingKit}
                      onBuyIngredients={() => handleToggleTextKit(suggestion.dish)}
                      onOrderDish={() => handleOrderDish(suggestion.dish)}
                    >
                      {expanded && (
                        kit ? (
                          <DishKitPanel
                            dish={suggestion.dish}
                            restaurant={suggestion.restaurant}
                            analysis={kit}
                          />
                        ) : (
                          <CardContent className="border-t pt-6">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Spinner className="h-4 w-4" />
                              Generating ingredient kit...
                            </div>
                          </CardContent>
                        )
                      )}
                    </DishOfferCard>
                  );
                })}
              </div>
            </section>
          )
        )}

        {textSearchPerformed && textMarketFallback.length > 0 && (
          <MarketFallbackPanel
            title="Prefer pantry items?"
            subtitle="We spotted items that are easier to grab from Wolt Market right now."
            items={textMarketFallback}
          />
        )}
      </div>
    </main>
  );
}

type DishOfferCardProps = {
  badgeLabel: string;
  dish: Dish;
  restaurant: Restaurant | null;
  matchScore?: number;
  buyIngredientsLabel: string;
  buyIngredientsDisabled?: boolean;
  buyIngredientsLoading?: boolean;
  onBuyIngredients: () => void;
  onReset?: () => void;
  onOrderDish: () => void;
  children?: ReactNode;
};

function DishOfferCard({
  badgeLabel,
  dish,
  restaurant,
  matchScore,
  buyIngredientsLabel,
  buyIngredientsDisabled,
  buyIngredientsLoading,
  onBuyIngredients,
  onReset,
  onOrderDish,
  children,
}: DishOfferCardProps) {
  const confidence = useMemo(() => {
    if (typeof matchScore !== "number") return null;
    const normalized = Math.min(Math.max(matchScore, 0), 1);
    return Math.round(normalized * 100);
  }, [matchScore]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">{badgeLabel}</Badge>
            <CardTitle>{dish.name}</CardTitle>
            <CardDescription>
              {restaurant?.name ?? "Restaurant info unavailable"}
              {restaurant?.eta ? ` • ${restaurant.eta}` : ""}
            </CardDescription>
            <p className="text-sm text-muted-foreground max-w-2xl">{dish.description}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {confidence !== null && (
              <div className="rounded-2xl border px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Match confidence</p>
                <p className="text-3xl font-semibold">{confidence}%</p>
              </div>
            )}
            <div className="h-32 w-32 overflow-hidden rounded-2xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dish.image}
                alt={dish.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      {children}

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground max-w-sm">
          Ready to eat faster? Jump straight to the restaurant or generate a kit if you prefer to cook.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onOrderDish}>
            Order dish
          </Button>
          <Button
            variant="outline"
            onClick={onBuyIngredients}
            disabled={buyIngredientsDisabled}
          >
            {buyIngredientsLoading && <Spinner className="mr-2 h-4 w-4" />}
            {buyIngredientsLabel}
          </Button>
          {onReset && (
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

type DishKitPanelProps = {
  dish: Dish;
  restaurant: Restaurant | null;
  analysis: DishAnalysis;
};

function DishKitPanel({ dish, restaurant, analysis }: DishKitPanelProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    setQuantities({});
  }, [analysis.matchedStockItems]);

  const total = useMemo(() => analysis.matchedStockItems.reduce((sum, item) => {
    const qty = quantities[item.id] ?? 1;
    return sum + item.price * qty;
  }, 0), [analysis.matchedStockItems, quantities]);

  const handleOrderIngredients = () => {
    try {
      sessionStorage.setItem(
        `analysis:${dish.id}`,
        JSON.stringify({
          ingredients: analysis.ingredients,
          totalPrice: Number(total.toFixed(2)),
          matchedStockItems: analysis.matchedStockItems,
          instructions: analysis.instructions,
          dishName: dish.name,
          restaurant: restaurant?.name,
        }),
      );
    }
    catch {
      // ignore
    }
    router.push(`/order/${dish.id}`);
  };

  return (
    <CardContent className="space-y-6 border-t pt-6">
      <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          <IngredientsCard items={analysis.matchedStockItems} onQuantityChange={setQuantities} />
          <InstructionCard instructions={analysis.instructions} />
        </div>
        <div className="space-y-4">
          <PriceSummaryCard items={analysis.matchedStockItems} quantities={quantities} />
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Estimated ingredient total</p>
            <p className="text-2xl font-semibold">{euroFormatter.format(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on matched Wolt Market items.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-md">
          Dial in the basket, then order the ingredients to recreate the dish at home or compare pricing.
        </p>
        <Button onClick={handleOrderIngredients}>Order ingredients</Button>
      </div>
    </CardContent>
  );
}

type MarketFallbackPanelProps = {
  title: string;
  subtitle: string;
  items: MatchedStockItem[];
};

function MarketFallbackPanel({ title, subtitle, items }: MarketFallbackPanelProps) {
  if (!items.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <Badge variant="outline" className="w-fit">Wolt Market</Badge>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl border p-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-medium leading-tight">{item.name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.category}</p>
              {item.ingredient && (
                <Badge variant="secondary" className="mt-1">Matched to “{item.ingredient}”</Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{euroFormatter.format(item.price)}</p>
              <p className="text-xs text-muted-foreground">/ {item.unit}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function extractPartySize(notes: string): number | null {
  if (!notes.trim()) {
    return null;
  }

  const match = notes.match(/(\d+)\s*(people|persons|guests|ppl|servings|portions|plates)/i);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1] ?? "", 10);
  if (Number.isNaN(value) || value < 2) {
    return null;
  }
  return value;
}

function buildGroupPlan(suggestions: TextSuggestion[], partySize: number): GroupPlanEntry[] {
  if (!partySize || !suggestions.length) {
    return [];
  }

  const allocations = new Map<string, GroupPlanEntry>();

  for (let i = 0; i < partySize; i += 1) {
    const suggestion = suggestions[i % suggestions.length];
    const existing = allocations.get(suggestion.dish.id);
    if (existing) {
      existing.quantity += 1;
    }
    else {
      allocations.set(suggestion.dish.id, {
        dish: suggestion.dish,
        restaurant: suggestion.restaurant,
        quantity: 1,
        matchScore: suggestion.matchScore,
      });
    }
  }

  return Array.from(allocations.values());
}

function getOrderIdForDish(dish: Dish): string | null {
  const restaurantName = restaurantSlugToName.get(dish.restaurantSlug);
  if (!restaurantName) {
    return null;
  }
  return restaurantNameToOrderId.get(restaurantName) ?? null;
}

type GroupPlanEntry = {
  dish: Dish;
  restaurant: Restaurant | null;
  quantity: number;
  matchScore: number;
};

type GroupOrderCardProps = {
  plan: GroupPlanEntry[];
  partySize: number;
  expandedKits: Record<string, boolean>;
  kits: Record<string, DishAnalysis>;
  loadingDishId: string | null;
  onToggleKit: (dish: Dish) => void;
  onOrderDish: (dish: Dish) => void;
  onOrderGroup: () => void;
};

function GroupOrderCard({
  plan,
  partySize,
  expandedKits,
  kits,
  loadingDishId,
  onToggleKit,
  onOrderDish,
  onOrderGroup,
}: GroupOrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Text search</p>
            <CardTitle>Group order plan</CardTitle>
            <CardDescription>Serving approximately {partySize} people</CardDescription>
          </div>
          <Badge variant="outline">{plan.length} dish{plan.length > 1 ? "es" : ""}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {plan.map((entry) => {
          const dishId = entry.dish.id;
          const expanded = expandedKits[dishId] ?? false;
          const kit = kits[dishId];
          const isLoadingKit = loadingDishId === dishId && !kit;

          return (
            <div key={dishId} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{entry.dish.name}</h3>
                    <Badge variant="secondary">×{entry.quantity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entry.restaurant?.name ?? "Restaurant info unavailable"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Match confidence {Math.round(Math.min(Math.max(entry.matchScore, 0), 1) * 100)}%
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onOrderDish(entry.dish)}>
                    Order dish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleKit(entry.dish)}
                    disabled={isLoadingKit}
                  >
                    {isLoadingKit && <Spinner className="mr-2 h-4 w-4" />}
                    {expanded ? "Hide ingredient kit" : "Buy ingredients instead"}
                  </Button>
                </div>
              </div>
              {expanded && (
                kit ? (
                  <div className="mt-4">
                    <DishKitPanel dish={entry.dish} restaurant={entry.restaurant} analysis={kit} />
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Spinner className="h-4 w-4" />
                      Generating ingredient kit...
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-md">
          We bundled dishes into a single order so you can jump straight into delivery tracking.
        </p>
        <Button onClick={onOrderGroup}>Order all dishes</Button>
      </CardFooter>
    </Card>
  );
}

function InstructionCard({ instructions }: { instructions: string[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4">Instructions</h3>
        <ol className="space-y-3">
          {instructions.map((step, index) => (
            <li key={step + index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      }
      else {
        reject(new Error("Unsupported file type"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
