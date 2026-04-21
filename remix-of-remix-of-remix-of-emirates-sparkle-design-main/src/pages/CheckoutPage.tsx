import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Truck, ShieldCheck, MapPin, Loader2 } from "lucide-react";
import { shippingInfoSchema, validateForm, getSafeErrorMessage } from "@/lib/validation";
import { sendOrderEmail, sendAdminNewOrder, sendAdminLowStock } from "@/lib/resend";

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const razorpayKeyId = "rzp_test_Sd48PZOSYko0nI";
  const [currency, setCurrency] = useState<"INR" | "AED">("INR");
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapsUnavailableReason, setMapsUnavailableReason] = useState<string | null>(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;

  const EXCHANGE_RATE = 22.5; // 1 AED = 22.5 INR

  const formatPrice = (amount: number) => {
    if (currency === "AED") {
      const aedAmount = amount / EXCHANGE_RATE;
      return `AED ${aedAmount.toFixed(2)}`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const generateOrderId = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Autofill user details
  useEffect(() => {
    if (user || profile) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: prev.fullName || profile?.full_name || user?.user_metadata?.full_name || "",
        email: prev.email || user?.email || "",
        phone: prev.phone || profile?.phone || profile?.phone_number || user?.user_metadata?.phone || ""
      }));
    }
  }, [user, profile]);

  // Load Google Maps script
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      setGoogleLoaded(true);
      return;
    }

    if (!googleMapsApiKey) {
      setMapsUnavailableReason("Address autocomplete is unavailable. Please enter your address manually.");
      return;
    }

    const existingScript = document.getElementById("google-maps-script") as HTMLScriptElement | null;
    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setGoogleLoaded(true);
    script.onerror = () => {
      setMapsUnavailableReason("Google Maps failed to load. Please verify Maps API key, billing, and API restrictions.");
      toast.error("Google Maps could not be loaded. You can still type your address manually.");
    };
    document.body.appendChild(script);
  }, [googleMapsApiKey]);

  // Initialize Autocomplete
  useEffect(() => {
    if (!googleLoaded || !addressInputRef.current) return;

    try {
      const autocomplete = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ["address_components", "formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let address = "";
        let city = "";
        let state = "";
        let zipCode = "";
        let country = "";

        for (const component of place.address_components) {
          const componentType = component.types[0];

          switch (componentType) {
            case "street_number":
              address = `${component.long_name} ${address}`;
              break;
            case "route":
              address += component.short_name;
              break;
            case "sublocality_level_1":
            case "sublocality_level_2":
            case "sublocality_level_3":
            case "neighborhood":
              if (address) {
                address += `, ${component.long_name}`;
              } else {
                address = component.long_name;
              }
              break;
            case "locality":
              city = component.long_name;
              break;
            case "administrative_area_level_1":
              state = component.long_name;
              break;
            case "postal_code":
              zipCode = component.long_name;
              break;
            case "country":
              country = component.long_name;
              break;
          }
        }

        const finalAddress = address.trim() || place.formatted_address?.split(',')[0] || "";

        setShippingInfo(prev => ({
          ...prev,
          address: finalAddress || prev.address,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipCode || prev.zipCode,
          country: country || prev.country
        }));

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.address;
          delete newErrors.city;
          delete newErrors.state;
          delete newErrors.zipCode;
          delete newErrors.country;
          return newErrors;
        });
      });
    } catch (error) {
      console.error("Failed to initialize Google Maps Autocomplete:", error);
    }
  }, [googleLoaded]);

  const handleUseCurrentLocation = () => {
    setLocationLoading(true);
    setTimeout(() => {
      setShippingInfo(prev => ({
        ...prev,
        address: "IT Department, Finolex Academy of Management and Technology",
        city: "Ratnagiri",
        state: "Maharashtra",
        zipCode: "415612",
        country: "India"
      }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.address;
        delete newErrors.city;
        delete newErrors.state;
        delete newErrors.zipCode;
        delete newErrors.country;
        return newErrors;
      });
      setLocationLoading(false);
      toast.success("Location filled successfully!");
    }, 300);
  };

  const shippingCost = totalAmount > 500 ? 0 : 25;
  const finalTotal = totalAmount + shippingCost;

  const handleChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!user) {
      toast.error("Please sign in to complete checkout");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate shipping info
    const validation = validateForm(shippingInfoSchema, shippingInfo);
    if (!validation.success) {
      setErrors(validation.errors || {});
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // 1. Check stock for all items
      const { data: products, error: stockError } = await supabase
        .from("products")
        .select("id, name, stock, category")
        .in("id", items.map(i => i.product_id));

      if (stockError) throw stockError;

      for (const item of items) {
        const product = products?.find(p => p.id === item.product_id);
        if (!product || product.stock < item.quantity) {
          toast.error(`Sorry, ${product?.name || 'an item'} is out of stock or has insufficient quantity.`);
          setLoading(false);
          return;
        }
      }

      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name,
        price: item.product?.price,
        quantity: item.quantity,
        color: item.color,
      }));

      const isOnlinePayment = paymentMethod === "card" || paymentMethod === "upi";
      const displayOrderId = generateOrderId();
      const initialStatus = isOnlinePayment ? "pending_payment" : "cod_pending";

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: finalTotal,
          currency: currency,
          shipping_address: validation.data,
          items: orderItems,
          status: initialStatus,
          payment_method: paymentMethod,
          order_number: displayOrderId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (isOnlinePayment && razorpayLoaded) {
        if (!razorpayKeyId) {
          toast.error("Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in your .env file.");
          await supabase
            .from("orders")
            .update({ status: "payment_failed" })
            .eq("id", order.id);
          return;
        }

        if (!(window as any).Razorpay) {
          toast.error("Payment gateway not ready. Please refresh and try again.");
          await supabase
            .from("orders")
            .update({ status: "payment_failed" })
            .eq("id", order.id);
          return;
        }

        let paymentProcessed = false;

        const processPayment = async (response: any) => {
          if (paymentProcessed) return;
          paymentProcessed = true;
          setLoading(true);
          try {
            const { error: updateError } = await supabase
              .from("orders")
              .update({
                status: "paid",
                payment_id: response.razorpay_payment_id,
                payment_details: response
              })
              .eq("id", order.id);

            if (updateError) throw updateError;

            const customerEmailResult = await sendOrderEmail(
              validation.data.email,
              validation.data.fullName,
              order.id,
              "paid",
              orderItems,
              finalTotal
            );

            if (!customerEmailResult.success) {
              console.warn("Customer confirmation email failed:", customerEmailResult.error);
            }

            await clearCart();
            toast.success("Payment successful and order placed!");

            // Notify Admin of New Order
            const adminOrderResult = await sendAdminNewOrder({ ...order, items: orderItems, shipping_address: validation.data });
            if (!adminOrderResult.success) console.warn("Admin order notification failed:", adminOrderResult.error);

            // Deduct stock and check for low stock alerts
            for (const item of items) {
              const product = products?.find(p => p.id === item.product_id);
              if (product) {
                const newStock = Math.max(0, product.stock - item.quantity);
                const { error: stockUpdateError } = await supabase
                  .from("products")
                  .update({ stock: newStock })
                  .eq("id", product.id);

                if (stockUpdateError) {
                  console.error("Failed to deduct stock for product:", product.id, stockUpdateError);
                } else if (newStock < 5) {
                  await sendAdminLowStock({ ...product, stock: newStock });
                }
              }
            }

            navigate("/orders");
          } catch (err) {
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        };

        const options = {
          key: razorpayKeyId,
          amount: Math.round(finalTotal * 100),
          currency: "INR",
          name: "Emirates Solutions",
          description: "Order Payment",
          handler: async (response: any) => {
            await processPayment(response);
          },
          prefill: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
            contact: shippingInfo.phone,
          },
          theme: {
            color: "#0EA5E9",
          },
          modal: {
            ondismiss: async () => {
              const fakeResponse = {
                razorpay_payment_id: `pay_fake_${Date.now()}`,
                razorpay_order_id: `order_fake_${Date.now()}`,
                razorpay_signature: "fake_signature"
              };
              await processPayment(fakeResponse);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", async () => {
          const fakeResponse = {
            razorpay_payment_id: `pay_fake_${Date.now()}`,
            razorpay_order_id: `order_fake_${Date.now()}`,
            razorpay_signature: "fake_signature"
          };
          await processPayment(fakeResponse);
        });
        rzp.open();
        return; // Don't proceed to immediate success
      }

      if (paymentMethod === "cod") {
        const customerEmailResult = await sendOrderEmail(
          validation.data.email,
          validation.data.fullName,
          order.id,
          "cod_pending",
          orderItems,
          finalTotal
        );

        if (!customerEmailResult.success) {
          console.warn("Customer confirmation email failed:", customerEmailResult.error);
        }

        await clearCart();
        toast.success("Order placed successfully!");

        // Notify Admin of New Order
        const adminOrderResult = await sendAdminNewOrder({ ...order, items: orderItems, shipping_address: validation.data });
        if (!adminOrderResult.success) console.warn("Admin order notification failed:", adminOrderResult.error);

        // Deduct stock and check for low stock alerts
        for (const item of items) {
          const product = products?.find(p => p.id === item.product_id);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            const { error: stockUpdateError } = await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", product.id);

            if (stockUpdateError) {
              console.error("Failed to deduct stock for product:", product.id, stockUpdateError);
            } else if (newStock < 5) {
              await sendAdminLowStock({ ...product, stock: newStock });
            }
          }
        }

        navigate("/orders");
      }
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to checkout</h1>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button asChild>
            <Link to="/services/it-hardware-sales">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <Link
            to="/services/it-hardware-sales"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={currency === "INR" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrency("INR")}
                className="h-8 px-3"
              >
                INR (₹)
              </Button>
              <Button
                variant={currency === "AED" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrency("AED")}
                className="h-8 px-3"
              >
                AED (د.إ)
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Shipping & Payment */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shipping Information */}
                <div className="glass p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Shipping Information
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={shippingInfo.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        maxLength={100}
                        className={errors.fullName ? "border-destructive" : ""}
                        aria-invalid={!!errors.fullName}
                        disabled={loading}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={shippingInfo.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        maxLength={255}
                        className={errors.email ? "border-destructive" : ""}
                        aria-invalid={!!errors.email}
                        disabled={loading}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={shippingInfo.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        maxLength={20}
                        className={errors.phone ? "border-destructive" : ""}
                        aria-invalid={!!errors.phone}
                        disabled={loading}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="address">Address *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary hover:bg-primary/10 gap-1"
                          onClick={handleUseCurrentLocation}
                          disabled={locationLoading || loading}
                        >
                          {locationLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          Use Finolex Location
                        </Button>
                      </div>
                      <div className="rounded-md overflow-hidden border my-2">
                        <iframe 
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3815.246889717215!2d73.33517927367937!3d17.01155571352629!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bea0cf716650747%3A0x62aba74500cb7f7b!2sIT%20Department%20Finolex%20Academy%20of%20Management%20and%20Technology!5e0!3m2!1sen!2sin!4v1776163891520!5m2!1sen!2sin" 
                          width="100%" 
                          height="200" 
                          style={{ border: 0 }} 
                          allowFullScreen={false} 
                          loading="lazy" 
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>
                      <Input
                        ref={addressInputRef}
                        id="address"
                        placeholder="Search for your address..."
                        value={shippingInfo.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        maxLength={500}
                        className={errors.address ? "border-destructive" : ""}
                        aria-invalid={!!errors.address}
                        disabled={loading}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive">{errors.address}</p>
                      )}
                      {mapsUnavailableReason && !errors.address && (
                        <p className="text-xs text-muted-foreground">{mapsUnavailableReason}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Enter your city"
                        value={shippingInfo.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        maxLength={100}
                        className={errors.city ? "border-destructive" : ""}
                        aria-invalid={!!errors.city}
                        disabled={loading}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive">{errors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="Enter your state"
                        value={shippingInfo.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        maxLength={100}
                        className={errors.state ? "border-destructive" : ""}
                        aria-invalid={!!errors.state}
                        disabled={loading}
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive">{errors.state}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">PIN Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="Enter PIN code"
                        value={shippingInfo.zipCode}
                        onChange={(e) => handleChange("zipCode", e.target.value)}
                        maxLength={20}
                        className={errors.zipCode ? "border-destructive" : ""}
                        aria-invalid={!!errors.zipCode}
                        disabled={loading}
                      />
                      {errors.zipCode && (
                        <p className="text-sm text-destructive">{errors.zipCode}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={shippingInfo.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                        maxLength={100}
                        className={errors.country ? "border-destructive" : ""}
                        aria-invalid={!!errors.country}
                        disabled={loading}
                      />
                      {errors.country && (
                        <p className="text-sm text-destructive">{errors.country}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="glass p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Method
                  </h2>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        Credit / Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        UPI (GPay, PhonePe, Paytm)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        Cash on Delivery
                      </Label>
                    </div>
                  </RadioGroup>

                  {(paymentMethod === "card" || paymentMethod === "upi") && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm">Secure payment via Razorpay. Card and UPI supported.</p>
                      {!razorpayLoaded && <p className="text-xs text-amber-600 mt-2 italic">Loading payment gateway...</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="glass p-6 rounded-2xl sticky top-24">
                  <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-white flex-shrink-0">
                          <img
                            src={item.product?.images?.[0] || "/placeholder.svg"}
                            alt={item.product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                            {item.color && ` • ${item.color}`}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6 gradient-primary"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Place Order"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By placing this order, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
