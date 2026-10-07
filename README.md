# Jevburger

A fixed-camera 3D burger station run by Jev. Write a ticket in plain English; Jev parses it, grills up to four patties at once (choosing when to place, season, flip, and remove each), builds the burgers, and serves them. The spatula follows Jev's grill moves. The station's custom TypeScript state machine only accepts legal actions. No XState, demo cook, or manual mode.

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173. Set `OPENROUTER_API_KEY` or `TYPESAFE_API_KEY` in `.env`, or enter a key in the UI. Copy `.env.example` to `.env` and add your own key if using a server-side key. Server keys take precedence (TypeSafe first). A browser-provided key stays in that browser and accompanies each request to the local server.

**Do not expose Vite dev or preview publicly with a server-side key.** The local API has no authentication or rate limiting. Jev pauses after 50 moves per burger or 160 moves per cooking batch.

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm preview
```

`pnpm preview` serves the build and the same local API middleware. Static `dist/` alone cannot make model requests; a public deployment needs a protected API.

## Kitchen

- `src/engine/burger.ts`: legal actions, transitions, patty cooking, and scoring.
- `src/engine/kitchen.ts`: four burger positions and a shared Jev-controlled cooking clock.
- `src/engine/recipes.ts`: three base burgers and available ingredients.
- `src/jev/orders.ts`: closed Jev questions for natural-language tickets; validates every answer.
- `src/jev/kitchen.ts`: closed, slot-targeted cooking choices; rechecks each selected move before delivery.
- `vite.config.ts`: server-only TypeSafe/OpenRouter bridge for parsing and cooking.
- `src/Kitchen3D.tsx` and `src/KitchenModels.ts`: fixed-camera Three.js kitchen, ingredient models, and state-timed motion.
- `src/GrillScene.tsx`: SVG fallback when WebGL is unavailable.

Jev understands varied phrasing for one burger with beef or veggie patty, cheese, doneness, and these ingredients: lettuce, tomato, onion, pickles, bacon, mushrooms, jalapeños, avocado, ketchup, mustard, and mayo. Extra/double portions are supported. A ticket may ask for one to four identical burgers; the kitchen cooks four concurrently and queues the rest. Mixed burger types go on separate tickets. Requests beyond the kitchen's physical ingredients are rejected. One Jev-selected wait advances all grilling patties by 30 simulated seconds; Jev decides when to put each on, flip it, and take it off. Jev automatically starts the next queued burger when a position opens. Pause it any time.
