import { expect, it } from 'vitest';
import { Mesh } from 'three';
import { disposeGroup, grillPositions, makeBurger, makePatty, makeStation, platePositions } from './KitchenModels';
import type { Patty } from './engine/burger';

it('builds four distinct positions and state-specific 3D food', () => {
  expect(new Set(grillPositions.map(String)).size).toBe(4);
  expect(new Set(platePositions.map(String)).size).toBe(4);
  const raw: Patty = { kind: 'beef', seasoned: false, side: 0, ticks: [0, 0], onGrill: true };
  const cooked: Patty = { ...raw, ticks: [2, 2] };
  const first = makePatty(raw), second = makePatty(cooked);
  expect((first.children[0] as Mesh).material).not.toBe((second.children[0] as Mesh).material);
  expect((first.children[0] as Mesh).geometry.getAttribute('normal').getY(0)).toBeGreaterThan(0);
  const burger = makeBurger(['bottom bun', 'patty', 'cheese', 'lettuce', 'top bun'], cooked);
  expect(burger.children).toHaveLength(5);
  expect(burger.children[4].position.y).toBeGreaterThan(burger.children[1].position.y);
  const grill = makeStation(), plating = makeStation('plates');
  expect(grill.children.length).toBeGreaterThan(plating.children.length);
  [first, second, burger, grill, plating].forEach(disposeGroup);
});
