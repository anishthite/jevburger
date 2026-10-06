import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { GrillScene } from './GrillScene';
import { initialKitchen, startOrder, transitionKitchen, type KitchenAction } from './engine/kitchen';
import type { Order } from './engine/recipes';

const order: Order = { recipe: 'cheese', cheese: true, toppings: [], doneness: 'regular' };
const ids = [1, null, null, null];
const show = (kitchen: ReturnType<typeof startOrder>, action: KitchenAction, previousPatty: typeof kitchen.slots[0]['patty']) => renderToStaticMarkup(<GrillScene kitchen={kitchen} ids={ids} motion={{ action, id: kitchen.moves, previousPatty }}/>);

it('keeps outgoing food visible through spatula contact and changes the flipped side', () => {
  let kitchen = startOrder(initialKitchen, 0, order);
  const place: KitchenAction = { type: 'slot', slot: 0, action: { type: 'patty.place', kind: 'beef' } };
  kitchen = transitionKitchen(kitchen, place);
  expect(show(kitchen, place, null)).toContain('class="patty-place"');

  kitchen = transitionKitchen(transitionKitchen(kitchen, { type: 'grill.wait' }), { type: 'grill.wait' });
  const beforeFlip = kitchen.slots[0].patty;
  const flip: KitchenAction = { type: 'slot', slot: 0, action: { type: 'patty.flip' } };
  kitchen = transitionKitchen(kitchen, flip);
  const flipped = show(kitchen, flip, beforeFlip);
  expect(flipped).toContain('class="patty-flip-front"');
  expect(flipped).toContain('class="patty-flip-back"');
  expect(flipped).toContain('#e5a39a'); // fresh underside
  expect(flipped).toContain('#c28b5b'); // seared outgoing side

  kitchen = transitionKitchen(transitionKitchen(kitchen, { type: 'grill.wait' }), { type: 'grill.wait' });
  const beforeRemove = kitchen.slots[0].patty;
  const remove: KitchenAction = { type: 'slot', slot: 0, action: { type: 'patty.remove' } };
  kitchen = transitionKitchen(kitchen, remove);
  expect(show(kitchen, remove, beforeRemove)).toContain('class="patty-lift"');
  expect(renderToStaticMarkup(<GrillScene kitchen={kitchen} ids={ids} motion={null}/>)).not.toContain('class="patty-lift"');
});

it('shows a shared sizzle for every active grill position', () => {
  let kitchen = [0, 1, 2, 3].reduce((state, slot) => startOrder(state, slot as 0 | 1 | 2 | 3, order), initialKitchen);
  for (const slot of [0, 1, 2, 3] as const) kitchen = transitionKitchen(kitchen, { type: 'slot', slot, action: { type: 'patty.place', kind: 'beef' } });
  kitchen = transitionKitchen(kitchen, { type: 'grill.wait' });
  const html = renderToStaticMarkup(<GrillScene kitchen={kitchen} ids={[1, 2, 3, 4]} motion={{ action: { type: 'grill.wait' }, id: kitchen.moves, previousPatty: null }}/>);
  expect(html.match(/class="sizzle"/g)).toHaveLength(4);
});
