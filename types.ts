
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  features?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export enum Category {
  Phones = 'Phones',
  Electronics = 'Electronics',
  HomeAppliances = 'Home Appliances',
  Furniture = 'Furniture',
  KitchenItems = 'Kitchen Items',
  Accessories = 'Accessories'
}

export interface OrderData {
  fullName: string;
  phone: string;
  address: string;
  items: CartItem[];
  total: number;
}
