import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity,
        size,
        color,
        products (
          id,
          name,
          price,
          images
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      if (import.meta.env.DEV) console.error("Error fetching cart:", error);
    } else {
      setItems(data?.map(item => ({
        ...item,
        product: item.products as any
      })) || []);
    }
    setLoading(false);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addToCart = async (productId: string, quantity: number, size?: string, color?: string) => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    const MAX_CART_ITEMS = 10;
    if (totalItems >= MAX_CART_ITEMS) {
      toast.error(`Cart limit reached (max ${MAX_CART_ITEMS} items). Please remove an item before adding more.`);
      return;
    }

    // Check if item already exists
    const existingItem = items.find(
      item => item.product_id === productId && item.size === (size || null) && item.color === (color || null)
    );

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity,
        size: size || null,
        color: color || null,
      });

    if (error) {
      toast.error("Failed to add item to cart");
    } else {
      toast.success("Added to cart!");
      fetchCart();
      openCart();
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to update quantity");
    } else {
      fetchCart();
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to remove item");
    } else {
      toast.success("Item removed from cart");
      fetchCart();
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to clear cart");
    } else {
      setItems([]);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      isOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
