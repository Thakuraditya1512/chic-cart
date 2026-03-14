export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category?: string;
  brandId?: string;
  rating: number;
  badge?: 'new' | 'sale' | 'trending';
  description?: string;
  sizes?: string[];
  colors?: string[];
  reviews?: number;
  inStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

export interface Brand {
  id: string;
  name: string;
  image: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  lane1: string;
  lane2?: string;
  landmark?: string;
  address?: string;
  city: string;
  zipCode: string;
  location?: {
    latitude: number;
    longitude: number;
    googleMapsLink?: string;
  };
  items: CartItem[];
  total: number;
  subtotal: number;
  codCharge: number;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  images?: string[];
  createdAt: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  userId?: string;
  isUsed: boolean;
  createdAt: any;
  expiresAt?: any;
}
