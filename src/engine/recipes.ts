export type PattyKind = 'beef' | 'veggie';
export const TOPPINGS = ['lettuce', 'tomato', 'onion', 'pickle', 'bacon', 'mushroom', 'jalapeno', 'avocado', 'ketchup', 'mustard', 'mayo'] as const;
export type Topping = typeof TOPPINGS[number];
export type Recipe = 'classic' | 'cheese' | 'garden';
export type Order = { recipe: Recipe; cheese: boolean; toppings: Topping[]; doneness: 'regular' | 'well-done' };

export const MENU: Record<Recipe, { name: string; patty: PattyKind; cheese: boolean; toppings: Topping[] }> = {
  classic: { name: 'The Classic', patty: 'beef', cheese: false, toppings: ['lettuce', 'tomato', 'onion', 'pickle'] },
  cheese: { name: 'The Cheeseburger', patty: 'beef', cheese: true, toppings: ['lettuce', 'tomato', 'onion', 'pickle'] },
  garden: { name: 'The Garden', patty: 'veggie', cheese: false, toppings: ['lettuce', 'tomato', 'pickle'] },
};

export const TOPPING_NAMES: Record<Topping, string> = {
  lettuce: 'Lettuce', tomato: 'Tomato', onion: 'Red onion', pickle: 'Pickles', bacon: 'Bacon', mushroom: 'Mushrooms',
  jalapeno: 'Jalapeños', avocado: 'Avocado', ketchup: 'Ketchup', mustard: 'Mustard', mayo: 'Mayo',
};

export function expected(order: Order): string[] {
  return ['bottom bun', 'patty', ...(order.cheese ? ['cheese'] : []), ...order.toppings, 'top bun'];
}
