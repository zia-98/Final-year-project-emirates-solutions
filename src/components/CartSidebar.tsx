import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CartSidebar = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalItems, totalAmount, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to view your cart</h3>
            <p className="text-muted-foreground mb-6">
              Create an account or sign in to start shopping
            </p>
            <Button asChild className="gradient-primary">
              <Link to="/auth" onClick={closeCart}>Sign In</Link>
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Browse our collection and add items to your cart
            </p>
            <Button asChild variant="outline">
              <Link to="/services" onClick={closeCart}>Shop Now</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-white flex-shrink-0">
                    <img
                      src={item.product?.images?.[0] || "/placeholder.svg"}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.product?.name}</h4>
                    <div className="text-sm text-muted-foreground space-x-2">
                      {item.color && <span>Color: {item.color}</span>}
                    </div>
                    <div className="font-semibold text-primary mt-1">
                      ₹{item.product?.price?.toLocaleString('en-IN')}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>
                <Button 
                  className="w-full gradient-primary" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={closeCart}
                >
                  Continue Shopping
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
