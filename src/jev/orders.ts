import { MENU, TOPPINGS, TOPPING_NAMES, type Order, type Recipe, type Topping } from '../engine/recipes';
import type { ProviderKey } from './types';

type Answer = { choice?: string };
export type OrderAnswers = Record<string, Answer>;
export type ParsedTicket = { order: Order; quantity: number };
const toppingQuestion = (topping: Topping) => `topping:${topping}`;

export function orderQuestions(text: string) {
  const menu = Object.entries(MENU).map(([id, recipe]) => `${id}: ${recipe.name}, ${recipe.patty} patty, ${recipe.cheese ? 'cheese' : 'no cheese'}, ${recipe.toppings.join(', ')}`).join('; ');
  const available = TOPPINGS.map((t) => TOPPING_NAMES[t]).join(', ');
  const context = `Customer order: ${JSON.stringify(text)}. Menu: ${menu}. Available extra ingredients: ${available}, cheese. Up to four identical burgers may be ordered together. Interpret colloquial wording and negation carefully. Do not invent unavailable ingredients.`;
  const questions: Record<string, { type: 'choice'; instructions: string; criteria: Record<string, string> }> = {
    supported: { type: 'choice', instructions: `${context} Can the entire request be made at this single-burger station? Reject different burger types in one request, more than four burgers, sides, drinks, unknown ingredients, or impossible preparations.`, criteria: { yes: 'One to four identical burgers using available ingredients and grill doneness.', no: 'Unsupported ingredient, mixed burgers, more than four, side, drink, or ambiguous request; customer must clarify.' } },
    quantity: { type: 'choice', instructions: `${context} How many identical burgers? Words like two, a couple, and 2 mean two.`, criteria: { '1': 'One burger or unspecified quantity.', '2': 'Two burgers.', '3': 'Three burgers.', '4': 'Four burgers.' } },
    recipe: { type: 'choice', instructions: `${context} Which base patty and burger did they request? If they only say burger, choose classic.`, criteria: { classic: 'Beef hamburger or plain burger.', cheese: 'Beef cheeseburger.', garden: 'Veggie or plant-based burger.' } },
    doneness: { type: 'choice', instructions: `${context} Which supported doneness? Only well-done is a special request; otherwise regular.`, criteria: { regular: 'Normal cook, or unspecified.', 'well-done': 'Explicitly well-done.' } },
    cheese: { type: 'choice', instructions: `${context} Should the final burger have cheese? A cheeseburger has cheese by default unless explicitly removed; other burgers only if requested.`, criteria: { yes: 'Cheese requested or default for cheeseburger.', no: 'No cheese requested or default for hamburger/veggie burger.' } },
  };
  for (const topping of TOPPINGS) {
    questions[toppingQuestion(topping)] = {
      type: 'choice',
      instructions: `${context} How much ${TOPPING_NAMES[topping]} on the burger? The base recipe has it by default when listed; honor "no/hold/without" and "extra/double".`,
      criteria: { none: 'Explicitly omitted, or not included by default and not requested.', regular: 'Included once by default or requested once.', extra: 'Explicitly extra or double; include twice.' },
    };
  }
  return questions;
}

export function orderFromAnswers(answers: OrderAnswers): ParsedTicket {
  const pick = (question: string, choices: readonly string[]) => {
    const choice = answers[question]?.choice;
    if (!choice || !choices.includes(choice)) throw new Error(`Jev could not understand ${question}; please reword the ticket.`);
    return choice;
  };
  if (pick('supported', ['yes', 'no']) === 'no') throw new Error('That ticket asks for something this kitchen cannot make. Try up to four identical burgers with ingredients from the menu.');
  const quantity = Number(pick('quantity', ['1', '2', '3', '4']));
  const recipe = pick('recipe', ['classic', 'cheese', 'garden']) as Recipe;
  const doneness = pick('doneness', ['regular', 'well-done']) as Order['doneness'];
  const cheese = pick('cheese', ['yes', 'no']) === 'yes';
  const toppings: Topping[] = [];
  for (const topping of TOPPINGS) {
    const amount = pick(toppingQuestion(topping), ['none', 'regular', 'extra']);
    if (amount !== 'none') toppings.push(topping);
    if (amount === 'extra') toppings.push(topping);
  }
  return { order: { recipe, doneness, cheese, toppings }, quantity };
}

export async function parseOrder(text: string, key?: ProviderKey): Promise<ParsedTicket> {
  const response = await fetch('/api/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, key }) });
  const data = await response.json() as { answers?: OrderAnswers; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not read ticket');
  if (!data.answers) throw new Error('Jev returned no ticket');
  return orderFromAnswers(data.answers);
}
