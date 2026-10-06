import { expect, it, vi } from 'vitest';
import { initialKitchen, kitchenActionId, startOrder, transitionKitchen } from '../engine/kitchen';
import { chooseKitchenMove, jevKitchenActions, kitchenRequest } from './kitchen';

const order = { recipe: 'cheese' as const, cheese: true, toppings: ['lettuce' as const], doneness: 'regular' as const };

it('describes slot-specific choices and rechecks the returned move', async () => {
  const kitchen = startOrder(startOrder(initialKitchen, 0, order), 1, order);
  expect(kitchenRequest(kitchen).questions.action.criteria).toHaveProperty('slot:0:patty.place:beef');
  expect(kitchenRequest(kitchen).questions.action.criteria).toHaveProperty('slot:1:patty.place:beef');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'slot:1:patty.place:beef' }) }));
  expect(await chooseKitchenMove(kitchen)).toEqual({ type: 'slot', slot: 1, action: { type: 'patty.place', kind: 'beef' } });
  const changed = transitionKitchen(kitchen, { type: 'slot', slot: 1, action: { type: 'patty.place', kind: 'beef' } });
  await expect(chooseKitchenMove(changed)).rejects.toThrow('unavailable');
  vi.unstubAllGlobals();
});

it('offers only the next recipe layer and stops waiting when a side is ready', () => {
  let kitchen = startOrder(initialKitchen, 0, order);
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'patty.place', kind: 'beef' } });
  expect(jevKitchenActions(kitchen).map(kitchenActionId)).not.toContain('grill.wait');
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'patty.season' } });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  const ready = jevKitchenActions(kitchen).map(kitchenActionId);
  expect(ready).toContain('slot:0:patty.flip');
  expect(ready).not.toContain('grill.wait');
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'patty.flip' } });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'patty.remove' } });
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'bun.toast' } });
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'bun.bottom' } });
  kitchen = transitionKitchen(kitchen, { type: 'slot', slot: 0, action: { type: 'stack.patty' } });
  const next = jevKitchenActions(kitchen).map(kitchenActionId);
  expect(next).toContain('slot:0:stack.cheese');
  expect(next).not.toContain('slot:0:stack.topping:lettuce');
  expect(next).not.toContain('slot:0:bun.top');
});
