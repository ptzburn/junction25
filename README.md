<div align="center">

# 🍱 Zaglot
### AI-Enhanced Local Commerce Platform

**Intelligent food discovery and ordering powered by multimodal AI**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Hono](https://img.shields.io/badge/Hono-4-orange?style=flat)](https://hono.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat&logo=openai)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Architecture](./docs/ARCHITECTURE.md) • [Data Model](./docs/DATA_MODEL.md) • [Screenshots Guide](./docs/screenshots/README.md)

</div>

------------------------------------------------------------------------

## 🎯 What is Zaglot?

Zaglot reimagines food ordering by combining AI vision, semantic search, and calendar intelligence. **Upload a food photo to find similar dishes, get ingredients automatically extracted and added to your cart, or let AI schedule your meals based on your calendar** — all in a TikTok-style swipeable feed.

Built for [Junction 2025](https://junction2025.com/) hackathon, extending Wolt's platform with cutting-edge AI capabilities.

------------------------------------------------------------------------

## 📸 Screenshots & Demo

> **Note**: Add screenshots of your application here to showcase the user interface

### Key Features in Action

<!-- Uncomment and add screenshots/GIFs when available
![OnlyFood Feed](./docs/screenshots/feed.gif)
*Swipeable TikTok-style food discovery feed*

![Image Search](./docs/screenshots/image-search.png)
*Upload a food photo to find similar dishes*

![Calendar Integration](./docs/screenshots/calendar.png)
*AI suggests meals based on your schedule*
-->

**To add screenshots:**
1. Place screenshots in the `docs/screenshots/` folder (already created)
2. Take screenshots of key features (feed, search, calendar, cart)
3. Use tools like [LICEcap](https://www.cockos.com/licecap/) or [ScreenToGif](https://www.screentogif.com/) for GIF recordings
4. See the [screenshots guide](./docs/screenshots/README.md) for detailed instructions
5. Uncomment the image tags above and update paths

------------------------------------------------------------------------

## 🏗️ Architecture & Data Model

Zaglot is built as a **Next.js 15 + Hono** monorepo with edge-first architecture.

```
Browser (React 19)
    │
    ├─► Image-to-Dish Search (Vision AI)
    ├─► Calendar Sync (Google API)
    ├─► OnlyFood Feed (Swipeable UI)
    └─► Ingredient Ordering
    │
    ▼
Next.js App Router ◄──► Hono Edge API
    │                       │
    │                       ├─► OpenAI GPT-4o-mini
    │                       ├─► Vector Embeddings (768-dim)
    │                       ├─► Google Calendar API
    │                       └─► Zod Validation
    ▼
Vercel Edge Runtime
```

**For detailed architecture diagrams and component interactions:**
- 📐 [System Architecture](./docs/ARCHITECTURE.md) - Component diagrams, sequence flows, data pipelines
- 🗄️ [Data Model & Schema](./docs/DATA_MODEL.md) - Entity relationships, embedding strategy, data structures

------------------------------------------------------------------------

## ✨ Core Features

### 🔍 1. Image-Based Dish Recognition
**Upload any food photo → Get matching dishes instantly**

- Uses GPT-4o-mini vision for image embeddings
- Cosine similarity search across 50+ dishes
- Returns top-k nearest matches

**API Endpoint:** `POST /api/vision-search`

---

### 🧪 2. AI Dish-to-Ingredients Pipeline
**Select a dish → Get a shopping list automatically**

- GPT extracts structured ingredient list from dish
- Semantic lookup in Zaglot Market (100+ products)
- Aggregated cart with quantities and pricing

---

### 📱 3. OnlyFood Swipe Feed
**TikTok-style vertical feed for food discovery**

- AI-generated short-form dish videos
- Embedding-based ranking for personalization
- One-tap ordering with instant checkout

---

### 📅 4. Calendar-Aware Ordering
**AI schedules meals around your day**

- Google Calendar integration via service account
- Finds optimal eating windows between meetings
- Suggests dishes based on:
  - Historical ordering patterns (embeddings)
  - Dietary preferences and restrictions
  - Available delivery times

---

### 🎮 5. Event-Based Ordering
**Planning a party or meeting? AI does the catering**

- Input: headcount, allergies, preferences, budget, event time
- Output: Complete menu plan with restaurant selection

---

### 🎯 6. Delivery Arrival Minigame
**Gamified delivery tracking with rewards**

- Guess the delivery ETA
- Correct predictions earn platform credits
- Incentivizes faster courier performance

------------------------------------------------------------------------

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|------------|---------|
| ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js) | React framework with App Router |
| ![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react) | UI library |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript) | Type-safe development |
| ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css) | Utility-first styling |
| ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Components-black?style=flat) | Beautiful UI components |
| ![TanStack Query](https://img.shields.io/badge/TanStack-Query-red?style=flat) | Async state management |

### **Backend**
| Technology | Purpose |
|------------|---------|
| ![Hono](https://img.shields.io/badge/Hono-4-orange?style=flat) | Ultrafast edge API framework |
| ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat&logo=openai) | Vision & text generation |
| ![Embeddings](https://img.shields.io/badge/text--embedding--3--small-768dim-green?style=flat) | Semantic search vectors |
| ![Zod](https://img.shields.io/badge/Zod-4-blue?style=flat) | Schema validation |

### **Integrations**
| Service | Purpose |
|---------|---------|
| ![Google Calendar](https://img.shields.io/badge/Google-Calendar_API-4285F4?style=flat&logo=google-calendar) | Schedule integration |
| ![Google OAuth](https://img.shields.io/badge/Google-OAuth_2.0-4285F4?style=flat&logo=google) | Authentication |

### **Infrastructure**
| Platform | Purpose |
|----------|---------|
| ![Vercel](https://img.shields.io/badge/Vercel-Edge_Runtime-black?style=flat&logo=vercel) | Edge functions & deployment |
| ![CDN](https://img.shields.io/badge/CDN-Static_Assets-blue?style=flat) | Images & videos |

------------------------------------------------------------------------

## 🚀 Getting Started

### Prerequisites

Before running Zaglot, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **pnpm** 8.x or higher ([Installation guide](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ptzburn/junction25.git
   cd junction25
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local  # If .env.example exists
   ```

   Add the following variables:
   ```env
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_URL=https://generativelanguage.googleapis.com/v1beta/
   
   # Optional
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

   **How to get API keys:**
   - **Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Google Service Account**: Follow [this guide](https://developers.google.com/workspace/guides/create-credentials#service-account)

4. **Generate embeddings (optional)**
   
   To generate embeddings for dishes and stock items:
   ```bash
   pnpm embed:dish-image  # Generate dish image embeddings
   pnpm embed:stock       # Generate stock item embeddings
   ```

### Running the Application

#### Development Mode

```bash
pnpm dev
```

The application will start at **http://localhost:3001**

#### Production Build

```bash
pnpm build
pnpm start
```

#### Linting & Type Checking

```bash
pnpm lint          # Run ESLint
pnpm lint:fix      # Auto-fix linting issues
pnpm typecheck     # Run TypeScript type checking
```

### Project Structure

```
junction25/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── scripts/          # Embedding generation scripts
├── data/                 # JSON mock data & embeddings
├── docs/                 # Documentation & diagrams
├── public/               # Static assets (images, videos)
├── .vscode/              # VS Code settings
└── package.json          # Dependencies & scripts
```

------------------------------------------------------------------------

## 🤝 Contributing

Contributions are welcome! This project follows standard open-source contribution guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and type checking (`pnpm lint && pnpm typecheck`)
5. Commit with meaningful messages (`git commit -m 'feat: add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

------------------------------------------------------------------------

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

------------------------------------------------------------------------

## 🙏 Acknowledgments

- **Junction 2025** - For organizing an amazing hackathon
- **Wolt** - For inspiring the local commerce vision
- **OpenAI** - For GPT-4o-mini and embedding models
- **Vercel** - For edge runtime and deployment platform
- **shadcn** - For beautiful UI components

------------------------------------------------------------------------

## 📬 Contact

**Project Link**: [https://github.com/ptzburn/junction25](https://github.com/ptzburn/junction25)

Built with ❤️ at Junction 2025

------------------------------------------------------------------------

<div align="center">

### ⭐ Star this repo if you found it helpful!

</div>

