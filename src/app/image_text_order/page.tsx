"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
import { useImageDishOrder } from "@/hooks/use-orders";
import type { Dish, Restaurant } from "@/types/restaurant";

type ImageOrderResponse = {
  analysis: {
    ingredients: string[];
    instructions: string[];
    totalPrice: number;
  };
  dish: Dish | null;
  restaurant: Restaurant | null;
  matchScore: number;
};

const euroFormatter = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

export default function ImageTextOrderPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<ImageOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useImageDishOrder();

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
    setResult(null);
  };

  const handleAnalyzeDish = async () => {
    if (!selectedFile) {
      setError("Upload a dish photo to analyze.");
      return;
    }

    setError(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      const response = await analyzeMutation.mutateAsync({
        imageBase64: base64,
        mimeType: selectedFile.type || "image/jpeg",
        notes: notes.trim() || undefined,
      });
      setResult(response as ImageOrderResponse);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze dish.");
    }
  };

  const handleOrderIngredients = () => {
    if (!result?.dish) return;

    try {
      sessionStorage.setItem(`analysis:${result.dish.id}`,
        JSON.stringify({
          ingredients: result.analysis.ingredients,
          totalPrice: result.analysis.totalPrice,
        }),
      );
    }
    catch {
      // ignore storage errors
    }

    router.push(`/order/${result.dish.id}`);
  };

  const confidence = useMemo(() => {
    if (!result) return 0;
    const normalized = Math.min(Math.max(result.matchScore ?? 0, 0), 1);
    return Math.round(normalized * 100);
  }, [result]);

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
                    ? <img src={imagePreview} alt="Selected dish" className="h-full w-full rounded-2xl object-cover" />
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
                  onClick={() => setError("Image analysis is live today — upload a dish photo for the most accurate match.")}
                >
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

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !result.dish && !error && (
          <Alert>
            <AlertTitle>No close matches found</AlertTitle>
            <AlertDescription>
              Try a brighter photo or add a short note so we can refine suggestions.
            </AlertDescription>
          </Alert>
        )}

        {result?.dish && (
          <section className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary" className="w-fit">AI recommendation</Badge>
                    <CardTitle>{result.dish.name}</CardTitle>
                    <CardDescription>
                      {result.restaurant?.name ?? "Restaurant info unavailable"}
                      {result.restaurant?.eta ? ` • ${result.restaurant.eta}` : ""}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground max-w-xl">
                      {result.dish.description}
                    </p>
                  </div>
                  <div className="h-32 w-32 overflow-hidden rounded-2xl border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.dish.image}
                      alt={result.dish.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Match confidence</p>
                  <p className="text-3xl font-semibold">
                    {confidence}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">Based on ingredient overlap and Gemini analysis.</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Restaurant</p>
                  <p className="font-medium">{result.restaurant?.name ?? "TBD"}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.restaurant?.address ?? "We'll connect you as soon as it's available."}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-3">
                {result.restaurant?.slug && (
                  <Button asChild>
                    <Link href={`/restaurants/${result.restaurant.slug}`}>
                      Order from {result.restaurant.name}
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={handleOrderIngredients}>
                  Order ingredients
                </Button>
                <Button variant="ghost" onClick={() => setResult(null)}>
                  Reset
                </Button>
              </CardFooter>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Ingredients</h3>
                  <ul className="space-y-2">
                    {result.analysis.ingredients.map((ingredient, index) => (
                      <li key={ingredient + index} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Instructions</h3>
                  <ol className="space-y-3">
                    {result.analysis.instructions.map((step, index) => (
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
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm text-muted-foreground">Estimated ingredient total</p>
                <p className="text-2xl font-semibold">
                  {euroFormatter.format(result.analysis.totalPrice)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Pricing is generated from the ingredient breakdown so you can re-create the dish at home or
                compare it with delivery.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
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
