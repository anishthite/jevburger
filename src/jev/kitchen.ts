import { doneness } from '../engine/burger';
import { kitchenActionId, legalKitchenActions, type KitchenAction, type KitchenState } from '../engine/kitchen';
import { expected, MENU, TOPPING_NAMES } from '../engine/recipes';
import type { ProviderKey } from './types';

export function jevKitchenActions(kitchen: KitchenState): KitchenAction[] {
  return legalKitchenActions(kitchen).filter((move) => {
    if (move.type === 'grill.wait') return kitchen.slots.every((state) => !state.patty?.onGrill || (state.patty.seasoned && state.patty.ticks[state.patty.side] < (state.order?.doneness === 'well-done' ? 3 : 2)));
    const state = kitchen.slots[move.slot];
    const wanted = expected(state.order!);
    const next = wanted[state.stack.length];
    switch (move.action.type) {
      case 'patty.place': return move.action.kind === MENU[state.order!.recipe].patty;
      case 'patty.flip': return state.patty!.seasoned && state.patty!.ticks[0] >= (state.order!.doneness === 'well-done' ? 3 : 2);
      case 'patty.remove': return state.patty!.seasoned && state.patty!.ticks[1] >= (state.order!.doneness === 'well-done' ? 3 : 2);
      case 'stack.cheese': return next === 'cheese';
      case 'stack.topping': return next === move.action.topping;
      case 'bun.top': return next === 'top bun';
      case 'burger.discard': return Boolean(state.patty && doneness(state.patty) === 'burnt') || state.stack.some((layer, index) => wanted[index] !== layer);
      default: return true;
    }
  });
}

function describe(action: KitchenAction, kitchen: KitchenState): string {
  if (action.type === 'grill.wait') {
    const progress = kitchen.slots.flatMap((state, slot) => state.patty?.onGrill ? [`#${slot + 1} side ${state.patty.side === 0 ? 'A' : 'B'}: ${state.patty.ticks[state.patty.side] * 30}s / ${state.order?.doneness === 'well-done' ? 90 : 60}s target`] : []);
    return `Advance ALL grilling patties by 30 seconds. ${progress.join('; ')}. Never overcook a side that is at its target.`;
  }
  const state = kitchen.slots[action.slot];
  const number = action.slot + 1;
  const target = state.order?.doneness === 'well-done' ? 90 : 60;
  switch (action.action.type) {
    case 'patty.place': return `Burger #${number}: put ${action.action.kind} patty on the grill.`;
    case 'patty.flip': return `Burger #${number}: flip side A at ${state.patty!.ticks[0] * 30}s (target ${target}s).`;
    case 'patty.remove': return `Burger #${number}: take patty OFF the grill; side B is at ${state.patty!.ticks[1] * 30}s (target ${target}s).`;
    case 'patty.season': return `Burger #${number}: season its patty.`;
    case 'bun.toast': return `Burger #${number}: toast bun.`;
    case 'bun.bottom': return `Burger #${number}: lay bottom bun on its plate.`;
    case 'stack.patty': return `Burger #${number}: add cooked patty to its bun.`;
    case 'stack.cheese': return `Burger #${number}: add cheese.`;
    case 'stack.topping': return `Burger #${number}: add ${TOPPING_NAMES[action.action.topping]}.`;
    case 'bun.top': return `Burger #${number}: put on top bun; no more additions possible.`;
    case 'burger.serve': return `Burger #${number}: serve and score this finished burger.`;
    case 'burger.discard': return `Burger #${number}: discard and restart ONLY if burnt or irreparably wrong.`;
  }
}

export function kitchenRequest(kitchen: KitchenState) {
  const actions = jevKitchenActions(kitchen);
  return {
    state: {
      burgers: kitchen.slots.map((state, index) => state.order ? {
        ticket: index + 1, name: MENU[state.order.recipe].name, wantedPatty: MENU[state.order.recipe].patty,
        layersInExactOrder: expected(state.order), doneness: state.order.doneness,
        patty: state.patty ? { ...state.patty, doneness: doneness(state.patty) } : null,
        bunToasted: state.bunToasted, assembled: state.stack,
      } : null),
    },
    questions: { action: {
      type: 'choice',
      instructions: 'You cook up to four burgers in parallel. Choose one legal move for a numbered ticket or advance the shared grill clock. Each side needs exactly 60s (90s well-done). Jev controls when each patty goes on, flips, and comes off; do not advance time after a side reaches target—flip or remove it first. One wait heats every patty currently on the grill. Season, toast, add only requested ingredients in exact layer order, close and serve each burger. Never discard unless already ruined.',
      criteria: Object.fromEntries(actions.map((action) => [kitchenActionId(action), describe(action, kitchen)])),
    } },
  };
}

export async function chooseKitchenMove(kitchen: KitchenState, key?: ProviderKey): Promise<KitchenAction> {
  const request = kitchenRequest(kitchen);
  const response = await fetch('/api/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...request, key }) });
  const data = await response.json() as { id?: string; error?: string };
  if (!response.ok) throw new Error(data.error || 'Jev could not decide');
  const action = jevKitchenActions(kitchen).find((move) => kitchenActionId(move) === data.id);
  if (!action) throw new Error('Jev returned an unavailable move');
  return action;
}
