
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Basmati Rice', price: 120, unit: 'kg', category: 'food_items' },
  { id: '2', name: 'Sugar', price: 42, unit: 'kg', category: 'food_items' },
  { id: '3', name: 'Sunflower Oil', price: 160, unit: 'liter', category: 'food_items' },
  { id: '4', name: 'Toor Dal', price: 140, unit: 'kg', category: 'food_items' },
  { id: '5', name: 'Wheat Flour', price: 45, unit: 'kg', category: 'food_items' },
  { id: '6', name: 'Bath Soap', price: 35, unit: 'piece', category: 'general_goods' },
  { id: '7', name: 'Detergent Powder', price: 90, unit: 'kg', category: 'general_goods' },
  { id: '8', name: 'Shampoo Bottle', price: 180, unit: 'bottle', category: 'general_goods' },
  { id: '9', name: 'Chocolate Box', price: 450, unit: 'box', category: 'luxury_items' },
  { id: '10', name: 'Perfume', price: 850, unit: 'bottle', category: 'luxury_items' },
];

export const GST_RATES = {
  food_items: 0.05,
  general_goods: 0.18,
  luxury_items: 0.28,
};
