import { actionId, initialState, legalActions, transition, type Action, type BurgerState } from './burger';
import type { Order } from './recipes';

export const SLOTS = [0, 1, 2, 3] as const;
export type Slot = typeof SLOTS[number];
type SlotAction = Exclude<Action, { type: 'order.start' } | { type: 'grill.wait' }>;
export type KitchenAction = { type: 'grill.wait' } | { type: 'slot'; slot: Slot; action: SlotAction };
export type KitchenState = { slots: [BurgerState, BurgerState, BurgerState, BurgerState]; moves: number };
export const initialKitchen: KitchenState = { slots: [initialState, initialState, initialState, initialState], moves: 0 };

export function startOrder(kitchen: KitchenState, slot: Slot, order: Order): KitchenState {
  const slots: KitchenState['slots'] = [...kitchen.slots];
  slots[slot] = transition(initialState, { type: 'order.start', order });
  return { ...kitchen, slots, moves: kitchen.slots.every((state) => !state.order || state.result) ? 0 : kitchen.moves };
}

export function kitchenActionId(action: KitchenAction): string {
  return action.type === 'grill.wait' ? 'grill.wait' : `slot:${action.slot}:${actionId(action.action)}`;
}

export function legalKitchenActions(kitchen: KitchenState): KitchenAction[] {
  const actions: KitchenAction[] = [];
  kitchen.slots.forEach((state, slot) => {
    for (const action of legalActions(state)) {
      if (action.type !== 'grill.wait') actions.push({ type: 'slot', slot: slot as Slot, action: action as SlotAction });
    }
  });
  if (kitchen.slots.some((state) => state.patty?.onGrill)) actions.push({ type: 'grill.wait' });
  return actions;
}

export function transitionKitchen(kitchen: KitchenState, action: KitchenAction): KitchenState {
  if (!legalKitchenActions(kitchen).some((move) => kitchenActionId(move) === kitchenActionId(action))) throw new Error(`Illegal kitchen action: ${kitchenActionId(action)}`);
  const slots: KitchenState['slots'] = [...kitchen.slots];
  if (action.type === 'grill.wait') {
    for (const slot of SLOTS) if (slots[slot].patty?.onGrill) slots[slot] = transition(slots[slot], { type: 'grill.wait' });
  } else slots[action.slot] = transition(slots[action.slot], action.action);
  return { slots, moves: kitchen.moves + 1 };
}
