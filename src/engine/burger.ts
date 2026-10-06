import { expected, MENU, TOPPINGS, type Order, type PattyKind, type Topping } from './recipes';

export type Action =
  | { type: 'order.start'; order: Order }
  | { type: 'patty.place'; kind: PattyKind }
  | { type: 'patty.season' }
  | { type: 'grill.wait' }
  | { type: 'patty.flip' }
  | { type: 'patty.remove' }
  | { type: 'bun.toast' }
  | { type: 'bun.bottom' }
  | { type: 'stack.patty' }
  | { type: 'stack.cheese' }
  | { type: 'stack.topping'; topping: Topping }
  | { type: 'bun.top' }
  | { type: 'burger.serve' }
  | { type: 'burger.discard' };

export type Patty = { kind: PattyKind; seasoned: boolean; side: 0 | 1; ticks: [number, number]; onGrill: boolean };
export type Result = { correct: boolean; issues: string[]; stack: string[]; order: Order };
export type BurgerState = {
  order: Order | null;
  patty: Patty | null;
  bunToasted: boolean;
  stack: string[];
  elapsed: number;
  result: Result | null;
  moves: number;
};

export const initialState: BurgerState = { order: null, patty: null, bunToasted: false, stack: [], elapsed: 0, result: null, moves: 0 };
export const actionId = (action: Action): string => action.type === 'stack.topping' ? `${action.type}:${action.topping}` : action.type === 'patty.place' ? `${action.type}:${action.kind}` : action.type;

export function doneness(patty: Patty): 'raw' | 'undercooked' | 'cooked' | 'well-done' | 'burnt' {
  if (patty.ticks.some((n) => n > 3)) return 'burnt';
  if (patty.ticks[0] === 0 && patty.ticks[1] === 0) return 'raw';
  if (patty.ticks.some((n) => n < 2)) return 'undercooked';
  return patty.ticks.every((n) => n >= 3) ? 'well-done' : 'cooked';
}

export function legalActions(s: BurgerState): Action[] {
  if (!s.order || s.result) return [];
  const actions: Action[] = [];
  const patty = s.patty;
  if (!patty) actions.push({ type: 'patty.place', kind: 'beef' }, { type: 'patty.place', kind: 'veggie' });
  if (patty?.onGrill) {
    if (!patty.seasoned && patty.side === 0) actions.push({ type: 'patty.season' });
    actions.push({ type: 'grill.wait' });
    if (patty.side === 0 && patty.ticks[0] >= 1) actions.push({ type: 'patty.flip' });
    if (patty.side === 1 && patty.ticks[1] >= 1) actions.push({ type: 'patty.remove' });
  }
  if (!s.bunToasted) actions.push({ type: 'bun.toast' });
  if (s.bunToasted && s.stack.length === 0) actions.push({ type: 'bun.bottom' });
  if (patty && !patty.onGrill && s.stack.at(-1) === 'bottom bun') actions.push({ type: 'stack.patty' });
  if (s.stack.includes('patty') && !s.stack.includes('top bun')) {
    if (!s.stack.includes('cheese')) actions.push({ type: 'stack.cheese' });
    for (const topping of TOPPINGS) {
      if (s.stack.filter((x) => x === topping).length < 2) actions.push({ type: 'stack.topping', topping });
    }
    actions.push({ type: 'bun.top' });
  }
  if (s.stack.at(-1) === 'top bun') actions.push({ type: 'burger.serve' });
  if (patty || s.bunToasted || s.stack.length) actions.push({ type: 'burger.discard' });
  return actions;
}

export function evaluate(s: BurgerState): Result {
  if (!s.order || !s.patty) throw new Error('A burger and an order are required');
  const issues: string[] = [];
  if (s.patty.kind !== MENU[s.order.recipe].patty) issues.push('Wrong patty');
  if (!s.patty.seasoned) issues.push('Patty not seasoned');
  const cooked = doneness(s.patty);
  if (cooked === 'burnt') issues.push('Patty burnt');
  else if (cooked === 'undercooked' || cooked === 'raw') issues.push('Patty undercooked');
  else if (s.order.doneness === 'well-done' && cooked !== 'well-done') issues.push('Patty not well-done');
  if (!s.bunToasted) issues.push('Bun not toasted');
  if (JSON.stringify(s.stack) !== JSON.stringify(expected(s.order))) issues.push('Ingredients or stacking do not match the ticket');
  return { correct: issues.length === 0, issues, stack: [...s.stack], order: s.order };
}

export function transition(s: BurgerState, action: Action): BurgerState {
  if (action.type === 'order.start') {
    if (!MENU[action.order.recipe] || typeof action.order.cheese !== 'boolean' || !Array.isArray(action.order.toppings) || action.order.toppings.length > TOPPINGS.length * 2 || action.order.toppings.some((topping) => !TOPPINGS.includes(topping)) || TOPPINGS.some((topping) => action.order.toppings.filter((item) => item === topping).length > 2) || !['regular', 'well-done'].includes(action.order.doneness)) throw new Error('Invalid order');
    return { ...initialState, order: { ...action.order, toppings: [...action.order.toppings] } };
  }
  if (!legalActions(s).some((move) => actionId(move) === actionId(action))) throw new Error(`Illegal action: ${actionId(action)}`);
  const next: BurgerState = { ...s, stack: [...s.stack], moves: s.moves + 1 };
  switch (action.type) {
    case 'patty.place': next.patty = { kind: action.kind, seasoned: false, side: 0, ticks: [0, 0], onGrill: true }; break;
    case 'patty.season': next.patty = { ...s.patty!, seasoned: true }; break;
    case 'grill.wait': {
      const p = s.patty!;
      const ticks: [number, number] = [...p.ticks];
      ticks[p.side]++;
      next.patty = { ...p, ticks };
      next.elapsed += 30;
      break;
    }
    case 'patty.flip': next.patty = { ...s.patty!, side: 1 }; break;
    case 'patty.remove': next.patty = { ...s.patty!, onGrill: false }; break;
    case 'bun.toast': next.bunToasted = true; break;
    case 'bun.bottom': next.stack.push('bottom bun'); break;
    case 'stack.patty': next.stack.push('patty'); break;
    case 'stack.cheese': next.stack.push('cheese'); break;
    case 'stack.topping': next.stack.push(action.topping); break;
    case 'bun.top': next.stack.push('top bun'); break;
    case 'burger.serve': next.result = evaluate(s); break;
    case 'burger.discard': return { ...initialState, order: s.order, moves: next.moves, elapsed: next.elapsed };
  }
  return next;
}
