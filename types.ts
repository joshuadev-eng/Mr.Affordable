
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  profilePic?: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string; // Featured image
  images?: string[]; // Additional images (including the featured one)
  features?: string[];
  userId?: string;
  isApproved?: boolean;
  isDenied?: boolean; 
  rejectionReason?: string; // New field for feedback
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

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';
  address: string;
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
