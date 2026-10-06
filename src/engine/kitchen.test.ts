import { expect, it } from 'vitest';
import { initialKitchen, kitchenActionId, legalKitchenActions, startOrder, transitionKitchen } from './kitchen';
import type { Order } from './recipes';

const order: Order = { recipe: 'cheese', cheese: true, toppings: ['lettuce'], doneness: 'regular' };

it('offers actions for four tickets and cooks every patty with one Jev-controlled wait', () => {
  let kitchen = [0, 1, 2, 3].reduce((state, slot) => startOrder(state, slot as 0 | 1 | 2 | 3, order), initialKitchen);
  expect(legalKitchenActions(kitchen).map(kitchenActionId)).toContain('slot:3:patty.place:beef');
  for (const slot of [0, 1, 2, 3] as const) kitchen = transitionKitchen(kitchen, { type: 'slot', slot, action: { type: 'patty.place', kind: 'beef' } });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  expect(kitchen.slots.map((state) => state.patty?.ticks)).toEqual([[1, 0], [1, 0], [1, 0], [1, 0]]);
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'patty.flip' } });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  expect(kitchen.slots.map((state) => state.patty?.ticks)).toEqual([[1, 1], [2, 0], [2, 0], [2, 0]]);
  expect(() => transitionKitchen(kitchen, { type: 'slot', slot: 3, action: { type: 'patty.remove' } })).toThrow('Illegal');
});
