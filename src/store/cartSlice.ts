import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  brand: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) =>
          item.productId === action.payload.productId &&
          item.size === action.payload.size
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem: (state, action: PayloadAction<{ productId: string; size: string }>) => {
      state.items = state.items.filter(
        (item) =>
          !(item.productId === action.payload.productId && item.size === action.payload.size)
      );
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; size: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) =>
          item.productId === action.payload.productId && item.size === action.payload.size
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart, setCartOpen } =
  cartSlice.actions;

export default cartSlice.reducer;
