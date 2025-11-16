# Zaglot --- AI-Enhanced Local Commerce Platform

Zaglot is a full-stack prototype that extends Wolt's city-commerce
experience with AI-driven food discovery, automatic meal timing,
semantic ingredient extraction, multimodal search, and event-based
ordering. The system integrates multiple AI pipelines, embeddings, and
calendar context to generate personalized, predictive, and frictionless
user flows --- all built on a modern, scalable edge-first architecture.

------------------------------------------------------------------------

## ⚙️ Architecture Overview

Zaglot is a **Next.js 15 + Hono** monorepo that can run locally or be
deployed to Vercel or a standard Node environment.

    Browser
       │
       ├── Image-to-Dish Search (Upload)
       ├── Calendar Sync (Service Account Integration)
       ├── OnlyFood Feed (Client + Server Components)
       ├── Ingredient Ordering (Client)
       │
       ▼
    Next.js App Router <—> Hono API Routes (Edge)
       │                      │
       │                      ├── OpenAI GPT-4o-mini
       │                      ├── Embedding Vector Store
       │                      ├── Google Calendar API
       │                      └── Zod Validation
       ▼
    Vercel Deployment

------------------------------------------------------------------------

## 🧩 Core Functional Modules

### **1. Image-Based Dish Recognition (switched from #3)**

Pipeline: - Upload → GPT-4o-mini vision embedding\
- Cosine similarity across dish embeddings\
- Returns top-k nearest dishes

**API:** `POST /api/vision-search`

------------------------------------------------------------------------

### **2. AI Dish-to-Ingredients Pipeline**

Steps: - Dish → GPT prompt → structured ingredient list\
- Zod schema validation\
- Semantic ingredient lookup in Zaglot Market\
- Aggregated shopping list

------------------------------------------------------------------------

### **3. OnlyFood Swipe Feed (switched from #1)**

A TikTok-style vertical feed with: - AI-generated dish videos\
- Dish-embedding ranking\
- One-tap order action

Ranking signals: - User embedding\
- Context-aware scoring

------------------------------------------------------------------------

### **4. Event-Based Ordering**

Takes: - headcount, allergies, preferences, budget, event time

GPT generates: - menu plan\
- restaurant/store list\
- merged cart payload

------------------------------------------------------------------------

### **5. Google Calendar--Aware Ordering**

-   Google Service Account Integration\
-   Fetches daily schedule\
-   Finds optimal eating window\
-   Selects dish using:
    -   historical ordering embedding\
    -   dietary constraints

------------------------------------------------------------------------

### **6. Delivery Arrival Minigame**

-   User guesses ETA\
-   Correct → gain credits\
-   Faster courier → tip transferred

------------------------------------------------------------------------

## 📦 Data Model

-   **orders.json** --- full mock Wolt schema\
-   **dishes.json** --- embeddings, videos, metadata\
-   **store.json** --- Zaglot Market SKUs + embeddings
- 

------------------------------------------------------------------------

## 🛠 Tech Stack

### **Frontend**

-   Next.js 15\
-   React 19\
-   TypeScript\
-   Tailwind CSS\
-   shadcn/ui\
-   TanStack Query\
-   NextAuth (Google OAuth)

### **Backend**

-   Hono (edge API)\
-   OpenAI GPT-4o-mini (vision + embeddings)\
-   Google Calendar API\
-   Zod validation\
-   In-memory vector search engine

### **Infrastructure**

-   Vercel Edge Runtime\
-   Static CDN (images, videos)

------------------------------------------------------------------------

## ▶️ Running Locally

``` bash
pnpm install
pnpm dev
```

### Environment Variables

    NODE_ENV=
    GEMINI_API_KEY=
    GEMINI_URL=
    NEXT_PUBLIC_APP_URL=
    GOOGLE_SERVICE_ACCOUNT_KEY=

------------------------------------------------------------------------
