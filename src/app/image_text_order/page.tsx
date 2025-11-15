"use client";

import Link from "next/link";
import { useState } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function ImageTextOrderPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
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
                    ? <img src={imagePreview} alt="Selected dish" className="h-full w-full rounded-2xl object-cover" />
                    : (
                        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                          <span>Preview will appear here after you upload an image.</span>
                          <span>No ideas yet? Snap your favorite dish or menu photo.</span>
                        </div>
                      )}
                </div>
                <Button size="lg" className="self-start">Analyze dish</Button>
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
                <Button size="lg" className="self-start">Find suggestions</Button>
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
      </div>
    </main>
  );
}
