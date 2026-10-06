# Jevburger plan

## Goal

Build a polished, single-station burger simulation where Jev chooses only actions the burger engine declares legal. The burger state machine is custom TypeScript, not XState.

## Scope

One burger at a time:

- Hamburger, cheeseburger, or veggie burger.
- Modifiers: no cheese, no onion, extra pickles, preferred doneness.
- Patty lifecycle: raw → cooking → flipped → cooked, undercooked, or burnt.
- Bun toasting, cheese, toppings, assembly, serving, and discarding.
- A human can pause Jev and make any currently legal move.

Do not build fries, drinks, payment, customers, inventory, staff scheduling, or a generic restaurant framework.

## Architecture

### Burger engine

Create `src/engine/burger.ts` with the complete domain model and no UI or model-provider code:

```ts
type BurgerState = { /* order, patty, grill, bun, assembly, hands */ }
type BurgerAction = { type: string; /* closed action payload */ }

function legalActions(state: BurgerState): BurgerAction[]
function transition(state: BurgerState, action: BurgerAction): BurgerState
```

`legalActions` is the sole source of possible moves. `transition` rejects an action that is not legal in its input state. This keeps Jev, the manual UI, and tests behind the same safety boundary.

### Jev adapter

Create `src/jev/barista.ts`:

1. Turn `legalActions(state)` into clear, closed-choice descriptions.
2. Send the visible burger state plus those choices to Jev.
3. Re-check Jev's returned action against the latest `legalActions` result.
4. Call `transition` only when it remains legal.
5. Retain a compact decision history, pause/resume state, and request errors.

### Recipes

Keep recipes as plain data in `src/engine/recipes.ts`. A served burger is evaluated from its final ingredients and patty doneness against the current order.

## Visual direction

Make it feel like a small, premium open-kitchen game rather than an admin dashboard:

- **Palette:** charcoal kitchen background, warm stainless steel, grilled-orange heat, mustard/yellow highlights, and fresh lettuce/pickle greens.
- **Layout:** order ticket on the left; hero grill and assembly station in the center; Jev status and decision trail on the right.
- **Burger-first:** the patty, bun, cheese, and toppings should be large, tactile, and immediately readable. The current cooking stage must be visible without reading logs.
- **Motion:** subtle heat shimmer, patty flip/toast transitions, and a satisfying assembly stack. Respect reduced-motion preferences.
- **Controls:** pause/resume Jev and a compact set of manual legal-move buttons. Hide impossible actions rather than disabling a large grid.
- **Feedback:** prominent status for raw, cooking, ready, undercooked, and burnt; serving should reveal a clear pass/fail comparison to the ticket.
- **Responsive:** on narrow screens, stack ticket → station → Jev panel and keep primary controls thumb-reachable.

Use CSS and lightweight React transitions before adding an animation dependency.

## First playable flow

1. Choose or type an order.
2. Put the correct patty on the grill.
3. Season, wait, and flip at an appropriate time.
4. Toast the bun while the patty cooks.
5. Add cheese and requested toppings.
6. Assemble in valid order.
7. Serve and compare the result to the order.
8. Show whether it was correct, undercooked, burnt, or incorrectly assembled.

## Tests

Write small engine tests that prove:

- Impossible actions are unavailable and rejected.
- A patty cannot flip before it is on the grill.
- Cooking time yields undercooked, cooked, and burnt outcomes.
- Recipe evaluation accepts correct burgers and rejects incorrect ones.
- A stale Jev decision cannot mutate a changed state.

## Delivery sequence

1. Scaffold the app and domain types.
2. Implement and test the custom engine.
3. Add recipes and order evaluation.
4. Build the visual station and manual controls.
5. Connect Jev through the closed-choice adapter.
6. Polish responsive layout, motion, and accessibility.
7. Add scripted evaluation only after the core loop feels good.
