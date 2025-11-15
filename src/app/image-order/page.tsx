"use client";

import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useDishImageSearch } from "@/hooks/use-dishes";

type DishMatch = {
  dish: {
    id: string;
    name: string;
    description: string;
    ingredients: string[];
    image: string;
    restaurantId: string;
    price: number;
  };
  similarity: number;
};

export default function DishImageSearchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const router = useRouter();

  const mutation = useDishImageSearch();

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      mutation.reset(); // Reset previous results
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile)
      handleFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file)
      return;

    const formData = new FormData();
    formData.append("image", file);

    mutation.mutate(formData);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    mutation.reset();
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Search Dish by Image</CardTitle>
          <CardDescription>
            Upload a photo of a dish to find the best matches from our menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              {preview
                ? (
                    <div className="relative inline-block">
                      <Image
                        src={preview}
                        alt="Preview"
                        width={320}
                        height={320}
                        className="mx-auto rounded-lg object-cover max-h-80"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Drop your image here, or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports JPG, PNG, WebP
                      </p>
                    </>
                  )}
            </div>
          </div>

          {/* Upload Button */}
          {file && (
            <div className="flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={mutation.isPending}
                size="lg"
                className="min-w-48"
              >
                {mutation.isPending
                  ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    )
                  : (
                      "Search for Dish"
                    )}
              </Button>
            </div>
          )}

          {/* Error Alert */}
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to search. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {mutation.isSuccess && mutation.data?.matches && (
            <div className="space-y-6">
              <Separator />
              <h3 className="text-lg font-semibold">Best Matches</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {mutation.data.matches.map((match: DishMatch) => (
                  <Card key={match.dish.id} className="overflow-hidden">
                    <div className="flex">
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image
                          src={match.dish.image}
                          alt={match.dish.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{match.dish.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {match.dish.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {(match.similarity * 100).toFixed(1)}
                            % match
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Progress
                            value={match.similarity * 100}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs font-medium">
                            {(match.similarity * 100).toFixed(0)}
                            %
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          {match.dish.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i}>
                              {ing}
                              {i < 2 && i < match.dish.ingredients.slice(0, 3).length - 1 && ", "}
                            </span>
                          ))}
                          {match.dish.ingredients.length > 3 && "..."}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">
                            $
                            {match.dish.price.toFixed(2)}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/restaurants/${match.dish.restaurantId}`)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
