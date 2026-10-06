import { describe, expect, it } from 'vitest';
import { actionId, doneness, initialState, legalActions, transition, type Action, type BurgerState } from './burger';
import type { Order } from './recipes';

const order: Order = { recipe: 'cheese', cheese: true, toppings: ['lettuce', 'tomato', 'onion', 'pickle'], doneness: 'regular' };
const start = () => transition(initialState, { type: 'order.start', order });
const doMoves = (...moves: Action[]) => moves.reduce(transition, start());
const wait: Action = { type: 'grill.wait' };
const patty: Action = { type: 'patty.place', kind: 'beef' };

function finish(state: BurgerState): BurgerState {
  for (const move of [
    { type: 'patty.remove' }, { type: 'bun.toast' }, { type: 'bun.bottom' }, { type: 'stack.patty' },
    { type: 'stack.cheese' }, ...(['lettuce', 'tomato', 'onion', 'pickle'] as const).map((topping) => ({ type: 'stack.topping', topping })),
    { type: 'bun.top' }, { type: 'burger.serve' },
  ] as Action[]) state = transition(state, move);
  return state;
}

describe('burger engine', () => {
  it('offers only possible actions and rejects impossible ones', () => {
    expect(legalActions(initialState)).toEqual([]);
    expect(() => transition(start(), { type: 'patty.flip' })).toThrow('Illegal');
    expect(legalActions(start()).map(actionId)).not.toContain('patty.flip');
    expect(() => transition(start(), { type: 'grill.wait' })).toThrow('Illegal');
  });

  it('distinguishes undercooked, cooked, well-done, and burnt', () => {
    const flipped = doMoves(patty, wait, { type: 'patty.flip' }, wait);
    expect(doneness(flipped.patty!)).toBe('undercooked');
    const cooked = doMoves(patty, wait, wait, { type: 'patty.flip' }, wait, wait);
    expect(doneness(cooked.patty!)).toBe('cooked');
    const well = doMoves(patty, wait, wait, wait, { type: 'patty.flip' }, wait, wait, wait);
    expect(doneness(well.patty!)).toBe('well-done');
    expect(doneness(transition(well, wait).patty!)).toBe('burnt');
  });

  it('serves a customized burger with extra ingredients and omitted defaults', () => {
    let s = transition(initialState, { type: 'order.start', order: { recipe: 'garden', cheese: true, toppings: ['lettuce', 'pickle', 'pickle', 'bacon', 'avocado'], doneness: 'regular' } });
    for (const action of [
      { type: 'patty.place', kind: 'veggie' }, { type: 'patty.season' }, wait, wait, { type: 'patty.flip' }, wait, wait,
      { type: 'patty.remove' }, { type: 'bun.toast' }, { type: 'bun.bottom' }, { type: 'stack.patty' }, { type: 'stack.cheese' },
      ...(['lettuce', 'pickle', 'pickle', 'bacon', 'avocado'] as const).map((topping) => ({ type: 'stack.topping', topping })),
      { type: 'bun.top' }, { type: 'burger.serve' },
    ] as Action[]) s = transition(s, action);
    expect(s.result?.correct).toBe(true);
    expect(s.result?.stack).not.toContain('tomato');
  });

  it('scores a complete burger and rejects a wrong burger', () => {
    const correct = finish(doMoves(patty, { type: 'patty.season' }, wait, wait, { type: 'patty.flip' }, wait, wait));
    expect(correct.result?.correct).toBe(true);
    expect(() => transition(correct, { type: 'bun.top' })).toThrow('Illegal');
    const wrong = finish(doMoves({ type: 'patty.place', kind: 'veggie' }, wait, wait, { type: 'patty.flip' }, wait, wait));
    expect(wrong.result?.correct).toBe(false);
    expect(wrong.result?.issues).toContain('Wrong patty');
  });
});
