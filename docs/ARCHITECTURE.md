# Zaglot System Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Layer (Browser)"]
        UI[React UI Components]
        Feed[OnlyFood Swipe Feed]
        Upload[Image Upload]
        Calendar[Calendar Sync]
        Ordering[Ordering Interface]
    end

    subgraph NextJS["Next.js 15 App Router"]
        SSR[Server Components]
        CSR[Client Components]
        API[API Routes]
    end

    subgraph Edge["Hono Edge API"]
        Vision[Vision Search API]
        Dish[Dish-to-Ingredients API]
        Event[Event-Based Ordering API]
        CalAPI[Calendar Integration API]
    end

    subgraph AI["AI Services"]
        GPT[OpenAI GPT-4o-mini]
        Embed[Embedding Engine]
        Vector[Vector Search]
    end

    subgraph External["External Services"]
        GCal[Google Calendar API]
        Auth[Google OAuth]
    end

    subgraph Data["Data Layer"]
        Dishes[dishes.json]
        Orders[orders.json]
        Stock[stock.json]
        Restaurants[restaurants.json]
    end

    UI --> SSR
    UI --> CSR
    Feed --> SSR
    Upload --> Vision
    Calendar --> CalAPI
    Ordering --> Event

    SSR --> API
    CSR --> API
    API --> Edge

    Vision --> GPT
    Vision --> Embed
    Dish --> GPT
    Event --> GPT
    CalAPI --> GCal

    Edge --> Vector
    Embed --> Vector
    Vector --> Data

    CalAPI --> Auth
    
    style Client fill:#e1f5ff
    style NextJS fill:#fff4e1
    style Edge fill:#ffe1f5
    style AI fill:#e1ffe1
    style External fill:#ffe1e1
    style Data fill:#f5e1ff
```

## Component Interactions

### 1. Image-Based Dish Recognition
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Vision API
    participant GPT-4o
    participant Vector DB
    participant Dishes

    User->>UI: Upload food image
    UI->>Vision API: POST /api/vision-search
    Vision API->>GPT-4o: Generate image embedding
    GPT-4o-->>Vision API: Image vector
    Vision API->>Vector DB: Cosine similarity search
    Vector DB->>Dishes: Query top-k matches
    Dishes-->>Vector DB: Matching dishes
    Vector DB-->>Vision API: Top matches
    Vision API-->>UI: Dish results
    UI-->>User: Display matches
```

### 2. AI Dish-to-Ingredients Pipeline
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Dish API
    participant GPT-4o
    participant Stock
    participant Cart

    User->>UI: Select dish
    UI->>Dish API: Request ingredients
    Dish API->>GPT-4o: Extract ingredients
    GPT-4o-->>Dish API: Structured ingredient list
    Dish API->>Stock: Semantic ingredient lookup
    Stock-->>Dish API: Matching products
    Dish API-->>UI: Shopping list
    UI->>Cart: Add items
    UI-->>User: Show cart
```

### 3. Calendar-Aware Ordering
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Cal API
    participant Google Calendar
    participant GPT-4o
    participant Dishes

    User->>UI: Enable calendar sync
    UI->>Cal API: Request schedule
    Cal API->>Google Calendar: Fetch today's events
    Google Calendar-->>Cal API: Event list
    Cal API->>Cal API: Find optimal eating window
    Cal API->>GPT-4o: Get dish recommendation
    GPT-4o->>Dishes: Query with constraints
    Dishes-->>GPT-4o: Available dishes
    GPT-4o-->>Cal API: Recommended dish
    Cal API-->>UI: Dish + timing
    UI-->>User: Show suggestion
```

## Data Flow

```mermaid
flowchart LR
    subgraph Input
        Image[Food Image]
        Text[Text Query]
        Calendar[Calendar Events]
        Preferences[User Preferences]
    end

    subgraph Processing
        Embedding[Generate Embeddings]
        Search[Vector Search]
        GPT[GPT Analysis]
        Ranking[Rank Results]
    end

    subgraph Output
        Dishes[Dish Matches]
        Ingredients[Shopping List]
        Recommendations[Personalized Recs]
        Orders[Order Suggestions]
    end

    Image --> Embedding
    Text --> Embedding
    Calendar --> GPT
    Preferences --> Ranking

    Embedding --> Search
    Search --> Dishes
    Search --> Ingredients
    GPT --> Recommendations
    GPT --> Orders
    Ranking --> Recommendations

    style Input fill:#e1f5ff
    style Processing fill:#ffe1f5
    style Output fill:#e1ffe1
```

## Technology Stack by Layer

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Authentication**: NextAuth (Google OAuth)

### Backend
- **API Framework**: Hono (Edge runtime)
- **Runtime**: Vercel Edge Functions
- **Validation**: Zod

### AI/ML
- **LLM**: OpenAI GPT-4o-mini
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Search**: In-memory cosine similarity

### External APIs
- **Calendar**: Google Calendar API
- **Authentication**: Google OAuth 2.0

### Data Storage
- **Type**: JSON-based mock data
- **Files**: dishes.json, orders.json, stock.json, restaurants.json
- **Embeddings**: Pre-computed vectors stored with entities

## Deployment Architecture

```mermaid
graph TB
    subgraph Vercel
        Edge[Edge Functions]
        Static[Static Assets CDN]
        SSR[Server-Side Rendering]
    end

    subgraph External
        OpenAI[OpenAI API]
        Google[Google APIs]
    end

    Browser[User Browser] --> Static
    Browser --> Edge
    Browser --> SSR
    
    Edge --> OpenAI
    Edge --> Google
    SSR --> Edge

    style Vercel fill:#e1f5ff
    style External fill:#ffe1e1
```
