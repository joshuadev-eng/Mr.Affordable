
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  profilePic?: string;
  role: 'user' | 'admin';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  features?: string[];
  userId?: string; // ID of the user who uploaded it
  isApproved?: boolean; // Admin approval flag
  createdAt?: number;
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
  subtotal: number;
  deliveryFee: number;
  total: number;
}
