export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  badge?: 'new' | 'sale' | 'trending';
  description?: string;
  sizes?: string[];
  colors?: string[];
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
