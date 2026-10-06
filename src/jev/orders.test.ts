import { expect, it } from 'vitest';
import { MENU, TOPPINGS } from '../engine/recipes';
import { orderFromAnswers, orderQuestions, type OrderAnswers } from './orders';

function answers(recipe: keyof typeof MENU): OrderAnswers {
  return {
    supported: { choice: 'yes' }, quantity: { choice: '1' }, recipe: { choice: recipe }, doneness: { choice: 'regular' },
    cheese: { choice: MENU[recipe].cheese ? 'yes' : 'no' },
    ...Object.fromEntries(TOPPINGS.map((topping) => [`topping:${topping}`, { choice: MENU[recipe].toppings.includes(topping) ? 'regular' : 'none' }])),
  };
}

it('asks a closed Jev question for each supported ingredient', () => {
  expect(Object.keys(orderQuestions('burger with bacon'))).toHaveLength(TOPPINGS.length + 5);
  expect(orderQuestions('burger with bacon')['topping:bacon'].criteria).toHaveProperty('extra');
});

it('turns supported free-form tickets into validated ingredients', () => {
  const response = answers('garden');
  response['topping:bacon'] = { choice: 'regular' };
  response['topping:pickle'] = { choice: 'extra' };
  response.cheese = { choice: 'yes' };
  response.quantity = { choice: '2' };
  expect(orderFromAnswers(response)).toEqual({ order: { recipe: 'garden', doneness: 'regular', cheese: true, toppings: ['lettuce', 'tomato', 'pickle', 'pickle', 'bacon'] }, quantity: 2 });
});

it('refuses unsupported tickets and missing or invented choices', () => {
  expect(() => orderFromAnswers({ ...answers('classic'), supported: { choice: 'no' } })).toThrow('cannot make');
  expect(() => orderFromAnswers({ ...answers('classic'), 'topping:bacon': { choice: 'triple' } })).toThrow('reword');
  expect(() => orderFromAnswers({ ...answers('classic'), recipe: { choice: 'pizza' } })).toThrow('reword');
});
